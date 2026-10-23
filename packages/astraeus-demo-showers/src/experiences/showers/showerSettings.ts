// Shower settings: the settings types and their strict validation from a shower file.
import { validateStartView, type StartView } from "../../../../astraeus/src/app/viewLink";
import type { Raw } from "../../../../astraeus/src/core/fieldReaders";
import { settingsFields } from "../../../../astraeus/src/experiences/settingsFields";
import { ElementsBodyError, parseElementsBodyRecord, type ElementsBodyRecord } from "../../../../astraeus/src/core/elementsBody";

/** A cited fact: where a value was read, and when. */
export interface ShowerSource {
  readonly name: string;
  readonly url: string;
  readonly accessed: string;
  /** Plain words shown with the source: how a value was taken from it. The file may also keep fields the viewer does not show (an archive checksum). */
  readonly note?: string;
}

/** The parent body's published orbit size and shape; only what the whole-orbit path needs. Its place in the sky is the catalogue's. */
export interface ShowerOrbitElements {
  readonly semiMajorAxisAu: number;
  readonly eccentricity: number;
}

/** The Global Meteor Network catalogue, the only measured-orbit source: its months, licence and how its columns map to the all/reliable rule. */
export interface GmnSourceSettings {
  readonly source: ShowerSource;
  /** The monthly summary files read, as YYYYMM (the fetch tool takes the same list). */
  readonly months: readonly string[];
  readonly licence: string;
  readonly licenceUrl: string;
  /** How the reliable rule is applied to GMN's own columns (stated in the panel). */
  readonly ruleNote: string;
}

export type ConcentrationStatus = "illustrative" | "cited";

/** Presentation numbers an experience owns: how the shower looks, not what it is. */
export interface ShowerLook {
  /** Looping playback: reaching the end of the activity window wraps to the start (the stream is bounded by the window). Default false. */
  readonly loop: boolean;
  /** The camera's up: "ecliptic" draws the planets' plane flat (default "equatorial", celestial north). */
  readonly viewUp: "equatorial" | "ecliptic";
  /** The camera view to open on, when the file declares one (see `StartView`); absent: the usual opening. */
  readonly startView?: StartView;
  readonly streamColor: string;
  readonly pointSizePx: number;
  /** How long the clock runs between two exact fills of the stream (hours of simulated time); presentation only. */
  readonly refillAfterHours: number;
  /** Milliseconds per frame the stream may spend computing its next fill ahead of time; 0 fills whole in one frame. Absent: the engine default. */
  readonly refillSliceMs?: number;
  readonly earthPathColor: string;
  readonly parentPathColor: string;
  /** How much larger than life Earth and every other planet are drawn under the solar-system scale (one factor, so their sizes stay in proportion); each info states it. */
  readonly planetExaggeration: number;
  /** The camera may pull back this far (Earth radii) and the far plane clears it; the parent's whole orbit reaches tens of AU. */
  readonly cameraMaxFocusDistance: number;
  readonly cameraFar: number;
}

/** Everything a shower needs, as plain data. Times are ISO-8601 UTC strings ending in Z. */
export interface ShowerSettings {
  readonly id: string;
  readonly label: string;
  /** The parent body's name as the panel shows it. */
  readonly parentBody: string;
  /**
   * The parent's id. Either a catalogued body (its position, orbit and marker come from the catalogue) or the id of `parentElements`.
   * In the file exactly one of `parentBodyId` and `parentElements` is given.
   */
  readonly parentBodyId: string;
  /** A parent the catalogue does not hold, defined by its published elements in this file; the experience adds it to its own catalogue. */
  readonly parentElements?: ElementsBodyRecord;
  readonly orbit: {
    readonly elements: ShowerOrbitElements;
    readonly source: ShowerSource;
  };
  readonly stream: {
    /** The IAU shower number the measured orbits are selected by (the fetch tool takes the same number). */
    readonly iauCode: number;
    /** The catalogue the orbits are read from (the Global Meteor Network), cited in the stream's panel. */
    readonly sources: { readonly gmn: GmnSourceSettings };
    readonly seed: number;
    /** Which orbit set is drawn unless the address says otherwise, and the published rule that defines the "reliable" one. */
    readonly quality: {
      readonly default: "all" | "reliable";
      readonly rule: {
        readonly minConvergenceAngleDeg: number;
        readonly maxVelocityErrorFraction: number;
        /** The published wording the thresholds are taken from, with where it was read. */
        readonly quote: string;
        readonly source: ShowerSource;
      };
    };
    /** The clump of dots near the parent: a model, with its stated basis. */
    readonly concentration: {
      readonly fraction: number;
      readonly widthDeg: number;
      readonly status: ConcentrationStatus;
      readonly basis: string;
      readonly source?: ShowerSource;
    };
  };
  /**
   * What the timeline spans. "activity" is the activity window itself. "year" is one year (365.256363 days), so the activity window is marked
   * inside it, Earth makes one full turn and crosses the stream once. The year starts at `yearStartUtc` when the file gives one (the activity
   * window must then lie inside that year), else it is centred on the peak.
   */
  readonly timeline: { readonly span: TimelineSpan; readonly rateSecondsPerSecond: number; readonly yearStartUtc?: string };
  /** Objects whose label the scene may hide: id (a catalogued body or the stream) to whether it is shown at the start. Anything not listed is always shown. */
  readonly labels: Readonly<Record<string, boolean>>;
  readonly look: ShowerLook;
  /**
   * Optional story panels (the shell's `parseStoryPanels` shape), as plain data. Either the repo-relative path of a panels file under
   * `data/stories/<story>/panels.json`, read the way an experience reads its own panels file, or the panels object itself.
   * The panels are checked against the built experience's events and objects when it is built.
   */
  readonly story?: { readonly panels: string | Readonly<Record<string, unknown>> };
  readonly activity: {
    readonly startUtc: string;
    readonly endUtc: string;
    readonly peakUtc: string;
    readonly peakPublishedNight: string;
    readonly peakRate: number;
    readonly rateUnit: string;
    /** Modelled: the rate falls by this many powers of ten per day away from the peak. */
    readonly fallOffPerDay: number;
    readonly source: ShowerSource;
  };
  /** The published geocentric radiant and the solar longitude of the peak, from one source; the factual checks compare the measured orbits with these. */
  readonly radiant: {
    readonly raDeg: number;
    readonly decDeg: number;
    /** The frame the coordinates are given in, for example "J2000". */
    readonly equinox: string;
    readonly peakSolarLongitudeDeg: number;
    readonly source: ShowerSource;
  };
}

export type TimelineSpan = "activity" | "year";

/** The length of the "year" timeline in days (one sidereal year); the timeline bounds use the same figure. */
export const YEAR_DAYS = 365.256363;

export class ShowerSettingsError extends TypeError {
  override readonly name = "ShowerSettingsError";
}

function fail(path: string, problem: string): never {
  throw new ShowerSettingsError(`shower settings ${path} ${problem}`);
}

const { record, text, finite, instant, positive } = settingsFields(fail);

function nonNegative(parent: Raw, key: string, path: string): number {
  const value = finite(parent, key, path);
  if (value < 0) fail(`${path}.${key}`, `must not be negative, got ${value}`);
  return value;
}

function source(parent: Raw, key: string, path: string): ShowerSource {
  const raw = record(parent[key], `${path}.${key}`);
  const here = `${path}.${key}`;
  return { name: text(raw, "name", here), url: text(raw, "url", here), accessed: text(raw, "accessed", here), ...(raw.note === undefined ? {} : { note: text(raw, "note", here) }) };
}

function orbitSources(stream: Raw): ShowerSettings["stream"]["sources"] {
  if (stream.source !== undefined) fail("stream.source", `is no longer a setting: the Global Meteor Network is the only orbit source, so remove it (got ${JSON.stringify(stream.source)})`);
  const raw = record(stream.sources, "stream.sources");
  if (raw.cams !== undefined) fail("stream.sources.cams", "is no longer supported: the CAMS source was removed, so remove it and keep stream.sources.gmn");
  const g = record(raw.gmn, "stream.sources.gmn");
  const path = "stream.sources.gmn";
  if (!Array.isArray(g.months) || g.months.length === 0 || !g.months.every((m) => typeof m === "string" && /^\d{4}(0[1-9]|1[0-2])$/.test(m))) {
    fail(`${path}.months`, `must be a non-empty list of YYYYMM months, got ${JSON.stringify(g.months)}`);
  }
  return { gmn: { source: source(g, "source", path), months: g.months as string[], licence: text(g, "licence", path), licenceUrl: text(g, "licenceUrl", path), ruleNote: text(g, "ruleNote", path) } };
}

/** The cited source (name, url, access date) of the orbit catalogue. */
export function citedSourceOf(settings: ShowerSettings): ShowerSource {
  return settings.stream.sources.gmn.source;
}

function orbitElements(raw: Raw, path: string): ShowerOrbitElements {
  const semiMajorAxisAu = finite(raw, "semiMajorAxisAu", path);
  const eccentricity = finite(raw, "eccentricity", path);
  if (semiMajorAxisAu <= 0) fail(`${path}.semiMajorAxisAu`, `must be positive, got ${semiMajorAxisAu}`);
  if (eccentricity < 0 || eccentricity >= 1) fail(`${path}.eccentricity`, `must be at least 0 and below 1 (a bound orbit), got ${eccentricity}`);
  return { semiMajorAxisAu, eccentricity };
}

/** A parent defined in the file, checked by the body-record validator; its errors are reported as settings errors. */
function parentRecord(input: unknown): ElementsBodyRecord {
  try {
    return parseElementsBodyRecord(input, "parentElements");
  } catch (error) {
    if (error instanceof ElementsBodyError) throw new ShowerSettingsError(`shower settings ${error.message}`);
    throw error;
  }
}

/** The orbit's size and shape; a parent defined in the file must agree with its own elements (one fact, said once). */
function orbitElementsOf(orbit: Raw, parent: ElementsBodyRecord | undefined): ShowerOrbitElements {
  const elements = orbitElements(record(orbit.elements, "orbit.elements"), "orbit.elements");
  if (parent !== undefined) {
    for (const key of ["semiMajorAxisAu", "eccentricity"] as const) {
      if (elements[key] !== parent.elements[key]) fail(`orbit.elements.${key}`, `must equal parentElements.elements.${key} (${parent.elements[key]}), got ${elements[key]}`);
    }
  }
  return elements;
}

function colour(parent: Raw, key: string, path: string): string {
  const value = text(parent, key, path);
  if (!/^#[0-9a-fA-F]{6}$/.test(value)) fail(`${path}.${key}`, `must be a colour like #ffb86b, got "${value}"`);
  return value;
}

function viewUp(raw: Raw): "equatorial" | "ecliptic" {
  if (raw.viewUp === undefined) return "equatorial";
  if (raw.viewUp !== "equatorial" && raw.viewUp !== "ecliptic") fail("look.viewUp", `must be "equatorial" or "ecliptic", got ${String(raw.viewUp)}`);
  return raw.viewUp;
}

function labels(input: unknown): Readonly<Record<string, boolean>> {
  if (input === undefined) return {};
  const raw = record(input, "labels");
  const out: Record<string, boolean> = {};
  for (const [id, value] of Object.entries(raw)) {
    if (typeof value !== "boolean") fail(`labels.${id}`, `must be true or false, got ${String(value)}`);
    out[id] = value;
  }
  return out;
}

function timeline(input: unknown): ShowerSettings["timeline"] {
  if (input === undefined) return { span: "activity", rateSecondsPerSecond: 86_400 };
  const raw = record(input, "timeline");
  const span = raw.span ?? "activity";
  if (span !== "activity" && span !== "year") fail("timeline.span", `must be "activity" or "year", got ${String(span)}`);
  const rate = raw.rateSecondsPerSecond === undefined ? 86_400 : positive(raw, "rateSecondsPerSecond", "timeline");
  return { span, rateSecondsPerSecond: rate, ...(raw.yearStartUtc === undefined ? {} : { yearStartUtc: instant(raw, "yearStartUtc", "timeline") }) };
}

function startViewOf(value: unknown): StartView {
  try {
    return validateStartView(value, "look.startView");
  } catch (error) {
    return fail("look.startView", `is not a valid view: ${(error as Error).message}`);
  }
}

function look(raw: Raw): ShowerLook {
  const cameraMaxFocusDistance = positive(raw, "cameraMaxFocusDistance", "look");
  const cameraFar = positive(raw, "cameraFar", "look");
  if (cameraFar <= cameraMaxFocusDistance) fail("look.cameraFar", `must exceed look.cameraMaxFocusDistance (${cameraMaxFocusDistance}), got ${cameraFar}`);
  const planetExaggeration = finite(raw, "planetExaggeration", "look");
  if (planetExaggeration < 1) fail("look.planetExaggeration", `must be at least 1, got ${planetExaggeration}`);
  if (raw.loop !== undefined && typeof raw.loop !== "boolean") fail("look.loop", `must be true or false, got ${String(raw.loop)}`);
  return {
    loop: raw.loop === true,
    viewUp: viewUp(raw),
    ...(raw.startView === undefined ? {} : { startView: startViewOf(raw.startView) }),
    streamColor: colour(raw, "streamColor", "look"),
    pointSizePx: positive(raw, "pointSizePx", "look"),
    refillAfterHours: positive(raw, "refillAfterHours", "look"),
    ...(raw.refillSliceMs === undefined ? {} : { refillSliceMs: nonNegative(raw, "refillSliceMs", "look") }),
    earthPathColor: colour(raw, "earthPathColor", "look"),
    parentPathColor: colour(raw, "parentPathColor", "look"),
    planetExaggeration,
    cameraMaxFocusDistance,
    cameraFar,
  };
}

function quality(input: unknown): ShowerSettings["stream"]["quality"] {
  const raw = record(input, "stream.quality");
  const choice = raw.default;
  if (choice !== "all" && choice !== "reliable") fail("stream.quality.default", `must be "all" or "reliable", got ${String(choice)}`);
  const rule = record(raw.rule, "stream.quality.rule");
  const fraction = finite(rule, "maxVelocityErrorFraction", "stream.quality.rule");
  if (!(fraction > 0 && fraction <= 1)) fail("stream.quality.rule.maxVelocityErrorFraction", `must be above 0 and at most 1, got ${fraction}`);
  const angle = finite(rule, "minConvergenceAngleDeg", "stream.quality.rule");
  if (!(angle >= 0 && angle <= 90)) fail("stream.quality.rule.minConvergenceAngleDeg", `must be from 0 to 90, got ${angle}`);
  return { default: choice, rule: { minConvergenceAngleDeg: angle, maxVelocityErrorFraction: fraction, quote: text(rule, "quote", "stream.quality.rule"), source: source(rule, "source", "stream.quality.rule") } };
}

function concentration(raw: Raw): ShowerSettings["stream"]["concentration"] {
  const path = "stream.concentration";
  const fraction = finite(raw, "fraction", path);
  if (fraction < 0 || fraction > 1) fail(`${path}.fraction`, `must be from 0 to 1, got ${fraction}`);
  const widthDeg = finite(raw, "widthDeg", path);
  if (!(widthDeg > 0 && widthDeg <= 180)) fail(`${path}.widthDeg`, `must be above 0 and at most 180, got ${widthDeg}`);
  const status = raw.status;
  if (status !== "illustrative" && status !== "cited") fail(`${path}.status`, `must be "illustrative" or "cited", got ${String(status)}`);
  if (status === "cited") return { fraction, widthDeg, status, basis: text(raw, "basis", path), source: source(raw, "source", path) };
  return { fraction, widthDeg, status, basis: text(raw, "basis", path) };
}

/** The path a shower's `story.panels` may name: one panels file in a story's folder. */
export const PANELS_PATH = /^data\/stories\/[a-z0-9]+(-[a-z0-9]+)*\/panels\.json$/;

function story(input: unknown): ShowerSettings["story"] {
  if (input === undefined) return undefined;
  const raw = record(input, "story");
  const panels = raw.panels;
  if (typeof panels === "string") {
    if (!PANELS_PATH.test(panels)) fail("story.panels", `must be a path like data/stories/<story>/panels.json or the panels object, got "${panels}"`);
    return { panels };
  }
  const inline = record(panels, "story.panels");
  if (!Array.isArray(inline.panels)) fail("story.panels.panels", "is required and must be a list of panels");
  return { panels: inline };
}

type Parent = Pick<ShowerSettings, "id" | "label" | "parentBody" | "parentBodyId" | "orbit"> & { readonly parentElements?: ElementsBodyRecord };

/** The shower's id, its parent body (catalogued or defined in the file) and that parent's orbit. */
function parseParent(root: Raw): Parent {
  const id = text(root, "id", "settings");
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) fail("settings.id", `must be lower-case words joined by hyphens, got "${id}"`);

  const hasId = root.parentBodyId !== undefined;
  const hasElements = root.parentElements !== undefined;
  if (hasId === hasElements) fail("parentBodyId", "and parentElements: exactly one must be given (a catalogued parent id, or the parent's published elements)");
  const parentElements = hasElements ? parentRecord(root.parentElements) : undefined;
  const parentBodyId = parentElements === undefined ? text(root, "parentBodyId", "settings") : parentElements.id;

  const orbit = record(root.orbit, "orbit");
  return {
    id,
    label: text(root, "label", "settings"),
    parentBody: text(root, "parentBody", "settings"),
    parentBodyId,
    ...(parentElements === undefined ? {} : { parentElements }),
    orbit: { elements: orbitElementsOf(orbit, parentElements), source: source(orbit, "source", "orbit") },
  };
}

/** The measured-orbit stream: its IAU code, seed, source, quality rule and concentration. */
function parseStream(root: Raw): ShowerSettings["stream"] {
  const stream = record(root.stream, "stream");
  const iauCode = finite(stream, "iauCode", "stream");
  if (!Number.isSafeInteger(iauCode) || iauCode <= 0) fail("stream.iauCode", `must be a positive whole number (the IAU shower number), got ${iauCode}`);
  const seed = finite(stream, "seed", "stream");
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) fail("stream.seed", `must be an unsigned 32-bit whole number, got ${seed}`);
  return { iauCode, sources: orbitSources(stream), seed, quality: quality(stream.quality), concentration: concentration(record(stream.concentration, "stream.concentration")) };
}

/** The activity window, its peak and rate; the timeline year, when given, must hold the whole window. */
function parseActivity(root: Raw, timelineSettings: ShowerSettings["timeline"]): ShowerSettings["activity"] {
  const activity = record(root.activity, "activity");
  const startUtc = instant(activity, "startUtc", "activity");
  const endUtc = instant(activity, "endUtc", "activity");
  const peakUtc = instant(activity, "peakUtc", "activity");
  const [startMs, endMs, peakMs] = [startUtc, endUtc, peakUtc].map(Date.parse);
  if (endMs <= startMs) fail("activity.endUtc", "must be after activity.startUtc");
  if (peakMs < startMs || peakMs > endMs) fail("activity.peakUtc", "must lie inside the activity window");
  if (timelineSettings.yearStartUtc !== undefined) {
    const yearStartMs = Date.parse(timelineSettings.yearStartUtc);
    if (startMs < yearStartMs || endMs > yearStartMs + Math.round(YEAR_DAYS * 86_400_000)) fail("timeline.yearStartUtc", `must start a year (${YEAR_DAYS} days) that holds the whole activity window, got ${timelineSettings.yearStartUtc}`);
  }
  const peakRate = nonNegative(activity, "peakRate", "activity");
  if (peakRate === 0) fail("activity.peakRate", "must be above zero");
  return {
    startUtc,
    endUtc,
    peakUtc,
    peakPublishedNight: text(activity, "peakPublishedNight", "activity"),
    peakRate,
    rateUnit: text(activity, "rateUnit", "activity"),
    fallOffPerDay: nonNegative(activity, "fallOffPerDay", "activity"),
    source: source(activity, "source", "activity"),
  };
}

/** The published radiant and the solar longitude of the peak. */
function parseRadiant(root: Raw): ShowerSettings["radiant"] {
  const radiant = record(root.radiant, "radiant");
  const raDeg = finite(radiant, "raDeg", "radiant");
  const decDeg = finite(radiant, "decDeg", "radiant");
  if (raDeg < 0 || raDeg >= 360) fail("radiant.raDeg", `must be at least 0 and below 360, got ${raDeg}`);
  if (decDeg < -90 || decDeg > 90) fail("radiant.decDeg", `must be between -90 and 90, got ${decDeg}`);

  const peakSolarLongitudeDeg = finite(radiant, "peakSolarLongitudeDeg", "radiant");
  if (peakSolarLongitudeDeg < 0 || peakSolarLongitudeDeg >= 360) fail("radiant.peakSolarLongitudeDeg", `must be at least 0 and below 360, got ${peakSolarLongitudeDeg}`);
  return { raDeg, decDeg, equinox: text(radiant, "equinox", "radiant"), peakSolarLongitudeDeg, source: source(radiant, "source", "radiant") };
}

/** Checks a settings object field by field and returns it typed. Every error names the field. */
export function parseShowerSettings(input: unknown): ShowerSettings {
  const root = record(input, "settings");
  const parent = parseParent(root);
  const stream = parseStream(root);
  const timelineSettings = timeline(root.timeline);
  const activity = parseActivity(root, timelineSettings);
  const radiant = parseRadiant(root);
  return {
    ...parent,
    stream,
    labels: labels(root.labels),
    timeline: timelineSettings,
    look: look(record(root.look, "look")),
    ...(root.story === undefined ? {} : { story: story(root.story) }),
    activity,
    radiant,
  };
}
