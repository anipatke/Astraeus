import type { BodyId } from "../core/body";
import { createOrbAstronomyAdapter } from "../core/astronomyAdapter";
import { BUILT_IN_SAMPLING, EARTH_EPHEMERIS } from "../core/bodies";
import { createEarthSunTrajectory, fullTurnSpanMs, type EccentricSampling } from "../core/sunCentredSources";
import type { Trajectory } from "../core/trajectory";
import { rootBodyId, type BodyCatalogue } from "../assets/catalogue";
import { SceneError } from "./errors";
import type { PathLayer } from "../app/experienceDefinition";

const DAY_MS = 86_400_000;
/** The turn search walks in two-day steps; the longest orbit among the planets is a dozen years. */
const TURN_STEP_MS = 2 * DAY_MS;
const TURN_MAX_STEPS = 3_000;
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

/**
 * The orbit line of a body that circles the Sun: one full turn from `startUtcMs`, from the body's own state source. A body given published elements
 * (`sampling`) is drawn from its periapsis for one period with samples spaced by eccentric anomaly, so a sharp orbit is smooth. Returns undefined when
 * the body completes no turn within the search (a comet's century-long orbit given without elements).
 */
export function sunOrbitLayer(catalogue: BodyCatalogue, id: BodyId, startUtcMs: number, color: string, given?: EccentricSampling): PathLayer | undefined {
  const sampling = given ?? BUILT_IN_SAMPLING[id];
  const { definition, visual } = catalogue.get(id);
  const source = trajectoryOf(catalogue, id);
  const span = sampling === undefined ? turnSpan(source, startUtcMs) : { startUtcMs: sampling.periapsisUtcMs, endUtcMs: sampling.periapsisUtcMs + Math.round(sampling.periodMs) };
  if (span === undefined) return undefined;
  const provenance = id === "earth" ? EARTH_EPHEMERIS.provenance : definition.accuracy.position;
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
      description: `${definition.label}'s path round the Sun for one full turn, drawn from the same position source that places ${definition.label}.`,
      provenance,
      knownLimitations: [sampling === undefined ? "A turn's samples joined by straight segments." : "One full turn of unperturbed two-body motion from periapsis; samples are spaced by eccentric anomaly and joined by straight segments."],
    },
  };
}

function turnSpan(source: Trajectory, startUtcMs: number): { readonly startUtcMs: number; readonly endUtcMs: number } | undefined {
  try {
    return { startUtcMs, endUtcMs: startUtcMs + fullTurnSpanMs(source, startUtcMs, TURN_STEP_MS, TURN_MAX_STEPS) };
  } catch (error) {
    if (error instanceof RangeError && /no full turn/.test(error.message)) return undefined;
    throw error;
  }
}

/**
 * The farthest a body that circles the Sun gets from it, in km: a(1+e) when the period and eccentricity are known (published elements or the
 * catalogue's comet sampling; a from Kepler's third law about the Sun), else the largest Sun distance over one full turn of its own state source.
 * A planet's source reads the planet series, so those must be loaded. Throws `no-orbit` for a body that completes no turn in the search.
 */
export function farthestSunDistanceKm(catalogue: BodyCatalogue, id: BodyId, startUtcMs: number, given?: EccentricSampling): number {
  const sampling = given ?? BUILT_IN_SAMPLING[id];
  if (sampling !== undefined) {
    const gm = catalogue.get(rootBodyId(catalogue)).definition.gmKm3S2!;
    const semiMajorKm = Math.cbrt(gm * (sampling.periodMs / 1000 / (2 * Math.PI)) ** 2);
    return semiMajorKm * (1 + sampling.eccentricity);
  }
  const source = trajectoryOf(catalogue, id);
  const span = turnSpan(source, startUtcMs);
  if (span === undefined) throw new SceneError("no-orbit", `camera.fitOrbit("${id}"): "${id}" completes no turn within a dozen years and the catalogue does not know its period; add it with addBodyFromElements`);
  let farthest = 0;
  for (let k = 0; k < TURN_SAMPLES; k += 1) {
    const [x, y, z] = source.stateAt(Math.round(span.startUtcMs + ((span.endUtcMs - span.startUtcMs) * k) / (TURN_SAMPLES - 1)), rootBodyId(catalogue)).positionKm;
    farthest = Math.max(farthest, Math.hypot(x, y, z));
  }
  return farthest;
}
