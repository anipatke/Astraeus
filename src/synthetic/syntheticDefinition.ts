import { bodyMetrics, resolverTrajectory } from "../app/bodyMetrics";
import { createTrackedMetrics } from "../experiences/apollo11/spacecraftMetrics";
import type { ExperienceDefinition } from "../app/experienceDefinition";
import type { TrackedBody } from "../app/mission";
import { earthMoonSystem } from "../assets/compositions";
import { createEvents } from "../core/events";
import { createProvenance } from "../core/provenance";
import { SampledTrajectory } from "../core/sampledTrajectory";
import { createWindows, rateAt } from "../core/timeWindow";
import type { Metric, RateMetric } from "../shell/metrics";
import type { ExperienceConfig } from "../shell/experience";
import { parseStoryPanels } from "../shell/storyPanels";

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

/** Made-up marks along the loop, one every 40 minutes, labelled "mark-1" and on; they give the anchor-label layer something to show. */
const ANCHOR_COUNT = 12;
const anchorTimes = Array.from({ length: ANCHOR_COUNT }, (_, index) => START_UTC_MS + (index + 1) * 40 * MINUTE_MS);

const trajectory = new SampledTrajectory({ body: "survey-marker", center: "earth", samples, provenance });
const bounds = trajectory.bounds;

const marker: TrackedBody = {
  id: "survey-marker",
  label: "Survey marker",
  color: "#ffb347",
  trajectory,
  pathTimesUtcMs: samples.map((sample) => sample.timeUtcMs),
  anchorTimesUtcMs: anchorTimes,
  anchorLabels: anchorTimes.map((_, index) => `mark-${index + 1}`),
  provenance,
};

const events = createEvents([
  { id: "marker-start", label: "Marker starts its loop", timeUtcMs: bounds.startUtcMs },
  { id: "marker-quarter", label: "Marker passes a quarter turn", timeUtcMs: START_UTC_MS + 120 * MINUTE_MS },
]);

/** Two made-up story panels (one about the marker, one about nothing in particular) so the story-panel checks run without a real story. */
const storyPanels = parseStoryPanels(
  {
    pauseSeconds: 2,
    panels: [
      {
        id: "marker-loop",
        at: { utc: new Date(START_UTC_MS + 60 * MINUTE_MS).toISOString() },
        title: "The marker's loop",
        body: ["The survey marker goes round a made-up circle.", "Nothing here is a real object."],
        details: ["The loop radius and speed were chosen for this fixture."],
        badge: "illustrative",
        sources: ["Made up for the story-panel test; not a real source"],
        object: "survey-marker",
      },
      {
        id: "marker-late",
        at: { utc: new Date(START_UTC_MS + 300 * MINUTE_MS).toISOString() },
        title: "A later note",
        body: ["A second made-up panel, further along the timeline."],
        badge: "modelled",
        sources: ["Made up for the story-panel test; not a real source"],
      },
    ],
  },
  { events, anchors: new Map(), objectIds: ["earth", "moon", marker.id], window: bounds },
);

const at = (minutes: number) => START_UTC_MS + minutes * MINUTE_MS;

const windowProvenance = (accuracy: string, notes: string) =>
  createProvenance({
    sourceType: "illustrative",
    sources: ["Made up for the window contract test; not real observations"],
    accuracy,
    notes,
  });

const windows = createWindows([
  {
    id: "contact-window",
    label: "Contact window",
    type: "contact",
    startUtcMs: at(30),
    endUtcMs: at(210),
    peakUtcMs: at(135),
    rate: {
      unit: "passes per hour",
      samples: [
        [30, 0],
        [60, 12],
        [90, 30],
        [135, 48],
        [165, 30],
        [190, 12],
        [210, 0],
      ].map(([minutes, value]) => ({ timeUtcMs: at(minutes), value })),
    },
    provenance: [
      {
        startUtcMs: at(30),
        endUtcMs: at(135),
        provenance: windowProvenance(
          "None claimed. A smooth rise invented for this fixture.",
          "First half: a plain made-up ramp up to the peak.",
        ),
      },
      {
        startUtcMs: at(135),
        endUtcMs: at(210),
        provenance: windowProvenance(
          "None claimed. A looser fall invented for this fixture, less certain than the rise.",
          "Second half: a made-up fall, drawn with wider guesses than the first half.",
        ),
      },
    ],
  },
]);
const contactWindow = windows[0];
const peakRate = Math.max(...(contactWindow.rate?.samples.map((sample) => sample.value) ?? [0]));

/** The made-up rate readout, from the same window samples the timeline curve draws (one source). */
function contactRateMetric(timeUtcMs: number): RateMetric {
  return {
    kind: "rate",
    id: "survey-marker-contact-rate",
    label: "Contact rate",
    value: rateAt(contactWindow, timeUtcMs),
    unit: contactWindow.rate?.unit ?? "",
    digits: 0,
    context: contactWindow.label,
    unavailable: "outside the contact window",
    peak: { label: "Peak", value: peakRate },
  };
}

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
  windows,
  window: bounds,
  storyPanels,
  rates: [60, 600, 3_600],
};

/** A tiny made-up experience; it proves the app mounts something other than Apollo. */
export const syntheticDefinition: ExperienceDefinition = {
  experience,
  clock: { startUtcMs: bounds.startUtcMs, rate: 600 },
  sceneLayers: ["tracked-bodies"],
  composition: earthMoonSystem,
  trackedBodies: [marker],
  createMetrics: ({ resolver }) => {
    const catalogued = bodyMetrics(resolver, earthMoonSystem.bodies, ["distance"]);
    const tracked = createTrackedMetrics({ bodies: [marker], moon: resolverTrajectory(resolver, "moon", "earth") });
    return (objectId: string, timeUtcMs: number): readonly Metric[] =>
      objectId === marker.id ? [...tracked(objectId, timeUtcMs), contactRateMetric(timeUtcMs)] : catalogued(objectId, timeUtcMs);
  },
};

const BARE_EXPERIENCE: ExperienceConfig = {
  ...experience,
  objects: experience.objects.filter((object) => object.id === marker.id),
};

/** The same experience with Earth and the Moon left out of the scene and the object list; proves a scene mounts with no composition. */
export const syntheticBareDefinition: ExperienceDefinition = {
  experience: BARE_EXPERIENCE,
  clock: syntheticDefinition.clock,
  sceneLayers: ["tracked-bodies"],
  sceneCenter: "earth",
  trackedBodies: [marker],
  createMetrics: syntheticDefinition.createMetrics,
};
