import type { TimeBounds } from "../core/trajectory";

/** How a panel's facts are labelled: measured or published values, a model of them, or a picture made to explain. */
export type PanelBadge = "observed" | "modelled" | "illustrative";

export const PANEL_BADGES: readonly PanelBadge[] = ["observed", "modelled", "illustrative"];

/** One short story panel, resolved to a UTC time. */
export interface StoryPanel {
  readonly id: string;
  readonly timeUtcMs: number;
  readonly title: string;
  /** Paragraphs, in order. */
  readonly body: readonly string[];
  readonly badge: PanelBadge;
  /** One line per cited source (PROV-01); never empty. */
  readonly sources: readonly string[];
  /** A shell object this panel is about; the scene draws a marker on it that reopens the panel. */
  readonly objectId?: string;
}

/** The panels an experience offers, with the defaults of the two settings that govern them. */
export interface StoryPanelSet {
  readonly panels: readonly StoryPanel[];
  /** How long playback holds when a panel opens by itself, in seconds (0 never pauses). */
  readonly pauseSeconds: number;
  /** Whether panels open by themselves as forward playback reaches them. */
  readonly autoOpen: boolean;
}

export const DEFAULT_PANEL_PAUSE_SECONDS = 6;
export const MAX_PANEL_PAUSE_SECONDS = 20;

/** What a story's settings may point a panel's time at, besides a plain UTC time. */
export interface PanelLookup {
  readonly events: readonly { readonly id: string; readonly timeUtcMs: number }[];
  /** Source anchors by id, when the experience has them. */
  readonly anchors?: ReadonlyMap<string, number>;
  /** Ids a panel's `object` may name. Absent: any id is accepted. */
  readonly objectIds?: readonly string[];
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

function timeOf(panel: string, at: unknown, lookup: PanelLookup): number {
  if (!isRecord(at)) throw new StoryPanelError(panel, "at", "must name a time: { utc }, { event } or { anchor }");
  const keys = ["utc", "event", "anchor"].filter((key) => at[key] !== undefined);
  if (keys.length !== 1) throw new StoryPanelError(panel, "at", "must give exactly one of utc, event or anchor");
  if (keys[0] === "utc") {
    const utc = text(panel, "at.utc", at.utc);
    const ms = Date.parse(utc);
    if (!/Z$/.test(utc) || !Number.isFinite(ms)) throw new StoryPanelError(panel, "at.utc", `must be an ISO-8601 UTC time ending in Z, got "${utc}"`);
    return ms;
  }
  if (keys[0] === "event") {
    const id = text(panel, "at.event", at.event);
    const event = lookup.events.find((candidate) => candidate.id === id);
    if (event === undefined) throw new StoryPanelError(panel, "at.event", `names "${id}", which the experience's events lack`);
    return event.timeUtcMs;
  }
  const id = text(panel, "at.anchor", at.anchor);
  const anchor = lookup.anchors?.get(id);
  if (anchor === undefined) throw new StoryPanelError(panel, "at.anchor", `names "${id}", which the experience's anchors lack`);
  return anchor;
}

function parsePanel(raw: unknown, index: number, lookup: PanelLookup): StoryPanel {
  if (!isRecord(raw)) throw new StoryPanelError(`#${index + 1}`, "entry", "must be an object");
  const id = text(`#${index + 1}`, "id", raw.id);
  const timeUtcMs = timeOf(id, raw.at, lookup);
  if (lookup.window !== undefined && (timeUtcMs < lookup.window.startUtcMs || timeUtcMs > lookup.window.endUtcMs)) {
    throw new StoryPanelError(id, "at", "falls outside the timeline window");
  }
  const badge = raw.badge;
  if (!PANEL_BADGES.includes(badge as PanelBadge)) throw new StoryPanelError(id, "badge", `must be one of ${PANEL_BADGES.join(", ")}, got ${JSON.stringify(badge)}`);
  const objectId = raw.object === undefined ? undefined : text(id, "object", raw.object);
  if (objectId !== undefined && lookup.objectIds !== undefined && !lookup.objectIds.includes(objectId)) {
    throw new StoryPanelError(id, "object", `names "${objectId}", which the experience lacks`);
  }
  return {
    id,
    timeUtcMs,
    title: text(id, "title", raw.title),
    body: lines(id, "body", raw.body),
    badge: badge as PanelBadge,
    sources: lines(id, "sources", raw.sources),
    ...(objectId === undefined ? {} : { objectId }),
  };
}

/**
 * Validates a story's panel settings (STYLE-06) and resolves each panel's time. Shape:
 * `{ pauseSeconds?, autoOpen?, panels: [{ id, at: { utc | event | anchor }, title, body, badge, sources, object? }] }`.
 * Panels come back sorted by time; ids must be unique.
 */
export function parseStoryPanels(raw: unknown, lookup: PanelLookup): StoryPanelSet {
  if (!isRecord(raw)) throw new StoryPanelError("settings", "panels", "must be an object with a panels list");
  const list = raw.panels;
  if (!Array.isArray(list)) throw new StoryPanelError("settings", "panels", "must be a list");
  const pauseSeconds = raw.pauseSeconds ?? DEFAULT_PANEL_PAUSE_SECONDS;
  if (typeof pauseSeconds !== "number" || !Number.isFinite(pauseSeconds) || pauseSeconds < 0 || pauseSeconds > MAX_PANEL_PAUSE_SECONDS) {
    throw new StoryPanelError("settings", "pauseSeconds", `must be between 0 and ${MAX_PANEL_PAUSE_SECONDS}, got ${JSON.stringify(pauseSeconds)}`);
  }
  const autoOpen = raw.autoOpen ?? true;
  if (typeof autoOpen !== "boolean") throw new StoryPanelError("settings", "autoOpen", "must be true or false");
  const panels = list.map((entry, index) => parsePanel(entry, index, lookup));
  const seen = new Set<string>();
  for (const panel of panels) {
    if (seen.has(panel.id)) throw new StoryPanelError(panel.id, "id", "is used twice");
    seen.add(panel.id);
  }
  return { panels: [...panels].sort((a, b) => a.timeUtcMs - b.timeUtcMs), pauseSeconds, autoOpen };
}

/**
 * The panels forward playback just passed: those with `previousMs < time <= currentMs`, in time order.
 * A backward step or no movement crosses nothing, so loops and rewinds never open a panel.
 */
export function panelsCrossed(panels: readonly StoryPanel[], previousMs: number, currentMs: number): readonly StoryPanel[] {
  if (!(currentMs > previousMs)) return [];
  return panels.filter((panel) => panel.timeUtcMs > previousMs && panel.timeUtcMs <= currentMs);
}

export const BADGE_LABELS: Readonly<Record<PanelBadge, string>> = {
  observed: "Observed",
  modelled: "Modelled",
  illustrative: "Illustrative",
};

/**
 * Decides, tick by tick, whether playback has just carried the clock across a panel. It remembers the last time it saw;
 * `rebase` moves that memory when a person seeks, so a jump is never read as playback and opens nothing.
 */
export class CrossingTracker {
  #previousMs: number;

  constructor(startMs: number) {
    this.#previousMs = startMs;
  }

  rebase(timeUtcMs: number): void {
    this.#previousMs = timeUtcMs;
  }

  /** The newest panel crossed since the last tick, or null: nothing crossed, the clock is not playing, or auto-open is off. */
  advance(panels: readonly StoryPanel[], timeUtcMs: number, playing: boolean, autoOpen: boolean): StoryPanel | null {
    const crossed = autoOpen && playing ? panelsCrossed(panels, this.#previousMs, timeUtcMs) : [];
    this.#previousMs = timeUtcMs;
    return crossed[crossed.length - 1] ?? null;
  }
}
