import { bodyMetrics } from "../../app/bodyMetrics";
import { catalogueItem } from "../../app/catalogueItem";
import { MOON_EPHEMERIS } from "../../app/ephemerisProvenance";
import type { ExperienceDefinition } from "../../app/experienceDefinition";
import { earthMoonSystem } from "../../assets/compositions";
import { createEvents } from "../../core/events";
import type { ExperienceConfig } from "../../shell/experience";
import { parseStoryPanels } from "../../shell/storyPanels";
import panelsFile from "../../../data/stories/earth-moon/panels.json";

/** The Moon's positions were checked against JPL Horizons from mid-2022 to mid-2025; the window sits inside that range. */
const WINDOW = { startUtcMs: Date.UTC(2025, 0, 1), endUtcMs: Date.UTC(2025, 3, 1) };

const objects = [
  catalogueItem("earth", { color: "#9fd8ff", labelPriority: 100, labelMaxDistance: 500, description: "Our planet, turning once a day, with the Moon in orbit around it." }),
  catalogueItem("moon", {
    color: "#ded7cc",
    labelPriority: 90,
    labelMaxDistance: 500,
    description: "Earth's natural satellite, one month round its orbit. The part of its face that is lit changes with its phase.",
    knownLimitations: MOON_EPHEMERIS.knownLimitations,
  }),
];

const events = createEvents([]);

const experience: ExperienceConfig = {
  objects,
  cameraPresets: [
    { id: "overview", label: "Overview", request: { kind: "overview" } },
    { id: "focus-earth", label: "Focus Earth", request: { kind: "focus", target: "earth" } },
    { id: "focus-moon", label: "Focus Moon", request: { kind: "focus", target: "moon" } },
    { id: "follow-moon", label: "Follow Moon", request: { kind: "follow", target: "moon" } },
  ],
  events,
  window: WINDOW,
  // The story's panels are story data (data/stories/<story>/panels.json), checked against this experience's objects and window.
  storyPanels: parseStoryPanels(panelsFile, { events, objectIds: objects.map((object) => object.id), window: WINDOW }),
  rates: [1, 60, 3_600, 86_400],
};

/**
 * The Earth–Moon Explorer: Earth and the Moon from the catalogue, their real motion, the timeline and the camera, and nothing
 * else. It states dates, presets and copy; every body, texture, radius and provider is the catalogue's.
 */
export const earthMoonExplorer: ExperienceDefinition = {
  label: "Earth–Moon",
  experience,
  clock: { startUtcMs: WINDOW.startUtcMs, rate: 3_600 },
  sceneLayers: [],
  composition: earthMoonSystem,
  scaleChoices: ["true-scale", "readable-scale"],
  trackedBodies: [],
  createMetrics: ({ resolver }) => bodyMetrics(resolver, earthMoonSystem.bodies),
};
