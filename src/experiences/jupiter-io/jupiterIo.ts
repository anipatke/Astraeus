import { bodyMetrics } from "../../app/bodyMetrics";
import { catalogueItem } from "../../app/catalogueItem";
import type { ExperienceDefinition } from "../../app/experienceDefinition";
import { jupiterIoSystem } from "../../assets/compositions";
import { IO } from "../../core/bodies/io";
import { createEvents } from "../../core/events";
import type { ExperienceConfig } from "../../shell/experience";

/** Io's mean-element position was compared with JPL Horizons at six dates from 1969 to 2030; it is nearest the J2000 epoch, so the window sits there. */
const WINDOW = { startUtcMs: Date.UTC(2000, 0, 1), endUtcMs: Date.UTC(2000, 0, 15) };

const JUPITER_NO_TEXTURE = "Jupiter is drawn flat in one colour, without cloud bands: the donor's Jupiter map has no recorded source or licence, so no texture is used.";

const experience: ExperienceConfig = {
  objects: [
    catalogueItem("jupiter", {
      labelPriority: 100,
      labelMaxDistance: 500,
      description: "The largest planet, flattened by its fast spin. Io circles it once in about 42 hours.",
      knownLimitations: [JUPITER_NO_TEXTURE, "The surface drawn is the 1-bar cloud-top level, not a solid surface."],
    }),
    catalogueItem("io", {
      labelPriority: 90,
      labelMaxDistance: 500,
      description: "The innermost large moon of Jupiter, always turning the same face towards it. Its orbit is drawn from published mean elements and is only an approximate demonstration.",
      knownLimitations: IO.accuracy.orientationLimitations,
    }),
  ],
  cameraPresets: [
    { id: "overview", label: "Overview", request: { kind: "overview" } },
    { id: "focus-jupiter", label: "Focus Jupiter", request: { kind: "focus", target: "jupiter" } },
    { id: "focus-io", label: "Focus Io", request: { kind: "focus", target: "io" } },
    { id: "follow-io", label: "Follow Io", request: { kind: "follow", target: "io" } },
  ],
  events: createEvents([]),
  window: WINDOW,
  rates: [60, 3_600, 21_600, 86_400],
};

/**
 * Jupiter and Io about Jupiter, from the catalogue: the stress test of the engine's contracts, a centre that is neither Earth
 * nor the Sun. True scale only: the Readable scale pulls Io inside Jupiter, and the Solar system scale would enlarge both.
 */
export const jupiterIoExplorer: ExperienceDefinition = {
  experience,
  clock: { startUtcMs: WINDOW.startUtcMs, rate: 3_600 },
  sceneLayers: [],
  composition: jupiterIoSystem,
  scaleChoices: ["true-scale"],
  trackedBodies: [],
  createMetrics: ({ resolver }) => bodyMetrics(resolver, jupiterIoSystem.bodies),
};
