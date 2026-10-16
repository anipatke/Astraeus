/** A cited fact: where a value was read, and when. */
export interface ShowerSource {
  readonly name: string;
  readonly url: string;
  readonly accessed: string;
}

/** The parent body's published orbit size and shape; only what the whole-orbit path needs. Its place in the sky is the catalogue's. */
export interface ShowerOrbitElements {
  readonly semiMajorAxisAu: number;
  readonly eccentricity: number;
}

export type ConcentrationStatus = "illustrative" | "cited";

/** Presentation numbers an experience owns: how the shower looks, not what it is. */
export interface ShowerLook {
  /** Looping playback: reaching the end of the activity window wraps to the start (the stream is bounded by the window). Default false. */
  readonly loop: boolean;
  /** The camera's up: "ecliptic" draws the planets' plane flat (default "equatorial", celestial north). */
  readonly viewUp: "equatorial" | "ecliptic";
  readonly streamColor: string;
  readonly pointSizePx: number;
  /** How long the clock runs between two exact fills of the stream (hours of simulated time); presentation only. */
  readonly refillAfterHours: number;
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
  /** The parent's catalogue id: its position, orbit and marker come from the catalogue. */
  readonly parentBodyId: string;
  readonly orbit: {
    readonly elements: ShowerOrbitElements;
    readonly source: ShowerSource;
  };
  readonly stream: {
    /** The IAU shower number the measured orbits are selected by (the fetch tool takes the same number). */
    readonly iauCode: number;
    /** Where the measured orbits come from (the database and its release), cited in the stream's panel. */
    readonly source: ShowerSource;
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
   * What the timeline spans. "activity" is the activity window itself. "year" is one year (365.256363 days) centred on the peak, so the
   * peak is mid-timeline, the activity window is marked inside it, Earth makes one full turn and crosses the stream once.
   */
  readonly timeline: { readonly span: TimelineSpan; readonly rateSecondsPerSecond: number };
  /** Objects whose label the scene may hide: id (a catalogued body or the stream) to whether it is shown at the start. Anything not listed is always shown. */
  readonly labels: Readonly<Record<string, boolean>>;
  readonly look: ShowerLook;
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

export class ShowerSettingsError extends TypeError {
  override readonly name = "ShowerSettingsError";
}

type Raw = Readonly<Record<string, unknown>>;

function fail(path: string, problem: string): never {
  throw new ShowerSettingsError(`shower settings ${path} ${problem}`);
}

function record(value: unknown, path: string): Raw {
  if (typeof value !== "object" || value === null || Array.isArray(value)) fail(path, "is required and must be an object");
  return value as Raw;
}

function text(parent: Raw, key: string, path: string): string {
  const value = parent[key];
  if (typeof value !== "string" || value.trim().length === 0) fail(`${path}.${key}`, "is required and must be non-empty text");
  return value;
}

function finite(parent: Raw, key: string, path: string): number {
  const value = parent[key];
  if (typeof value !== "number" || !Number.isFinite(value)) fail(`${path}.${key}`, "is required and must be a finite number");
  return value;
}

function nonNegative(parent: Raw, key: string, path: string): number {
  const value = finite(parent, key, path);
  if (value < 0) fail(`${path}.${key}`, `must not be negative, got ${value}`);
  return value;
}

function instant(parent: Raw, key: string, path: string): string {
  const value = text(parent, key, path);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value) || !Number.isFinite(Date.parse(value))) {
    fail(`${path}.${key}`, `must be an ISO-8601 UTC time like 2030-01-01T00:00:00Z, got "${value}"`);
  }
  return value;
}

function source(parent: Raw, key: string, path: string): ShowerSource {
  const raw = record(parent[key], `${path}.${key}`);
  const here = `${path}.${key}`;
  return { name: text(raw, "name", here), url: text(raw, "url", here), accessed: text(raw, "accessed", here) };
}

function orbitElements(raw: Raw, path: string): ShowerOrbitElements {
  const semiMajorAxisAu = finite(raw, "semiMajorAxisAu", path);
  const eccentricity = finite(raw, "eccentricity", path);
  if (semiMajorAxisAu <= 0) fail(`${path}.semiMajorAxisAu`, `must be positive, got ${semiMajorAxisAu}`);
  if (eccentricity < 0 || eccentricity >= 1) fail(`${path}.eccentricity`, `must be at least 0 and below 1 (a bound orbit), got ${eccentricity}`);
  return { semiMajorAxisAu, eccentricity };
}

function positive(parent: Raw, key: string, path: string): number {
  const value = finite(parent, key, path);
  if (!(value > 0)) fail(`${path}.${key}`, `must be above zero, got ${value}`);
  return value;
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
  return { span, rateSecondsPerSecond: rate };
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
    streamColor: colour(raw, "streamColor", "look"),
    pointSizePx: positive(raw, "pointSizePx", "look"),
    refillAfterHours: positive(raw, "refillAfterHours", "look"),
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

/** Checks a settings object field by field and returns it typed. Every error names the field. */
export function parseShowerSettings(input: unknown): ShowerSettings {
  const root = record(input, "settings");
  const id = text(root, "id", "settings");
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) fail("settings.id", `must be lower-case words joined by hyphens, got "${id}"`);

  const orbit = record(root.orbit, "orbit");

  const stream = record(root.stream, "stream");
  const iauCode = finite(stream, "iauCode", "stream");
  if (!Number.isSafeInteger(iauCode) || iauCode <= 0) fail("stream.iauCode", `must be a positive whole number (the IAU shower number), got ${iauCode}`);
  const seed = finite(stream, "seed", "stream");
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) fail("stream.seed", `must be an unsigned 32-bit whole number, got ${seed}`);

  const activity = record(root.activity, "activity");
  const startUtc = instant(activity, "startUtc", "activity");
  const endUtc = instant(activity, "endUtc", "activity");
  const peakUtc = instant(activity, "peakUtc", "activity");
  const [startMs, endMs, peakMs] = [startUtc, endUtc, peakUtc].map(Date.parse);
  if (endMs <= startMs) fail("activity.endUtc", "must be after activity.startUtc");
  if (peakMs < startMs || peakMs > endMs) fail("activity.peakUtc", "must lie inside the activity window");
  const peakRate = nonNegative(activity, "peakRate", "activity");
  if (peakRate === 0) fail("activity.peakRate", "must be above zero");

  const radiant = record(root.radiant, "radiant");
  const raDeg = finite(radiant, "raDeg", "radiant");
  const decDeg = finite(radiant, "decDeg", "radiant");
  if (raDeg < 0 || raDeg >= 360) fail("radiant.raDeg", `must be at least 0 and below 360, got ${raDeg}`);
  if (decDeg < -90 || decDeg > 90) fail("radiant.decDeg", `must be between -90 and 90, got ${decDeg}`);

  const peakSolarLongitudeDeg = finite(radiant, "peakSolarLongitudeDeg", "radiant");
  if (peakSolarLongitudeDeg < 0 || peakSolarLongitudeDeg >= 360) fail("radiant.peakSolarLongitudeDeg", `must be at least 0 and below 360, got ${peakSolarLongitudeDeg}`);

  return {
    id,
    label: text(root, "label", "settings"),
    parentBody: text(root, "parentBody", "settings"),
    parentBodyId: text(root, "parentBodyId", "settings"),
    orbit: { elements: orbitElements(record(orbit.elements, "orbit.elements"), "orbit.elements"), source: source(orbit, "source", "orbit") },
    stream: { iauCode, source: source(stream, "source", "stream"), seed, quality: quality(stream.quality), concentration: concentration(record(stream.concentration, "stream.concentration")) },
    labels: labels(root.labels),
    timeline: timeline(root.timeline),
    look: look(record(root.look, "look")),
    activity: {
      startUtc,
      endUtc,
      peakUtc,
      peakPublishedNight: text(activity, "peakPublishedNight", "activity"),
      peakRate,
      rateUnit: text(activity, "rateUnit", "activity"),
      fallOffPerDay: nonNegative(activity, "fallOffPerDay", "activity"),
      source: source(activity, "source", "activity"),
    },
    radiant: { raDeg, decDeg, equinox: text(radiant, "equinox", "radiant"), peakSolarLongitudeDeg, source: source(radiant, "source", "radiant") },
  };
}
