import type { ExperienceDefinition, GroupLayer } from "../app/experienceDefinition";
import { createOrbTwoBodyAdapter } from "../core/twoBodyAdapter";
import { createEvents } from "../core/events";
import { createOrbitGroup, type OrbitGroupInput } from "../core/orbitGroup";
import { createProvenance } from "../core/provenance";
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

/** A Sun-centred made-up group; proven by tests through the same definition path, too far out to see at the app's camera reach. */
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
  sceneLayers: ["earth-moon", "points"],
  trackedBodies: [],
  groups: [syntheticRingLayer],
  createMetrics: () => () => [],
};
