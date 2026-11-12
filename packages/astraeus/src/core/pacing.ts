import type { SimulationClock } from "./clock";
import type { TimelineEvent } from "./events";

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

/** Where an event zone lies: the part of a zone the host report and the view filter read. A `PaceZone` is one with a rate. */
export type EventZone = Pick<PaceZone, "fromUtcMs" | "toUtcMs" | "eventId">;

/** The zone of `event`: its own `withinMs` where it has one, else `defaultWithinMs`, either side of its time. The one place an event zone is cut. */
export function zoneAround(event: TimelineEvent, defaultWithinMs: number): EventZone {
  const within = event.withinMs ?? defaultWithinMs;
  return { fromUtcMs: event.timeUtcMs - within, toUtcMs: event.timeUtcMs + within, eventId: event.id };
}

/**
 * Every event zone of a scene: those of the pacing rules (`paceZones`, which already read each event's own `withinMs`) and the own zone of each event that has a `withinMs`
 * and no rule zone. A scene without pacing still has the second kind.
 */
export function eventZonesOf(events: readonly TimelineEvent[], paceZones: readonly PaceZone[]): readonly EventZone[] {
  const ruled = paceZones.filter((zone) => zone.eventId !== undefined);
  const covered = new Set(ruled.map((zone) => zone.eventId));
  const own = events.filter((event) => event.withinMs !== undefined && !covered.has(event.id)).map((event) => zoneAround(event, 0));
  return [...ruled, ...own];
}

/** The ids of the events a view shows; absent means every zone applies (a scene without views). */
export type ShownEvents = ReadonlySet<string> | undefined;

/** Whether a zone applies when only `shown` events are in play: spans always do, an event zone only when its event is shown. */
export function zoneInView<Z extends EventZone>(zone: Z, shown: ShownEvents): boolean {
  return shown === undefined || zone.eventId === undefined || shown.has(zone.eventId);
}

/** The zones that apply when only `shown` events are in play (the same filter `pacedRate` reads; a host reads it to tell where playback is slowed for the view). */
export function zonesInView<Z extends EventZone>(zones: readonly Z[], shown: ShownEvents): readonly Z[] {
  return shown === undefined ? zones : zones.filter((zone) => zoneInView(zone, shown));
}

/**
 * The ids of the events whose zone (from `withinSeconds` or a pacing rule) holds `timeUtcMs` (edges included, as `pacedRate` reads them), among the zones the showing view has; each id once, in zone order.
 * Span zones carry no event and never count. A pure function of its arguments.
 */
export function activeEventZones(zones: readonly EventZone[], shown: ShownEvents, timeUtcMs: number): readonly string[] {
  const ids: string[] = [];
  for (const zone of zonesInView(zones, shown)) {
    if (zone.eventId !== undefined && timeUtcMs >= zone.fromUtcMs && timeUtcMs <= zone.toUtcMs && !ids.includes(zone.eventId)) ids.push(zone.eventId);
  }
  return ids;
}

/** A scene's pacing: the rate outside every zone and its zones. Where zones overlap or their ramps meet the slowest speed any one of them alone would give wins, whatever order they are listed in. */
export interface Pacing {
  readonly baseRate: number;
  readonly zones: readonly PaceZone[];
}

const smooth = (x: number): number => x * x * (3 - 2 * x);

/**
 * The playback rate at `timeUtcMs`: the slowest of what each zone touching that time alone would give there (order-independent), the base rate where none does. A zone alone has weight 1 inside it and falling to 0 over its ramp
 * (smoothstep) and blends the base toward its rate in log space, so a jump of several orders of magnitude eases evenly. Each such rate is continuous in time and so is their minimum.
 * A pure function of its arguments: nothing about the State changes.
 */
export function pacedRate(pacing: Pacing, timeUtcMs: number, shown?: ShownEvents): number {
  const logBase = Math.log(pacing.baseRate);
  let logRate = Infinity;
  for (const zone of pacing.zones) {
    if (!zoneInView(zone, shown)) continue;
    const distance = timeUtcMs < zone.fromUtcMs ? zone.fromUtcMs - timeUtcMs : timeUtcMs > zone.toUtcMs ? timeUtcMs - zone.toUtcMs : 0;
    const weight = distance === 0 ? 1 : distance >= zone.rampMs ? 0 : smooth(1 - distance / zone.rampMs);
    if (weight > 0) logRate = Math.min(logRate, logBase + (Math.log(zone.rate) - logBase) * weight);
  }
  return logRate === Infinity ? pacing.baseRate : Math.exp(logRate); // untouched: exactly the base, not its log round trip
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
