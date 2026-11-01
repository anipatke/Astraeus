import type { ViewerChangeCause, ViewerPort, ViewerState } from "../app/viewerPort";
import type { ViewerControl } from "../app/viewerPort";
import { SceneError } from "./errors";
import { ViewerCamera } from "./viewerCamera";
import { ViewerClock } from "./viewerClock";
import { ViewerViews } from "./viewerViews";
import { ViewerZones } from "./viewerZones";
import type { TimeInput } from "./time";

/** What a host is told when the viewer's time, speed or playing state changes. */
export interface ViewerChange {
  /** The viewer's time, Unix milliseconds UTC. */
  readonly time: number;
  /** Simulated seconds per real second. */
  readonly rate: number;
  readonly playing: boolean;
  /** Only in a scene with views: the id of the view showing. */
  readonly view?: string;
  /** `playback`: the clock ran on; `visitor`: someone used the timeline or the view choice; `host`: the host page called `setTime`, `setRate` or `setView`. */
  readonly cause: ViewerChangeCause;
}

/** What a host is told when playback enters or leaves the pacing zone of an event the showing view has. */
export interface EventZoneChange {
  /** The id of the event whose zone it is. */
  readonly event: string;
  /** The event's `type` and `object`, when it has them. */
  readonly type?: string;
  readonly object?: string;
  /** True on entering the zone, false on leaving it. */
  readonly entered: boolean;
  /** The viewer's time at the report, Unix milliseconds UTC. */
  readonly time: number;
  /** What moved it across: `playback` (the clock ran, or the zone was already active when the viewer opened), `visitor` (the timeline or the view choice), `host` (`setTime` or `setView`). */
  readonly cause: ViewerChangeCause;
  /** What the report is about: `time` (playback crossed the zone, or a seek moved the clock across it) or `view` (a view switch showed or hid the zone). After a `view` leave the view's own camera rule owns the camera, so a host that restores a camera should do it only for `time`. */
  readonly via: "time" | "view";
}

/** The camera as a plain value: the object it is centred on and where it stands from it. Read from `MountedScene.camera`, put back with `setCamera`. */
export interface CameraPose {
  /** The id of the object the camera is centred on (and follows as it moves). */
  readonly focus: string;
  /** Degrees about the up direction, 0 up to 360 (rounded to 0.01). */
  readonly azimuthDeg: number;
  /** Degrees above the orbit plane, within ±89 (rounded to 0.01). */
  readonly elevationDeg: number;
  /** Camera-to-object distance in the scene's scaled units (Earth radii), to five significant figures. */
  readonly distance: number;
}

/** What `setCamera` takes: follow an object (keep the distance), focus it (frame it), or put the camera back on a pose from `camera`. */
export type CameraTarget = { readonly follow: string } | { readonly focus: string } | CameraPose;

/** Where the playback rate comes from. `scene` is the rate the scene opened at; `chosen` is one a visitor or the host picked, which stays until it is released. */
export type RateSource = "scene" | "chosen";

/** What the host-link parts share: the one attached control, read through here so no part keeps a copy of it. */
export interface LinkAccess {
  /** The attached control, or undefined before the viewer is drawn and after it is gone. */
  control(): ViewerControl | undefined;
  /** The attached control; before the viewer is drawn or after it is gone, throws `not-mounted` naming `what`. */
  open(what: string): ViewerControl;
}

const NOT_OPEN = "the viewer is not drawn yet (or is gone); wait for `ready` first";

interface Wait { readonly promise: Promise<void>; resolve: () => void; reject: (reason: Error) => void; done: boolean }
function newWait(): Wait {
  const wait = { done: false } as Wait;
  (wait as { promise: Promise<void> }).promise = new Promise<void>((resolve, reject) => { wait.resolve = resolve; wait.reject = reject; });
  wait.promise.catch(() => undefined); // a wait nobody holds when the link closes is not an unhandled rejection
  return wait;
}

/**
 * Joins a host page to a mounted viewer's one clock: reads, sets and change callbacks. Created by `mount` and `AstraeusScene`; the viewer attaches
 * its clock controls when it opens and detaches when it closes. The clock, views, camera and zones are separate parts it delegates to.
 */
export class ViewerLink implements ViewerPort {
  #control: ViewerControl | undefined;
  readonly #access: LinkAccess = {
    control: () => this.#control,
    open: (what) => {
      if (this.#control === undefined) throw new SceneError("not-mounted", `${what}: ${NOT_OPEN}`);
      return this.#control;
    },
  };
  readonly #clock = new ViewerClock(this.#access);
  readonly #views = new ViewerViews(this.#access);
  readonly #camera = new ViewerCamera(this.#access);
  readonly #zones = new ViewerZones(this.#access);
  #wait = newWait();
  #closed = false;

  attach(control: ViewerControl): void {
    this.#control = control;
    this.#clock.reset(control.read());
    this.#zones.reset(); // nothing is known to be active yet: the first publish reports every zone the time is already inside
    this.#wait.done = true;
    this.#wait.resolve();
  }

  detach(): void {
    this.#control = undefined;
    this.#clock.reset(undefined);
    if (this.#wait.done && !this.#closed) this.#wait = newWait();
  }

  /** Stops all callbacks for good (the host unmounted). */
  close(): void {
    this.#closed = true;
    if (!this.#wait.done) this.#wait.reject(new SceneError("not-mounted", "the viewer was unmounted before it was drawn"));
    this.detach();
    this.#clock.clearListeners();
    this.#zones.clearListeners();
  }

  /**
   * Resolves once the viewer has attached its clock, so every read and call works from then on; at once when it already has. A `close` before it attached rejects it with
   * `not-mounted` (a closed link is not usable); it never stays pending. A detach (the viewer rebuilt) arms a fresh wait.
   */
  whenAttached(): Promise<void> { return this.#wait.promise; }

  get rateSource(): RateSource { return this.#clock.rateSource; }
  get time(): number | undefined { return this.#clock.time; }
  get rate(): number | undefined { return this.#clock.rate; }
  get playing(): boolean | undefined { return this.#clock.playing; }
  get eventZones(): readonly string[] | undefined { return this.#zones.eventZones; }
  get view(): string | undefined { return this.#views.view; }
  get camera(): CameraPose | undefined { return this.#camera.camera; }

  // Each member below is documented where it is done: viewerClock, viewerViews, viewerCamera, viewerZones.
  setView(id: string): void { this.#views.setView(id); this.#afterHost(); }
  setTime(time: TimeInput): void { this.#clock.setTime(time); this.#afterHost(); }
  setRate(rate: number | "auto"): void { this.#clock.setRate(rate); this.#afterHost(); }
  setCamera(target: CameraTarget): void { this.#camera.setCamera(target); }
  onChange(listener: (change: ViewerChange) => void): () => void { return this.#clock.onChange(listener); }
  onEventZone(listener: (change: EventZoneChange) => void): () => void { return this.#zones.onEventZone(listener); }

  publish(state: ViewerState, cause: ViewerChangeCause): void {
    this.#clock.publish(state, cause);
    this.#zones.publish(state, cause);
  }

  /** A host call moved the clock or the view: report the control's reading, change then zones. */
  #afterHost(): void { this.publish(this.#access.open("publish").read(), "host"); }
}
