// Shower definition: assembles the shower experience definition from its settings and re-exports the pieces.
import { bodyMetrics } from "../../app/bodyMetrics";
import type { ExperienceDefinition } from "../../app/experienceDefinition";
import { rootBodyId } from "../../assets/catalogue";
import { createEvents } from "../../core/events";
import { createProvenance } from "../../core/provenance";
import type { ExperienceConfig } from "../../shell/experience";
import type { Metric } from "../../shell/metrics";
import { parseStoryPanels, StoryPanelError, type StoryPanelSet } from "../../shell/storyPanels";
import { orbitSetCounts, type MeasuredLoad, type OrbitSet } from "./measuredOrbits";
import { createActivityWindow, radiantMetricOf, rateMetricOf } from "./showerActivity";
import { showerCatalogue, sourceLine, streamIdOf, timelineBoundsOf, yearBoundsOf } from "./showerBasics";
import { bodyObjects, planetIdsOf, showerComposition } from "./showerBodies";
import { createEarthPathLayer, createParentOrbitPathLayer, createPlanetOrbitPathLayers, parentOrbitIdOf } from "./showerPaths";
import { ShowerSettingsError, type ShowerSettings } from "./showerSettings";
import { createStreamLayer } from "./showerStream";
import { absentStreamObject } from "./showerStreamText";

// The pieces of a shower experience live in their own files (stream layer and its text, path layers, activity window, body items);
// this file assembles them, and re-exports the names callers import from here.
export { createActivityWindow, rateSamplesOf } from "./showerActivity";
export { showerCatalogue, streamIdOf, timelineBoundsOf, windowIdOf } from "./showerBasics";
export { showerComposition } from "./showerBodies";
export { createEarthPathLayer, createParentOrbitPathLayer, createPlanetOrbitPathLayers, parentOrbitIdOf, parentSamplingOf } from "./showerPaths";
export { showerEntryName } from "./showerEntry";
export { createStreamLayer } from "./showerStream";
export { absentStreamObject, gmnSourceSentence, orbitSetSentence, streamLimitations } from "./showerStreamText";

/** Every story panels file a shower's `story.panels` path may name, keyed by repo-relative path. */
const PANEL_FILES = import.meta.glob<unknown>("../../../data/stories/*/panels.json", { eager: true, import: "default" });

/**
 * The shower's story panels, or undefined when its settings carry none. A path is read from the story folder; either way the panels are checked
 * against this experience's events, objects and timeline, and a problem is raised with the settings field or the panel and field named.
 */
export function showerStoryPanels(settings: ShowerSettings, objectIds: readonly string[], events: readonly { readonly id: string; readonly timeUtcMs: number }[], window: { readonly startUtcMs: number; readonly endUtcMs: number }): StoryPanelSet | undefined {
  if (settings.story === undefined) return undefined;
  const given = settings.story.panels;
  const raw = typeof given === "string" ? PANEL_FILES[`../../../${given}`] : given;
  if (raw === undefined) throw new ShowerSettingsError(`shower settings story.panels names "${String(given)}", which is not a panels file in the project`);
  try {
    // Validated against the full default (year) timeline so a genuine data mistake still throws; a viewer who narrows the span just loses the panels outside what is visible.
    const set = parseStoryPanels(raw, { events, objectIds, window: yearBoundsOf(settings) });
    const panels = set.panels.filter((panel) => panel.timeUtcMs >= window.startUtcMs && panel.timeUtcMs <= window.endUtcMs);
    return panels.length === set.panels.length ? set : { ...set, panels };
  } catch (error) {
    if (error instanceof StoryPanelError) throw new ShowerSettingsError(`shower settings story.panels: ${error.message}`);
    throw error;
  }
}

/** The live switch the Developer section lists: the orbit set (once loaded). Undefined when there is none. */
function alternatesOf(settings: ShowerSettings, load: MeasuredLoad, set: OrbitSet): ExperienceDefinition["alternates"] {
  if (load.kind !== "loaded") return undefined;
  const counts = orbitSetCounts(load.orbits, settings.stream.quality.rule);
  return (["all", "reliable"] as const).map((option) => ({
    label: option === "all" ? `All orbits (${counts.all})` : `Reliable only (${counts.reliable})`,
    param: "orbits",
    value: option,
    active: option === set,
  }));
}

/**
 * Turns shower settings and the shower's measured orbits into an experience definition; nothing here names a particular shower. When the
 * orbits are not on this machine the experience says so and draws no stream: there is no stand-in.
 */
export function buildShowerDefinition(settings: ShowerSettings, load: MeasuredLoad, set: OrbitSet = settings.stream.quality.default): ExperienceDefinition {
  const composition = showerComposition(settings);
  const layer = load.kind === "loaded" ? createStreamLayer(settings, load.orbits, set) : null;
  const window = createActivityWindow(settings);
  const streamId = streamIdOf(settings);
  const { startUtcMs, endUtcMs } = timelineBoundsOf(settings);
  const radiant = radiantMetricOf(settings);
  const parentOrbitId = parentOrbitIdOf(settings);
  const events = createEvents([
    { id: `${settings.id}-start`, label: `${settings.label} activity begins`, timeUtcMs: window.startUtcMs },
    { id: `${settings.id}-peak`, label: `${settings.label} peak`, timeUtcMs: window.peakUtcMs ?? window.startUtcMs },
    { id: `${settings.id}-end`, label: `${settings.label} activity ends`, timeUtcMs: window.endUtcMs },
  ]);
  const objects = [...bodyObjects(settings, composition), ...(load.kind === "loaded" ? [] : [absentStreamObject(settings, load)])];
  // A panel may name any object the experience lists, or the stream when it is drawn.
  const storyPanels = showerStoryPanels(settings, [...objects.map((object) => object.id), ...(layer === null ? [] : [streamId])], events, { startUtcMs, endUtcMs });
  const experience: ExperienceConfig = {
    objects,
    cameraPresets: [
      { id: "overview", label: "Overview", request: { kind: "overview" } },
      { id: "focus-earth", label: "Focus Earth", request: { kind: "focus", target: "earth" } },
      { id: "follow-earth", label: "Follow Earth", request: { kind: "follow", target: "earth" } },
      { id: "focus-parent", label: "Focus parent", request: { kind: "focus", target: settings.parentBodyId } },
      { id: "whole-orbit", label: "Whole orbit", request: { kind: "focus", target: parentOrbitId } },
      ...(layer === null
        ? []
        : [
            { id: "focus-stream", label: "Focus stream", request: { kind: "focus", target: streamId } } as const,
            { id: "follow-stream", label: "Follow stream", request: { kind: "follow", target: streamId } } as const,
          ]),
    ],
    events,
    windows: [window],
    window: { startUtcMs, endUtcMs },
    ...(storyPanels === undefined ? {} : { storyPanels }),
    rates: [...new Set([3_600, 43_200, 86_400, 259_200, 604_800, settings.timeline.rateSecondsPerSecond])].sort((a, b) => a - b),
    eventProvenance: createProvenance({
      sourceType: "observed",
      sources: [sourceLine(settings.activity.source)],
      accuracy: "Activity dates as published; the peak instant is chosen inside the published night.",
      notes: settings.activity.source.note ?? "",
    }),
  };
  return {
    label: settings.label,
    experience,
    clock: { startUtcMs, rate: settings.timeline.rateSecondsPerSecond },
    alternates: alternatesOf(settings, load, set),
    loop: settings.look.loop,
    viewUp: settings.look.viewUp,
    ...(settings.look.startView === undefined ? {} : { startView: settings.look.startView }),
    sceneLayers: ["points", "sun-centred"],
    composition,
    ...(settings.parentElements === undefined ? {} : { catalogue: showerCatalogue(settings) }),
    sceneCenter: rootBodyId(),
    scaleChoices: ["true-scale", "solar-system"],
    visualOverrides: Object.fromEntries(planetIdsOf(composition, settings).map((id) => [id, { exaggeration: settings.look.planetExaggeration }])),
    trackedBodies: [],
    groups: layer === null ? [] : [layer],
    paths: [createEarthPathLayer(settings), ...createPlanetOrbitPathLayers(settings), createParentOrbitPathLayer(settings)],
    camera: { maxFocusDistance: settings.look.cameraMaxFocusDistance, far: settings.look.cameraFar },
    createMetrics: ({ resolver }) => {
      const base = bodyMetrics(resolver, composition.bodies, ["distance"]);
      return (objectId: string, timeUtcMs: number): readonly Metric[] =>
        objectId === streamId ? [rateMetricOf(settings, window, timeUtcMs), radiant] : base(objectId, timeUtcMs);
    },
  };
}
