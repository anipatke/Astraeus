import type { TimeBounds } from "../core/trajectory";

/** The one clock's reading as a host sees it. */
export interface ViewerState {
  readonly timeUtcMs: number;
  /** Simulated seconds per real second. */
  readonly rate: number;
  readonly playing: boolean;
  /** Only in a scene with pacing: true while pacing sets the rate, false once a visitor or the host has picked a speed. */
  readonly auto?: boolean;
}

/** Who moved the clock: the clock running (`playback`), a person at the controls (`visitor`) or the host page (`host`). */
export type ViewerChangeCause = "playback" | "visitor" | "host";

/** What a mounted viewer lets the host do to its one clock. Seeking and rate changes go through the viewer's own handlers, so there is no second clock. */
export interface ViewerControl {
  readonly window: TimeBounds;
  /** The speeds the timeline offers. */
  readonly rates: readonly number[];
  read(): ViewerState;
  seek(timeUtcMs: number): void;
  /** True: the scene has pacing, so `"auto"` is a valid choice. */
  readonly paced: boolean;
  /** A number is a chosen speed; `"auto"` gives the rate back to the scene's pacing. */
  setRate(rate: number | "auto"): void;
}

/** The viewer's side of the host link; the public API supplies the implementation (`ViewerLink`). */
export interface ViewerPort {
  /** The viewer hands over its clock controls when it opens. */
  attach(control: ViewerControl): void;
  /** The viewer is going away: the controls are no longer valid. */
  detach(): void;
  /** The viewer reports the clock's current reading; the link tells the host only when it differs from the last one. */
  publish(state: ViewerState, cause: ViewerChangeCause): void;
}
