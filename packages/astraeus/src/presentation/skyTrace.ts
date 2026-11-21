// How a sky-figure trace runs (O-065 T-297): pure arithmetic with no drawing, shared by the host call's checks (`src/api`) and the frame stage (`src/app`). Wall time only: the scene clock never enters.

/** What follows a trace: the traced lines stay, or fade away. (Removing a trace at any time is `clearSkyTrace`.) */
export type SkyTraceAfter = "stay" | "fade";

export const SKY_TRACE_AFTER: readonly SkyTraceAfter[] = Object.freeze(["stay", "fade"] as const);

/** How long a trace takes, in seconds, when the app does not say. */
export const DEFAULT_TRACE_SECONDS = 2;
/** The range of `durationSeconds` a trace accepts. */
export const TRACE_SECONDS_LIMITS = Object.freeze({ min: 0.1, max: 60 });
/** How long a `fade` takes after the trace, in seconds. */
export const TRACE_FADE_SECONDS = 1;

/** How long sky lines and their names take to fade in when they appear, in seconds, when the look does not say (owner, T-306). */
export const DEFAULT_SKY_FADE_IN_SECONDS = 0.5;
/** The longest step one frame moves the fade-in on, in seconds, so a frame after an idle spell (the scene draws only when needed) does not skip the fade. */
export const SKY_FADE_IN_STEP_LIMIT = 0.1;

/** The share of a fade-in shown after one more step: `from` moved on by `deltaSeconds` (capped at `SKY_FADE_IN_STEP_LIMIT`) of `seconds`; 0 seconds shows it all at once. */
export function stepFadeIn(from: number, deltaSeconds: number, seconds: number): number {
  if (seconds <= 0) return 1;
  return Math.min(1, from + Math.min(SKY_FADE_IN_STEP_LIMIT, Math.max(0, deltaSeconds)) / seconds);
}

/** One trace in progress. `reduced`: the person asked for less motion, so the whole figure shows at once. */
export interface SkyTraceRun {
  readonly seconds: number;
  readonly after: SkyTraceAfter;
  readonly reduced: boolean;
  /** Real seconds since the trace began. */
  elapsed: number;
}

/** What one step of a trace says to draw. */
export interface SkyTraceFrame {
  /** The share of the figure's segments drawn, 0 to 1 (segments in order, each growing from its first end). */
  readonly drawn: number;
  /** How far the lines have faded, 0 to 1 (0: the traced colour; 1: the faded colour, then gone). */
  readonly fade: number;
  /** True: the trace is over and its lines go (`clear`, or a finished `fade`). */
  readonly done: boolean;
  /** True: this step changed what is drawn, so the scene must draw this frame. */
  readonly moving: boolean;
}

/** Moves a trace on by `deltaSeconds` of real time and says what to draw. A `stay` trace holds its drawn figure for good (until the app traces it again). */
export function stepTrace(run: SkyTraceRun, deltaSeconds: number): SkyTraceFrame {
  const unsettled = run.elapsed < run.seconds; // a `stay` trace changes only until it is fully drawn
  run.elapsed += Math.max(0, deltaSeconds);
  const drawn = run.reduced ? 1 : Math.min(1, run.elapsed / run.seconds);
  if (run.elapsed < run.seconds) return { drawn, fade: 0, done: false, moving: true };
  if (run.after === "stay") return { drawn: 1, fade: 0, done: false, moving: unsettled };
  if (run.reduced) return { drawn: 1, fade: 1, done: true, moving: true };
  const fade = Math.min(1, (run.elapsed - run.seconds) / TRACE_FADE_SECONDS);
  return { drawn: 1, fade, done: fade >= 1, moving: true };
}

/** A trace on its way out because the host asked to clear it: eases from the fade it had to 1 over `seconds` (0: gone this step). */
export interface SkyHideRun {
  readonly seconds: number;
  /** The fade the trace had when the request was taken, 0 to 1. */
  readonly from: number;
  /** Real seconds since the request was taken. */
  elapsed: number;
}

/** Moves a hide on by `deltaSeconds` of real time; `drawn` is the share the trace had reached, which a hide holds. */
export function stepHide(run: SkyHideRun, deltaSeconds: number, drawn: number): SkyTraceFrame {
  run.elapsed += Math.max(0, deltaSeconds);
  const share = run.seconds <= 0 ? 1 : Math.min(1, run.elapsed / run.seconds);
  const fade = run.from + (1 - run.from) * share;
  return { drawn, fade, done: share >= 1, moving: true };
}
