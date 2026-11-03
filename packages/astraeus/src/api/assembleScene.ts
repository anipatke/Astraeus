import type { BodyId } from "../core/body";
import type { ScalePolicy } from "../core/scalePolicy";
import type { TimeBounds } from "../core/trajectory";
import { isPlanetId, loadPlanetSeries, planetSeriesLoaded, planetSeriesSpan } from "../core/planetSeries";
import { TimeScaleOutOfRangeError } from "../core/timeScale";
import { catalogue as builtInCatalogue } from "../assets/catalogue";
import { createComposition } from "../assets/compositions";
import { mergePictures } from "../assets/pictures";
import { bodyMetrics } from "../app/bodyMetrics";
import type { ExperienceDefinition, GroupLayer, PathLayer } from "../app/experienceDefinition";
import type { LookInput } from "./look";
import { needsPlanetSeries } from "../app/planetNeeds";
import { createReadoutMetrics } from "../app/trackedMetrics";
import type { Metric } from "../shell/metrics";
import type { ExperienceObject } from "../shell/experience";
import { installData, type DataSource } from "./data";
import { SceneError } from "./errors";
import { cameraPresetsOf, fitFarthestKm, startPresetEntry, startViewEntry, viewEntries, type SceneCamera } from "./planCamera";
import type { BodyPlan } from "./planBodies";
import { groupLayersEntry, lateGroups, type GroupPlan } from "./planGroups";
import { autoPaths, checkReadouts, pathCover, type Tracked } from "./planPaths";
import type { StoryPlan } from "./planStory";
import type { TimelinePlan } from "./planTimeline";
import type { ViewPlan } from "./planViews";

/** What a `Scene` hands the assembler: the planners it has filled, its camera and its scale choice. Internal; never exported from the package. */
export interface ScenePlanners {
  readonly plan: BodyPlan;
  readonly tracked: ReadonlyMap<string, Tracked>;
  readonly groupPlan: GroupPlan;
  readonly story: StoryPlan;
  readonly timeline: TimelinePlan;
  readonly viewPlan: ViewPlan;
  readonly camera: SceneCamera;
  readonly scale: ScalePolicy;
  readonly scaleOnly: boolean;
  readonly look: LookInput | undefined;
}

/** The `out-of-span` error naming the planets when the scene's window reaches outside the years the planet series cover (the series are loaded); undefined otherwise. */
function planetSpanError(ids: readonly BodyId[], window: TimeBounds): SceneError | undefined {
  const planets = ids.filter(isPlanetId);
  if (planets.length === 0 || !planetSeriesLoaded()) return undefined;
  const span = planetSeriesSpan();
  if (window.startUtcMs >= span.startUtcMs && window.endUtcMs <= span.endUtcMs) return undefined;
  const iso = (ms: number): string => new Date(ms).toISOString().slice(0, 10);
  return new SceneError("out-of-span", `${planets.join(", ")} is outside the years the built-in planet series covers: it covers ${iso(span.startUtcMs)} to ${iso(span.endUtcMs)}, but the scene runs ${iso(window.startUtcMs)} to ${iso(window.endUtcMs)}; set the timeline inside that span`);
}

/** Throws `out-of-span` naming the planets when the scene's window reaches outside the years the planet series cover (the series are loaded). */
function checkPlanetSpan(ids: readonly BodyId[], window: TimeBounds): void {
  const error = planetSpanError(ids, window);
  if (error !== undefined) throw error;
}

/**
 * The one choke point for planet-series reads during setup (orbit lines, the fit distance, clump groups): checks the span first, and turns a
 * `TimeScaleOutOfRangeError` from the read into the named `out-of-span` error when the window is outside the series, so no setup read can leak the raw one.
 */
function planetRead<T>(ids: readonly BodyId[], window: TimeBounds, read: () => T): T {
  checkPlanetSpan(ids, window);
  try {
    return read();
  } catch (error) {
    if (error instanceof TimeScaleOutOfRangeError) throw planetSpanError(ids, window) ?? error;
    throw error;
  }
}

/**
 * A setup read in `toDefinition`: an `out-of-span` failure is recorded in `fault` and the read gives `fallback`, so `toDefinition` (and so `mount`) never throws it;
 * `prepare` rejects with the recorded error, which is how it always arrives (once, as `ready` rejecting).
 */
function deferredRead<T>(ids: readonly BodyId[], window: TimeBounds, fault: { error?: SceneError }, fallback: T, read: () => T): T {
  try {
    return planetRead(ids, window, read);
  } catch (error) {
    if (error instanceof SceneError && error.code === "out-of-span") {
      fault.error ??= error;
      return fallback;
    }
    throw error;
  }
}

/** The app's plug-in contract for a scene's planners. Throws if the scene is empty or a body needs a data package not passed in `data`. */
export function assembleScene(parts: ScenePlanners, data: readonly DataSource[]): ExperienceDefinition {
  const { plan, groupPlan, story, timeline: timelinePlan, viewPlan, camera, tracked: trackedMap } = parts;
  if (plan.bodies.size === 0) throw new SceneError("empty-scene", "the scene has no bodies; call addBody before mount");
  plan.checkData(data);
  groupPlan.checkReadouts();
  const ids = [...plan.bodies.keys()];
  const paths = plan.moonPaths();
  const sunCentred = plan.checkSunCentred(ids);
  plan.checkSolarSystemScale(parts.scale, sunCentred);
  for (const entry of trackedMap.values()) checkReadouts(entry, ids);
  const entries = [...trackedMap.values()];
  const tracked = entries.map((entry) => entry.body);
  const timeline = timelinePlan.setting;
  const { window, startUtcMs } = timelinePlan.span([...tracked.map((body) => body.trajectory.bounds), ...[...groupPlan.activities.values()].map((activity) => activity.window)]);
  const sunOrbitIds = plan.sunOrbitIds(ids);
  // The farthest distance is worked out in setup, once: now when the planet series are in, else in `prepare` once they are; never in the frame loop.
  const fault: { error?: SceneError } = {};
  // `lineFixedTo: "auto"` paths read body states: now when the planet series are in, else in `prepare` once they are (the viewer draws only after it resolves); never per frame.
  const auto = autoPaths(plan.catalogue, entries, tracked, ids);
  auto.now((read) => deferredRead(ids, window, fault, undefined, read));
  const fit = deferredRead(ids, window, fault, undefined, () => fitFarthestKm(camera, plan.catalogue, plan.own, startUtcMs));
  // The lines read planet positions; when the planet series are not loaded yet (a consumer's mount), they are drawn in `prepare`, once the series are in. The viewer draws only after `prepare` resolves.
  const sunPaths: PathLayer[] = deferredRead<PathLayer[]>(ids, window, fault, [], () => plan.earlySunPaths(sunOrbitIds, startUtcMs, planetSeriesLoaded()));
  const storyPanels = story.panels(window, trackedMap.values(), [...plan.bodies.keys(), ...trackedMap.keys(), ...groupPlan.groups.keys()]);
  groupPlan.check(ids);
  // A clump near a body reads its position; with the planet series not loaded yet, those groups are built in `prepare` (the viewer draws only after it resolves).
  const seriesIn = planetSeriesLoaded();
  const late = lateGroups(seriesIn);
  const layers: GroupLayer[] = deferredRead<GroupLayer[]>(ids, window, fault, [], () => [...groupPlan.layers(ids, window, startUtcMs, (plan) => !late(plan))]);
  const labelled = [...plan.bodies.values(), ...tracked, ...[...groupPlan.groups.values()]].map(({ id, label }) => ({ id, label }));
  const catalogue = plan.catalogue;
  story.checkObjects(new Set(labelled.map(({ id }) => id)));
  const definition: ExperienceDefinition = {
    experience: {
      objects: [
        ...[...plan.bodies.values()].map((body) => plan.bodyObject(body, ids, sunCentred, camera)),
        ...[...trackedMap.values()].map(({ body, description, knownLimitations, provenanceSpans }): ExperienceObject => ({ id: body.id, label: body.label, color: body.color, availability: body.trajectory.bounds, labelPriority: 80, ...plan.labelReach(body.id, sunCentred, camera), provenance: body.provenance, ...(provenanceSpans === undefined ? {} : { provenanceSpans }), ...(description === undefined ? {} : { description }), ...(knownLimitations === undefined ? {} : { knownLimitations }) })),
      ],
      cameraPresets: cameraPresetsOf(labelled),
      ...startPresetEntry(camera),
      events: story.events,
      ...story.provenanceEntries(),
      ...(storyPanels === undefined ? {} : { storyPanels }),
      ...(timeline?.none === true ? { hideTimeline: true } : {}),
      window,
      ...groupPlan.windowsEntry(),
      rates: timelinePlan.rates(),
    },
    clock: timelinePlan.clock(startUtcMs),
    ...timelinePlan.pacing(story.events),
    ...groupLayersEntry(layers, groupPlan.groups.size > 0, sunOrbitIds.length > 0),
    ...(sunOrbitIds.length === 0 ? {} : { paths: sunPaths }),
    ...(plan.catalogue === builtInCatalogue ? {} : { catalogue: plan.catalogue }),
    ...plan.visualOverrides(),
    // The viewer draws only the pictures of the packages passed to it (T-252); nothing is shared between viewers.
    ...picturesEntry(data),
    composition: createComposition(plan.catalogue, { id: "scene", bodies: ids, defaultCenter: ids[0]!, ...(paths.length === 0 ? {} : { paths }) }),
    scaleChoices: plan.scaleChoices(parts.scale, parts.scaleOnly),
    ...viewPlan.switchesEntry(),
    ...(parts.look === undefined ? {} : { look: parts.look }),
    ...viewPlan.viewsEntry({ paths: [...trackedMap.keys()], bodies: [...ids, ...groupPlan.groups.keys()], events: story.events.map(({ id }) => id) }, storyPanels),
    ...viewEntries(timeline, camera, fit?.read, pathCover(trackedMap.values(), sunCentred, ids[0]!)),
    ...startViewEntry(camera),
    trackedBodies: tracked,
    createMetrics: ({ resolver }) => {
      const catalogued = bodyMetrics(resolver, ids, ["distance"], catalogue);
      const readouts = createReadoutMetrics([...trackedMap.values()].map(({ body, readouts: specs }) => ({ body, readouts: specs })), resolver);
      return (objectId: string, timeUtcMs: number): readonly Metric[] => (groupPlan.groups.has(objectId) ? groupPlan.metrics(objectId, timeUtcMs) : trackedMap.has(objectId) ? readouts(objectId, timeUtcMs) : catalogued(objectId, timeUtcMs));
    },
    prepare: async () => {
      if (fault.error !== undefined) throw fault.error;
      if (needsPlanetSeries(definition) || auto.later || sunPaths.length < sunOrbitIds.length || groupPlan.groups.size > layers.length) await loadPlanetSeries();
      checkPlanetSpan(ids, window);
      auto.settle((read) => planetRead(ids, window, read));
      if (groupPlan.groups.size > layers.length) layers.push(...planetRead(ids, window, () => groupPlan.layers(ids, window, startUtcMs, late)));
      if (sunPaths.length < sunOrbitIds.length) sunPaths.push(...planetRead(ids, window, () => sunOrbitIds.map((id) => plan.sunPath(id, startUtcMs))));
      if (fit !== undefined) planetRead(ids, window, () => fit.settle());
      await installData(data, ids, window, catalogue);
    },
  };
  return definition;
}

/** The viewer's own pictures (those of the packages passed to it); absent when no package brings any. */
function picturesEntry(data: readonly DataSource[]): Pick<ExperienceDefinition, "pictures"> {
  const pictures = mergePictures(data.map((source) => source.pictures));
  return Object.keys(pictures).length === 0 ? {} : { pictures };
}
