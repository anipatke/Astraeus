import type { BodyId } from "../core/body";
import { createOrbAstronomyAdapter } from "../core/astronomyAdapter";
import { BUILT_IN_SAMPLING, EARTH_EPHEMERIS } from "../core/bodies";
import { fillKeplerRangeKm, keplerElementsFromStates, type KeplerElements } from "../core/keplerElements";
import { createState, EQJ } from "../core/state";
import { TimeScaleOutOfRangeError } from "../core/timeScale";
import { createEarthSunTrajectory, fullTurnSpanMs, type EccentricSampling } from "../core/sunCentredSources";
import type { Trajectory } from "../core/trajectory";
import { rootBodyId, type BodyCatalogue } from "../assets/catalogue";
import { SceneError } from "./errors";
import type { PathLayer } from "../app/experienceDefinition";

const DAY_MS = 86_400_000;
/** The turn search walks in two-day steps; a full turn is looked for up to about thirty years (Saturn's). */
const TURN_STEP_MS = 2 * DAY_MS;
const TURN_MAX_STEPS = 6_000;
const TURN_SAMPLES = 361;

/** The id of a body's Sun-orbit line. */
export const sunOrbitIdOf = (id: BodyId): string => `${id}-orbit`;

/** Whether the catalogue holds this body and it circles the Sun (the catalogue's root). */
export function circlesTheSun(catalogue: BodyCatalogue, id: BodyId): boolean {
  return catalogue.has(id) && catalogue.get(id).definition.parentId === rootBodyId(catalogue);
}

function trajectoryOf(catalogue: BodyCatalogue, id: BodyId): Trajectory {
  const adapter = createOrbAstronomyAdapter();
  return id === "earth" ? createEarthSunTrajectory(adapter) : catalogue.get(id).source!.create(adapter);
}

/** One orbit of a body about the Sun, in the form that can be drawn: its own source over one full turn, or the two-body ellipse osculating at the opening time. */
interface DrawnOrbit {
  readonly source: Trajectory;
  readonly span: { readonly startUtcMs: number; readonly endUtcMs: number };
  readonly sampling: EccentricSampling | undefined;
  readonly osculating: boolean;
  readonly farthestKm: number | undefined;
}

const VELOCITY_STEP_MS = DAY_MS / 2;

/** The body's velocity from its position source (which models none): a central difference, or a one-sided one at the end of the source's years. */
function velocityKmS(source: Trajectory, timeUtcMs: number, center: BodyId): number[] {
  const at = (t: number): ArrayLike<number> | undefined => {
    try {
      return source.stateAt(t, center).positionKm;
    } catch (error) {
      if (error instanceof RangeError) return undefined;
      throw error;
    }
  };
  const [before, after] = [at(timeUtcMs - VELOCITY_STEP_MS), at(timeUtcMs + VELOCITY_STEP_MS)];
  const here = source.stateAt(timeUtcMs, center).positionKm;
  const [from, to, seconds] = before !== undefined && after !== undefined ? [before, after, VELOCITY_STEP_MS / 500] : after !== undefined ? [here, after, VELOCITY_STEP_MS / 1000] : before !== undefined ? [before, here, VELOCITY_STEP_MS / 1000] : [here, here, 1];
  return [0, 1, 2].map((axis) => (to[axis]! - from[axis]!) / seconds);
}

/** The two-body ellipse osculating at `startUtcMs`, as a source, the span of one turn from periapsis and its sampling; undefined when the body is not bound or no Sun GM is known. */
function osculatingOrbit(catalogue: BodyCatalogue, id: BodyId, source: Trajectory, startUtcMs: number): DrawnOrbit | undefined {
  const root = rootBodyId(catalogue);
  const mu = catalogue.get(root).definition.gmKm3S2;
  if (mu === undefined) return undefined;
  const position = source.stateAt(startUtcMs, root).positionKm;
  const velocity = velocityKmS(source, startUtcMs, root);
  if (![...position, ...velocity].every(Number.isFinite)) return undefined;
  const elements = keplerElementsFromStates(Float64Array.from([position[0]!, position[1]!, position[2]!, ...velocity]), 1, mu, startUtcMs);
  const a = elements.semiMajorAxisKm[0]!;
  const e = elements.eccentricity[0]!;
  if (!(a > 0) || !(e >= 0 && e < 1) || !Number.isFinite(elements.meanMotionRadS[0]!)) return undefined;
  const periodMs = Math.round((2 * Math.PI * 1000) / elements.meanMotionRadS[0]!);
  const periapsisUtcMs = Math.round(startUtcMs - (elements.meanAnomalyRad[0]! * 1000) / elements.meanMotionRadS[0]!);
  return { source: ellipseSource(id, elements), span: { startUtcMs: periapsisUtcMs, endUtcMs: periapsisUtcMs + periodMs }, sampling: { eccentricity: e, periodMs, periapsisUtcMs }, osculating: true, farthestKm: a * (1 + e) };
}

function ellipseSource(id: BodyId, elements: KeplerElements): Trajectory {
  return Object.freeze({
    body: id,
    stateAt(timeUtcMs: number) {
      const out = new Float64Array(3);
      fillKeplerRangeKm(elements, timeUtcMs, out, 0, 1);
      return createState({ body: id, center: "sun", timeUtcMs, frame: EQJ, positionKm: out, orientation: null }, () => false);
    },
  });
}

/**
 * How a body that circles the Sun is drawn, one rule for every body and never by name: with published elements (`given`, or the catalogue's comet
 * sampling) from periapsis for one period; else one full turn of its own source when the source covers a whole turn from `startUtcMs`; else (a source
 * that ends first, such as the planet series for Uranus and Neptune) the two-body ellipse osculating at `startUtcMs`. Undefined when none can be drawn.
 */
function drawnOrbit(catalogue: BodyCatalogue, id: BodyId, startUtcMs: number, given?: EccentricSampling): DrawnOrbit | undefined {
  const source = trajectoryOf(catalogue, id);
  const sampling = given ?? BUILT_IN_SAMPLING[id];
  if (sampling !== undefined) {
    const gm = catalogue.get(rootBodyId(catalogue)).definition.gmKm3S2!;
    const semiMajorKm = Math.cbrt(gm * (sampling.periodMs / 1000 / (2 * Math.PI)) ** 2);
    return { source, span: { startUtcMs: sampling.periapsisUtcMs, endUtcMs: sampling.periapsisUtcMs + Math.round(sampling.periodMs) }, sampling, osculating: false, farthestKm: semiMajorKm * (1 + sampling.eccentricity) };
  }
  const span = turnSpan(source, startUtcMs);
  if (span !== undefined) return { source, span, sampling: undefined, osculating: false, farthestKm: undefined };
  return osculatingOrbit(catalogue, id, source, startUtcMs);
}

/**
 * The orbit line of a body that circles the Sun: one full turn from `startUtcMs`, from the body's own state source. A body given published elements
 * (`sampling`) is drawn from its periapsis for one period with samples spaced by eccentric anomaly, so a sharp orbit is smooth. Returns undefined when
 * the body completes no turn within the search (a comet's century-long orbit given without elements).
 */
export function sunOrbitLayer(catalogue: BodyCatalogue, id: BodyId, startUtcMs: number, color: string, given?: EccentricSampling): PathLayer | undefined {
  const drawn = drawnOrbit(catalogue, id, startUtcMs, given);
  if (drawn === undefined) return undefined;
  const { definition, visual } = catalogue.get(id);
  const { source, span, sampling, osculating } = drawn;
  const provenance = id === "earth" ? EARTH_EPHEMERIS.provenance : definition.accuracy.position;
  const limitation = osculating
    ? `${definition.label}'s source does not cover a whole turn from the scene's opening time, so this is the two-body ellipse osculating at that time (position and velocity from the source, the Sun's gravity alone): perturbations over a turn are not drawn, and the line leaves the source's own positions as the years pass from the opening time. Samples are spaced by eccentric anomaly and joined by straight segments.`
    : sampling === undefined ? "A turn's samples joined by straight segments." : "One full turn of unperturbed two-body motion from periapsis; samples are spaced by eccentric anomaly and joined by straight segments.";
  return {
    kind: "orbit",
    color: color || visual.material.color,
    source,
    span,
    ...(sampling === undefined ? { samples: TURN_SAMPLES } : { sampling }),
    object: {
      id: sunOrbitIdOf(id),
      partOf: id,
      label: `${definition.label}'s orbit`,
      color: color || visual.material.color,
      labelPriority: 50,
      showLabel: false,
      description: osculating
        ? `${definition.label}'s path round the Sun for one turn, drawn as the two-body ellipse osculating at the scene's opening time.`
        : `${definition.label}'s path round the Sun for one full turn, drawn from the same position source that places ${definition.label}.`,
      provenance,
      knownLimitations: [limitation],
    },
  };
}

function turnSpan(source: Trajectory, startUtcMs: number): { readonly startUtcMs: number; readonly endUtcMs: number } | undefined {
  try {
    return { startUtcMs, endUtcMs: startUtcMs + fullTurnSpanMs(source, startUtcMs, TURN_STEP_MS, TURN_MAX_STEPS) };
  } catch (error) {
    // No full turn in the search, or the source's years end first (the planet series): the source does not cover a whole turn.
    if (error instanceof TimeScaleOutOfRangeError || (error instanceof RangeError && /no full turn|do not cover/.test(error.message))) return undefined;
    throw error;
  }
}

/**
 * The farthest a body that circles the Sun gets from it, in km, by the same rule as its orbit line: a(1+e) when the period and eccentricity are known
 * (published elements, the catalogue's comet sampling) or when the line is the osculating ellipse; else the largest Sun distance over one full turn of
 * its own state source. A planet's source reads the planet series, so those must be loaded. Throws `no-orbit` for a body drawn by neither form.
 */
export function farthestSunDistanceKm(catalogue: BodyCatalogue, id: BodyId, startUtcMs: number, given?: EccentricSampling): number {
  const drawn = drawnOrbit(catalogue, id, startUtcMs, given);
  if (drawn === undefined) throw new SceneError("no-orbit", `camera.fitOrbit("${id}"): "${id}" completes no turn within thirty years and its position and the Sun's gravity do not give a bound ellipse; add it with addBodyFromElements`);
  if (drawn.farthestKm !== undefined) return drawn.farthestKm;
  let farthest = 0;
  for (let k = 0; k < TURN_SAMPLES; k += 1) {
    const [x, y, z] = drawn.source.stateAt(Math.round(drawn.span.startUtcMs + ((drawn.span.endUtcMs - drawn.span.startUtcMs) * k) / (TURN_SAMPLES - 1)), rootBodyId(catalogue)).positionKm;
    farthest = Math.max(farthest, Math.hypot(x, y, z));
  }
  return farthest;
}
