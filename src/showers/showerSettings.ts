/** A cited fact: where a value was read, and when. */
export interface ShowerSource {
  readonly name: string;
  readonly url: string;
  readonly accessed: string;
}

export interface ShowerOrbitElements {
  readonly semiMajorAxisAu: number;
  readonly eccentricity: number;
  readonly inclinationDeg: number;
  readonly raanDeg: number;
  readonly argumentOfPeriapsisDeg: number;
}

/** Half-width of a uniform spread around the stream's base elements (0 means none). */
export interface ShowerSpread extends ShowerOrbitElements {
  readonly trueAnomalyDeg: number;
}

export type EncounterNode = "ascending" | "descending";

/** Everything a shower needs, as plain data. Times are ISO-8601 UTC strings ending in Z. */
export interface ShowerSettings {
  readonly id: string;
  readonly label: string;
  readonly parentBody: string;
  readonly orbit: {
    readonly plane: "ecliptic-j2000" | "EQJ";
    readonly elementsEpochUtc: string;
    readonly elements: ShowerOrbitElements;
    readonly source: ShowerSource;
  };
  readonly stream: {
    /** The orbit node where Earth crosses the stream's plane; a modelling choice, not a published fact. */
    readonly encounterNode: EncounterNode;
    readonly memberCount: number;
    readonly seed: number;
    readonly spread: ShowerSpread;
  };
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
  readonly radiant: {
    readonly raDeg: number;
    readonly decDeg: number;
    readonly source: ShowerSource;
  };
}

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
  return {
    semiMajorAxisAu,
    eccentricity,
    inclinationDeg: finite(raw, "inclinationDeg", path),
    raanDeg: finite(raw, "raanDeg", path),
    argumentOfPeriapsisDeg: finite(raw, "argumentOfPeriapsisDeg", path),
  };
}

function spread(raw: Raw, path: string): ShowerSpread {
  return {
    semiMajorAxisAu: nonNegative(raw, "semiMajorAxisAu", path),
    eccentricity: nonNegative(raw, "eccentricity", path),
    inclinationDeg: nonNegative(raw, "inclinationDeg", path),
    raanDeg: nonNegative(raw, "raanDeg", path),
    argumentOfPeriapsisDeg: nonNegative(raw, "argumentOfPeriapsisDeg", path),
    trueAnomalyDeg: nonNegative(raw, "trueAnomalyDeg", path),
  };
}

/** Checks a settings object field by field and returns it typed. Every error names the field. */
export function parseShowerSettings(input: unknown): ShowerSettings {
  const root = record(input, "settings");
  const id = text(root, "id", "settings");
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) fail("settings.id", `must be lower-case words joined by hyphens, got "${id}"`);

  const orbit = record(root.orbit, "orbit");
  const plane = orbit.plane;
  if (plane !== "ecliptic-j2000" && plane !== "EQJ") fail("orbit.plane", `must be "ecliptic-j2000" or "EQJ", got ${String(plane)}`);

  const stream = record(root.stream, "stream");
  const node = stream.encounterNode;
  if (node !== "ascending" && node !== "descending") fail("stream.encounterNode", `must be "ascending" or "descending", got ${String(node)}`);
  const memberCount = finite(stream, "memberCount", "stream");
  if (!Number.isSafeInteger(memberCount) || memberCount <= 0) fail("stream.memberCount", `must be a positive whole number, got ${memberCount}`);
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

  return {
    id,
    label: text(root, "label", "settings"),
    parentBody: text(root, "parentBody", "settings"),
    orbit: {
      plane,
      elementsEpochUtc: instant(orbit, "elementsEpochUtc", "orbit"),
      elements: orbitElements(record(orbit.elements, "orbit.elements"), "orbit.elements"),
      source: source(orbit, "source", "orbit"),
    },
    stream: { encounterNode: node, memberCount, seed, spread: spread(record(stream.spread, "stream.spread"), "stream.spread") },
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
    radiant: { raDeg, decDeg, source: source(radiant, "source", "radiant") },
  };
}
