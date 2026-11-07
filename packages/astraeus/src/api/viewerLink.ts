import type { ViewerChangeCause, ViewerPort, ViewerState } from "../app/viewerPort";
import type { ViewerControl } from "../app/viewerPort";
import { SceneError } from "./errors";
import type { LookInput, LookRead } from "./look";
import { ViewerLooks } from "./viewerLooks";
import { ViewerCamera } from "./viewerCamera";
import { ViewerClock } from "./viewerClock";
import { ViewerSelection, type SelectionChange } from "./viewerSelection";
import { ViewerFirstDraw } from "./viewerFirstDraw";
import { ViewerPicker } from "./viewerPicker";
import type { PickChange } from "./pickerInput";
import { ViewerViews } from "./viewerViews";
import { ViewerZones } from "./viewerZones";
import type { TimeInput } from "./time";

/** What a host is told when the viewer's time, speed or playing state changes. */
export interface ViewerChange {
  /** The viewer's time, Unix milliseconds UTC. */
  readonly timeUtcMs: number;
  /** Simulated seconds per real second. */
  readonly rate: number;
  readonly playing: boolean;
  /** Only in a scene with views: the id of the view showing. */
  readonly view?: string;
  /** The id of the scale showing. */
  readonly scale: string;
  /** The looks in force, every one filled in (what `look` reads). */
  readonly look: LookRead;
  /** Only in a scene that placed display switches: each placed switch, on or off (what `switches` reads). */
  readonly switches?: Readonly<Record<string, boolean>>;
  /** `playback`: the clock ran on; `visitor`: someone used the timeline, the view choice, the scale, a display switch or the Developer drawer's looks; `host`: the host page called `setTime`, `setRate`, `setPlaying`, `setView`, `setScale`, `setSwitch` or `setLook`. */
  readonly cause: ViewerChangeCause;
}

/** What a host is told when playback enters or leaves the zone of an event the showing view has. */
export interface EventZoneChange {
  /** The id of the event whose zone it is. */
  readonly event: string;
  /** The event's `type` and `object`, when it has them. */
  readonly type?: string;
  readonly object?: string;
  /** True on entering the zone, false on leaving it. */
  readonly entered: boolean;
  /** The viewer's time at the report, Unix milliseconds UTC. */
  readonly timeUtcMs: number;
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
 * its clock controls when it opens and detaches when it closes. The clock, views, camera, zones and selection are separate parts it delegates to.
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
  readonly #selection = new ViewerSelection(this.#access);
  readonly #looks = new ViewerLooks(this.#access);
  readonly #frame = new ViewerFirstDraw();
  readonly #picker = new ViewerPicker(this.#access);
  #wait = newWait();
  /** What last moved the clock or the view, as published; a selection dropped by time or the view names it. */
  #mover: ViewerChangeCause = "playback";
  #closed = false;

  attach(control: ViewerControl): void {
    this.#control = control;
    this.#clock.reset(control.read());
    this.#selection.reset(control.read());
    this.#mover = "playback";
    this.#camera.reset();
    this.#picker.reset(control);
    this.#zones.reset(); // nothing is known to be active yet: the first publish reports every zone the time is already inside
    this.#wait.done = true;
    this.#wait.resolve();
  }

  detach(): void {
    this.#control = undefined;
    this.#clock.reset(undefined);
    this.#selection.reset(undefined);
    this.#mover = "playback";
    this.#camera.reset();
    this.#picker.reset(undefined);
    this.#frame.reset();
    if (this.#wait.done && !this.#closed) this.#wait = newWait();
  }

  /** Takes a closed link back into use: a host effect that was cleaned up and replayed (React StrictMode) before the viewer drew. Waits for the next attach, never for the earlier one. */
  reopen(): void {
    if (!this.#closed) return;
    this.#closed = false;
    this.#wait = newWait();
  }

  /** Stops all callbacks for good (the host unmounted). */
  close(): void {
    this.#closed = true;
    if (!this.#wait.done) this.#wait.reject(new SceneError("not-mounted", "the viewer was unmounted before it was drawn"));
    this.detach();
    this.#clock.clearListeners();
    this.#zones.clearListeners();
    this.#selection.clearListeners();
    this.#camera.clearListeners();
    this.#frame.clearListeners();
    this.#picker.clearListeners();
  }

  /**
   * Resolves once the viewer has attached its clock, so every read and call works from then on; at once when it already has. A `close` before it attached rejects it with
   * `not-mounted` (a closed link is not usable); it never stays pending. A detach (the viewer rebuilt) arms a fresh wait.
   */
  whenAttached(): Promise<void> { return this.#wait.promise; }

  get rateSource(): RateSource { return this.#clock.rateSource; }
  get timeUtcMs(): number | undefined { return this.#clock.timeUtcMs; }
  get rate(): number | undefined { return this.#clock.rate; }
  get playing(): boolean | undefined { return this.#clock.playing; }
  get eventZones(): readonly string[] | undefined { return this.#zones.eventZones; }
  get view(): string | undefined { return this.#views.view; }
  get selected(): string | undefined { return this.#selection.selected; }
  get camera(): CameraPose | undefined { return this.#camera.camera; }
  get pick(): string | undefined { return this.#picker.pick; }

  get look(): LookRead | undefined { return this.#looks.look; }
  get scale(): string | undefined { return this.#looks.scale; }
  get switches(): Readonly<Record<string, boolean>> | undefined { return this.#looks.switches; }

  // Each member below is documented where it is done: viewerClock, viewerViews, viewerCamera, viewerZones, viewerSelection.
  setView(id: string): void { this.#views.setView(id); this.#afterHost(); }
  setTime(time: TimeInput): void { this.#clock.setTime(time); this.#afterHost(); }
  setRate(rate: number | "auto"): void { this.#clock.setRate(rate); this.#afterHost(); }
  setPlaying(playing: boolean): void { this.#clock.setPlaying(playing); this.#afterHost(); }
  setCamera(target: CameraTarget): void { this.#camera.setCamera(target); }
  setLook(look: LookInput): void { this.#looks.setLook(look); this.#afterHost(); }
  setScale(id: string): void { this.#looks.setScale(id); this.#afterHost(); }
  setSwitch(id: string, on: boolean): void { this.#looks.setSwitch(id, on); this.#afterHost(); }
  onChange(listener: (change: ViewerChange) => void): () => void { return this.#clock.onChange(listener); }
  onEventZone(listener: (change: EventZoneChange) => void): () => void { return this.#zones.onEventZone(listener); }

  setPick(value: string): void { this.#picker.setPick(value); }
  onPick(listener: (change: PickChange) => void): () => void { return this.#picker.onPick(listener); }
  pickNow(): string | undefined { return this.#picker.pick; }
  watchPick(watcher: () => void): () => void { return this.#picker.watch(watcher); }
  picked(value: string): void { this.#picker.press(value); }

  onFirstDraw(listener: () => void): () => void { return this.#frame.onFirstDraw(listener); }
  firstDraw(): void { this.#frame.publish(); }
  onSelect(listener: (change: SelectionChange) => void): () => void { return this.#selection.onSelect(listener); }
  onCameraChange(listener: (camera: CameraPose) => void): () => void { return this.#camera.onCameraChange(listener); }

  publish(state: ViewerState, cause: ViewerChangeCause): void {
    if (this.#clock.publish(state, cause)) this.#mover = cause;
    this.#zones.publish(state, cause);
    this.#selection.publish(state, cause);
    this.#camera.publish();
  }

  /** The selection changed. A drop by time or the view names whatever last moved them (`onChange` names the same), so the cause is never a second opinion. */
  publishSelection(state: ViewerState, byMove: boolean): void { this.#selection.publish(state, byMove ? this.#mover : "visitor"); }

  /** A host call moved the clock or the view: report the control's reading, change then zones. */
  #afterHost(): void { this.publish(this.#access.open("publish").read(), "host"); }
}
