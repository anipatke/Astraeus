import { createProvenance, PROVENANCE_SOURCE_TYPES, type Provenance, type ProvenanceSourceType } from "./provenance";
import type { StartView } from "./startView";
import type { SkyTraceAfter } from "./skyTrace";
import { timeInputMs, type TimeInput } from "./timeInput";
import type { TimeBounds } from "./trajectory";

/** A camera request a panel makes when it opens (checked): the same shapes the scene camera takes. A look-out `direction` that is absent keeps the direction already looked along (else right ascension 0, declination 0). */
export type PanelCameraRequest =
  | { readonly kind: "focus" | "follow"; readonly target: string }
  | { readonly kind: "overview" }
  | { readonly kind: "hold" }
  | { readonly kind: "lookOut"; readonly body: string; readonly direction?: readonly [number, number, number] | string; readonly fovDeg?: number }
  | { readonly kind: "pose"; readonly view: StartView };

/** What a panel does when it opens, in this order: the camera turns, its object is selected, its object's sky figure is traced. */
export interface PanelActions {
  readonly camera?: PanelCameraRequest;
  /** True: select the panel's `object`. */
  readonly select?: true;
  /** Trace the panel's `object`, a sky figure, this way. */
  readonly trace?: { readonly seconds: number; readonly after: SkyTraceAfter };
}

/** The ids a camera request names: the bodies it points at, and the id a look-out turns toward (a body or a sky figure). */
export function cameraIdsOf(request: PanelCameraRequest): { readonly bodies: readonly string[]; readonly toward?: string } {
  switch (request.kind) {
    case "focus": case "follow": return { bodies: [request.target] };
    case "pose": return { bodies: [request.view.focus] };
    case "lookOut": return typeof request.direction === "string" ? { bodies: [request.body], toward: request.direction } : { bodies: [request.body] };
    default: return { bodies: [] };
  }
}

/** One short story panel, resolved to a UTC time. */
export interface StoryPanel extends PanelActions {
  readonly id: string;
  readonly timeUtcMs: number;
  readonly title: string;
  /** Paragraphs, in order. */
  readonly body: readonly string[];
  /** Short paragraphs of exact figures and measured-versus-reconstructed notes, shown in the folded section above the sources. Empty when the panel has none. */
  readonly details: readonly string[];
  /** Where the panel's facts come from and how far to trust them (PROV-01): its `sourceType` is the badge word; `sources` is never empty and `accuracy` is always stated. */
  readonly provenance: Provenance;
  /** A shell object this panel is about; the scene draws a marker on it that reopens the panel. */
  readonly objectId?: string;
}

/** A story step: a panel with no moment, shown in the order added with Back and Next. */
export type StoryStep = Omit<StoryPanel, "timeUtcMs"> & {
  /** The step's place among the steps, counting from 1 in the order added. */
  readonly step: number;
};

/** The panels an experience offers, with the defaults of the two settings that govern them. */
export interface StoryPanelSet {
  /** The moment panels, sorted by time. */
  readonly panels: readonly StoryPanel[];
  /** The steps, in the order added; absent or empty when there are none. */
  readonly steps?: readonly StoryStep[];
  /** How long playback holds when a panel opens by itself, in seconds (0 never pauses). */
  readonly pauseSeconds: number;
  /** Whether panels open by themselves as forward playback reaches them. */
  readonly autoOpen: boolean;
}

export const DEFAULT_PANEL_PAUSE_SECONDS = 6;
export const MAX_PANEL_PAUSE_SECONDS = 20;

/** The two playback settings of a scene's story panels. */
export type PanelPlayback = Pick<StoryPanelSet, "pauseSeconds" | "autoOpen">;

export const DEFAULT_PANEL_PLAYBACK: PanelPlayback = Object.freeze({ pauseSeconds: DEFAULT_PANEL_PAUSE_SECONDS, autoOpen: true });

/** A panel whose own shape is sound and whose moment is converted. What it names (an event, an anchor, an object) is left for `resolveStoryPanels`, because those may be added later. */
export interface CheckedPanel extends Omit<StoryPanel, "timeUtcMs" | "objectId"> {
  /** Absent: a step. */
  readonly at?: { readonly timeUtcMs: number } | { readonly event: string } | { readonly anchor: string };
  readonly object?: string;
}

/** What a story's settings may point a panel's time at, besides a plain UTC time. */
export interface PanelLookup {
  readonly events: readonly { readonly id: string; readonly timeUtcMs: number }[];
  /** Source anchors by id, when the experience has them. */
  readonly anchors?: ReadonlyMap<string, number>;
  /** Ids a panel's `object` may name. Absent: any id is accepted. */
  readonly objectIds?: readonly string[];
  /** The sky figures' ids: a panel's `object` may name one, and a look-out camera may turn toward one. Absent: none. */
  readonly figureIds?: readonly string[];
  /** When given, every panel must fall inside it. */
  readonly window?: TimeBounds;
}

/** A panel's settings entry is wrong; the message names the panel and the field. */
export class StoryPanelError extends Error {
  constructor(panel: string, field: string, problem: string) {
    super(`story panel ${panel}: ${field} ${problem}`);
    this.name = "StoryPanelError";
  }
}

type Record_ = Readonly<Record<string, unknown>>;
const isRecord = (value: unknown): value is Record_ => typeof value === "object" && value !== null && !Array.isArray(value);

function text(panel: string, field: string, value: unknown): string {
  if (typeof value !== "string" || value.trim() === "") throw new StoryPanelError(panel, field, "must be non-empty text");
  return value;
}

function lines(panel: string, field: string, value: unknown): readonly string[] {
  const list = typeof value === "string" ? [value] : value;
  if (!Array.isArray(list) || list.length === 0) throw new StoryPanelError(panel, field, "must be one or more non-empty lines");
  return list.map((line, index) => text(panel, `${field}[${index}]`, line));
}

function atOf(panel: string, at: unknown): CheckedPanel["at"] {
  if (at === undefined) return undefined;
  if (!isRecord(at)) throw new StoryPanelError(panel, "at", "must name a time ({ time }, { event } or { anchor }), or be left out for a step");
  const keys = ["time", "event", "anchor"].filter((key) => at[key] !== undefined);
  if (keys.length !== 1) throw new StoryPanelError(panel, "at", "must give exactly one of time, event or anchor");
  if (keys[0] === "event") return { event: text(panel, "at.event", at.event) };
  if (keys[0] === "anchor") return { anchor: text(panel, "at.anchor", at.anchor) };
  const timeUtcMs = timeInputMs(at.time as TimeInput);
  if (!Number.isFinite(timeUtcMs)) throw new StoryPanelError(panel, "at.time", `must be a valid moment (ISO text, a Date or Unix milliseconds), got ${JSON.stringify(at.time)}`);
  return { timeUtcMs };
}

function provenanceOf(panel: string, value: unknown): Provenance {
  if (!isRecord(value)) throw new StoryPanelError(panel, "provenance", "must be an object: { sourceType, sources, accuracy, notes }");
  if (!PROVENANCE_SOURCE_TYPES.includes(value.sourceType as ProvenanceSourceType)) throw new StoryPanelError(panel, "provenance.sourceType", `must be one of ${PROVENANCE_SOURCE_TYPES.join(", ")}, got ${JSON.stringify(value.sourceType)}`);
  if (!Array.isArray(value.sources)) throw new StoryPanelError(panel, "provenance.sources", "must be one or more non-empty lines");
  lines(panel, "provenance.sources", value.sources);
  text(panel, "provenance.accuracy", value.accuracy);
  if (typeof value.notes !== "string") throw new StoryPanelError(panel, "provenance.notes", "must be text");
  return createProvenance(value as unknown as Provenance);
}

/** Checks the shape of one panel, the `index`th of the list it came in. Nothing here looks at the scene: links are `resolveStoryPanels`' job. */
export function checkStoryPanel(raw: unknown, index: number): CheckedPanel {
  if (!isRecord(raw)) throw new StoryPanelError(`#${index + 1}`, "entry", "must be an object");
  const id = text(`#${index + 1}`, "id", raw.id);
  const object = raw.object === undefined ? undefined : text(id, "object", raw.object);
  const at = atOf(id, raw.at);
  return {
    id,
    ...(at === undefined ? {} : { at }),
    title: text(id, "title", raw.title),
    body: lines(id, "body", raw.body),
    details: raw.details === undefined ? [] : lines(id, "details", raw.details),
    provenance: provenanceOf(id, raw.provenance),
    ...(object === undefined ? {} : { object }),
  };
}

/** Checks the two playback settings; a setting left out takes its default, so the result is the whole setting. */
export function checkPanelPlayback(raw: unknown): PanelPlayback {
  if (!isRecord(raw)) throw new StoryPanelError("settings", "playback", "must be an object: { pauseSeconds?, autoOpen? }");
  const pauseSeconds = raw.pauseSeconds ?? DEFAULT_PANEL_PLAYBACK.pauseSeconds;
  if (typeof pauseSeconds !== "number" || !Number.isFinite(pauseSeconds) || pauseSeconds < 0 || pauseSeconds > MAX_PANEL_PAUSE_SECONDS) {
    throw new StoryPanelError("settings", "pauseSeconds", `must be between 0 and ${MAX_PANEL_PAUSE_SECONDS}, got ${JSON.stringify(pauseSeconds)}`);
  }
  const autoOpen = raw.autoOpen ?? DEFAULT_PANEL_PLAYBACK.autoOpen;
  if (typeof autoOpen !== "boolean") throw new StoryPanelError("settings", "autoOpen", "must be true or false");
  return { pauseSeconds, autoOpen };
}

function timeOf(id: string, at: NonNullable<CheckedPanel["at"]>, lookup: PanelLookup): number {
  if ("timeUtcMs" in at) return at.timeUtcMs;
  if ("event" in at) {
    const event = lookup.events.find((candidate) => candidate.id === at.event);
    if (event === undefined) throw new StoryPanelError(id, "at.event", `names "${at.event}", which the experience's events lack`);
    return event.timeUtcMs;
  }
  const anchor = lookup.anchors?.get(at.anchor);
  if (anchor === undefined) throw new StoryPanelError(id, "at.anchor", `names "${at.anchor}", which the experience's anchors lack`);
  return anchor;
}

function checkLinks({ id, object, camera, trace }: CheckedPanel, lookup: PanelLookup): void {
  const figures = lookup.figureIds ?? [];
  if (object !== undefined && lookup.objectIds !== undefined && !lookup.objectIds.includes(object) && !figures.includes(object)) {
    throw new StoryPanelError(id, "object", `names "${object}", which the experience lacks`);
  }
  if (trace !== undefined && (object === undefined || !figures.includes(object))) {
    throw new StoryPanelError(id, "trace", `needs an object that names a sky figure${object === undefined ? "" : `; "${object}" is not one`}`);
  }
  if (camera === undefined || lookup.objectIds === undefined) return;
  const { bodies, toward } = cameraIdsOf(camera);
  for (const body of bodies) if (!lookup.objectIds.includes(body)) throw new StoryPanelError(id, "camera", `names "${body}", which is not an object the experience shows`);
  if (toward !== undefined && !lookup.objectIds.includes(toward) && !figures.includes(toward)) throw new StoryPanelError(id, "camera", `turns toward "${toward}", which is neither an object nor a sky figure the experience has`);
}

/** The actions a panel carries, in the order they apply. */
const actionsOf = ({ camera, select, trace }: PanelActions): PanelActions => ({ ...(camera === undefined ? {} : { camera }), ...(select === undefined ? {} : { select }), ...(trace === undefined ? {} : { trace }) });

function resolvePanel(panel: CheckedPanel & { readonly at: NonNullable<CheckedPanel["at"]> }, lookup: PanelLookup): StoryPanel {
  const { id, at, title, body, details, provenance, object } = panel;
  const timeUtcMs = timeOf(id, at, lookup);
  if (lookup.window !== undefined && (timeUtcMs < lookup.window.startUtcMs || timeUtcMs > lookup.window.endUtcMs)) {
    throw new StoryPanelError(id, "at", "falls outside the timeline window");
  }
  checkLinks(panel, lookup);
  return { id, timeUtcMs, title, body, details, provenance, ...(object === undefined ? {} : { objectId: object }), ...actionsOf(panel) };
}

function resolveStep(panel: CheckedPanel, lookup: PanelLookup, step: number): StoryStep {
  const { id, title, body, details, provenance, object } = panel;
  checkLinks(panel, lookup);
  return { id, step, title, body, details, provenance, ...(object === undefined ? {} : { objectId: object }), ...actionsOf(panel) };
}

/** Resolves each checked panel's time and links against the scene as built. Moment panels come back sorted by time; steps (no `at`) in the order given, numbered from 1. */
export function resolveStoryPanels(panels: readonly CheckedPanel[], playback: PanelPlayback, lookup: PanelLookup): StoryPanelSet {
  const moments = panels.flatMap((panel) => (panel.at === undefined ? [] : [resolvePanel({ ...panel, at: panel.at }, lookup)]));
  const steps = panels.filter((panel) => panel.at === undefined).map((panel, index) => resolveStep(panel, lookup, index + 1));
  return { panels: moments.sort((a, b) => a.timeUtcMs - b.timeUtcMs), ...(steps.length === 0 ? {} : { steps }), ...playback };
}

/** The step Back or Next opens from `step`: the one `by` places along (-1 or 1), or undefined at either end. */
export function neighbourStep(steps: readonly StoryStep[], step: StoryStep, by: -1 | 1): StoryStep | undefined {
  return steps.find((candidate) => candidate.step === step.step + by);
}
