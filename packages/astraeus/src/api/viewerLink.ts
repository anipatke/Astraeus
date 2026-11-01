import type { ViewerChangeCause, ViewerControl, ViewerPort, ViewerState } from "../app/viewerPort";
import { SceneError } from "./errors";
import type { CameraRequest } from "../app/CameraController";
import { validateStartView } from "../app/viewLink";
import { toUtcMs, type TimeInput } from "./time";

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

const NOT_OPEN = "the viewer is not drawn yet (or is gone); wait for `ready` first";

interface Wait { readonly promise: Promise<void>; resolve: () => void; done: boolean }
function newWait(): Wait {
  const wait = { done: false } as Wait;
  (wait as { promise: Promise<void> }).promise = new Promise<void>((resolve) => { wait.resolve = resolve; });
  return wait;
}

/**
 * Joins a host page to a mounted viewer's one clock: reads, sets and change callbacks. Created by `mount` and `AstraeusScene`; the viewer attaches
 * its clock controls when it opens and detaches when it closes.
 */
export class ViewerLink implements ViewerPort {
  #control: ViewerControl | undefined;
  #last: ViewerState | undefined;
  #rateSource: RateSource = "scene";
  readonly #listeners = new Set<(change: ViewerChange) => void>();
  readonly #zoneListeners = new Set<(change: EventZoneChange) => void>();
  #zones: readonly string[] = [];
  #wait = newWait();
  #closed = false;

  attach(control: ViewerControl): void {
    this.#control = control;
    this.#last = control.read();
    this.#rateSource = "scene";
    this.#zones = []; // nothing is known to be active yet: the first publish reports every zone the time is already inside
    this.#wait.done = true;
    this.#wait.resolve();
  }

  detach(): void {
    this.#control = undefined;
    this.#last = undefined;
    if (this.#wait.done && !this.#closed) this.#wait = newWait();
  }

  /** Stops all callbacks for good (the host unmounted). */
  close(): void {
    this.#closed = true;
    this.detach();
    this.#listeners.clear();
    this.#zoneListeners.clear();
  }

  /**
   * Resolves once the viewer has attached its clock, so every read and call works from then on; at once when it already has. After `close` it
   * never resolves (a closed link is not usable). A detach (the viewer rebuilt) arms a fresh wait.
   */
  whenAttached(): Promise<void> { return this.#wait.promise; }

  get rateSource(): RateSource { return this.#rateSource; }

  /** The viewer's time (Unix milliseconds UTC), or undefined before it is drawn or after it is gone. */
  get time(): number | undefined { return this.#control?.read().timeUtcMs; }
  get rate(): number | undefined { return this.#control?.read().rate; }
  get playing(): boolean | undefined { return this.#control?.read().playing; }
  /** The ids of the events whose pacing zone holds the time now (empty without pacing event rules); undefined before the viewer is drawn and after it is gone. */
  get eventZones(): readonly string[] | undefined { return this.#control === undefined ? undefined : this.#control.read().zones ?? []; }
  /** The id of the view showing; undefined before the viewer is drawn, after it is gone, and in a scene without views. */
  get view(): string | undefined { return this.#control?.read().view; }

  /** Switches to the view with this id. An id the scene does not name, or a scene without views, throws `bad-view`; before the viewer is drawn or after it is gone, `missing-data`. */
  setView(id: string): void {
    const control = this.#open("setView");
    if (!control.views.includes(id)) {
      throw new SceneError("bad-view", control.views.length === 0 ? "setView: the scene has no views; name them with setViews" : `setView: "${String(id)}" is not one of the scene's views (${control.views.join(", ")})`);
    }
    control.setView(id);
    this.publish(control.read(), "host");
  }

  setTime(time: TimeInput): void {
    const control = this.#open("setTime");
    const timeUtcMs = toUtcMs(time, "setTime");
    const { startUtcMs, endUtcMs } = control.window;
    if (timeUtcMs < startUtcMs || timeUtcMs > endUtcMs) {
      throw new SceneError("bad-time", `setTime: ${new Date(timeUtcMs).toISOString()} is outside the timeline (${new Date(startUtcMs).toISOString()} to ${new Date(endUtcMs).toISOString()})`);
    }
    control.seek(timeUtcMs);
    this.publish(control.read(), "host");
  }

  /**
   * Only a speed the timeline offers is taken, so the speed picker always shows what is running; any other number throws `bad-timeline`.
   * `"auto"` hands the rate back to the scene's pacing (`setTimeline({ pacing })`) and throws `bad-timeline` when the scene has none. The in-between speeds pacing
   * runs at are never set through here; they arrive in `onChange` and `rate`.
   */
  setRate(rate: number | "auto"): void {
    const control = this.#open("setRate");
    if (rate === "auto") {
      if (!control.paced) throw new SceneError("bad-timeline", "setRate: \"auto\" needs a scene with pacing; give setTimeline({ pacing })");
      control.setRate("auto");
      this.#rateSource = "scene";
      this.publish(control.read(), "host");
      return;
    }
    if (!control.rates.includes(rate)) throw new SceneError("bad-timeline", `setRate: ${String(rate)} is not one of the offered speeds (${control.rates.join(", ")}); offer it with setTimeline({ rates })`);
    control.setRate(rate);
    this.#rateSource = "chosen";
    this.publish(control.read(), "host");
  }

  /** The camera pose, or undefined before the viewer is drawn, after it is gone, and before its first frame. */
  get camera(): CameraPose | undefined { return this.#control?.readCamera(); }

  /**
   * Points the camera: `{ follow: id }` keeps the distance, `{ focus: id }` frames the object, a pose (from `camera`) puts the camera back where it was read,
   * relative to its object. The id must be an object the showing view shows; an unknown or hidden id, or a malformed argument, throws `bad-camera`.
   * Before the viewer is drawn or after it is gone, `missing-data`. The move eases in as a view's camera rule does.
   */
  setCamera(target: CameraTarget): void {
    const control = this.#open("setCamera");
    const request = this.#cameraRequest(target);
    const id = request.kind === "pose" ? request.view.focus : request.kind === "overview" || request.kind === "hold" ? "" : request.target;
    if (!control.cameraTargets().includes(id)) {
      throw new SceneError("bad-camera", `setCamera: "${id}" is not an object the showing view shows (${control.cameraTargets().join(", ")})`);
    }
    control.setCamera(request);
  }

  #cameraRequest(target: unknown): CameraRequest {
    const bad = (why: string) => new SceneError("bad-camera", `setCamera: ${why}; give { follow: id }, { focus: id } or a pose from camera`);
    if (typeof target !== "object" || target === null || Array.isArray(target)) throw bad(`${String(target)} is not an object`);
    const record = target as Record<string, unknown>;
    // A pose names its object with `focus` too; its angle and distance fields tell it from `{ focus: id }`.
    const isPose = ["azimuthDeg", "elevationDeg", "distance"].some((key) => key in record) || !("follow" in record || "focus" in record);
    const named = (["follow", "focus"] as const).filter((key) => key in record);
    if (isPose) {
      try { return { kind: "pose", view: validateStartView(record, "pose") }; } catch (cause) { throw bad(cause instanceof Error ? cause.message : "a malformed pose"); }
    }
    const id = record[named[0]];
    if (named.length > 1 || Object.keys(record).length > 1 || typeof id !== "string" || id === "") throw bad("the target must be exactly one of follow or focus, naming a non-empty id");
    return { kind: named[0], target: id };
  }

  /** Calls `listener` whenever the time, speed or playing state changes; returns the function that stops it. */
  onChange(listener: (change: ViewerChange) => void): () => void {
    this.#listeners.add(listener);
    return () => { this.#listeners.delete(listener); };
  }

  /**
   * Calls `listener` when playback enters or leaves the pacing zone of an event the showing view has (a `near` rule of `setTimeline({ pacing })`); returns the function that stops it.
   * A zone the time is already inside when the viewer opens is reported as entered once, with the first report after `ready` (within a tenth of a second), so a listener added right after `await ready` hears it.
   * A viewer rebuild (`AstraeusScene` given a new scene) starts over the same way.
   */
  onEventZone(listener: (change: EventZoneChange) => void): () => void {
    this.#zoneListeners.add(listener);
    return () => { this.#zoneListeners.delete(listener); };
  }

  publish(state: ViewerState, cause: ViewerChangeCause): void {
    this.#publishChange(state, cause);
    this.#publishZones(state, cause);
  }

  #publishZones(state: ViewerState, cause: ViewerChangeCause): void {
    const now = state.zones ?? [];
    const before = this.#zones;
    if (now.length === before.length && now.every((id, index) => id === before[index])) return;
    this.#zones = now;
    const reports: [string, boolean][] = [...before.filter((id) => !now.includes(id)).map((id): [string, boolean] => [id, false]), ...now.filter((id) => !before.includes(id)).map((id): [string, boolean] => [id, true])];
    for (const [id, entered] of reports) {
      const event = this.#control?.events.find((candidate) => candidate.id === id);
      const change: EventZoneChange = { event: id, ...(event?.type === undefined ? {} : { type: event.type }), ...(event?.object === undefined ? {} : { object: event.object }), entered, time: state.timeUtcMs, cause };
      for (const listener of [...this.#zoneListeners]) listener(change);
    }
  }

  #publishChange(state: ViewerState, cause: ViewerChangeCause): void {
    const last = this.#last;
    if (last !== undefined && last.timeUtcMs === state.timeUtcMs && last.rate === state.rate && last.playing === state.playing && last.auto === state.auto && last.view === state.view) return;
    if (state.auto !== undefined) this.#rateSource = state.auto ? "scene" : "chosen";
    else if (cause === "visitor" && last !== undefined && last.rate !== state.rate) this.#rateSource = "chosen";
    this.#last = state;
    const change: ViewerChange = { time: state.timeUtcMs, rate: state.rate, playing: state.playing, ...(state.view === undefined ? {} : { view: state.view }), cause };
    for (const listener of [...this.#listeners]) listener(change);
  }

  #open(what: string): ViewerControl {
    if (this.#control === undefined) throw new SceneError("missing-data", `${what}: ${NOT_OPEN}`);
    return this.#control;
  }
}
