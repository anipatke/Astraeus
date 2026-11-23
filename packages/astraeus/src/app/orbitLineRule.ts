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

// One turn about the display time (T-445): an orbit line is a whole turn on a fixed grid around the display time, not a trailing ring; it is
// re-sampled only when the display time leaves the middle half of the turn, and a head of fine grid points runs through the display time.

/** Fine head points per far step, and how many fine steps the head reaches either side of the display time (one far step). */
export const HEAD_SUBSTEPS = 16;
export const HEAD_REACH = HEAD_SUBSTEPS;
/** At most this many new head points are taken from the source in one frame, nearest the display time first: a fast clock that outruns the head costs no more than this. */
export const HEAD_BUDGET = 4;

/**
 * One turn's sample times on a fixed grid, oldest first: `count` whole multiples of `turnMs / (count - 1)` (each rounded to the ms), the
 * middle one the grid step nearest `displayMs`, so the turn covers the display time with half a turn either side.
 */
export function turnGridTimes(displayMs: number, turnMs: number, count: number): number[] {
  const step = turnMs / (count - 1);
  const first = Math.round(displayMs / step) - Math.floor((count - 1) / 2);
  return Array.from({ length: count }, (_, i) => Math.round((first + i) * step));
}

/**
 * One turn's sample times spaced evenly in eccentric anomaly on a fixed anomaly grid (whole multiples of `2π / (count - 1)` from periapsis),
 * oldest first, the middle one the grid anomaly nearest the display time's. `eccentricAnomalyOf` maps a time's mean anomaly to its eccentric one.
 */
export function eccentricTurnTimes(
  displayMs: number,
  orbit: { readonly eccentricity: number; readonly periodMs: number; readonly periapsisUtcMs: number },
  count: number,
  eccentricAnomalyOf: (meanRad: number, eccentricity: number) => number,
): number[] {
  const { eccentricity: e, periodMs, periapsisUtcMs } = orbit;
  const step = (2 * Math.PI) / (count - 1);
  const now = eccentricAnomalyOf((2 * Math.PI * (displayMs - periapsisUtcMs)) / periodMs, e);
  const first = Math.round(now / step) - Math.floor((count - 1) / 2);
  return Array.from({ length: count }, (_, i) => {
    const anomaly = (first + i) * step;
    return Math.round(periapsisUtcMs + (periodMs * (anomaly - e * Math.sin(anomaly))) / (2 * Math.PI));
  });
}

/** Whether the display time is outside the middle half of a turn sampled from `firstMs` to `lastMs` (or the turn is empty): re-sample it. */
export function outsideMiddleHalf(displayMs: number, firstMs: number, lastMs: number): boolean {
  const quarter = (lastMs - firstMs) / 4;
  return !(displayMs >= firstMs + quarter && displayMs <= lastMs - quarter);
}

/** The head's fine indices about the display time: `reach` fine steps before the fine step it is in to `reach` after the next. Index `j` is at `fineTimeMs(j, fineMs)`. */
export function headAbout(displayMs: number, fineMs: number, reach: number): { from: number; to: number } {
  const j = Math.floor(displayMs / fineMs);
  return { from: j - reach, to: j + 1 + reach };
}

/** The time of fine index `j`, in whole ms. */
export function fineTimeMs(j: number, fineMs: number): number {
  return Math.round(j * fineMs);
}

/**
 * The drawn line's times, in order: the far samples, the head times and the live time merged, each time once. `far[i]` is marked by its
 * index; a head or live time by -1. Every input list must be in order.
 */
export function mergedLineTimes(
  far: readonly number[],
  head: readonly number[],
  liveMs: number | null,
): { times: number[]; farIndex: number[] } {
  const extra = liveMs === null ? head : insertSorted(head, liveMs);
  const times: number[] = [];
  const farIndex: number[] = [];
  let [i, k] = [0, 0];
  while (i < far.length || k < extra.length) {
    const takeFar = k >= extra.length || (i < far.length && far[i]! <= extra[k]!);
    const t = takeFar ? far[i]! : extra[k]!;
    if (times.length === 0 || times[times.length - 1] !== t) {
      times.push(t);
      farIndex.push(takeFar ? i : -1);
    } else if (takeFar) farIndex[farIndex.length - 1] = i;
    if (takeFar) i += 1;
    else k += 1;
  }
  return { times, farIndex };
}

function insertSorted(list: readonly number[], value: number): number[] {
  const out = list.slice();
  let at = out.findIndex((t) => t >= value);
  if (at < 0) at = out.length;
  out.splice(at, 0, value);
  return out;
}

/** The head's fine indices from `from` to `to`, nearest the fine step `displayMs` is in first (ties: the later first). */
export function headByNearness(displayMs: number, fineMs: number, from: number, to: number): number[] {
  const j = Math.floor(displayMs / fineMs);
  return Array.from({ length: to - from + 1 }, (_, i) => from + i).sort(
    (a, b) => Math.abs(a - j - 0.5) - Math.abs(b - j - 0.5) || b - a,
  );
}
