import { EARTH_EPHEMERIS } from "../app/ephemerisProvenance";
import type { ExperienceDefinition, GroupLayer, PathLayer, SunBody } from "../app/experienceDefinition";
import { createOrbAstronomyAdapter } from "../core/astronomyAdapter";
import { createEarthSunTrajectory, createTwoBodyTrajectory } from "../core/sunCentredSources";
import { createOrbTwoBodyAdapter } from "../core/twoBodyAdapter";
import { createEvents } from "../core/events";
import { createOrbitGroup, type OrbitGroupInput } from "../core/orbitGroup";
import { createProvenance } from "../core/provenance";
import { earthMoonSystem, sunEarthSystem } from "../assets/compositions";
import type { ExperienceConfig } from "../shell/experience";

const START_UTC_MS = Date.UTC(2030, 0, 1, 0, 0, 0);
const HOUR_MS = 3_600_000;
const END_UTC_MS = START_UTC_MS + 24 * HOUR_MS;
const bounds = { startUtcMs: START_UTC_MS, endUtcMs: END_UTC_MS };
export const RING_MEMBER_COUNT = 10_000;
export const BELT_MEMBER_COUNT = 10_000;
const AU_KM = 149_597_870.7;

const ringProvenance = createProvenance({
  sourceType: "illustrative",
  sources: ["Made up for the group capability test; not a real population"],
  accuracy: "None claimed. A scattered ring of invented members on Earth-centred two-body orbits.",
  notes: "Exists to prove a group of objects mounts through the same contract as a single body.",
});

const beltProvenance = createProvenance({
  sourceType: "illustrative",
  sources: ["Made up for the group capability test; not a real population"],
  accuracy: "None claimed. A scattered belt of invented members on Sun-centred two-body orbits.",
  notes: "Exists to prove a Sun-centred group is placed through centre composition.",
});

const ringInput: OrbitGroupInput = {
  id: "debris-ring",
  count: RING_MEMBER_COUNT,
  center: "earth",
  plane: "EQJ",
  epochUtcMs: START_UTC_MS,
  base: { semiMajorAxisKm: 26_000, eccentricity: 0.02, inclinationDeg: 15, raanDeg: 0, argumentOfPeriapsisDeg: 0, trueAnomalyDeg: 0 },
  spread: { semiMajorAxisKm: 1_500, eccentricity: 0.02, inclinationDeg: 2, raanDeg: 180, argumentOfPeriapsisDeg: 180, trueAnomalyDeg: 180 },
  seed: 20300101,
  bounds,
  provenance: ringProvenance,
};

const beltInput: OrbitGroupInput = {
  id: "dust-belt",
  count: BELT_MEMBER_COUNT,
  center: "sun",
  plane: "ecliptic-j2000",
  epochUtcMs: START_UTC_MS,
  base: { semiMajorAxisKm: 2.5 * AU_KM, eccentricity: 0.1, inclinationDeg: 8, raanDeg: 0, argumentOfPeriapsisDeg: 0, trueAnomalyDeg: 0 },
  spread: { semiMajorAxisKm: 0.3 * AU_KM, eccentricity: 0.08, inclinationDeg: 6, raanDeg: 180, argumentOfPeriapsisDeg: 180, trueAnomalyDeg: 180 },
  seed: 7,
  bounds,
  provenance: beltProvenance,
};

const adapter = createOrbTwoBodyAdapter();

export const syntheticRingLayer: GroupLayer = {
  group: createOrbitGroup(ringInput, adapter),
  color: "#7fd1ff",
  object: {
    id: "debris-ring",
    label: "Debris ring",
    color: "#7fd1ff",
    labelPriority: 70,
    labelMaxDistance: 500,
    description: "10,000 invented fragments circling Earth. One item stands for the whole ring; its focus point is the centroid of the members.",
    knownLimitations: [
      "Made up; not a real population.",
      "Members move on unperturbed two-body orbits about Earth: no drag, no Moon or Sun pull, no collisions.",
    ],
  },
};

/** A Sun-centred made-up group; proven by tests through the same definition path, seen through `syntheticBeltDefinition`, which declares the camera reach to frame it. */
export const syntheticBeltLayer: GroupLayer = {
  group: createOrbitGroup(beltInput, adapter),
  color: "#ffd27f",
  object: {
    id: "dust-belt",
    label: "Dust belt",
    color: "#ffd27f",
    description: "10,000 invented fragments circling the Sun. One item stands for the whole belt; its focus point is the centroid of the members.",
    knownLimitations: [
      "Made up; not a real population.",
      "Members move on unperturbed two-body orbits about the Sun.",
    ],
  },
};

const YEAR_MS = Math.round(365.256363 * 86_400_000);

/** The Sun as a drawn body: its position is the engine's Earth–Sun geometry; its marker size is a presentation choice. */
export const syntheticSun: SunBody = {
  object: {
    id: "sun",
    label: "Sun",
    color: "#fff1b0",
    labelPriority: 95,
    description: "The Sun, the centre the belt and the paths circle. The marker's size is a drawing choice, not the Sun's real size.",
    provenance: createProvenance({
      sourceType: "ephemeris",
      sources: EARTH_EPHEMERIS.provenance.sources,
      accuracy: "Position from the engine's Earth–Sun geometry, the same source that lights Earth and the Moon.",
      notes: "Only the position is modelled. The drawn size is not a physical radius.",
    }),
    knownLimitations: ["The marker is drawn at a fixed screen size, not to scale."],
  },
};

const earthAdapter = createOrbAstronomyAdapter();
const earthPathSource = createEarthSunTrajectory(earthAdapter);

/** Earth's own path round the Sun over one year, sampled from Earth's Sun-centred state. */
export const syntheticEarthPath: PathLayer = {
  kind: "orbit",
  color: "#7ab8ff",
  source: earthPathSource,
  span: { startUtcMs: START_UTC_MS, endUtcMs: START_UTC_MS + YEAR_MS },
  object: {
    id: "earth-path",
    label: "Earth's path",
    color: "#7ab8ff",
    labelPriority: 60,
    description: "Earth's path round the Sun over one year, drawn from the same Earth–Sun geometry that places Earth.",
    provenance: createProvenance({
      sourceType: "ephemeris",
      sources: EARTH_EPHEMERIS.provenance.sources,
      accuracy: "Sampled from the engine's Earth–Sun geometry at 256 evenly spaced times; Earth sits on the line at the clock time to within the sampling gap.",
      notes: "The line is the year's path; the real path shifts slightly from year to year.",
    }),
    knownLimitations: ["A year's samples joined by straight segments."],
  },
};

const madeUpPathSource = createTwoBodyTrajectory({
  body: "far-marker",
  plane: "ecliptic-j2000",
  epochUtcMs: START_UTC_MS,
  elements: { semiMajorAxisKm: 4.5 * AU_KM, eccentricity: 0.2, inclinationDeg: 5, raanDeg: 60, argumentOfPeriapsisDeg: 30, trueAnomalyDeg: 0 },
}, createOrbTwoBodyAdapter());

/** A made-up Sun-centred object's path, from made-up elements; proves a path needs no built-in planet. */
export const syntheticFarPath: PathLayer = {
  kind: "orbit",
  color: "#c79bff",
  source: madeUpPathSource,
  span: { startUtcMs: START_UTC_MS, endUtcMs: START_UTC_MS + Math.round(9.5 * YEAR_MS) },
  object: {
    id: "far-marker-path",
    label: "Made-up far path",
    color: "#c79bff",
    labelPriority: 55,
    description: "The path of an invented object about 4.5 AU from the Sun, drawn from invented orbital elements.",
    provenance: createProvenance({
      sourceType: "illustrative",
      sources: ["Made up for the path capability test; not a real object"],
      accuracy: "None claimed. A two-body orbit with elements chosen for this fixture.",
      notes: "Exists to prove a path is drawn from any state source.",
    }),
    knownLimitations: ["Made up; not a real object.", "Unperturbed two-body motion about the Sun."],
  },
};

const experience: ExperienceConfig = {
  objects: [
    { id: "earth", label: "Earth", color: "#9fd8ff", labelPriority: 100, labelMaxDistance: 500, description: "The planet the ring circles." },
    { id: "moon", label: "Moon", color: "#ded7cc", labelPriority: 90, labelMaxDistance: 500, description: "Shown for scale only." },
  ],
  cameraPresets: [
    { id: "overview", label: "Overview", request: { kind: "overview" } },
    { id: "focus-ring", label: "Focus ring", request: { kind: "focus", target: "debris-ring" } },
    { id: "follow-ring", label: "Follow ring", request: { kind: "follow", target: "debris-ring" } },
  ],
  events: createEvents([
    { id: "ring-start", label: "Ring begins", timeUtcMs: START_UTC_MS },
    { id: "ring-half", label: "Ring half a day on", timeUtcMs: START_UTC_MS + 12 * HOUR_MS },
  ]),
  window: bounds,
  rates: [60, 600, 3_600],
};

/** A made-up experience whose only object is a group; proves the group capability is not specific to any one experience. */
export const syntheticRingDefinition: ExperienceDefinition = {
  experience,
  clock: { startUtcMs: START_UTC_MS, rate: 600 },
  sceneLayers: ["points"],
  composition: earthMoonSystem,
  trackedBodies: [],
  groups: [syntheticRingLayer],
  createMetrics: () => () => [],
};

const beltExperience: ExperienceConfig = {
  objects: [
    { id: "earth", label: "Earth", color: "#9fd8ff", labelPriority: 100, labelMaxDistance: 500, description: "Earth, on its path round the Sun; the belt circles the Sun." },
  ],
  cameraPresets: [
    { id: "overview", label: "Overview", request: { kind: "overview" } },
    { id: "sun-view", label: "Sun view", request: { kind: "focus", target: "sun" } },
    { id: "focus-earth", label: "Focus Earth", request: { kind: "focus", target: "earth" } },
    { id: "focus-belt", label: "Focus belt", request: { kind: "focus", target: "dust-belt" } },
    { id: "follow-belt", label: "Follow belt", request: { kind: "follow", target: "dust-belt" } },
  ],
  events: createEvents([
    { id: "belt-start", label: "Belt begins", timeUtcMs: START_UTC_MS },
    { id: "belt-half", label: "Belt half a day on", timeUtcMs: START_UTC_MS + 12 * HOUR_MS },
  ]),
  window: bounds,
  rates: [60, 600, 3_600],
};

/**
 * A made-up Sun-centred experience, about 2.5 AU across: the Sun and Earth about the Sun, the Sun at the scene's zero. Its declared reach (Earth radii: 1 AU is about
 * 23,500) lets the camera pull back far enough to frame the whole belt, and it declares the Sun and two paths
 * (Earth's own and a made-up object's) so the belt has a frame of reference.
 */
export const syntheticBeltDefinition: ExperienceDefinition = {
  experience: beltExperience,
  clock: { startUtcMs: START_UTC_MS, rate: 600 },
  sceneLayers: ["points", "sun-centred"],
  composition: sunEarthSystem,
  sceneCenter: "sun",
  trackedBodies: [],
  groups: [syntheticBeltLayer],
  sun: syntheticSun,
  visualOverrides: { sun: { marker: { sizePx: 10 } } },
  paths: [syntheticEarthPath, syntheticFarPath],
  createMetrics: () => () => [],
  camera: { maxFocusDistance: 400_000, far: 1_000_000 },
};
