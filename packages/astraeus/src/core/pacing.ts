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
  /** The event this zone comes from (an event rule's zones); absent for a span, which applies everywhere. */
  readonly eventId?: string;
}

/** The ids of the events a view shows; absent means every zone applies (a scene without views). */
export type ShownEvents = ReadonlySet<string> | undefined;

/** Whether a zone applies when only `shown` events are in play: spans always do, an event zone only when its event is shown. */
export function zoneInView(zone: PaceZone, shown: ShownEvents): boolean {
  return shown === undefined || zone.eventId === undefined || shown.has(zone.eventId);
}

/** The zones that apply when only `shown` events are in play (the same filter `pacedRate` reads; a host reads it to tell where playback is slowed for the view). */
export function zonesInView(zones: readonly PaceZone[], shown: ShownEvents): readonly PaceZone[] {
  return shown === undefined ? zones : zones.filter((zone) => zoneInView(zone, shown));
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
export function pacedRate(pacing: Pacing, timeUtcMs: number, shown?: ShownEvents): number {
  let logRate = Math.log(pacing.baseRate);
  let touched = false;
  for (const zone of inLayerOrder(pacing.zones)) {
    if (!zoneInView(zone, shown)) continue;
    const distance = timeUtcMs < zone.fromUtcMs ? zone.fromUtcMs - timeUtcMs : timeUtcMs > zone.toUtcMs ? timeUtcMs - zone.toUtcMs : 0;
    const weight = distance === 0 ? 1 : distance >= zone.rampMs ? 0 : smooth(1 - distance / zone.rampMs);
    if (weight > 0) touched = true;
    if (weight > 0) logRate += (Math.log(zone.rate) - logRate) * weight;
  }
  return touched ? Math.exp(logRate) : pacing.baseRate; // untouched: exactly the base, not its log round trip
}

/** How long, in real milliseconds, a change of the paced rate that comes from a view switch takes to ease in. */
export const PACE_EASE_MS = 1000;

/** What pacing reads besides the clock: the events the showing view has, and an ease in progress from a view switch (`applyPacing` clears it when it ends). */
export interface PaceView {
  shown?: ShownEvents;
  ease?: { readonly fromRate: number; readonly startMs: number };
}

/** Starts the ease from the clock's present rate; the next `applyPacing` calls blend from it to the paced rate over `PACE_EASE_MS`. */
export function startPaceEase(view: PaceView, fromRate: number, nowMs: number): void {
  view.ease = { fromRate, startMs: nowMs };
}

/** Sets the clock to the paced rate for its current time (skipped when it already runs at it); mid-ease it is the log-space blend from the ease's start rate. */
export function applyPacing(clock: SimulationClock, pacing: Pacing, view?: PaceView, nowMs: number = performance.now()): void {
  let rate = pacedRate(pacing, clock.now(), view?.shown);
  const ease = view?.ease;
  if (ease !== undefined) {
    const progress = (nowMs - ease.startMs) / PACE_EASE_MS;
    if (progress >= 1) delete view!.ease;
    else if (progress >= 0) rate = Math.exp(Math.log(ease.fromRate) + (Math.log(rate) - Math.log(ease.fromRate)) * smooth(progress));
  }
  if (rate !== clock.rate) clock.setRate(rate);
}
