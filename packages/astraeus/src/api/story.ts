import { createEvents, type TimelineEvent } from "../core/events";
import { zoneAround, type PaceZone, type Pacing } from "../core/pacing";
import { createProvenance, type Provenance } from "../core/provenance";
import type { TimeBounds } from "../core/trajectory";
import { checkPanelPlayback, checkStoryPanel, resolveStoryPanels, StoryPanelError, type CheckedPanel, type PanelActions, type PanelCameraRequest, type PanelLookup, type PanelPlayback, type StoryPanelSet } from "../core/storyPanels";
import { SceneError } from "./errors";
import { cameraRequestOf } from "./cameraRequest";
import { traceOptionsOf, type SkyTraceOptions } from "./skyTraceInput";
import type { CameraTarget } from "./viewerLink";
import { rejectRenamed } from "./renamedInputs";
import { toUtcMs, type TimeInput } from "./time";

/** A timed event: a labelled moment on the timeline. The id is unique among the scene's events: a repeat throws `duplicate-id`. */
export interface EventInput {
  readonly id: string;
  readonly label: string;
  readonly time: TimeInput;
  /** A free word the timeline may group by, such as "launch". */
  readonly type?: string;
  /** Where this event's time comes from. Shown with the event; an event without one shows the `provenance` of `addEvents`. Malformed: `addEvents` throws "bad-event" naming the event. */
  readonly provenance?: Provenance;
  /** The body, trajectory or sky figure (its id) this event is about. Go to this event seeks to its time and, for a body or trajectory, frames the object as `camera.focus` does; for a sky figure it seeks, selects it and turns toward it only while the camera looks out. Not in the scene when the scene is built (`mount`): "bad-event" naming the event and the id. Without one, Go to only seeks. */
  readonly object?: string;
  /**
   * Gives the event a zone of its own: from `withinSeconds` before its time to `withinSeconds` after it (simulated seconds, positive and finite). A host hears entering and leaving it
   * (`onEventZone`, `eventZones`), with or without pacing; a pacing rule for the event's type uses this width instead of its own `withinSeconds`. Not positive and finite: `addEvents` throws "bad-event" naming the event.
   */
  readonly withinSeconds?: number;
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
 * One piece of a timeline's pacing. A span `{ start, end, rate }` plays at `rate` between two moments; an event rule `{ near: { type, withinSeconds }, rate }` plays at `rate`
 * within `withinSeconds` (simulated) of every event of that `type` (see `addEvents`). Outside every piece playback runs at the timeline's `rate`. Between a piece and
 * what surrounds it the speed eases over `rampSeconds` simulated seconds (default: `withinSeconds` for an event rule, a tenth of the span for a span). `rate` here is any positive number;
 * it need not be one of the offered `rates`. Spans may not overlap (touching is fine); where an event rule meets a span or another rule, the slowest speed wins, whichever contains the other and in whatever order they are listed.
 */
export type PacingInput =
  | { readonly start: TimeInput; readonly end: TimeInput; readonly rate: number; readonly rampSeconds?: number }
  | { readonly near: { readonly type: string; readonly withinSeconds: number }; readonly rate: number; readonly rampSeconds?: number };

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

/** When a story panel opens: a moment, an event of `addEvents` by id, or an anchor of a path by id. Exactly one. */
export type StoryPanelAt = { readonly time: TimeInput } | { readonly event: string } | { readonly anchor: string };

/**
 * One story panel. Its shape is checked at `addStoryPanels`, which throws `bad-panels` naming the panel and field. What it names is checked when the scene is built (`check`, `mount`),
 * because the event, anchor or object may be added later: a mistake there, or a moment outside the timeline, throws `bad-panels` too.
 */
export interface StoryPanelInput {
  /** Unique among the scene's panels: a repeat throws `duplicate-id`. */
  readonly id: string;
  /** When the panel opens. Left out, it is a step: steps keep the order added, never open from playback, and show Back and Next. */
  readonly at?: StoryPanelAt;
  readonly title: string;
  /** Paragraphs, in order; one text is one paragraph. */
  readonly body: string | readonly string[];
  /** Paragraphs of exact figures, shown folded above the sources. */
  readonly details?: string | readonly string[];
  /** Where the panel's facts come from. The badge shows the word for `sourceType`; `sources`, `accuracy` and `notes` show in the panel's folded section. `sources` is never empty and `accuracy` is never blank: where a source states none, say so. */
  readonly provenance: Provenance;
  /** The id of a body, path or sky figure the panel is about; a body or path gets a marker that reopens the panel. */
  readonly object?: string;
  /** Turns the camera when the panel opens (anything `setCamera` takes). */
  readonly camera?: CameraTarget;
  /** True: selects the `object`. */
  readonly select?: boolean;
  /** Traces the `object`, a sky figure. */
  readonly trace?: true | SkyTraceOptions;
}

/** The playback settings of a scene's story panels. */
export interface StoryPanelPlaybackInput {
  /** Seconds playback holds when a panel opens by itself (0 to 20, default 6; 0 never pauses). Playback then restarts, unless the visitor pressed Play during the hold, which ends it at once. */
  readonly pauseSeconds?: number;
  /** Whether panels open by themselves as forward playback crosses them (default true). */
  readonly autoOpen?: boolean;
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

/** The events merged with `inputs`, sorted by time; each needs a non-empty id and label and a valid moment, and an id already in `known` or repeated in the batch throws `duplicate-id`. */
export function eventsOf(inputs: readonly EventInput[], known: readonly TimelineEvent[]): readonly TimelineEvent[] {
  if (!Array.isArray(inputs)) throw new SceneError("bad-event", "addEvents: events must be a list");
  const ids = new Set(known.map((event) => event.id));
  const added = inputs.map((input): TimelineEvent => {
    if (typeof input?.id !== "string" || input.id === "") throw new SceneError("bad-event", "addEvents: every event needs a non-empty id");
    if (typeof input.label !== "string" || input.label === "") throw new SceneError("bad-event", `addEvents: event "${input.id}" needs a non-empty label`);
    if (ids.has(input.id)) throw new SceneError("duplicate-id", `addEvents: event "${input.id}" is already in the scene's events`);
    ids.add(input.id);
    const timeUtcMs = toUtcMs(input.time, `addEvents: event "${input.id}" time`);
    if (input.object !== undefined && (typeof input.object !== "string" || input.object === "")) throw new SceneError("bad-event", `addEvents: event "${input.id}" object must be a non-empty id`);
    if (input.withinSeconds !== undefined && !(typeof input.withinSeconds === "number" && Number.isFinite(input.withinSeconds) && input.withinSeconds > 0)) throw new SceneError("bad-event", `addEvents: event "${input.id}" withinSeconds must be a positive, finite number of seconds, got ${String(input.withinSeconds)}`);
    return { id: input.id, label: input.label, timeUtcMs, ...(input.withinSeconds === undefined ? {} : { withinMs: input.withinSeconds * 1000 }), ...(input.type === undefined ? {} : { type: input.type }), ...(input.object === undefined ? {} : { object: input.object }) };
  });
  return createEvents([...known, ...added].sort((a, b) => a.timeUtcMs - b.timeUtcMs));
}

/** A rate that crosses the whole span in under this many real seconds is probably a unit mistake (milliseconds given for seconds). */
const MIN_CROSSING_REAL_SECONDS = 1;

/** Warns (never throws: a short span at a fast rate can be meant) when a `rate` or an offered rate crosses the whole timeline span in under a real second; I-163. */
function warnOfFastRates(window: { readonly startUtcMs: number; readonly endUtcMs: number }, input: { readonly rate?: number; readonly rates?: readonly number[] }): void {
  const spanSeconds = (window.endUtcMs - window.startUtcMs) / 1000;
  const fast = [...new Set([...(input.rates ?? []), ...(input.rate === undefined ? [] : [input.rate])].filter((rate) => spanSeconds / Math.abs(rate) < MIN_CROSSING_REAL_SECONDS))];
  if (fast.length === 0) return;
  console.warn(`setTimeline: rate ${fast.join(", ")} is in simulated seconds per real second and would cross the whole ${spanSeconds}-second span in under a real second; if the value is in milliseconds (for example DAY_MS), divide it by 1000`);
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
  warnOfFastRates(window, input);
  return { none: false, window, ...(rates === undefined ? {} : { rates }), ...(pacing === undefined ? {} : { pacing }), ...(input.rate === undefined ? {} : { rate: input.rate }), ...(input.loop === true ? { loop: true } : {}) };
}

/** Runs a core panel check, turning a `StoryPanelError` into a `bad-panels` SceneError that leads with `call`. */
function panelCheck<T>(call: string, check: () => T): T {
  try {
    return check();
  } catch (error) {
    if (error instanceof StoryPanelError) throw new SceneError("bad-panels", `${call}: ${error.message}`);
    throw error;
  }
}

/** Checks the shape of a batch for `addStoryPanels`: old forms throw `renamed`, a bad shape `bad-panels`, and an id already in `known` or repeated in the batch `duplicate-id`. */
export function panelBatchOf(inputs: readonly StoryPanelInput[], known: readonly CheckedPanel[]): readonly CheckedPanel[] {
  rejectRenamed("AddStoryPanelsCall", inputs, "addStoryPanels");
  if (!Array.isArray(inputs)) throw new SceneError("bad-panels", "addStoryPanels: give a list of panels");
  const ids = new Set(known.map(({ id }) => id));
  return inputs.map((input: unknown, index): CheckedPanel => {
    const named = (input as { id?: unknown } | null | undefined)?.id;
    const where = `addStoryPanels: story panel ${typeof named === "string" ? named : `#${index + 1}`}`;
    rejectRenamed("StoryPanelInput", input, where);
    rejectRenamed("StoryPanelAt", (input as { at?: unknown } | null | undefined)?.at, `${where} at`);
    const checked = panelCheck("addStoryPanels", () => checkStoryPanel(input, index));
    const panel = { ...checked, ...panelActionsOf(input as Record<string, unknown>, checked.id, checked.object) };
    if (ids.has(panel.id)) throw new SceneError("duplicate-id", `${where}: that id is already in the scene's panels`);
    ids.add(panel.id);
    return panel;
  });
}

/** The actions of a panel (`camera`, `select`, `trace`), checked in shape; a mistake throws `bad-panels` naming the panel and field. What they name is checked when the scene is built. */
function panelActionsOf(input: Record<string, unknown>, id: string, object: string | undefined): PanelActions {
  const bad = (field: string, why: string) => new SceneError("bad-panels", `addStoryPanels: story panel ${id}: ${field} ${why}`);
  let camera: PanelCameraRequest | undefined;
  if (input.camera !== undefined) {
    try {
      camera = cameraRequestOf(input.camera, "camera", undefined, true) as PanelCameraRequest;
    } catch (error) {
      throw bad("camera", `is not a camera target (${error instanceof Error ? error.message : String(error)})`);
    }
  }
  if (input.select !== undefined && typeof input.select !== "boolean") throw bad("select", "must be true or false");
  if (input.select === true && object === undefined) throw bad("select", "needs an object to select");
  let trace: PanelActions["trace"];
  if (input.trace !== undefined && input.trace !== false) {
    if (object === undefined) throw bad("trace", "needs an object that names a sky figure");
    try {
      trace = traceOptionsOf(input.trace === true ? undefined : input.trace);
    } catch (error) {
      throw bad("trace", `is not true or trace options (${error instanceof Error ? error.message : String(error)})`);
    }
  }
  return { ...(camera === undefined ? {} : { camera }), ...(input.select === true ? { select: true as const } : {}), ...(trace === undefined ? {} : { trace }) };
}

/** Checks a `setStoryPanelPlayback` argument; a mistake throws `bad-panels`. */
export function panelPlaybackOf(input: StoryPanelPlaybackInput): PanelPlayback {
  return panelCheck("setStoryPanelPlayback", () => checkPanelPlayback(input));
}

/** The story panels resolved against the scene's events, anchors, objects and window; a mistake becomes a `bad-panels` SceneError. */
export function panelsOf(panels: readonly CheckedPanel[], playback: PanelPlayback, lookup: PanelLookup): StoryPanelSet {
  return panelCheck("addStoryPanels", () => resolveStoryPanels(panels, playback, lookup));
}

/** Checks `pacing`: each piece names the field that is wrong (`pacing[2].rate`); spans must not overlap. */
function pacingOf(input: unknown, bad: (message: string) => SceneError): readonly PacingPiece[] | undefined {
  if (input === undefined) return undefined;
  if (!Array.isArray(input)) throw bad("pacing must be a list of { start, end, rate } and { near: { type, withinSeconds }, rate }");
  const positive = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;
  const pieces = input.map((raw: unknown, index): PacingPiece => {
    const at = `pacing[${index}]`;
    if (typeof raw !== "object" || raw === null) throw bad(`${at} must be an object`);
    const piece = raw as { start?: TimeInput; end?: TimeInput; near?: { type?: unknown; withinSeconds?: unknown }; rate?: unknown; rampSeconds?: unknown };
    rejectRenamed(piece.near === undefined ? "PacingSpan" : "PacingRule", piece, `setTimeline: ${at}`);
    if (!positive(piece.rate)) throw bad(`${at}.rate must be a positive number, got ${String(piece.rate)}`);
    if (piece.rampSeconds !== undefined && !(typeof piece.rampSeconds === "number" && Number.isFinite(piece.rampSeconds) && piece.rampSeconds >= 0)) throw bad(`${at}.rampSeconds must be zero or more seconds, got ${String(piece.rampSeconds)}`);
    if (piece.near !== undefined) {
      rejectRenamed("PacingNear", piece.near, `setTimeline: ${at}.near`);
      const { type, withinSeconds } = piece.near;
      if (typeof type !== "string" || type === "") throw bad(`${at}.near.type must be a non-empty event type`);
      if (!positive(withinSeconds)) throw bad(`${at}.near.withinSeconds must be a positive number of seconds, got ${String(withinSeconds)}`);
      return { type, withinMs: withinSeconds * 1000, rate: piece.rate, rampMs: (piece.rampSeconds ?? withinSeconds) * 1000 };
    }
    if (piece.start === undefined || piece.end === undefined) throw bad(`${at} needs { start, end, rate } or { near: { type, withinSeconds }, rate }`);
    const fromUtcMs = toUtcMs(piece.start, `setTimeline ${at}.start`);
    const toUtcMsValue = toUtcMs(piece.end, `setTimeline ${at}.end`);
    if (toUtcMsValue <= fromUtcMs) throw bad(`${at}.end must be after ${at}.start`);
    return { fromUtcMs, toUtcMs: toUtcMsValue, rate: piece.rate, rampMs: piece.rampSeconds === undefined ? (toUtcMsValue - fromUtcMs) / 10 : piece.rampSeconds * 1000 };
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
    for (const event of matching) near.push({ ...zoneAround(event, piece.withinMs), rate: piece.rate, rampMs: piece.rampMs });
  });
  return { baseRate, zones: [...spans, ...near] };
}
