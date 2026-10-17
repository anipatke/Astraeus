// Shower paths: the Earth, planet and parent-orbit path layers.
import type { PathLayer } from "../../app/experienceDefinition";
import { EARTH_EPHEMERIS } from "../../app/ephemerisProvenance";
import { rootBodyId } from "../../assets/catalogue";
import { createOrbAstronomyAdapter } from "../../core/astronomyAdapter";
import { createEarthSunTrajectory, fullTurnSpanMs, type EccentricSampling } from "../../core/sunCentredSources";
import type { Trajectory } from "../../core/trajectory";
import { DAY_MS, LABEL_PRIORITY, YEAR_MS, showerCatalogue } from "./showerBasics";
import type { ShowerSettings } from "./showerSettings";

const AU_KM = 149_597_870.7;

/** Earth's path round the Sun over the year about the peak, from the same Earth–Sun geometry that places Earth. */
export function createEarthPathLayer(settings: ShowerSettings): PathLayer {
  const peakUtcMs = Date.parse(settings.activity.peakUtc);
  return {
    kind: "orbit",
    color: settings.look.earthPathColor,
    source: createEarthSunTrajectory(createOrbAstronomyAdapter()),
    span: { startUtcMs: peakUtcMs - Math.floor(YEAR_MS / 2), endUtcMs: peakUtcMs + Math.ceil(YEAR_MS / 2) },
    samples: 361,
    object: {
      id: "earth-path",
      label: "Earth's path",
      color: settings.look.earthPathColor,
      labelPriority: LABEL_PRIORITY.earthPath,
      description: "Earth's path round the Sun over one year, drawn from the same Earth–Sun geometry that places Earth.",
      provenance: EARTH_EPHEMERIS.provenance,
      knownLimitations: ["A year's samples joined by straight segments."],
    },
  };
}

/** The turn search walks in two-day steps; the longest orbit among the planets is a dozen years. */
const PLANET_TURN_STEP_MS = 2 * DAY_MS;
const PLANET_TURN_MAX_STEPS = 3_000;

/**
 * The orbit of every catalogued body that circles the Sun, except Earth (which has its own path) and the parent (whose whole orbit is drawn
 * deliberately, below), from its own catalogue state source and drawn for one full turn from the peak. No body is named here: the planets
 * are whatever the catalogue holds.
 */
export function createPlanetOrbitPathLayers(settings: ShowerSettings): PathLayer[] {
  const catalogue = showerCatalogue(settings);
  const peakUtcMs = Date.parse(settings.activity.peakUtc);
  const adapter = createOrbAstronomyAdapter();
  const root = rootBodyId();
  return catalogue.ids()
    .filter((id) => catalogue.get(id).definition.parentId === root && catalogue.get(id).visual.kind === "sphere" && id !== "earth" && id !== settings.parentBodyId)
    .flatMap((id): PathLayer[] => {
      const { definition, source, visual } = catalogue.get(id);
      const trajectory = source!.create(adapter);
      // An orbit too long to sweep within the search (a comet's, over a century) is not a planet's turn; the search finds none and it is left out here.
      const spanMs = turnSpanOrNull(trajectory, peakUtcMs);
      if (spanMs === null) return [];
      const { endUtcMs: validUntil } = definition.accuracy.validUtc;
      const beyond = peakUtcMs + spanMs > validUntil;
      return [{
        kind: "orbit",
        color: visual.material.color,
        source: trajectory,
        span: { startUtcMs: peakUtcMs, endUtcMs: peakUtcMs + spanMs },
        samples: 361,
        object: {
          id: `${id}-orbit`,
          label: `${definition.label}'s orbit`,
          color: visual.material.color,
          labelPriority: LABEL_PRIORITY.planetOrbit,
          description: `${definition.label}'s path round the Sun for one full turn from the peak, from the same position source that places ${definition.label} when it is drawn.`,
          provenance: definition.accuracy.position,
          knownLimitations: [
            "A turn's samples joined by straight segments.",
            ...(beyond ? [`The turn reaches past ${new Date(validUntil).getUTCFullYear()}, the last year the position was compared with JPL Horizons; the series itself is not limited to that range.`] : []),
          ],
        },
      }];
    });
}

function turnSpanOrNull(trajectory: Trajectory, peakUtcMs: number): number | null {
  try {
    return fullTurnSpanMs(trajectory, peakUtcMs, PLANET_TURN_STEP_MS, PLANET_TURN_MAX_STEPS);
  } catch (error) {
    if (error instanceof RangeError && /no full turn/.test(error.message)) return null;
    throw error;
  }
}

/** The id of the parent's whole-orbit path: also what the "Whole orbit" camera preset targets. */
export const parentOrbitIdOf = (settings: ShowerSettings): string => `${settings.parentBodyId}-orbit`;

const SAMPLING_STEPS = 2_000;
const REFINE_ITERATIONS = 80;

/**
 * What a path of the parent's whole orbit needs to space its samples by eccentric anomaly: the published eccentricity and semi-major axis
 * give the shape and the period (about the Sun's catalogue GM), and the instant of periapsis is where the catalogue body's own trajectory is
 * nearest the Sun, found by a coarse sweep over one period about `aroundUtcMs` and then refined. Nothing here names a body.
 */
export function parentSamplingOf(settings: ShowerSettings, aroundUtcMs: number): EccentricSampling {
  const catalogue = showerCatalogue(settings);
  const gm = catalogue.get(rootBodyId()).definition.gmKm3S2;
  if (gm === undefined) throw new RangeError("the catalogue's root body has no gravitational parameter");
  const { semiMajorAxisAu, eccentricity } = settings.orbit.elements;
  const periodMs = 2 * Math.PI * Math.sqrt((semiMajorAxisAu * AU_KM) ** 3 / gm) * 1000;
  const parent = catalogue.get(settings.parentBodyId);
  if (parent.source === undefined) throw new RangeError(`parentBodyId "${settings.parentBodyId}" has no state source`);
  const trajectory = parent.source.create(createOrbAstronomyAdapter());
  const radius = (t: number): number => Math.hypot(...trajectory.stateAt(Math.round(t), "sun").positionKm);
  const step = periodMs / SAMPLING_STEPS;
  const start = aroundUtcMs - periodMs / 2;
  let best = start;
  for (let k = 0; k <= SAMPLING_STEPS; k += 1) if (radius(start + k * step) < radius(best)) best = start + k * step;
  let [lo, hi] = [best - step, best + step];
  for (let k = 0; k < REFINE_ITERATIONS; k += 1) {
    const [m1, m2] = [lo + (hi - lo) / 3, hi - (hi - lo) / 3];
    if (radius(m1) < radius(m2)) hi = m2;
    else lo = m1;
  }
  return Object.freeze({ eccentricity, periodMs, periapsisUtcMs: Math.round((lo + hi) / 2) });
}

/**
 * The parent's whole orbit, one full turn from periapsis, from the catalogue body's own (Horizons-checked) trajectory and spaced by
 * eccentric anomaly so the sharp end near the Sun is smooth.
 */
export function createParentOrbitPathLayer(settings: ShowerSettings): PathLayer {
  const catalogue = showerCatalogue(settings);
  const peakUtcMs = Date.parse(settings.activity.peakUtc);
  const { definition, source } = catalogue.get(settings.parentBodyId);
  if (source === undefined) throw new RangeError(`parentBodyId "${settings.parentBodyId}" has no state source`);
  const sampling = parentSamplingOf(settings, peakUtcMs);
  return {
    kind: "orbit",
    color: settings.look.parentPathColor,
    source: source.create(createOrbAstronomyAdapter()),
    span: { startUtcMs: sampling.periapsisUtcMs, endUtcMs: sampling.periapsisUtcMs + Math.round(sampling.periodMs) },
    sampling,
    object: {
      id: parentOrbitIdOf(settings),
      label: `${definition.label} orbit`,
      color: settings.look.parentPathColor,
      labelPriority: LABEL_PRIORITY.parentOrbit,
      description: `The whole orbit of ${settings.parentBody}, the source of the ${settings.label}, from its nearest point to the Sun out to its farthest and back. The stream follows orbits like this one.`,
      provenance: definition.accuracy.position,
      knownLimitations: [
        "One full turn of unperturbed two-body motion about the Sun, starting at the nearest point to the Sun; the samples are spaced by eccentric anomaly and joined by straight segments.",
        ...(definition.accuracy.orientationLimitations ?? []),
      ],
    },
  };
}
