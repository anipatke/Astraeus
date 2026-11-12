import type { BodyId } from "../core/body";
import type { ScalePolicy } from "../core/scalePolicy";
import type { TimeBounds } from "../core/trajectory";
import { isPlanetId, loadPlanetSeries, planetSeriesLoaded, planetSeriesSpan } from "../core/planetSeries";
import { TimeScaleOutOfRangeError } from "../core/timeScale";
import { catalogue as builtInCatalogue } from "../assets/catalogue";
import { createComposition } from "../assets/compositions";
import { mergePictures } from "../assets/pictures";
import { bodyMetrics, type BodyMetricKind } from "../app/bodyMetrics";
import type { ExperienceDefinition, GroupLayer, PathLayer } from "../app/experienceDefinition";
import type { LookInput } from "./look";
import { needsPlanetSeries } from "../app/planetNeeds";
import { createReadoutMetrics } from "../app/trackedMetrics";
import type { Metric } from "../shell/metrics";
import type { ExperienceObject } from "../shell/experience";
import { checkDataSources, installData, type DataSource } from "./data";
import { SceneError } from "./errors";
import { cameraPresetsOf, checkOpeningLook, fitFarthestKm, startPresetEntry, startViewEntry, viewEntries, type SceneCamera } from "./planCamera";
import type { BodyPlan } from "./planBodies";
import type { BodySetPlan } from "./planBodySets";
import type { MoonPanelPlan } from "./planMoonPanel";
import type { PickerPlan } from "./planPicker";
import type { PlacesPlan } from "./planPlaces";
import { groupLayersEntry, lateGroups, type GroupPlan } from "./planGroups";
import { autoPaths, checkNamedReadouts, checkReadouts, pathCover, type Tracked } from "./planPaths";
import type { StoryPlan } from "./planStory";
import type { TimelinePlan } from "./planTimeline";
import type { ViewPlan } from "./planViews";
import type { SkyFigurePlan } from "./planSkyFigures";
import { loadStarCatalogue, starIdsOf } from "../assets/sky";
import type { SkyFigureLayer } from "../app/skyFigures";

/** What a `Scene` hands the assembler: the planners it has filled, its camera and its scale choice. Internal; never exported from the package. */
export interface ScenePlanners {
  readonly plan: BodyPlan;
  readonly tracked: ReadonlyMap<string, Tracked>;
  readonly groupPlan: GroupPlan;
  readonly bodySets: BodySetPlan;
  readonly moonPanel: MoonPanelPlan;
  readonly picker: PickerPlan;
  readonly places: PlacesPlan;
  readonly story: StoryPlan;
  readonly timeline: TimelinePlan;
  readonly viewPlan: ViewPlan;
  readonly skyFigures: SkyFigurePlan;
  readonly camera: SceneCamera;
  readonly scale: ScalePolicy;
  readonly scaleOnly: boolean;
  readonly look: LookInput | undefined;
  readonly bodyReadouts: readonly BodyMetricKind[];
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
  const { plan, groupPlan, bodySets, moonPanel, places, story, timeline: timelinePlan, viewPlan, camera, tracked: trackedMap, skyFigures } = parts;
  if (plan.bodies.size === 0) throw new SceneError("empty-scene", "the scene has no bodies; call addBody before mount");
  checkDataSources(data);
  plan.checkData(data);
  bodySets.checkData(data);
  groupPlan.checkReadouts();
  const ids = [...plan.bodies.keys()];
  const paths = plan.moonPaths();
  const sunCentred = plan.checkSunCentred(ids);
  plan.checkSolarSystemScale(parts.scale, sunCentred);
  for (const entry of trackedMap.values()) checkReadouts(entry, ids);
  for (const [id, readouts] of plan.readouts) checkNamedReadouts(id, readouts, ids, "addBody");
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
  const storyPanels = story.panels(window, trackedMap.values(), [...plan.bodies.keys(), ...trackedMap.keys(), ...groupPlan.groups.keys(), ...bodySets.memberIds()], [...skyFigures.figures.keys()]);
  groupPlan.check(ids);
  bodySets.check({ ids, catalogue: plan.catalogue, orbits: plan.orbits });
  // A clump near a body reads its position; with the planet series not loaded yet, those groups are built in `prepare` (the viewer draws only after it resolves).
  const seriesIn = planetSeriesLoaded();
  const late = lateGroups(seriesIn);
  const layers: GroupLayer[] = deferredRead<GroupLayer[]>(ids, window, fault, [], () => [...groupPlan.layers(ids, window, startUtcMs, (plan) => !late(plan))]);
  const setLayers = bodySets.layers({ ids, catalogue: plan.catalogue, orbits: plan.orbits, window, startUtcMs });
  const labelled = [...plan.bodies.values(), ...tracked, ...[...groupPlan.groups.values()]].map(({ id, label }) => ({ id, label }));
  const catalogue = plan.catalogue;
  if (camera.following && camera.target !== undefined && camera.followChoices !== undefined && !camera.followChoices.includes(camera.target)) throw new SceneError("bad-camera", `camera.follow("${camera.target}"): the opening view follows "${camera.target}", which camera.setFollowChoices does not list`);
  story.checkObjects(new Set([...labelled.map(({ id }) => id), ...skyFigures.figures.keys()]));
  const objects: ExperienceObject[] = [
    ...[...plan.bodies.values()].map((body) => plan.bodyObject(body, ids, sunCentred, camera)),
    ...[...trackedMap.values()].map(({ body, description, knownLimitations, provenanceSpans, shownDuring }): ExperienceObject => ({ id: body.id, label: body.label, color: body.color, availability: body.trajectory.bounds, labelPriority: 80, ...plan.labelReach(body.id, sunCentred, camera), provenance: body.provenance, ...(provenanceSpans === undefined ? {} : { provenanceSpans }), ...(shownDuring === undefined ? {} : { shownDuring }), ...(description === undefined ? {} : { description }), ...(knownLimitations === undefined ? {} : { knownLimitations }) })),
    ...bodySets.objects({ ids, catalogue: plan.catalogue }),
  ];
  const pictures = mergePictures(data.map((source) => source.pictures));
  const members = new Set(bodySets.memberIds());
  const moonFamilies = moonPanel.list(new Map(objects.filter(({ id }) => plan.bodies.has(id) || members.has(id)).map(({ id, label }) => [id, label])), new Set(ids), plan.catalogue, (picture) => pictures[picture]?.url);
  const figures = skyFigureLayers(skyFigures);
  const bodyFeatures = places.featureSets(new Map(objects.map(({ id, label }) => [id, label])));
  const definition: ExperienceDefinition = {
    experience: {
      objects,
      cameraPresets: cameraPresetsOf(labelled, camera.followChoices, camera.lookOutChoices),
      ...startPresetEntry(camera),
      ...(moonFamilies === undefined ? {} : { moonFamilies }),
      ...(bodyFeatures.length === 0 ? {} : { bodyFeatures }),
      ...(skyFigures.figures.size === 0 ? {} : { skyFigures: skyFigures.cards() }),
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
    ...(setLayers.length === 0 ? {} : { bodySets: setLayers }),
    ...figures.entry,
    ...(plan.catalogue === builtInCatalogue ? {} : { catalogue: plan.catalogue }),
    ...plan.visualOverrides(),
    // The viewer draws only the pictures of the packages passed to it (T-252); nothing is shared between viewers.
    ...picturesEntry(data),
    composition: createComposition(plan.catalogue, { id: "scene", bodies: ids, defaultCenter: ids[0]!, ...(paths.length === 0 ? {} : { paths }) }),
    scaleChoices: plan.scaleChoices(parts.scale, parts.scaleOnly),
    ...viewPlan.switchesEntry(),
    ...parts.picker.entry(),
    ...(parts.look === undefined ? {} : { look: parts.look }),
    ...viewPlan.viewsEntry({ objects: [...trackedMap.keys(), ...ids, ...groupPlan.groups.keys()], events: story.events.map(({ id }) => id) }, storyPanels),
    ...viewEntries(timeline, camera, fit?.read, pathCover(trackedMap.values(), sunCentred, ids[0]!)),
    ...startViewEntry(camera),
    trackedBodies: tracked,
    createMetrics: ({ resolver }) => {
      const catalogued = bodyMetrics(resolver, ids, parts.bodyReadouts, catalogue);
      const bodyReadouts = [...plan.readouts].map(([id, specs]) => ({ id, label: plan.bodies.get(id)!.label, center: ids[0]!, readouts: specs }));
      const readouts = createReadoutMetrics([...trackedMap.values()].map(({ body, readouts: specs }) => ({ body, readouts: specs })), resolver, undefined, bodyReadouts);
      return (objectId: string, timeUtcMs: number): readonly Metric[] => (groupPlan.groups.has(objectId) ? groupPlan.metrics(objectId, timeUtcMs) : trackedMap.has(objectId) || plan.readouts.has(objectId) ? readouts(objectId, timeUtcMs) : catalogued(objectId, timeUtcMs));
    },
    prepare: async () => {
      if (fault.error !== undefined) throw fault.error;
      if (needsPlanetSeries(definition) || auto.later || sunPaths.length < sunOrbitIds.length || groupPlan.groups.size > layers.length) await loadPlanetSeries();
      checkPlanetSpan(ids, window);
      auto.settle((read) => planetRead(ids, window, read));
      if (groupPlan.groups.size > layers.length) layers.push(...planetRead(ids, window, () => groupPlan.layers(ids, window, startUtcMs, late)));
      if (sunPaths.length < sunOrbitIds.length) sunPaths.push(...planetRead(ids, window, () => sunOrbitIds.map((id) => plan.sunPath(id, startUtcMs))));
      if (fit !== undefined) planetRead(ids, window, () => fit.settle());
      await installData(data, ids, window, catalogue, bodySets.load());
      await figures.settle();
    },
  };
  checkOpeningLook(camera, definition, groupPlan.groups.keys(), skyFigures.figures.keys());
  return definition;
}

/** The viewer's own pictures (those of the packages passed to it); absent when no package brings any. */
function picturesEntry(data: readonly DataSource[]): Pick<ExperienceDefinition, "pictures"> {
  const pictures = mergePictures(data.map((source) => source.pictures));
  return Object.keys(pictures).length === 0 ? {} : { pictures };
}

/** The sky figures' drawable layers: placed now when no end names a star, else by `settle` (in `prepare`), once the star list has loaded (the viewer draws only after `prepare` resolves). */
function skyFigureLayers(plan: SkyFigurePlan): { readonly entry: Pick<ExperienceDefinition, "skyFigures">; readonly settle: () => Promise<void> } {
  const layers: SkyFigureLayer[] = plan.needsStars ? [] : [...plan.layers(new Map())];
  return {
    entry: plan.figures.size === 0 ? {} : { skyFigures: layers },
    settle: async () => { if (plan.needsStars && layers.length === 0) layers.push(...plan.layers(await starsOf())); },
  };
}

/** The star list's stars by Hipparcos number, for placing figures that name stars; the list unreadable throws `missing-data`. */
async function starsOf(): Promise<ReturnType<typeof starIdsOf>> {
  const loaded = await loadStarCatalogue();
  if (loaded === null) throw new SceneError("missing-data", "a sky figure names a star, but the engine's star list could not be read; check that the star file is served with the app, or place the figure by { raDeg, decDeg }");
  return starIdsOf(loaded);
}
