// The one rule for the points of an orbit line, as times (no Three.js, no State): every sample sits at a whole multiple of a fixed step, so
// the line does not shift as the clock runs; a head of finer points, also at whole multiples of a fine step, runs from the last sample up to
// the display time; a path is re-sampled when the clock enters a later step, at once when it jumped.

/** Share of a line's span a clock jump may cover before the line is re-sampled at once rather than in turn. */
export const JUMP_SHARE = 0.25;

/** The step index (whole steps since the epoch) the display time is in. */
export function stepIndex(displayMs: number, stepMs: number): number {
  return Math.floor(displayMs / stepMs);
}

/**
 * The grid sample times, oldest first: `count` whole multiples of `stepMs`, the last a whole step before the step `displayMs` is in, so
 * a sample never moves while the clock stays in that step.
 */
export function gridTimes(displayMs: number, stepMs: number, count: number): number[] {
  const last = (stepIndex(displayMs, stepMs) - 1) * stepMs;
  return Array.from({ length: count }, (_, i) => last - (count - 1 - i) * stepMs);
}

/** A time kept inside the loaded data (not before `loadedFromMs`, unless the time is later) and not past the display time, in whole ms. */
export function clampTimeMs(timeMs: number, displayMs: number, loadedFromMs: number): number {
  return Math.round(Math.min(displayMs, Math.max(loadedFromMs, timeMs)));
}

/**
 * The head's fine point indices (whole multiples of `stepMs / substeps`): from the last grid sample (step `builtStep` less one) up to the
 * fine step `displayMs` is in, at most `maxPoints` past the first. Index `j` is at time `j * stepMs / substeps`.
 */
export function headRange(
  builtStep: number,
  displayMs: number,
  stepMs: number,
  substeps: number,
  maxPoints: number,
): { from: number; to: number } {
  const from = (builtStep - 1) * substeps;
  return { from, to: Math.max(from, Math.min(Math.floor(displayMs / (stepMs / substeps)), from + maxPoints)) };
}

/**
 * How many leading points of the new head range [from, to] are already held (a held range [have, have + haveCount - 1]): all of them
 * that lie in the new range when it starts inside the held one and the held one ends no later; else none (re-sample the lot).
 */
export function keptHeadPoints(have: number, haveCount: number, from: number, to: number): number {
  const haveTo = have + haveCount - 1;
  return have <= from && from <= haveTo && haveTo <= to ? haveTo - from + 1 : 0;
}

/** How many whole steps the display time is past the step a line was built in (negative when it went back). */
export function stepsMoved(displayMs: number, stepMs: number, builtStep: number): number {
  return stepIndex(displayMs, stepMs) - builtStep;
}

/** Whether a line is re-sampled at once, whatever the per-frame budget: `whole` (the scale changed), or it moved backwards or past the jump share of `span` steps. */
export function resampleNow(moved: number, spanSteps: number, whole: boolean): boolean {
  return whole || !(moved >= 0 && moved <= JUMP_SHARE * spanSteps);
}

/** Whether a line is stale: the display time has entered a later step, so it is re-sampled in turn. */
export function isStale(moved: number): boolean {
  return moved >= 1;
}
