import { createEvents, type TimelineEvent } from "../core/events";
import type { PaceZone, Pacing } from "../core/pacing";
import { createProvenance, type Provenance } from "../core/provenance";
import type { TimeBounds } from "../core/trajectory";
import { parseStoryPanels, StoryPanelError, type PanelLookup, type StoryPanelSet } from "../shell/storyPanels";
import { SceneError } from "./errors";
import { toUtcMs, type TimeInput } from "./time";

/** A timed event: a labelled moment on the timeline. The id is unique among the scene's events. */
export interface EventInput {
  readonly id: string;
  readonly label: string;
  readonly time: TimeInput;
  /** A free word the timeline may group by, such as "launch". */
  readonly type?: string;
  /** Where this event's time comes from. Shown with the event; an event without one shows the `provenance` of `addEvents`. Malformed: `addEvents` throws "bad-event" naming the event. */
  readonly provenance?: Provenance;
  /** The body or trajectory (its id) this event is about. Go to this event seeks to its time and frames the object as `camera.lookAt` does. Not in the scene when the scene is built (`mount`): "bad-event" naming the event and the id. Without one, Go to only seeks. */
  readonly object?: string;
}

/** Options of `addEvents`. */
export interface AddEventsOptions {
  /** Where the event times come from; shown with every event. */
  readonly provenance?: Provenance;
}

/**
 * The timeline. With `start` and `end`: its span, the playback speeds offered (`rates`, simulated seconds per real second) and the speed it opens at
 * (`rate`, default 60). With `none: true`: no timeline at all, so the viewer draws no timeline bar; the time is frozen at `at` (else the time of `setTime`),
 * or, when `rate` is given, runs on from there at that rate.
 */
export type TimelineInput =
  | { readonly start: TimeInput; readonly end: TimeInput; readonly rates?: readonly number[]; readonly rate?: number; /** Playback that slows for encounters and speeds up for cruise: see `PacingInput`. */ readonly pacing?: readonly PacingInput[]; /** True: while playing, reaching the end wraps to the start and plays on. The viewer can still seek and pause. Default false. Not available with `none: true`, where it is ignored. */ readonly loop?: boolean; readonly none?: undefined }
  | { readonly none: true; readonly at?: TimeInput; readonly rate?: number };

/**
 * One piece of a timeline's pacing. A span `{ from, to, rate }` plays at `rate` between two moments; an event rule `{ near: { type, within }, rate }` plays at `rate`
 * within `within` seconds (simulated) of every event of that `type` (see `addEvents`). Outside every piece playback runs at the timeline's `rate`. Between a piece and
 * what surrounds it the speed eases over `ramp` simulated seconds (default: `within` for an event rule, a tenth of the span for a span). `rate` here is any positive number;
 * it need not be one of the offered `rates`. Spans may not overlap (touching is fine); where an event rule meets a span or another rule, the slowest speed wins, whichever contains the other and in whatever order they are listed.
 */
export type PacingInput =
  | { readonly from: TimeInput; readonly to: TimeInput; readonly rate: number; readonly ramp?: number }
  | { readonly near: { readonly type: string; readonly within: number }; readonly rate: number; readonly ramp?: number };

/** A checked pacing piece: moments as Unix milliseconds, seconds as milliseconds. */
export type PacingPiece =
  | { readonly fromUtcMs: number; readonly toUtcMs: number; readonly rate: number; readonly rampMs: number }
  | { readonly type: string; readonly withinMs: number; readonly rate: number; readonly rampMs: number };

/** What `setTimeline` was given, checked and converted. */
export interface TimelineSetting {
  readonly window?: TimeBounds;
  readonly rates?: readonly number[];
  readonly rate?: number;
  /** Playback wraps from the end of the span to its start. */
  readonly loop?: boolean;
  /** The checked pacing pieces (absent: none). */
  readonly pacing?: readonly PacingPiece[];
  /** No timeline bar. */
  readonly none: boolean;
  /** For no timeline: the moment time is frozen at, or runs on from. */
  readonly atUtcMs?: number;
}

/**
 * The raw settings of a scene's story panels: `{ pauseSeconds?, autoOpen?, panels: [{ id, at: { utc } | { event } | { anchor }, title, body, details?, badge, sources, object? }] }`.
 * `badge` is "observed", "modelled" or "illustrative"; `sources` is never empty. A panel's time may name an event of `addEvents` or an anchor of a path, and `object` a
 * body or path of the scene; these are checked when the scene is turned into a definition (mount), and a mistake throws `bad-panels` naming the panel and field.
 */
export interface StoryPanelsInput {
  /** Seconds playback holds when a panel opens by itself (0 to 20, default 6; 0 never pauses). Playback then restarts, unless the visitor pressed Play during the hold, which ends it at once. */
  readonly pauseSeconds?: number;
  /** Whether panels open by themselves as forward playback crosses them (default true). */
  readonly autoOpen?: boolean;
  readonly panels: readonly unknown[];
}

/** Throws "bad-event" naming the first event whose `object` is not among the scene's `objectIds`. */
export function checkEventObjects(events: readonly TimelineEvent[], objectIds: ReadonlySet<string>): void {
  for (const event of events) {
    if (event.object !== undefined && !objectIds.has(event.object)) throw new SceneError("bad-event", `addEvents: event "${event.id}" object "${event.object}" is not a body or trajectory in the scene`);
  }
}

/** Checks a provenance given to `addEvents` (for the whole batch, or for the event `eventId`) and returns it frozen; throws "bad-event" when malformed. */
export function eventProvenanceOf(value: unknown, eventId?: string): Provenance {
  const where = eventId === undefined ? "addEvents: provenance" : `addEvents: event "${eventId}" provenance`;
  try {
    return createProvenance(value as Provenance);
  } catch (error) {
    throw new SceneError("bad-event", `${where} is malformed (${error instanceof Error ? error.message : String(error)})`);
  }
}

/** The events merged with `inputs`, sorted by time; each needs a distinct non-empty id and label and a valid moment. */
export function eventsOf(inputs: readonly EventInput[], known: readonly TimelineEvent[]): readonly TimelineEvent[] {
  if (!Array.isArray(inputs)) throw new SceneError("bad-event", "addEvents: events must be a list");
  const ids = new Set(known.map((event) => event.id));
  const added = inputs.map((input): TimelineEvent => {
    if (typeof input?.id !== "string" || input.id === "") throw new SceneError("bad-event", "addEvents: every event needs a non-empty id");
    if (typeof input.label !== "string" || input.label === "") throw new SceneError("bad-event", `addEvents: event "${input.id}" needs a non-empty label`);
    if (ids.has(input.id)) throw new SceneError("bad-event", `addEvents: event "${input.id}" appears twice`);
    ids.add(input.id);
    const timeUtcMs = toUtcMs(input.time, `addEvents: event "${input.id}" time`);
    if (input.object !== undefined && (typeof input.object !== "string" || input.object === "")) throw new SceneError("bad-event", `addEvents: event "${input.id}" object must be a non-empty id`);
    return { id: input.id, label: input.label, timeUtcMs, ...(input.type === undefined ? {} : { type: input.type }), ...(input.object === undefined ? {} : { object: input.object }) };
  });
  return createEvents([...known, ...added].sort((a, b) => a.timeUtcMs - b.timeUtcMs));
}

/** Checks a `setTimeline` argument and converts its moments. */
export function timelineOf(input: TimelineInput): TimelineSetting {
  const bad = (message: string) => new SceneError("bad-timeline", `setTimeline: ${message}`);
  if (typeof input !== "object" || input === null) throw bad("give an object such as { start, end } or { none: true }");
  if (input.rate !== undefined && !(Number.isFinite(input.rate) && input.rate !== 0)) throw bad(`rate must be a finite, non-zero number, got ${String(input.rate)}`);
  if ((input as { loop?: unknown }).loop !== undefined && typeof (input as { loop?: unknown }).loop !== "boolean") throw bad("loop must be true or false");
  if (input.none === true) return { none: true, ...(input.at === undefined ? {} : { atUtcMs: toUtcMs(input.at, "setTimeline at") }), ...(input.rate === undefined ? {} : { rate: input.rate }) };
  const window = { startUtcMs: toUtcMs(input.start, "setTimeline start"), endUtcMs: toUtcMs(input.end, "setTimeline end") };
  if (window.endUtcMs <= window.startUtcMs) throw bad("end must be after start");
  const rates = input.rates;
  if (rates !== undefined && (!Array.isArray(rates) || rates.length === 0 || !rates.every((rate) => Number.isFinite(rate) && rate > 0))) throw bad("rates must be a non-empty list of positive numbers");
  const pacing = pacingOf(input.pacing, bad);
  return { none: false, window, ...(rates === undefined ? {} : { rates }), ...(pacing === undefined ? {} : { pacing }), ...(input.rate === undefined ? {} : { rate: input.rate }), ...(input.loop === true ? { loop: true } : {}) };
}

/** The story panels resolved against the scene's events, anchors, objects and window; a mistake becomes a `bad-panels` SceneError. */
export function panelsOf(raw: StoryPanelsInput, lookup: PanelLookup): StoryPanelSet {
  try {
    return parseStoryPanels(raw, lookup);
  } catch (error) {
    if (error instanceof StoryPanelError) throw new SceneError("bad-panels", `addStoryPanels: ${error.message}`);
    throw error;
  }
}

/** Checks `pacing`: each piece names the field that is wrong (`pacing[2].rate`); spans must not overlap. */
function pacingOf(input: unknown, bad: (message: string) => SceneError): readonly PacingPiece[] | undefined {
  if (input === undefined) return undefined;
  if (!Array.isArray(input)) throw bad("pacing must be a list of { from, to, rate } and { near: { type, within }, rate }");
  const positive = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;
  const pieces = input.map((raw: unknown, index): PacingPiece => {
    const at = `pacing[${index}]`;
    if (typeof raw !== "object" || raw === null) throw bad(`${at} must be an object`);
    const piece = raw as { from?: TimeInput; to?: TimeInput; near?: { type?: unknown; within?: unknown }; rate?: unknown; ramp?: unknown };
    if (!positive(piece.rate)) throw bad(`${at}.rate must be a positive number, got ${String(piece.rate)}`);
    if (piece.ramp !== undefined && !(typeof piece.ramp === "number" && Number.isFinite(piece.ramp) && piece.ramp >= 0)) throw bad(`${at}.ramp must be zero or more seconds, got ${String(piece.ramp)}`);
    if (piece.near !== undefined) {
      const { type, within } = piece.near;
      if (typeof type !== "string" || type === "") throw bad(`${at}.near.type must be a non-empty event type`);
      if (!positive(within)) throw bad(`${at}.near.within must be a positive number of seconds, got ${String(within)}`);
      return { type, withinMs: within * 1000, rate: piece.rate, rampMs: (piece.ramp ?? within) * 1000 };
    }
    if (piece.from === undefined || piece.to === undefined) throw bad(`${at} needs { from, to, rate } or { near: { type, within }, rate }`);
    const fromUtcMs = toUtcMs(piece.from, `setTimeline ${at}.from`);
    const toUtcMsValue = toUtcMs(piece.to, `setTimeline ${at}.to`);
    if (toUtcMsValue <= fromUtcMs) throw bad(`${at}.to must be after ${at}.from`);
    return { fromUtcMs, toUtcMs: toUtcMsValue, rate: piece.rate, rampMs: piece.ramp === undefined ? (toUtcMsValue - fromUtcMs) / 10 : piece.ramp * 1000 };
  });
  const spans = pieces.flatMap((piece, index) => ("fromUtcMs" in piece ? [{ piece, index }] : [])).sort((a, b) => a.piece.fromUtcMs - b.piece.fromUtcMs);
  for (let i = 1; i < spans.length; i += 1) {
    if (spans[i]!.piece.fromUtcMs < spans[i - 1]!.piece.toUtcMs) throw bad(`pacing[${spans[i]!.index}] overlaps pacing[${spans[i - 1]!.index}]; spans may touch but not overlap`);
  }
  return pieces.length === 0 ? undefined : pieces;
}

/**
 * The pacing the viewer runs, laid over the events: spans, then one zone per event of each rule's type. `pacedRate` lays the zones fastest first, so the slowest applicable piece wins wherever they meet, whatever contains what.
 * A rule whose type has no event throws `bad-timeline` naming the piece (a mistyped type would otherwise slow nothing, silently).
 */
export function pacingFor(setting: TimelineSetting, events: readonly TimelineEvent[], baseRate: number): Pacing | undefined {
  if (setting.pacing === undefined) return undefined;
  const spans: PaceZone[] = [];
  const near: PaceZone[] = [];
  setting.pacing.forEach((piece, index) => {
    if ("fromUtcMs" in piece) { spans.push({ fromUtcMs: piece.fromUtcMs, toUtcMs: piece.toUtcMs, rate: piece.rate, rampMs: piece.rampMs }); return; }
    const matching = events.filter((event) => event.type === piece.type);
    if (matching.length === 0) throw new SceneError("bad-timeline", `setTimeline: pacing[${index}].near.type "${piece.type}" matches no event; give the events that type with addEvents`);
    for (const event of matching) near.push({ fromUtcMs: event.timeUtcMs - piece.withinMs, toUtcMs: event.timeUtcMs + piece.withinMs, rate: piece.rate, rampMs: piece.rampMs });
  });
  return { baseRate, zones: [...spans, ...near] };
}
