import type { BodyId, CelestialBodyDefinition, StateSourceBinding } from "./body";
import { trueAnomalyFromMean } from "./bodies/io";
import { fieldReaders, type Raw } from "./fieldReaders";
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

function fail(path: string, problem: string): never {
  throw new ElementsBodyError(`body record ${path} ${problem}`);
}

const { record, text, finite, instant } = fieldReaders(fail);

/** The five orbit-shape elements and the one placement along the orbit (exactly one of mean anomaly and perihelion time). */
function parseOrbitElements(raw: Raw, here: string): ElementsBodyRecord["elements"] {
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
  return { semiMajorAxisAu, eccentricity, inclinationDeg, ascendingNodeDeg, argumentOfPerihelionDeg, ...placement };
}

function parseEpoch(raw: Raw, here: string): ElementsBodyRecord["epoch"] {
  const jd = finite(raw, "jd", here);
  const timeScale = raw.timeScale;
  if (timeScale !== "TDB" && timeScale !== "TT" && timeScale !== "UTC") fail(`${here}.timeScale`, `must be "TDB", "TT" or "UTC", got ${String(timeScale)}`);
  if (timeScale === "UTC") {
    if (raw.ttMinusUtcSeconds !== undefined) fail(`${here}.ttMinusUtcSeconds`, "must be absent when the epoch is already UTC");
    return { jd, timeScale };
  }
  const ttMinusUtcSeconds = finite(raw, "ttMinusUtcSeconds", here);
  if (ttMinusUtcSeconds < 32 || ttMinusUtcSeconds > 120) fail(`${here}.ttMinusUtcSeconds`, `must be from 32 to 120 seconds (32.184 plus the leap seconds), got ${ttMinusUtcSeconds}`);
  return { jd, timeScale, ttMinusUtcSeconds };
}

function parseSource(raw: Raw, here: string): ElementsSource {
  return { name: text(raw, "name", here), url: text(raw, "url", here), solution: text(raw, "solution", here), accessed: text(raw, "accessed", here) };
}

function parseRadius(raw: Raw, here: string): NonNullable<ElementsBodyRecord["radius"]> {
  const km = finite(raw, "km", here);
  if (!(km > 0)) fail(`${here}.km`, `must be positive, got ${km}`);
  return { km, source: text(raw, "source", here) };
}

function parseAccuracy(raw: Raw, here: string): ElementsBodyRecord["accuracy"] {
  const classification = raw.classification;
  if (classification !== "approximate" && classification !== "indicative") fail(`${here}.classification`, `must be "approximate" or "indicative", got ${String(classification)}`);
  const validFromUtc = instant(raw, "validFromUtc", here);
  const validToUtc = instant(raw, "validToUtc", here);
  if (Date.parse(validToUtc) <= Date.parse(validFromUtc)) fail(`${here}.validToUtc`, "must be after accuracy.validFromUtc");
  const limitations = raw.limitations ?? [];
  if (!Array.isArray(limitations) || limitations.some((item) => typeof item !== "string" || item.trim().length === 0)) fail(`${here}.limitations`, "must be a list of non-empty text");
  return { classification, statement: text(raw, "statement", here), validFromUtc, validToUtc, limitations: [...limitations] };
}

function parseMarker(raw: Raw, here: string): ElementsBodyRecord["marker"] {
  const color = raw.color === undefined ? DEFAULT_ELEMENTS_MARKER_COLOUR : text(raw, "color", here);
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) fail(`${here}.color`, `must be a colour like #9fe3ff, got "${color}"`);
  const sizePx = raw.sizePx === undefined ? DEFAULT_ELEMENTS_MARKER_SIZE_PX : finite(raw, "sizePx", here);
  if (!(sizePx > 0)) fail(`${here}.sizePx`, `must be above zero, got ${sizePx}`);
  return { color, sizePx };
}

/** Checks a body record field by field and returns it typed, with the optional marker and limitations filled by their defaults. Every error names the field. */
export function parseElementsBodyRecord(input: unknown, path = "body"): ElementsBodyRecord {
  const root = record(input, path);
  const id = text(root, "id", path);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) fail(`${path}.id`, `must be lower-case words joined by hyphens, got "${id}"`);
  const label = text(root, "label", path);
  const elements = parseOrbitElements(record(root.elements, `${path}.elements`), `${path}.elements`);
  const epoch = parseEpoch(record(root.epoch, `${path}.epoch`), `${path}.epoch`);
  if (root.frame !== "ecliptic-j2000") fail(`${path}.frame`, `must be "ecliptic-j2000", got ${String(root.frame)}`);
  const source = parseSource(record(root.source, `${path}.source`), `${path}.source`);
  const radius = root.radius === undefined ? undefined : parseRadius(record(root.radius, `${path}.radius`), `${path}.radius`);
  const accuracy = parseAccuracy(record(root.accuracy, `${path}.accuracy`), `${path}.accuracy`);
  const marker = parseMarker(root.marker === undefined ? {} : record(root.marker, `${path}.marker`), `${path}.marker`);
  return { id, label, elements, epoch, frame: "ecliptic-j2000", source, ...(radius === undefined ? {} : { radius }), accuracy, marker };
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
