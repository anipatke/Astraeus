import type { ExperienceDefinition, PathLayer } from "../app/experienceDefinition";
import { SUN } from "../core/bodies/sun";
import { createProvenance } from "../core/provenance";
import { createTwoBodyTrajectory, type EccentricSampling } from "../core/sunCentredSources";
import { createOrbTwoBodyAdapter } from "../core/twoBodyAdapter";
import { syntheticBeltDefinition, syntheticEarthPath } from "./syntheticRingDefinition";

const AU_KM = 149_597_870.7;
const START_UTC_MS = Date.UTC(2030, 0, 1, 0, 0, 0);

/** A made-up long orbit: eccentricity 0.96, semi-major axis 26 AU, so it runs from 1.04 AU out to 50.96 AU. It is at its nearest point at the start. */
export const ECCENTRIC_ELEMENTS = Object.freeze({ semiMajorAxisKm: 26 * AU_KM, eccentricity: 0.96, inclinationDeg: 40, raanDeg: 100, argumentOfPeriapsisDeg: 20, trueAnomalyDeg: 0 });

export const ECCENTRIC_PERIOD_MS = 2 * Math.PI * Math.sqrt(ECCENTRIC_ELEMENTS.semiMajorAxisKm ** 3 / SUN.gmKm3S2!) * 1000;

export const ECCENTRIC_SAMPLING: EccentricSampling = Object.freeze({ eccentricity: ECCENTRIC_ELEMENTS.eccentricity, periodMs: ECCENTRIC_PERIOD_MS, periapsisUtcMs: START_UTC_MS });

export const eccentricSource = createTwoBodyTrajectory({ body: "far-eccentric", plane: "ecliptic-j2000", epochUtcMs: START_UTC_MS, elements: ECCENTRIC_ELEMENTS }, createOrbTwoBodyAdapter());

/** One whole turn of the made-up orbit, spaced by eccentric anomaly so the sharp end is smooth. */
export const syntheticEccentricPath: PathLayer = {
  kind: "orbit",
  color: "#ff9fd0",
  source: eccentricSource,
  span: { startUtcMs: START_UTC_MS, endUtcMs: START_UTC_MS + Math.round(ECCENTRIC_PERIOD_MS) },
  sampling: ECCENTRIC_SAMPLING,
  object: {
    id: "eccentric-path",
    label: "Made-up eccentric path",
    color: "#ff9fd0",
    labelPriority: 58,
    description: "The whole orbit of an invented object that swings from about 1 AU to about 51 AU from the Sun, drawn from invented orbital elements.",
    provenance: createProvenance({
      sourceType: "illustrative",
      sources: ["Made up for the long-orbit capability test; not a real object"],
      accuracy: "None claimed. A two-body orbit with elements chosen for this fixture.",
      notes: "Exists to prove a very eccentric orbit is drawn whole and smoothly, and can be framed at true scale.",
    }),
    knownLimitations: ["Made up; not a real object.", "Unperturbed two-body motion about the Sun."],
  },
};

/** The made-up belt, Earth's path and a made-up 51 AU eccentric orbit, with the camera allowed out to frame the whole orbit. */
export const syntheticEccentricDefinition: ExperienceDefinition = {
  ...syntheticBeltDefinition,
  experience: {
    ...syntheticBeltDefinition.experience,
    cameraPresets: [
      ...syntheticBeltDefinition.experience.cameraPresets,
      { id: "focus-eccentric", label: "Focus long orbit", request: { kind: "focus", target: "eccentric-path" } },
    ],
  },
  scaleChoices: ["true-scale", "solar-system"],
  visualOverrides: { sun: { marker: { sizePx: 10 } }, earth: { exaggeration: 200 } },
  paths: [syntheticEarthPath, syntheticEccentricPath],
  // 51 AU is about 1.2 million Earth radii: the camera may pull back to frame the whole orbit, and the far plane clears it.
  camera: { maxFocusDistance: 4_000_000, far: 12_000_000 },
};
