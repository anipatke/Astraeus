import type { ViewerChangeCause, ViewerControl, ViewerPort, ViewerState } from "../app/viewerPort";
import { SceneError } from "./errors";
import { toUtcMs, type TimeInput } from "./time";

/** What a host is told when the viewer's time, speed or playing state changes. */
export interface ViewerChange {
  /** The viewer's time, Unix milliseconds UTC. */
  readonly time: number;
  /** Simulated seconds per real second. */
  readonly rate: number;
  readonly playing: boolean;
  /** `playback`: the clock ran on; `visitor`: someone used the timeline; `host`: the host page called `setTime` or `setRate`. */
  readonly cause: ViewerChangeCause;
}

/** Where the playback rate comes from. `scene` is the rate the scene opened at; `chosen` is one a visitor or the host picked, which stays until it is released. */
export type RateSource = "scene" | "chosen";

const NOT_OPEN = "the viewer is not drawn yet (or is gone); wait for `ready` first";

/**
 * Joins a host page to a mounted viewer's one clock: reads, sets and change callbacks. Created by `mount` and `AstraeusScene`; the viewer attaches
 * its clock controls when it opens and detaches when it closes.
 */
export class ViewerLink implements ViewerPort {
  #control: ViewerControl | undefined;
  #last: ViewerState | undefined;
  #rateSource: RateSource = "scene";
  readonly #listeners = new Set<(change: ViewerChange) => void>();

  attach(control: ViewerControl): void {
    this.#control = control;
    this.#last = control.read();
    this.#rateSource = "scene";
  }

  detach(): void {
    this.#control = undefined;
    this.#last = undefined;
  }

  /** Stops all callbacks for good (the host unmounted). */
  close(): void {
    this.detach();
    this.#listeners.clear();
  }

  get rateSource(): RateSource { return this.#rateSource; }

  /** The viewer's time (Unix milliseconds UTC), or undefined before it is drawn or after it is gone. */
  get time(): number | undefined { return this.#control?.read().timeUtcMs; }
  get rate(): number | undefined { return this.#control?.read().rate; }
  get playing(): boolean | undefined { return this.#control?.read().playing; }

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

  /** Calls `listener` whenever the time, speed or playing state changes; returns the function that stops it. */
  onChange(listener: (change: ViewerChange) => void): () => void {
    this.#listeners.add(listener);
    return () => { this.#listeners.delete(listener); };
  }

  publish(state: ViewerState, cause: ViewerChangeCause): void {
    const last = this.#last;
    if (last !== undefined && last.timeUtcMs === state.timeUtcMs && last.rate === state.rate && last.playing === state.playing && last.auto === state.auto) return;
    if (state.auto !== undefined) this.#rateSource = state.auto ? "scene" : "chosen";
    else if (cause === "visitor" && last !== undefined && last.rate !== state.rate) this.#rateSource = "chosen";
    this.#last = state;
    const change: ViewerChange = { time: state.timeUtcMs, rate: state.rate, playing: state.playing, cause };
    for (const listener of [...this.#listeners]) listener(change);
  }

  #open(what: string): ViewerControl {
    if (this.#control === undefined) throw new SceneError("missing-data", `${what}: ${NOT_OPEN}`);
    return this.#control;
  }
}
