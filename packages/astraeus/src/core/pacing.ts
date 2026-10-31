import type { SimulationClock } from "./clock";

/**
 * One stretch of the timeline with its own playback rate: full `rate` from `fromUtcMs` to `toUtcMs`, easing back to the surrounding rate over
 * `rampMs` of simulated time on either side. The ramp is in simulated time, so the paced rate stays a pure function of the clock's time.
 */
export interface PaceZone {
  readonly fromUtcMs: number;
  readonly toUtcMs: number;
  readonly rate: number;
  readonly rampMs: number;
}

/** A scene's pacing: the rate outside every zone and its zones. Where zones overlap the slowest wins whatever order they are listed in (`pacedRate` lays the fastest first and the slowest last). */
export interface Pacing {
  readonly baseRate: number;
  readonly zones: readonly PaceZone[];
}

const slowestLast = new WeakMap<readonly PaceZone[], readonly PaceZone[]>();

/** The zones fastest first, so the slowest is laid last and wins wherever zones meet, ramps included. Cached per zone list. */
function inLayerOrder(zones: readonly PaceZone[]): readonly PaceZone[] {
  let sorted = slowestLast.get(zones);
  if (sorted === undefined) {
    sorted = [...zones].sort((a, b) => b.rate - a.rate);
    slowestLast.set(zones, sorted);
  }
  return sorted;
}

const smooth = (x: number): number => x * x * (3 - 2 * x);

/**
 * The playback rate at `timeUtcMs`: the base rate, with each zone laid over it in turn, fastest first so the slowest wins where zones meet (order-independent). A zone's weight is 1 inside it and falls to 0 over its ramp
 * (smoothstep); the rate blends in log space, so a jump of several orders of magnitude eases evenly. Every weight is continuous in time, so the
 * result is continuous too. A pure function of its arguments: nothing about the State changes.
 */
export function pacedRate(pacing: Pacing, timeUtcMs: number): number {
  let logRate = Math.log(pacing.baseRate);
  let touched = false;
  for (const zone of inLayerOrder(pacing.zones)) {
    const distance = timeUtcMs < zone.fromUtcMs ? zone.fromUtcMs - timeUtcMs : timeUtcMs > zone.toUtcMs ? timeUtcMs - zone.toUtcMs : 0;
    const weight = distance === 0 ? 1 : distance >= zone.rampMs ? 0 : smooth(1 - distance / zone.rampMs);
    if (weight > 0) touched = true;
    if (weight > 0) logRate += (Math.log(zone.rate) - logRate) * weight;
  }
  return touched ? Math.exp(logRate) : pacing.baseRate; // untouched: exactly the base, not its log round trip
}

/** Sets the clock to the paced rate for its current time (skipped when it already runs at it). */
export function applyPacing(clock: SimulationClock, pacing: Pacing): void {
  const rate = pacedRate(pacing, clock.now());
  if (rate !== clock.rate) clock.setRate(rate);
}
