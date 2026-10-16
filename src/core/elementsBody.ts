import type { BodyId, CelestialBodyDefinition, StateSourceBinding } from "./body";
import { trueAnomalyFromMean } from "./bodies/io";
import { createProvenance } from "./provenance";
import { createTwoBodyTrajectory, type EccentricSampling } from "./sunCentredSources";
import type { Trajectory } from "./trajectory";
import { createOrbTwoBodyAdapter } from "./twoBodyAdapter";

const AU_KM = 149_597_870.7;
const DEGREES = Math.PI / 180;
const JD_UNIX_EPOCH = 2_440_587.5;
const DAY_MS = 86_400_000;

/** Default look of the marker that stands for a body on a published orbit; a record's own `marker` replaces either value. */
export const DEFAULT_ELEMENTS_MARKER_COLOUR = "#9fe3ff";
export const DEFAULT_ELEMENTS_MARKER_SIZE_PX = 7;

/**
 * The classification rule: a position within this fraction of the body's distance from the Sun at every compared date is "approximate";
 * within the larger one, "indicative". Both are good enough to draw where the body is on its orbit at overview scale and neither is an ephemeris.
 */
export const APPROXIMATE_LIMIT_FRACTION = 0.01;
export const INDICATIVE_LIMIT_FRACTION = 0.05;

/** The classification a largest error fraction earns, or null when it earns neither (the body should not be drawn from its elements alone). */
export function classifyPositionError(maxFraction: number): AccuracyClassification | null {
  if (maxFraction <= APPROXIMATE_LIMIT_FRACTION) return "approximate";
  if (maxFraction <= INDICATIVE_LIMIT_FRACTION) return "indicative";
  return null;
}

export type ElementsTimeScale = "TDB" | "TT" | "UTC";
export type AccuracyClassification = "approximate" | "indicative";

/** A cited fact: the solution it came from, where it was read, and when. */
export interface ElementsSource {
  readonly name: string;
  readonly url: string;
  /** The orbit solution the elements belong to, as the source names it. */
  readonly solution: string;
  readonly accessed: string;
}

/**
 * A body on a published Sun-centred orbit, as plain data: classical elements at an epoch, their source, an optional radius with its source,
 * and a stated accuracy. Exactly one of `meanAnomalyDeg` and `perihelionJdTdb` places the body on its orbit.
 */
export interface ElementsBodyRecord {
  readonly id: string;
  readonly label: string;
  readonly elements: {
    readonly semiMajorAxisAu: number;
    readonly eccentricity: number;
    readonly inclinationDeg: number;
    readonly ascendingNodeDeg: number;
    readonly argumentOfPerihelionDeg: number;
    readonly meanAnomalyDeg?: number;
    readonly perihelionJdTdb?: number;
  };
  readonly epoch: {
    readonly jd: number;
    readonly timeScale: ElementsTimeScale;
    /** TT minus UTC at the epoch in seconds (32.184 plus the leap seconds then); required for TDB and TT, absent for UTC. TDB is taken as TT (they differ by under 2 ms). */
    readonly ttMinusUtcSeconds?: number;
  };
  /** The plane the elements are given in. */
  readonly frame: "ecliptic-j2000";
  readonly source: ElementsSource;
  readonly radius?: { readonly km: number; readonly source: string };
  readonly accuracy: {
    readonly classification: AccuracyClassification;
    readonly statement: string;
    /** The dates the position was compared with an independent ephemeris: what the claim covers. */
    readonly validFromUtc: string;
    readonly validToUtc: string;
    /** Further limits to show beside the generic two-body ones. */
    readonly limitations: readonly string[];
  };
  /** Presentation only: the marker's colour and size; defaults above. */
  readonly marker: { readonly color: string; readonly sizePx: number };
}

export class ElementsBodyError extends TypeError {
  override readonly name = "ElementsBodyError";
}

type Raw = Readonly<Record<string, unknown>>;

function fail(path: string, problem: string): never {
  throw new ElementsBodyError(`body record ${path} ${problem}`);
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

function instant(parent: Raw, key: string, path: string): string {
  const value = text(parent, key, path);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value) || !Number.isFinite(Date.parse(value))) {
    fail(`${path}.${key}`, `must be an ISO-8601 UTC time like 2030-01-01T00:00:00Z, got "${value}"`);
  }
  return value;
}

/** Checks a body record field by field and returns it typed, with the optional marker and limitations filled by their defaults. Every error names the field. */
export function parseElementsBodyRecord(input: unknown, path = "body"): ElementsBodyRecord {
  const root = record(input, path);
  const id = text(root, "id", path);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) fail(`${path}.id`, `must be lower-case words joined by hyphens, got "${id}"`);
  const label = text(root, "label", path);

  const raw = record(root.elements, `${path}.elements`);
  const here = `${path}.elements`;
  const semiMajorAxisAu = finite(raw, "semiMajorAxisAu", here);
  if (!(semiMajorAxisAu > 0)) fail(`${here}.semiMajorAxisAu`, `must be positive, got ${semiMajorAxisAu}`);
  const eccentricity = finite(raw, "eccentricity", here);
  if (eccentricity < 0 || eccentricity >= 1) fail(`${here}.eccentricity`, `must be at least 0 and below 1 (a bound orbit), got ${eccentricity}`);
  const inclinationDeg = finite(raw, "inclinationDeg", here);
  if (inclinationDeg < 0 || inclinationDeg > 180) fail(`${here}.inclinationDeg`, `must be from 0 to 180, got ${inclinationDeg}`);
  const ascendingNodeDeg = finite(raw, "ascendingNodeDeg", here);
  const argumentOfPerihelionDeg = finite(raw, "argumentOfPerihelionDeg", here);
  for (const [key, value] of [["ascendingNodeDeg", ascendingNodeDeg], ["argumentOfPerihelionDeg", argumentOfPerihelionDeg]] as const) {
    if (value < 0 || value >= 360) fail(`${here}.${key}`, `must be at least 0 and below 360, got ${value}`);
  }
  const hasMean = raw.meanAnomalyDeg !== undefined;
  const hasPerihelion = raw.perihelionJdTdb !== undefined;
  if (hasMean === hasPerihelion) fail(here, "must give exactly one of meanAnomalyDeg and perihelionJdTdb");
  const placement = hasMean ? { meanAnomalyDeg: finite(raw, "meanAnomalyDeg", here) } : { perihelionJdTdb: finite(raw, "perihelionJdTdb", here) };
  if (hasMean && (placement.meanAnomalyDeg! < 0 || placement.meanAnomalyDeg! >= 360)) fail(`${here}.meanAnomalyDeg`, `must be at least 0 and below 360, got ${placement.meanAnomalyDeg}`);

  const epochRaw = record(root.epoch, `${path}.epoch`);
  const epochJd = finite(epochRaw, "jd", `${path}.epoch`);
  const timeScale = epochRaw.timeScale;
  if (timeScale !== "TDB" && timeScale !== "TT" && timeScale !== "UTC") fail(`${path}.epoch.timeScale`, `must be "TDB", "TT" or "UTC", got ${String(timeScale)}`);
  let ttMinusUtcSeconds: number | undefined;
  if (timeScale === "UTC") {
    if (epochRaw.ttMinusUtcSeconds !== undefined) fail(`${path}.epoch.ttMinusUtcSeconds`, "must be absent when the epoch is already UTC");
  } else {
    ttMinusUtcSeconds = finite(epochRaw, "ttMinusUtcSeconds", `${path}.epoch`);
    if (ttMinusUtcSeconds < 32 || ttMinusUtcSeconds > 120) fail(`${path}.epoch.ttMinusUtcSeconds`, `must be from 32 to 120 seconds (32.184 plus the leap seconds), got ${ttMinusUtcSeconds}`);
  }
  if (root.frame !== "ecliptic-j2000") fail(`${path}.frame`, `must be "ecliptic-j2000", got ${String(root.frame)}`);

  const sourceRaw = record(root.source, `${path}.source`);
  const source: ElementsSource = {
    name: text(sourceRaw, "name", `${path}.source`),
    url: text(sourceRaw, "url", `${path}.source`),
    solution: text(sourceRaw, "solution", `${path}.source`),
    accessed: text(sourceRaw, "accessed", `${path}.source`),
  };

  let radius: ElementsBodyRecord["radius"];
  if (root.radius !== undefined) {
    const radiusRaw = record(root.radius, `${path}.radius`);
    const km = finite(radiusRaw, "km", `${path}.radius`);
    if (!(km > 0)) fail(`${path}.radius.km`, `must be positive, got ${km}`);
    radius = { km, source: text(radiusRaw, "source", `${path}.radius`) };
  }

  const accuracyRaw = record(root.accuracy, `${path}.accuracy`);
  const classification = accuracyRaw.classification;
  if (classification !== "approximate" && classification !== "indicative") fail(`${path}.accuracy.classification`, `must be "approximate" or "indicative", got ${String(classification)}`);
  const validFromUtc = instant(accuracyRaw, "validFromUtc", `${path}.accuracy`);
  const validToUtc = instant(accuracyRaw, "validToUtc", `${path}.accuracy`);
  if (Date.parse(validToUtc) <= Date.parse(validFromUtc)) fail(`${path}.accuracy.validToUtc`, "must be after accuracy.validFromUtc");
  const limitationsRaw = accuracyRaw.limitations ?? [];
  if (!Array.isArray(limitationsRaw) || limitationsRaw.some((item) => typeof item !== "string" || item.trim().length === 0)) fail(`${path}.accuracy.limitations`, "must be a list of non-empty text");

  const markerRaw = root.marker === undefined ? {} : record(root.marker, `${path}.marker`);
  const color = markerRaw.color === undefined ? DEFAULT_ELEMENTS_MARKER_COLOUR : text(markerRaw, "color", `${path}.marker`);
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) fail(`${path}.marker.color`, `must be a colour like #9fe3ff, got "${color}"`);
  const sizePx = markerRaw.sizePx === undefined ? DEFAULT_ELEMENTS_MARKER_SIZE_PX : finite(markerRaw, "sizePx", `${path}.marker`);
  if (!(sizePx > 0)) fail(`${path}.marker.sizePx`, `must be above zero, got ${sizePx}`);

  return {
    id,
    label,
    elements: { semiMajorAxisAu, eccentricity, inclinationDeg, ascendingNodeDeg, argumentOfPerihelionDeg, ...placement },
    epoch: { jd: epochJd, timeScale, ...(ttMinusUtcSeconds === undefined ? {} : { ttMinusUtcSeconds }) },
    frame: "ecliptic-j2000",
    source,
    ...(radius === undefined ? {} : { radius }),
    accuracy: { classification, statement: text(accuracyRaw, "statement", `${path}.accuracy`), validFromUtc, validToUtc, limitations: [...limitationsRaw] },
    marker: { color, sizePx },
  };
}

/** The body a record's elements orbit: its id and gravitational parameter, from the catalogue's root. */
export interface ElementsCentre {
  readonly id: BodyId;
  readonly gmKm3S2: number;
}

/** What building a body from a record gives: the definition, the state-source binding, and what a path of its orbit needs. */
export interface ElementsBody {
  readonly definition: CelestialBodyDefinition;
  readonly binding: StateSourceBinding;
  readonly sampling: EccentricSampling;
  /** The epoch in UTC, ms. */
  readonly epochUtcMs: number;
  create(): Trajectory;
}

/** The epoch of a record in UTC milliseconds. */
export function epochUtcMsOf(epoch: ElementsBodyRecord["epoch"]): number {
  return Math.round((epoch.jd - JD_UNIX_EPOCH) * DAY_MS) - Math.round((epoch.ttMinusUtcSeconds ?? 0) * 1000);
}

/**
 * Builds a body that circles the Sun from its published elements: unperturbed two-body motion about the Sun's catalogue GM, a marker's worth
 * of radius, and an accuracy record that says what was and was not compared. It names no body; everything comes from the record.
 */
export function buildElementsBody(input: ElementsBodyRecord, centre: ElementsCentre): ElementsBody {
  const body = parseElementsBodyRecord(input);
  const gm = centre.gmKm3S2;
  if (!(gm > 0)) throw new RangeError(`the centre "${centre.id}" has no gravitational parameter`);
  const { elements } = body;
  const semiMajorAxisKm = elements.semiMajorAxisAu * AU_KM;
  const meanMotionRadPerS = Math.sqrt(gm / semiMajorAxisKm ** 3);
  const epochUtcMs = epochUtcMsOf(body.epoch);
  const meanAnomalyRad = elements.meanAnomalyDeg !== undefined
    ? elements.meanAnomalyDeg * DEGREES
    : meanMotionRadPerS * (body.epoch.jd - elements.perihelionJdTdb!) * (DAY_MS / 1000);
  const reducedRad = meanAnomalyRad - 2 * Math.PI * Math.floor(meanAnomalyRad / (2 * Math.PI));
  const periodMs = ((2 * Math.PI) / meanMotionRadPerS) * 1000;
  const sampling: EccentricSampling = Object.freeze({
    eccentricity: elements.eccentricity,
    periodMs,
    periapsisUtcMs: Math.round(epochUtcMs - (meanAnomalyRad / meanMotionRadPerS) * 1000),
  });
  const create = (): Trajectory => createTwoBodyTrajectory({
    body: body.id,
    center: centre.id,
    plane: body.frame,
    epochUtcMs,
    elements: {
      semiMajorAxisKm,
      eccentricity: elements.eccentricity,
      inclinationDeg: elements.inclinationDeg,
      raanDeg: elements.ascendingNodeDeg,
      argumentOfPeriapsisDeg: elements.argumentOfPerihelionDeg,
      trueAnomalyDeg: trueAnomalyFromMean(reducedRad, elements.eccentricity) / DEGREES,
    },
  }, createOrbTwoBodyAdapter());
  const citation = `${body.source.name}, ${body.source.solution} (${body.source.url}), epoch JD ${body.epoch.jd} ${body.epoch.timeScale}, read ${body.source.accessed}`;
  const radiusKm = body.radius?.km ?? 0.001;
  const definition: CelestialBodyDefinition = Object.freeze({
    id: body.id,
    label: body.label,
    radiusKm,
    parentId: centre.id,
    orientation: "none",
    accuracy: Object.freeze({
      dimensions: createProvenance({
        sourceType: body.radius === undefined ? "illustrative" : "observed",
        sources: [body.radius?.source ?? "No radius published in the record"],
        accuracy: body.radius === undefined
          ? "No radius is claimed; the body is drawn as a marker at its position, and its size is a placeholder that is never drawn."
          : `Radius of ${body.radius.km} km as the source states it. A body this small is far under a pixel at any scale where its orbit is visible.`,
        notes: "Drawn as a marker, a drawing aid at the body's real position, not its size.",
      }),
      position: createProvenance({
        sourceType: "reconstructed",
        sources: [citation, `Unperturbed two-body motion about the GM of "${centre.id}" (catalogue)`],
        accuracy: `${body.accuracy.classification}: ${body.accuracy.statement}`,
        notes: "Geometric position about the Sun's centre; no light-time. Elements are osculating at the epoch; there are no perturbations or non-gravitational forces.",
      }),
      validUtc: Object.freeze({ startUtcMs: Date.parse(body.accuracy.validFromUtc), endUtcMs: Date.parse(body.accuracy.validToUtc) }),
      orientationLimitations: Object.freeze([
        `Unperturbed two-body motion about the Sun from osculating elements at JD ${body.epoch.jd} ${body.epoch.timeScale}: no planetary perturbations and no non-gravitational forces.`,
        ...body.accuracy.limitations,
      ]),
    }),
  });
  return Object.freeze({
    definition,
    binding: Object.freeze<StateSourceBinding>({ body: body.id, create }),
    sampling,
    epochUtcMs,
    create,
  });
}
