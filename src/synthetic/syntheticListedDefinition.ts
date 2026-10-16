import type { ExperienceDefinition, GroupLayer, PathLayer } from "../app/experienceDefinition";
import { createListedOrbitGroup, type ListedMember } from "../core/listedOrbitGroup";
import { createProvenance } from "../core/provenance";
import { createTwoBodyTrajectory } from "../core/sunCentredSources";
import { createOrbTwoBodyAdapter } from "../core/twoBodyAdapter";
import { createEvents } from "../core/events";
import { sunEarthSystem } from "../assets/compositions";
import type { ExperienceConfig } from "../shell/experience";
import { syntheticEarthPath, syntheticSun } from "./syntheticRingDefinition";

const START_UTC_MS = Date.UTC(2030, 0, 1, 0, 0, 0);
const DAY_MS = 86_400_000;
const END_UTC_MS = START_UTC_MS + 400 * DAY_MS;
const bounds = { startUtcMs: START_UTC_MS, endUtcMs: END_UTC_MS };
const AU_KM = 149_597_870.7;

export const LISTED_MEMBER_COUNT = 3_000;
/** Share of the dots drawn near the made-up parent, and the half-width of that clump in degrees of mean anomaly: model settings of this fixture. */
export const LISTED_CLUMP = { fraction: 0.25, widthDeg: 15 } as const;
/** Look-and-feel settings of this fixture's dots; presentation only. */
export const LISTED_LOOK = { color: "#9de3a8", pointSizePx: 2.5 } as const;
/** Presentation only: the span between the points layer's two exact fills. */
export const LISTED_REFILL_AFTER_MS = DAY_MS / 4;

// A small deterministic generator, local to this fixture, so the made-up list is the same every time.
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const random = lcg(20300101);
/** Invented orbits: each has its own shape, orientation, record id and record time. */
export const listedMembers: readonly ListedMember[] = Object.freeze(Array.from({ length: LISTED_MEMBER_COUNT }, (_, k): ListedMember => ({
  recordId: `made-up-${String(k + 1).padStart(5, "0")}`,
  epochUtcMs: Date.UTC(2020 + (k % 8), k % 12, 1 + (k % 27)),
  elements: {
    semiMajorAxisKm: (2.4 + 1.4 * random()) * AU_KM,
    eccentricity: 0.45 + 0.2 * random(),
    inclinationDeg: 20 + 12 * random(),
    raanDeg: 40 + 14 * random(),
    argumentOfPeriapsisDeg: 70 + 16 * random(),
  },
})));

const adapter = createOrbTwoBodyAdapter();

/** The made-up reference body whose position the clump is drawn near. */
const madeUpParent = createTwoBodyTrajectory({
  body: "listed-parent",
  plane: "ecliptic-j2000",
  epochUtcMs: START_UTC_MS,
  elements: { semiMajorAxisKm: 3.1 * AU_KM, eccentricity: 0.55, inclinationDeg: 25, raanDeg: 47, argumentOfPeriapsisDeg: 78, trueAnomalyDeg: 100 },
}, adapter);

const listedProvenance = createProvenance({
  sourceType: "illustrative",
  sources: ["Made up for the listed-orbits capability test; not a real population"],
  accuracy: "None claimed. Invented orbits listed one by one.",
  notes: "Exists to prove a group can be drawn from a list of per-member orbits through the same contract as any group.",
});

export const syntheticListedLayer: GroupLayer = {
  group: createListedOrbitGroup({
    id: "listed-orbits",
    center: "sun",
    plane: "ecliptic-j2000",
    members: listedMembers,
    phase: { referenceUtcMs: START_UTC_MS, seed: 7, concentration: { around: madeUpParent, ...LISTED_CLUMP } },
    bounds,
    provenance: listedProvenance,
  }, adapter),
  color: LISTED_LOOK.color,
  pointSizePx: LISTED_LOOK.pointSizePx,
  refillAfterMs: LISTED_REFILL_AFTER_MS,
  object: {
    id: "listed-orbits",
    label: "Listed orbits",
    color: LISTED_LOOK.color,
    labelPriority: 80,
    description: "3,000 invented orbits, each listed with its own elements and record id, circling the Sun. One item stands for the whole group; its focus point is the centroid of the dots.",
    knownLimitations: [
      "Made up; not a real population.",
      "The position along each orbit is illustrative: the list gives the orbit's shape and orientation, and the dots are spread evenly along them.",
      "A quarter of the dots are drawn near the made-up parent's position along its orbit. That clump is a model, not a measurement.",
      "Parts of a population that miss the listed orbits are not shown.",
      "Motion is unperturbed two-body about the Sun.",
    ],
  },
};

const parentPath: PathLayer = {
  kind: "orbit",
  color: "#ffb4a2",
  source: madeUpParent,
  span: { startUtcMs: START_UTC_MS, endUtcMs: START_UTC_MS + Math.round(5.5 * 365.256363 * DAY_MS) },
  object: {
    id: "listed-parent-path",
    label: "Made-up parent path",
    color: "#ffb4a2",
    labelPriority: 55,
    description: "The path of the invented body the clump is drawn near, from invented orbital elements.",
    provenance: createProvenance({
      sourceType: "illustrative",
      sources: ["Made up for the listed-orbits capability test; not a real object"],
      accuracy: "None claimed. A two-body orbit with elements chosen for this fixture.",
      notes: "Exists to show where the clump is drawn near.",
    }),
    knownLimitations: ["Made up; not a real object.", "Unperturbed two-body motion about the Sun."],
  },
};

const experience: ExperienceConfig = {
  objects: [
    { id: "earth", label: "Earth", color: "#9fd8ff", labelPriority: 100, labelMaxDistance: 500, description: "Earth, on its path round the Sun; the listed orbits circle the Sun." },
  ],
  cameraPresets: [
    { id: "overview", label: "Overview", request: { kind: "overview" } },
    { id: "sun-view", label: "Sun view", request: { kind: "focus", target: "sun" } },
    { id: "focus-earth", label: "Focus Earth", request: { kind: "focus", target: "earth" } },
    { id: "focus-listed", label: "Focus listed orbits", request: { kind: "focus", target: "listed-orbits" } },
    { id: "follow-listed", label: "Follow listed orbits", request: { kind: "follow", target: "listed-orbits" } },
  ],
  events: createEvents([
    { id: "listed-start", label: "Listing begins", timeUtcMs: START_UTC_MS },
    { id: "listed-half", label: "Half a year on", timeUtcMs: START_UTC_MS + 182 * DAY_MS },
  ]),
  window: bounds,
  rates: [3_600, 86_400, 604_800],
};

/** A made-up Sun-centred experience whose group is drawn from a list of per-member orbits; proves the listed capability needs no particular population. */
export const syntheticListedDefinition: ExperienceDefinition = {
  experience,
  clock: { startUtcMs: START_UTC_MS, rate: 86_400 },
  sceneLayers: ["points", "sun-centred"],
  composition: sunEarthSystem,
  sceneCenter: "sun",
  trackedBodies: [],
  groups: [syntheticListedLayer],
  sun: syntheticSun,
  visualOverrides: { sun: { marker: { sizePx: 10 } } },
  paths: [syntheticEarthPath, parentPath],
  createMetrics: () => () => [],
  camera: { maxFocusDistance: 400_000, far: 1_000_000 },
};
