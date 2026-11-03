import type { ViewerChangeCause, ViewerState } from "../app/viewerPort";
import { SceneError } from "./errors";
import { callListeners } from "./listeners";
import { toUtcMs, type TimeInput } from "./time";
import type { LinkAccess, RateSource, ViewerChange } from "./viewerLink";

/** Whether two readings agree on the scale, the looks and the switches (small values, compared by content). */
function sameLooks(a: ViewerState, b: ViewerState): boolean {
  return a.scale === b.scale && JSON.stringify(a.look) === JSON.stringify(b.look) && JSON.stringify(a.switches) === JSON.stringify(b.switches);
}

/** The host link's clock: time, rate and playing reads, `setTime`, `setRate`, the rate source and the `onChange` callbacks. */
export class ViewerClock {
  #last: ViewerState | undefined;
  #rateSource: RateSource = "scene";
  readonly #listeners = new Set<(change: ViewerChange) => void>();

  constructor(private readonly access: LinkAccess) {}

  /** The viewer attached (its first reading) or detached (undefined): the rate source goes back to the scene's. */
  reset(first: ViewerState | undefined): void {
    this.#last = first;
    if (first !== undefined) this.#rateSource = "scene";
  }

  clearListeners(): void { this.#listeners.clear(); }

  get rateSource(): RateSource { return this.#rateSource; }

  /** The viewer's time (Unix milliseconds UTC), or undefined before it is drawn or after it is gone. */
  get time(): number | undefined { return this.access.control()?.read().timeUtcMs; }
  get rate(): number | undefined { return this.access.control()?.read().rate; }
  get playing(): boolean | undefined { return this.access.control()?.read().playing; }

  setTime(time: TimeInput): void {
    const control = this.access.open("setTime");
    const timeUtcMs = toUtcMs(time, "setTime");
    const { startUtcMs, endUtcMs } = control.window;
    if (timeUtcMs < startUtcMs || timeUtcMs > endUtcMs) {
      throw new SceneError("bad-time", `setTime: ${new Date(timeUtcMs).toISOString()} is outside the timeline (${new Date(startUtcMs).toISOString()} to ${new Date(endUtcMs).toISOString()})`);
    }
    control.seek(timeUtcMs);
  }

  /**
   * Only a speed the timeline offers is taken, so the speed picker always shows what is running; any other number throws `bad-timeline`.
   * `"auto"` hands the rate back to the scene's pacing (`setTimeline({ pacing })`) and throws `bad-timeline` when the scene has none. The in-between speeds pacing
   * runs at are never set through here; they arrive in `onChange` and `rate`.
   */
  setRate(rate: number | "auto"): void {
    const control = this.access.open("setRate");
    if (rate === "auto") {
      if (!control.paced) throw new SceneError("bad-timeline", "setRate: \"auto\" needs a scene with pacing; give setTimeline({ pacing })");
      control.setRate("auto");
      this.#rateSource = "scene";
      return;
    }
    if (!control.rates.includes(rate)) throw new SceneError("bad-timeline", `setRate: ${String(rate)} is not one of the offered speeds (${control.rates.join(", ")}); offer it with setTimeline({ rates })`);
    control.setRate(rate);
    this.#rateSource = "chosen";
  }

  /** Plays or pauses the viewer through its own play handler. Throws `bad-timeline` for a non-boolean and in a scene without a timeline (`setTimeline({ none: true })`), where a visitor has no play control either. */
  setPlaying(playing: boolean): void {
    const control = this.access.open("setPlaying");
    if (typeof playing !== "boolean") throw new SceneError("bad-timeline", `setPlaying: expected true or false, got ${String(playing)}`);
    if (!control.playable) throw new SceneError("bad-timeline", "setPlaying: the scene has no timeline (setTimeline({ none: true })), so there is no play control; a visitor cannot play or pause it either");
    control.setPlaying(playing);
  }

  /** Calls `listener` whenever the time, speed or playing state changes; returns the function that stops it. */
  onChange(listener: (change: ViewerChange) => void): () => void {
    this.#listeners.add(listener);
    return () => { this.#listeners.delete(listener); };
  }

  /** Tells the listeners of a change in the reading; returns whether there was one. */
  publish(state: ViewerState, cause: ViewerChangeCause): boolean {
    const last = this.#last;
    if (last !== undefined && last.timeUtcMs === state.timeUtcMs && last.rate === state.rate && last.playing === state.playing && last.auto === state.auto && last.view === state.view && sameLooks(last, state)) return false;
    if (state.auto !== undefined) this.#rateSource = state.auto ? "scene" : "chosen";
    else if (cause === "visitor" && last !== undefined && last.rate !== state.rate) this.#rateSource = "chosen";
    this.#last = state;
    const change: ViewerChange = { time: state.timeUtcMs, rate: state.rate, playing: state.playing, ...(state.view === undefined ? {} : { view: state.view }), scale: state.scale, look: state.look, ...(Object.keys(state.switches).length === 0 ? {} : { switches: state.switches }), cause };
    callListeners(this.#listeners, change);
    return true;
  }
}
