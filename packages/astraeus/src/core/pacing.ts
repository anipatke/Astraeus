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

/**
 * A scene's pacing: the rate outside every zone and its zones. Spans (zones with no event) set the cruise over the base; an event rule eases down from the cruise, and where rules overlap or their ramps meet the slowest
 * speed any one of them alone would give wins, whatever order they are listed in.
 */
export interface Pacing {
  readonly baseRate: number;
  readonly zones: readonly PaceZone[];
}

const smooth = (x: number): number => x * x * (3 - 2 * x);

/** A zone list split into its spans (fastest first, so the slowest is laid last and wins where ramps meet) and its event rules. Cached per zone list. */
interface Layers { readonly spans: readonly PaceZone[]; readonly rules: readonly PaceZone[] }
const layered = new WeakMap<readonly PaceZone[], Layers>();

function layersOf(zones: readonly PaceZone[]): Layers {
  let layers = layered.get(zones);
  if (layers === undefined) {
    layers = { spans: zones.filter((zone) => zone.eventId === undefined).sort((a, b) => b.rate - a.rate), rules: zones.filter((zone) => zone.eventId !== undefined) };
    layered.set(zones, layers);
  }
  return layers;
}

/** The weight of `zone` at `timeUtcMs`: 1 inside it, falling to 0 over its ramp (smoothstep). */
function zoneWeight(zone: PaceZone, timeUtcMs: number): number {
  const distance = timeUtcMs < zone.fromUtcMs ? zone.fromUtcMs - timeUtcMs : timeUtcMs > zone.toUtcMs ? timeUtcMs - zone.toUtcMs : 0;
  return distance === 0 ? 1 : distance >= zone.rampMs ? 0 : smooth(1 - distance / zone.rampMs);
}

/**
 * The playback rate at `timeUtcMs`. The cruise is the base with the spans laid over it, slowest last (log-space blend). An event rule touching that time eases from the cruise toward its rate by its weight, and the paced
 * rate is the slowest of the cruise and of what each touching rule gives (a rule faster than the cruise changes nothing). Each term is continuous in time, so the rate is continuous at every zone and ramp edge, and
 * the minimum does not depend on the order of the zones. Untouched, it is exactly the base. A pure function of its arguments: nothing about the State changes.
 */
export function pacedRate(pacing: Pacing, timeUtcMs: number, shown?: ShownEvents): number {
  const { spans, rules } = layersOf(pacing.zones);
  let logCruise = Math.log(pacing.baseRate);
  let touched = false;
  for (const zone of spans) {
    const weight = zoneWeight(zone, timeUtcMs);
    if (weight > 0) { touched = true; logCruise += (Math.log(zone.rate) - logCruise) * weight; }
  }
  let logRate = logCruise;
  for (const zone of rules) {
    if (!zoneInView(zone, shown)) continue;
    const weight = zoneWeight(zone, timeUtcMs);
    if (weight > 0) { touched = true; logRate = Math.min(logRate, logCruise + (Math.log(zone.rate) - logCruise) * weight); }
  }
  return touched ? Math.exp(logRate) : pacing.baseRate; // untouched: exactly the base, not its log round trip
}

/** How long, in real milliseconds, a change of the paced rate that comes from a view switch takes to ease in. */
export const PACE_EASE_MS = 1000;

/** What pacing reads besides the clock: the events the showing view has, and an ease in progress from a view switch (`applyPacing` clears it when it ends). */
export interface PaceView {
  shown?: ShownEvents;
  ease?: { readonly fromRate: number; readonly startMs: number; /** log(fromRate) - log(paced rate at the switch): the change the switch itself caused; set on first use. */ k0?: number };
  /** Where `stepPacing` left the clock: its time and rate, and the real time it did so. Absent until the first step, and cleared by a seek or any other move of the clock the step did not make. */
  last?: { readonly timeUtcMs: number; readonly rate: number; readonly nowMs: number };
}

/** Starts the ease from the clock's present rate; the next `applyPacing` calls blend from it to the paced rate over `PACE_EASE_MS`. */
export function startPaceEase(view: PaceView, fromRate: number, nowMs: number): void {
  view.ease = { fromRate, startMs: nowMs };
}

/** The ease's own change, fixed once at the switch (the first time it is read, at the switch's time): log(start rate) minus log(the new view's paced rate there). */
export function easeShift(view: PaceView, timeUtcMs: number, pacing: Pacing): number {
  const ease = view.ease!;
  ease.k0 ??= Math.log(ease.fromRate) - Math.log(pacedRate(pacing, timeUtcMs, view.shown));
  return ease.k0;
}

/** Sets the clock to the paced rate for its current time (skipped when it already runs at it); mid-ease the switch's own change decays over it: the paced shape times exp(k0 * (1 - weight)), so a zone reached during the ease still slows playback. */
export function applyPacing(clock: SimulationClock, pacing: Pacing, view?: PaceView, nowMs: number = performance.now()): void {
  let rate = pacedRate(pacing, clock.now(), view?.shown);
  const ease = view?.ease;
  if (ease !== undefined) {
    const progress = (nowMs - ease.startMs) / PACE_EASE_MS;
    if (progress >= 1) delete view!.ease;
    else if (progress >= 0) rate = Math.exp(Math.log(rate) + easeShift(view!, clock.now(), pacing) * (1 - smooth(progress)));
  }
  if (rate !== clock.rate) clock.setRate(rate);
}

/** The most sub-steps one `pacedAdvance` call takes; real time left over after them is dropped, so a frame that long (a tab left hidden) slows the clock rather than skipping a zone. */
export const MAX_PACE_STEPS = 4096;
/** A sub-step inside a ramp covers at most this part of the ramp's simulated length. */
const RAMP_STEP_FRACTION = 1 / 32;

/** The longest simulated distance a sub-step from `t` may cover in `direction`: to the next zone or ramp edge, and a fraction of the ramp while inside one. */
function stepCap(zones: readonly PaceZone[], t: number, direction: 1 | -1): number {
  let cap = Infinity;
  for (const zone of zones) {
    const edges = [zone.fromUtcMs - zone.rampMs, zone.fromUtcMs, zone.toUtcMs, zone.toUtcMs + zone.rampMs];
    for (const edge of edges) {
      const distance = direction * (edge - t);
      if (distance > 0) cap = Math.min(cap, distance);
    }
    if (zone.rampMs > 0) {
      for (const [lo, hi] of [[edges[0]!, edges[1]!], [edges[2]!, edges[3]!]] as const) {
        const inside = direction === 1 ? t >= lo && t < hi : t > lo && t <= hi;
        if (inside) cap = Math.min(cap, zone.rampMs * RAMP_STEP_FRACTION);
      }
    }
  }
  return cap;
}

/** A view-switch ease as `pacedAdvance` reads it: the switch's own change k0 (see `easeShift`) and how far into its `PACE_EASE_MS` it already is, in real milliseconds, when the advance begins. */
export interface AdvanceEase { readonly k0: number; readonly elapsedMs: number }

/** A sub-step inside a running ease covers at most this much real time, so the eased rate is read finely enough. */
const EASE_STEP_MS = PACE_EASE_MS / 32;

/** The rate the clock runs at: the paced rate at `t`, with the ease's decaying change laid over its shape while the ease runs (as `applyPacing` does), `usedMs` of real time into the advance. */
function advanceRate(pacing: Pacing, t: number, shown: ShownEvents, ease: AdvanceEase | undefined, usedMs: number): number {
  const rate = pacedRate(pacing, t, shown);
  if (ease === undefined) return rate;
  const progress = (ease.elapsedMs + usedMs) / PACE_EASE_MS;
  if (progress >= 1 || progress < 0) return rate;
  return Math.exp(Math.log(rate) + ease.k0 * (1 - smooth(progress)));
}

/**
 * The time `realElapsedMs` of real time after `fromUtcMs` when the clock runs at `pacedRate` throughout (`direction` -1 runs it backward): the rate is integrated, not read once, so a long frame still slows down
 * through every zone and ramp it crosses. Each sub-step stops at the next zone or ramp edge, covers at most 1/32 of a ramp, and is timed by the trapezoid rule on the rates at its two ends (the far one a millisecond short).
 * With an `ease` (a view switch changing the rate) the rate integrated is the eased one, and a sub-step also covers at most 1/32 of the ease's real time while it runs.
 * At most `MAX_PACE_STEPS` sub-steps; the result is a whole millisecond. A pure function of its arguments.
 */
export function pacedAdvance(pacing: Pacing, fromUtcMs: number, realElapsedMs: number, shown?: ShownEvents, direction: 1 | -1 = 1, ease?: AdvanceEase): number {
  const zones = zonesInView(pacing.zones, shown);
  let t = fromUtcMs;
  let left = realElapsedMs;
  for (let step = 0; step < MAX_PACE_STEPS && left > 0; step += 1) {
    const used = realElapsedMs - left;
    const easing = ease !== undefined && ease.elapsedMs + used >= 0 && ease.elapsedMs + used < PACE_EASE_MS;
    const startRate = advanceRate(pacing, t, shown, ease, used);
    const length = Math.min(stepCap(zones, t, direction), startRate * Math.min(left, easing ? EASE_STEP_MS : Infinity));
    const end = t + direction * length;
    const endUsed = used + Math.min(left, length / startRate); // the real time the step takes if the rate stayed as at its start
    const endRate = advanceRate(pacing, end - direction * Math.min(1, length / 2), shown, ease, endUsed); // a millisecond short of the end, so a jump of rate at a hard edge is not read early
    const needed = (length * (1 / startRate + 1 / endRate)) / 2; // trapezoid: real time is the mean of the reciprocal rates times the distance
    if (needed <= left) { t = end; left -= needed; }
    else { t += (direction * length * left) / needed; left = 0; }
  }
  return Math.round(t);
}

/** Real-time slack, in milliseconds, between the clock's own advance and the real time `stepPacing` measured before the move is taken as someone else's (a seek). */
const STEP_SLACK_MS = 5;

/**
 * One pacing step per frame: moves the clock from where the last step left it by `pacedAdvance` over the real time since, then sets the paced rate for the new time (`applyPacing`'s job). Falls back to `applyPacing`
 * (one rate for the frame) on the first step, while paused, or when the clock was moved or re-rated since the last step. The clock is moved through its public `seek` and `setRate`.
 */
export function stepPacing(clock: SimulationClock, pacing: Pacing, view: PaceView, nowMs: number = performance.now()): void {
  const last = view.last;
  const realMs = last === undefined ? 0 : nowMs - last.nowMs;
  const clockMs = last === undefined ? 0 : (clock.now() - last.timeUtcMs) / last.rate;
  const continuous = last !== undefined && clock.playing && clock.rate === last.rate && realMs > 0 && Math.abs(clockMs - realMs) <= STEP_SLACK_MS + 2 / last.rate;
  if (continuous) {
    const ease = view.ease === undefined ? undefined : { k0: easeShift(view, last.timeUtcMs, pacing), elapsedMs: last.nowMs - view.ease.startMs };
    const to = pacedAdvance(pacing, last.timeUtcMs, realMs, view.shown, 1, ease);
    if (to !== clock.now()) clock.seek(to);
  }
  applyPacing(clock, pacing, view, nowMs);
  if (clock.playing) view.last = { timeUtcMs: clock.now(), rate: clock.rate, nowMs };
  else delete view.last;
}
