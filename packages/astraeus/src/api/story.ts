import { createEvents, type TimelineEvent } from "../core/events";
import type { Provenance } from "../core/provenance";
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
  | { readonly start: TimeInput; readonly end: TimeInput; readonly rates?: readonly number[]; readonly rate?: number; /** True: while playing, reaching the end wraps to the start and plays on. The viewer can still seek and pause. Default false. Not available with `none: true`, where it is ignored. */ readonly loop?: boolean; readonly none?: undefined }
  | { readonly none: true; readonly at?: TimeInput; readonly rate?: number };

/** What `setTimeline` was given, checked and converted. */
export interface TimelineSetting {
  readonly window?: TimeBounds;
  readonly rates?: readonly number[];
  readonly rate?: number;
  /** Playback wraps from the end of the span to its start. */
  readonly loop?: boolean;
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
    return { id: input.id, label: input.label, timeUtcMs, ...(input.type === undefined ? {} : { type: input.type }) };
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
  return { none: false, window, ...(rates === undefined ? {} : { rates }), ...(input.rate === undefined ? {} : { rate: input.rate }), ...(input.loop === true ? { loop: true } : {}) };
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
