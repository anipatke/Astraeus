import { createObjectMetrics } from "../app/metricReadouts";
import type { ExperienceDefinition } from "../app/experienceDefinition";
import type { TrackedBody } from "../app/mission";
import { createEvents } from "../core/events";
import { createProvenance } from "../core/provenance";
import { SampledTrajectory } from "../core/sampledTrajectory";
import type { ExperienceConfig } from "../shell/experience";

const START_UTC_MS = Date.UTC(2030, 0, 1, 0, 0, 0);
const MINUTE_MS = 60_000;
const SAMPLE_COUNT = 97;
const ORBIT_RADIUS_KM = 20_000;
const SPEED_KM_S = 4.465;
const TILT = Math.PI / 6;
const OMEGA_RAD_S = SPEED_KM_S / ORBIT_RADIUS_KM;

const provenance = createProvenance({
  sourceType: "illustrative",
  sources: ["Made up for the plug-in contract test; not a real object"],
  accuracy: "None claimed. A circular, tilted, Earth-centred path invented for this fixture.",
  notes: "Exists to prove a second experience mounts through the same contract as the first.",
});

const samples = Array.from({ length: SAMPLE_COUNT }, (_, index) => {
  const angle = OMEGA_RAD_S * index * 5 * 60;
  const [c, s] = [Math.cos(angle), Math.sin(angle)];
  return {
    timeUtcMs: START_UTC_MS + index * 5 * MINUTE_MS,
    positionKm: [ORBIT_RADIUS_KM * c, ORBIT_RADIUS_KM * s * Math.cos(TILT), ORBIT_RADIUS_KM * s * Math.sin(TILT)],
    velocityKmS: [-SPEED_KM_S * s, SPEED_KM_S * c * Math.cos(TILT), SPEED_KM_S * c * Math.sin(TILT)],
  };
});

const trajectory = new SampledTrajectory({ body: "survey-marker", center: "earth", samples, provenance });
const bounds = trajectory.bounds;

const marker: TrackedBody = {
  id: "survey-marker",
  label: "Survey marker",
  color: "#ffb347",
  trajectory,
  pathTimesUtcMs: samples.map((sample) => sample.timeUtcMs),
  anchorTimesUtcMs: [],
  provenance,
};

const events = createEvents([
  { id: "marker-start", label: "Marker starts its loop", timeUtcMs: bounds.startUtcMs },
  { id: "marker-quarter", label: "Marker passes a quarter turn", timeUtcMs: START_UTC_MS + 120 * MINUTE_MS },
]);

const experience: ExperienceConfig = {
  objects: [
    { id: "earth", label: "Earth", color: "#9fd8ff", labelPriority: 100, labelMaxDistance: 500, description: "The planet the marker circles." },
    { id: "moon", label: "Moon", color: "#ded7cc", labelPriority: 90, labelMaxDistance: 500, description: "Shown for scale only." },
    {
      id: marker.id,
      label: marker.label,
      color: marker.color,
      availability: bounds,
      labelPriority: 80,
      labelMaxDistance: 4,
      description: "An invented object on a simple loop around Earth.",
      provenance,
      knownLimitations: ["Not a real object; the loop is a plain circle chosen for testing."],
    },
  ],
  cameraPresets: [
    { id: "overview", label: "Overview", request: { kind: "overview" } },
    { id: "focus-marker", label: "Focus marker", request: { kind: "focus", target: marker.id } },
    { id: "follow-marker", label: "Follow marker", request: { kind: "follow", target: marker.id } },
  ],
  events,
  window: bounds,
  rates: [60, 600, 3_600],
};

/** A tiny made-up experience; it proves the app mounts something other than Apollo. */
export const syntheticDefinition: ExperienceDefinition = {
  experience,
  clock: { startUtcMs: bounds.startUtcMs, rate: 600 },
  sceneLayers: ["earth-moon", "tracked-bodies"],
  trackedBodies: [marker],
  createMetrics: ({ moon }) => createObjectMetrics({ bodies: [marker], moon, earthId: "earth", moonId: "moon" }),
};

const BARE_EXPERIENCE: ExperienceConfig = {
  ...experience,
  objects: experience.objects.filter((object) => object.id === marker.id),
};

/** The same experience with Earth and the Moon left out of the scene and the object list; proves the layer list is honoured. */
export const syntheticBareDefinition: ExperienceDefinition = {
  ...syntheticDefinition,
  experience: BARE_EXPERIENCE,
  sceneLayers: ["tracked-bodies"],
};
