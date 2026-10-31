import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createOrbAstronomyAdapter } from "../core/astronomyAdapter";
import type { GlowLook } from "./bodyDraw";
import { viewUpFromSearch, viewUpVector, type ViewUp } from "./viewUp";
import { applyPacing } from "../core/pacing";
import { openClock } from "./openClock";
import type { ViewerPort, ViewerState } from "./viewerPort";
import { createSolarSystemScale, type ScalePolicy } from "../core/scalePolicy";
import type { CameraRequest } from "./CameraController";
import type { DebugReadout } from "./debugReadout";
import { bodySetsOf, cameraReachOf, catalogueOf, compositionOf, experienceWithGroups, groupsOf, initialObjectIdOf, mountedBodiesOf, pageTitleOf, scaleChoiceIdsOf, sceneCenterOf, sunCentredOf, trackedBodiesOf, visualOverridesOf, type DeveloperSection, type ExperienceDefinition } from "./experienceDefinition";
import { AstraeusShell } from "../shell/AstraeusShell";
import type { ExperienceCameraRequest } from "../shell/experience";
import { scaleChoicesFor, scalePolicyFor, startScaleFor, type ScaleId } from "../shell/scaleModel";
import { scaleFromSearch, timeFromSearch, viewFromSearch, shareViewLink, type StartView } from "./viewLink";
import { Collapsible } from "../shell/Collapsible";
import { PanelLoadBoundary } from "./PanelLoadBoundary";
import { BOOT_FADE_LIMITS, bootFadeSeconds, saveBootFadeSeconds } from "../shell/bootLoader";
import { LabelSettings, UnderTheHoodSettings, ViewLinkReadout, MoonsAndRingsSettings, SkyAndSunSettings, StoryPanelSettings } from "./developerPanels";
import { DEFAULT_ILLUMINATE_ALL } from "./lighting";
import { SettingButtons, SettingColor, SettingGroup, SettingSlider } from "./SettingControls";
import { DEFAULT_TIMELINE_GLOW, type TimelineGlowLook } from "../shell/timelineGlow";
import { DEFAULT_PHONE_LAYOUT, PHONE_LAYOUT_LIMITS, type PhoneLayoutSettings } from "../shell/phoneLayout";
import type { StoryMarkerSpec } from "./StoryMarkers";
import { featureMarkerSpecs, featureMinBodyPxFromSearch } from "./FeatureMarkers";
import type { GroupFill } from "./FrameRateSection";
import { FrameStats, type FrameSnapshot } from "./frameStats";
import { AstraeusScene, type SceneControls } from "./AstraeusScene";
import { HOVER_BRIGHTNESS_DEFAULT } from "./scenePicking";
import { createSceneResolver } from "./sceneLayout";
import { loadStarCatalogue } from "../assets/sky";
import { resolveSkySettings, withSkyObject, type StarStatus } from "./skyModel";
import { ORBIT_LOOK_LIMITS, resolveOrbitLook, type OrbitLook } from "../assets/orbitLook";
import { DEFAULT_BODY_SET_LOOK, type BodySetLook } from "./bodySet";
import { displaySwitchItems, orbitStart } from "./displaySwitches";
import type { RingLook } from "../assets/rings";
import { baseGlowOf, glowLookFromSearch, markerSettingsFromSearch } from "./bodyDraw";
import { brightnessFromSearch, milkyWayFromSearch, skyHiddenBySearch } from "./SkyView";

/** Frames-per-second readings kept for the graph: one per 250 ms poll, so about 15 seconds. */
const FPS_HISTORY = 60;

/** The sky settings in force: the experience's own, hidden when the address says `?sky=off`. */
function skySettingsOf(definition: ExperienceDefinition) {
  const settings = resolveSkySettings(definition.sky);
  const milkyWay = milkyWayFromSearch(window.location.search) ?? definition.displaySwitches?.milkyWay?.on ?? settings.milkyWay;
  const starBrightness = brightnessFromSearch(window.location.search, "stars") ?? settings.starBrightness;
  const milkyWayBrightness = brightnessFromSearch(window.location.search, "milkywaybrightness") ?? settings.milkyWayBrightness;
  return { ...settings, milkyWay, starBrightness, milkyWayBrightness, visible: settings.visible && !skyHiddenBySearch(window.location.search) };
}

/** The labels switched off at the start: objects that set `showLabel: false`, then `?labels=<id>:on|off,...` over them. */
export function hiddenLabelsFrom(search: string, objects: readonly { readonly id: string; readonly showLabel?: boolean }[]): Set<string> {
  const hidden = new Set(objects.filter((object) => object.showLabel === false).map((object) => object.id));
  for (const part of (new URLSearchParams(search).get("labels") ?? "").split(",")) {
    const [id, state] = part.split(":");
    if (id === undefined || id === "" || (state !== "on" && state !== "off")) continue;
    if (state === "off") hidden.add(id);
    else hidden.delete(id);
  }
  return hidden;
}

/** `?loop=on` or `?loop=off` overrides the experience's own looping setting. */
export function loopFromSearch(search: string, fallback: boolean): boolean {
  const value = new URLSearchParams(search).get("loop");
  return value === "on" ? true : value === "off" ? false : fallback;
}

/** The labels switch's starting state, if the story gave one. */
function labelStart(definition: ExperienceDefinition): boolean | undefined {
  return definition.displaySwitches?.labels?.on;
}

/** The orbit lines a story starts off: the ring and arc, and the moon orbits. */
function startOrbitControls(definition: ExperienceDefinition): Pick<SceneControls, "orbitLook" | "bodySetLook"> {
  const start = orbitStart(definition.displaySwitches?.orbitLines);
  return start === undefined ? {} : { orbitLook: start.look, bodySetLook: { ...DEFAULT_BODY_SET_LOOK, orbitsOn: false } };
}

function copyOfGlow(look: GlowLook | undefined): GlowLook | null {
  return look === undefined ? null : { ...look };
}

function orbitPathsOf(runtime: Runtime) {
  return runtime.composition?.paths ?? [];
}

/** The up direction at the start: `?up=` in the address, else the experience's own, else the equatorial pole. */
function startViewUp(definition: ExperienceDefinition): ViewUp {
  return viewUpFromSearch(window.location.search, definition.viewUp ?? "equatorial");
}

function storyStartOf(storySet: ExperienceDefinition["experience"]["storyPanels"]) {
  return { autoOpen: storySet?.autoOpen ?? false, pauseSeconds: storySet?.pauseSeconds ?? 0 };
}

function switcherOf(definition: ExperienceDefinition, runtime: Runtime, open?: (address: string) => void) {
  return definition.switcher === undefined ? undefined : { ...definition.switcher, currentTimeUtcMs: () => runtime.clock.snapshot().timeUtcMs, open };
}

/** Everything one mounted experience shares: clock, resolver, catalogue and the settings read from its definition and the address. */
function buildRuntime(definition: ExperienceDefinition) {
    const adapter = createOrbAstronomyAdapter();
    // A copied view link carries the time it was copied at.
    const clock = openClock(definition, timeFromSearch(window.location.search));
    // One resolver per mount: every position in the scene comes from it, whatever the scene centre.
    const resolver = createSceneResolver(adapter, catalogueOf(definition));
    return {
      clock,
      adapter,
      resolver,
      catalogue: catalogueOf(definition),
      bodies: mountedBodiesOf(definition),
      composition: compositionOf(definition),
      overrides: visualOverridesOf(definition),
      desktopTextures: definition.desktopTextures === true,
      sceneCenter: sceneCenterOf(definition),
      trackedBodies: trackedBodiesOf(definition),
      groups: groupsOf(definition),
      bodySets: bodySetsOf(definition),
      ...sunCentredOf(definition),
      cameraReach: cameraReachOf(definition),
      sky: skySettingsOf(definition),
      loopWindow: definition.experience.window,
      ...(definition.pacing === undefined ? {} : { pacing: definition.pacing }),
      up: viewUpVector(startViewUp(definition)),
    };
}

type Runtime = ReturnType<typeof buildRuntime>;

/** Whether the experience has anything the Display controls (markers, labels, timeline, phone layout) act on. */
function showsDisplayControls(definition: ExperienceDefinition, runtime: Runtime, orbitPathCount: number, storyMarkerCount: number): boolean {
  return orbitPathCount > 0 || runtime.trackedBodies.length > 0 || runtime.sky.visible || storyMarkerCount > 0 || (definition.experience.storyPanels?.panels.length ?? 0) > 0
    || runtime.bodies.some((id) => runtime.catalogue.get(id).visual.kind === "sphere");
}

/** The scene's live controls at mount: the address overrides the experience's own start values. */
function initialSceneControls(
  definition: ExperienceDefinition,
  runtime: Runtime,
  experience: ReturnType<typeof experienceWithGroups>,
  startScale: ScaleId,
  glowBase: ReturnType<typeof baseGlowOf>,
  storyMarkers: readonly StoryMarkerSpec[],
  suppliedPolicies: readonly ScalePolicy[],
): SceneControls {
  const search = window.location.search;
  const startView = viewFromSearch(search) ?? definition.startView;
  return {
    policy: scalePolicyFor(startScale, suppliedPolicies),
    cameraRequest: null,
    showAnchorLabels: labelStart(definition) === true && runtime.trackedBodies.length > 0,
    loop: loopFromSearch(search, definition.loop === true),
    ...(definition.pacing === undefined ? {} : { paceAuto: true }),
    up: viewUpVector(startViewUp(definition)),
    showMilkyWay: runtime.sky.milkyWay,
    bodyMarker: markerSettingsFromSearch(search),
    ...(glowBase === null ? {} : { glowLook: glowLookFromSearch(search, glowBase) }),
    starBrightness: runtime.sky.starBrightness,
    milkyWayBrightness: runtime.sky.milkyWayBrightness,
    illuminateAll: DEFAULT_ILLUMINATE_ALL,
    hiddenLabels: hiddenLabelsFrom(search, labelStart(definition) === undefined ? experience.objects : experience.objects.map(({ id }) => ({ id, showLabel: labelStart(definition) }))),
    ...startOrbitControls(definition),
    labelObjects: experience.objects,
    storyMarkers,
    featureMarkers: featureMarkerSpecs(definition.experience.bodyFeatures),
    featureMinBodyPx: featureMinBodyPxFromSearch(search),
    selectedObjectId: initialObjectIdOf(definition),
    frameStats: null,
    groupFills: [],
    ...(startView === undefined ? {} : { startView }),
  };
}

/**
 * `onOpenAddress`: the entry's way to open a switch's address in place; without it a switch navigates the page.
 * `writeTitle`: whether the page heading is set to the experience's name (default true); `mount` and `AstraeusScene` pass false so a host page keeps its own title.
 * `host`: the link a host page reads and sets the one clock through (time, speed) and hears its changes from; every change goes through the same handlers as the timeline's own controls.
 */
export function App({ definition, onOpenAddress, writeTitle = true, host }: { readonly definition: ExperienceDefinition; readonly onOpenAddress?: (address: string) => void; readonly writeTitle?: boolean; readonly host?: ViewerPort }) {
  // The page heading names the experience once it is open; app.html says only "Astraeus" until then.
  useEffect(() => {
    if (writeTitle) document.title = pageTitleOf(definition);
  }, [definition, writeTitle]);
  const runtime = useMemo(() => buildRuntime(definition), [definition]);
  const experienceRuntime = useMemo(
    () => ({ clock: runtime.clock, resolver: runtime.resolver, catalogue: runtime.catalogue }),
    [runtime],
  );
  // The choices offered, in the experience's order; the solar-system policy enlarges only the bodies the experience names.
  const scaleChoiceIds = useMemo(() => scaleChoiceIdsOf(definition), [definition]);
  const scaleChoices = useMemo(() => (scaleChoiceIds === undefined ? undefined : scaleChoicesFor(scaleChoiceIds)), [scaleChoiceIds]);
  const suppliedPolicies = useMemo<readonly ScalePolicy[]>(() => {
    const exaggeration: Record<string, number> = {};
    for (const [id, override] of runtime.overrides) if (override.exaggeration !== undefined) exaggeration[id] = override.exaggeration;
    return [createSolarSystemScale({ exaggeration, defaultExaggeration: 1 })];
  }, [runtime]);
  const linkedScale = scaleFromSearch(window.location.search);
  const startScale: ScaleId = startScaleFor(linkedScale, scaleChoiceIds);
  const experience = useMemo(() => experienceWithGroups(definition), [definition]);
  // The shell also lists the sky, citing its sources and saying whether the stars were fetched.
  const [starStatus, setStarStatus] = useState<StarStatus>({ kind: "loading" });
  useEffect(() => {
    let cancelled = false;
    void loadStarCatalogue().then((loaded) => {
      if (!cancelled) setStarStatus(loaded === null ? { kind: "absent" } : { kind: "loaded", count: loaded.stars.length });
    });
    return () => { cancelled = true; };
  }, []);
  const shellExperience = useMemo(() => withSkyObject(experience, runtime.sky.visible, starStatus), [experience, runtime.sky.visible, starStatus]);
  const metricsFor = useMemo(() => definition.createMetrics(experienceRuntime), [definition, experienceRuntime]);
  const glowBase = useMemo(() => baseGlowOf(runtime.bodies.map((id) => runtime.catalogue.get(id))), [runtime]);
  const storySet = definition.experience.storyPanels;
  const storyMarkerSpecs = useMemo<readonly StoryMarkerSpec[]>(
    () => (storySet?.panels ?? []).flatMap((panel) => (panel.objectId === undefined ? [] : [{ panelId: panel.id, objectId: panel.objectId, title: panel.title, timeUtcMs: panel.timeUtcMs }])),
    [storySet],
  );
  const controls = useRef<SceneControls>(initialSceneControls(definition, runtime, experience, startScale, glowBase, storyMarkerSpecs, suppliedPolicies));
  const readout = useRef<DebugReadout | null>(null);
  const [clockSnapshot, setClockSnapshot] = useState(() => runtime.clock.snapshot());
  const [scale, setScale] = useState<ScaleId>(startScale);
  const [developerMode, setDeveloperMode] = useState(false);
  const [timelineGlow, setTimelineGlow] = useState<TimelineGlowLook>(DEFAULT_TIMELINE_GLOW);
  const [phoneLayout, setPhoneLayout] = useState<PhoneLayoutSettings>(DEFAULT_PHONE_LAYOUT);
  const [anchorLabels, setAnchorLabels] = useState(controls.current.showAnchorLabels);
  const [glowShown, setGlowShown] = useState<GlowLook | null>(copyOfGlow(controls.current.glowLook));
  const orbitPaths = orbitPathsOf(runtime);
  const orbitDefault = useMemo(() => resolveOrbitLook(orbitPaths[0]?.look), [orbitPaths]);
  const [orbitShown, setOrbitShown] = useState<OrbitLook>({ ...orbitDefault, ...controls.current.orbitLook });
  const setOrbit = (change: Partial<OrbitLook>) => {
    controls.current.orbitLook = { ...controls.current.orbitLook, ...change };
    setOrbitShown({ ...orbitDefault, ...controls.current.orbitLook });
  };
  const resetOrbit = () => { delete controls.current.orbitLook; setOrbitShown(orbitDefault); };
  const bodySets = runtime.bodySets;
  const [setLook, setSetLook] = useState<BodySetLook>(controls.current.bodySetLook ?? DEFAULT_BODY_SET_LOOK);
  const changeSetLook = (change: Partial<BodySetLook>) => {
    const next = { ...(controls.current.bodySetLook ?? DEFAULT_BODY_SET_LOOK), ...change };
    controls.current.bodySetLook = next;
    setSetLook(next);
  };
  const highlightFamily = (family: string | null) => changeSetLook({ highlightFamily: family });
  const ringSystems = useMemo(() => runtime.bodies.flatMap((id) => { const rings = runtime.overrides.get(id)?.rings ?? runtime.catalogue.get(id).visual.rings; return rings === undefined ? [] : [rings]; }), [runtime]);
  const [ringLook, setRingLook] = useState<RingLook>({});
  const changeRing = (band: string, change: { color?: string; opacity?: number }) => {
    const next = { ...ringLook, [band]: { ...ringLook[band], ...change } };
    controls.current.ringLook = next;
    setRingLook(next);
  };
  const labelToggles = useMemo(() => experience.objects.filter((object) => object.showLabel !== undefined), [experience]);
  const [hiddenLabels, setHiddenLabels] = useState<ReadonlySet<string>>(() => new Set(controls.current.hiddenLabels));
  const [loopOn, setLoopOn] = useState(controls.current.loop === true);
  const [upChoice, setUpChoice] = useState<ViewUp>(startViewUp(definition));
  const [illuminateAll, setIlluminateAll] = useState(controls.current.illuminateAll);
  const [milkyWayOn, setMilkyWayOn] = useState(runtime.sky.milkyWay);
  const [hoverBrightness, setHoverBrightness] = useState(HOVER_BRIGHTNESS_DEFAULT);
  const [starBrightness, setStarBrightness] = useState(runtime.sky.starBrightness);
  const [milkyWayBrightness, setMilkyWayBrightness] = useState(runtime.sky.milkyWayBrightness);
  const [loadFade, setLoadFade] = useState(() => bootFadeSeconds());
  const [markerPx, setMarkerPx] = useState(() => controls.current.bodyMarker.minSpherePx);
  const [storyAutoOpen, setStoryAutoOpen] = useState(storyStartOf(storySet).autoOpen);
  const [storyPauseSeconds, setStoryPauseSeconds] = useState(storyStartOf(storySet).pauseSeconds);
  const [panelRequest, setPanelRequest] = useState<{ readonly id: string; readonly serial: number } | null>(null);
  const [pickRequest, setPickRequest] = useState<{ readonly id: string; readonly serial: number } | null>(null);
  const [featureRequest, setFeatureRequest] = useState<{ readonly key: string; readonly serial: number } | null>(null);
  const [hud, setHud] = useState<DebugReadout | null>(null);
  const [frames, setFrames] = useState<FrameSnapshot | null>(null);
  const [fpsHistory, setFpsHistory] = useState<readonly number[]>([]);
  const [viewNow, setViewNow] = useState<StartView | null>(null);
  const [viewLink, setViewLink] = useState<{ readonly url: string; readonly copied: boolean } | null>(null);
  const [fills, setFills] = useState<readonly GroupFill[]>([]);
  const updateCameraRequest = useCallback((request: ExperienceCameraRequest) => {
    controls.current.cameraRequest = request as CameraRequest;
  }, []);
  const requestPanel = useCallback((id: string) => setPanelRequest((previous) => ({ id, serial: (previous?.serial ?? 0) + 1 })), []);
  const requestPick = useCallback((id: string) => setPickRequest((previous) => ({ id, serial: (previous?.serial ?? 0) + 1 })), []);
  const requestFeature = useCallback((key: string) => setFeatureRequest((previous) => ({ key, serial: (previous?.serial ?? 0) + 1 })), []);
  const markOpenFeature = useCallback((key: string | null) => { controls.current.openFeatureKey = key; }, []);
  const markOpenPanel = useCallback((id: string | null) => { controls.current.openStoryPanelId = id; }, []);
  const setPlaying = useCallback((playing: boolean) => {
    if (playing) runtime.clock.play();
    else runtime.clock.pause();
    setClockSnapshot(runtime.clock.snapshot());
  }, [runtime]);
  controls.current.onStoryMarker = requestPanel;
  controls.current.onFeatureMarker = requestFeature;
  controls.current.onPickObject = requestPick;
  const updateSelectedObject = useCallback((objectId: string) => {
    controls.current.selectedObjectId = objectId;
  }, []);
  const updateScale = useCallback((id: ScaleId) => {
    controls.current.policy = scalePolicyFor(id, suppliedPolicies);
    setScale(id);
  }, [suppliedPolicies]);

  const stateNow = useCallback((): ViewerState => ({ ...runtime.clock.snapshot(), ...(runtime.pacing === undefined ? {} : { auto: controls.current.paceAuto === true }) }), [runtime]);
  useEffect(() => {
    const id = window.setInterval(() => {
      // The readout wraps with the scene, so the shown time never rests past the end while looping.
      if (controls.current.loop === true) runtime.clock.wrapWithin(runtime.loopWindow);
      if (controls.current.paceAuto === true && runtime.pacing !== undefined) applyPacing(runtime.clock, runtime.pacing);
      setClockSnapshot(runtime.clock.snapshot());
      host?.publish(stateNow(), "playback");
    }, 100);
    return () => window.clearInterval(id);
  }, [runtime, host, stateNow]);
  // The host reaches the one clock through the same seek and rate handlers a visitor's timeline uses.
  const seekTo = useCallback((timeUtcMs: number) => {
    runtime.clock.seek(timeUtcMs);
    setClockSnapshot(runtime.clock.snapshot());
  }, [runtime]);
  // A speed picked by the visitor or the host takes over from pacing; "auto" gives the rate back to it.
  const [paceAuto, setPaceAuto] = useState(controls.current.paceAuto === true);
  const changeRate = useCallback((rate: number | "auto") => {
    if (rate === "auto") {
      if (runtime.pacing !== undefined) applyPacing(runtime.clock, runtime.pacing);
    } else runtime.clock.setRate(rate);
    controls.current.paceAuto = rate === "auto";
    setPaceAuto(rate === "auto");
    setClockSnapshot(runtime.clock.snapshot());
  }, [runtime]);
  useEffect(() => {
    if (host === undefined) return undefined;
    host.attach({ window: runtime.loopWindow, rates: definition.experience.rates, paced: runtime.pacing !== undefined, read: stateNow, seek: seekTo, setRate: changeRate });
    return () => host.detach();
  }, [host, runtime, definition, seekTo, changeRate]);

  useEffect(() => {
    if (!developerMode) return undefined;
    const stats = new FrameStats();
    controls.current.frameStats = stats;
    const id = window.setInterval(() => {
      setHud(readout.current);
      const snapshot = stats.snapshot();
      setFrames(snapshot);
      if (snapshot.frames > 0) setFpsHistory((history) => [...history.slice(-(FPS_HISTORY - 1)), snapshot.fps]);
      setFills(controls.current.groupFills.map((fill) => ({ ...fill })));
      setViewNow(controls.current.viewReadout === undefined ? null : { ...controls.current.viewReadout });
    }, 250);
    return () => {
      window.clearInterval(id);
      controls.current.frameStats = null;
      setFrames(null);
      setFpsHistory([]);
    };
  }, [developerMode, runtime]);

  /** Writes the current view, scale, up direction and time into the address, then copies the full link (or shows it to copy by hand). */
  const copyViewLink = async () => {
    const view = controls.current.viewReadout;
    if (view === undefined) return;
    setViewLink(await shareViewLink({ view, scaleId: scale, up: upChoice, timeUtcMs: runtime.clock.snapshot().timeUtcMs }));
  };
  const displaySwitches = displaySwitchItems({
    settings: definition.displaySwitches,
    orbit: { present: orbitPaths.length > 0, look: orbitShown, set: setOrbit },
    moons: { present: bodySets.length > 0, look: setLook, set: changeSetLook },
    sky: { present: runtime.sky.visible, on: milkyWayOn, set: (on) => { controls.current.showMilkyWay = on; setMilkyWayOn(on); } },
    labels: {
      objectIds: experience.objects.map((object) => object.id), hidden: hiddenLabels,
      setHidden: (hidden) => { controls.current.hiddenLabels = new Set(hidden); setHiddenLabels(new Set(hidden)); },
      anchorsPresent: runtime.trackedBodies.length > 0, anchors: anchorLabels, setAnchors: (on) => { controls.current.showAnchorLabels = on; setAnchorLabels(on); },
    },
  });
  const sections = definition.developerSections ?? [];
  const renderSection = (section: DeveloperSection) => (
    <section key={section.id} className={section.id === "clock" ? "hud-section hud-section-clock" : "hud-section"} aria-labelledby={`developer-${section.id}-heading`}>
      <h3 id={`developer-${section.id}-heading`}>{section.heading}</h3>
      {section.render(experienceRuntime)}
    </section>
  );
  const hasStoryPanels = (storySet?.panels.length ?? 0) > 0;
  const showDisplay = showsDisplayControls(definition, runtime, orbitPaths.length, storyMarkerSpecs.length);
  // Orbit-line sliders: the first four stay in view, the rest sit in a nested "Fine-tune" fold (T-090).
  const orbitSliders = {
    main: [
      ["baseOpacity", "Ring opacity", "orbit-base-opacity", 0.01],
      ["endFade", "End fade (of ring)", "orbit-end-fade", 0.01],
      ["arcFraction", "Arc length (of orbit)", "orbit-arc-fraction", 0.01],
      ["arcPeak", "Arc opacity", "orbit-arc-peak", 0.01],
    ],
    fine: [
      ["arcExponent", "Fade curve (power)", "orbit-arc-exponent", 0.1],
      ["arcSegments", "Arc segments", "orbit-arc-segments", 1],
      ["arcWidth", "Arc width (of orbit)", "orbit-arc-width", 0.0001],
      ["arcMaxWidthPx", "Arc max width (px)", "orbit-arc-max-width", 0.5],
      ["zoomBoostBase", "Zoom boost (ring)", "orbit-zoom-boost-base", 0.01],
      ["zoomBoostArc", "Zoom boost (arc)", "orbit-zoom-boost-arc", 0.01],
    ],
  } as const;
  const orbitSlider = ([key, label, testId, step]: readonly [Exclude<keyof typeof orbitShown, "baseOn" | "endFadeOn" | "arcOn" | "zoomOn">, string, string, number]) => (
    <SettingSlider key={key} label={label} ariaLabel={label} testId={`${testId}-value`} display={orbitShown[key].toFixed(step === 1 ? 0 : step === 0.5 ? 1 : step < 0.01 ? 4 : 2)} min={ORBIT_LOOK_LIMITS[key].min} max={ORBIT_LOOK_LIMITS[key].max} step={step} value={orbitShown[key]}
      onChange={(value) => setOrbit({ [key]: value })} />
  );
  // The panel's folds, in order; the first one present opens by default and the rest start closed (T-090).
  const groups: ReadonlyArray<{ readonly id: string; readonly title: string; readonly className?: string; readonly body: ReactNode } | null> = [
    sections.length === 0 ? null : {
      id: "demo", title: "This demo", className: "dev-group-cards",
      body: (
        <>
          {sections.filter((section) => section.placement === "before-scene").map(renderSection)}
          {sections.filter((section) => section.placement === "after-scene").map(renderSection)}
        </>
      ),
    },
    !showDisplay ? null : {
      id: "camera", title: "Camera and view",
      body: (
        <>
        <SettingButtons label="Up direction">
          {([["ecliptic", "Planets' plane (ecliptic)"], ["equatorial", "Earth's pole (equatorial)"]] as const).map(([choice, text]) => (
            <button key={choice} aria-pressed={upChoice === choice} onClick={() => { controls.current.up = viewUpVector(choice); setUpChoice(choice); }}>{text}</button>
          ))}
        </SettingButtons>
        <SettingSlider label="Marker threshold (px)" ariaLabel="Body marker threshold" testId="body-marker-value" display={markerPx.toFixed(1)} min={0} max={20} step={0.5} value={markerPx}
          onChange={(value) => { controls.current.bodyMarker = { ...controls.current.bodyMarker, minSpherePx: value }; setMarkerPx(value); }} />
        <SettingSlider label="Loading fade (s, next load)" ariaLabel="Loading fade" testId="load-fade-value" display={loadFade.toFixed(1)} min={BOOT_FADE_LIMITS.min} max={BOOT_FADE_LIMITS.max} step={0.1} value={loadFade}
          onChange={(value) => { saveBootFadeSeconds(value); setLoadFade(value); }} />
        <div className="view-link" role="group" aria-label="Camera view">
          <SettingButtons label="Camera view">
            <button onClick={() => void copyViewLink()}>Copy view link</button>
          </SettingButtons>
          <ViewLinkReadout viewNow={viewNow} viewLink={viewLink} scale={scale} upChoice={upChoice} />
        </div>
        <SettingButtons>
          <button aria-pressed={loopOn} onClick={() => { controls.current.loop = !loopOn; setLoopOn(!loopOn); }}>Loop playback</button>
        </SettingButtons>
      
        </>
      ),
    },
    !showDisplay ? null : {
      id: "timeline", title: "Timeline and stories",
      body: (
        <>
          <SettingGroup id="timeline-glow" title="Timeline glow">
            <SettingColor label="Glow colour" ariaLabel="Timeline glow colour" testId="glow-color-value" value={timelineGlow.color} onChange={(color) => setTimelineGlow({ ...timelineGlow, color })} />
            <SettingColor label="Played colour" ariaLabel="Timeline played colour" testId="glow-played-value" value={timelineGlow.playedColor} onChange={(playedColor) => setTimelineGlow({ ...timelineGlow, playedColor })} />
            {([
              ["minBrightness", "Quiet brightness", "Timeline quiet brightness", "glow-min-value", 0, 1, 0.01],
              ["steadyBrightness", "Steady brightness (no rate)", "Timeline steady brightness", "glow-steady-value", 0, 1, 0.01],
              ["curve", "Curve (rate to brightness)", "Timeline glow curve", "glow-curve-value", 0.2, 3, 0.05],
              ["playedFloor", "Played brightness floor", "Timeline played floor", "glow-floor-value", 0, 1, 0.01],
              ["thicknessPx", "Thickness (px)", "Timeline glow thickness", "glow-thickness-value", 2, 14, 0.5],
              ["haloPx", "Halo blur (px)", "Timeline glow halo", "glow-halo-value", 0, 20, 0.5],
            ] as const).map(([key, label, ariaLabel, testId, min, max, step]) => (
              <SettingSlider key={key} label={label} ariaLabel={ariaLabel} testId={testId} display={timelineGlow[key].toFixed(step < 0.1 ? 2 : step < 1 ? 1 : 0)} min={min} max={max} step={step} value={timelineGlow[key]}
                onChange={(value) => setTimelineGlow({ ...timelineGlow, [key]: value })} />
            ))}
            <SettingButtons>
              <button onClick={() => setTimelineGlow(DEFAULT_TIMELINE_GLOW)}>Reset glow</button>
            </SettingButtons>
          </SettingGroup>
          {hasStoryPanels && <StoryPanelSettings storyAutoOpen={storyAutoOpen} setStoryAutoOpen={setStoryAutoOpen} storyPauseSeconds={storyPauseSeconds} setStoryPauseSeconds={setStoryPauseSeconds} />}
        </>
      ),
    },
    orbitPaths.length === 0 ? null : {
      id: "orbit-lines", title: "Orbit lines",
      body: (
        <>
          <SettingButtons>
            <button aria-pressed={orbitShown.baseOn} onClick={() => setOrbit({ baseOn: !orbitShown.baseOn })}>Orbit ring</button>
            <button aria-pressed={orbitShown.endFadeOn} onClick={() => setOrbit({ endFadeOn: !orbitShown.endFadeOn })}>Fade ring ends</button>
            <button aria-pressed={orbitShown.arcOn} onClick={() => setOrbit({ arcOn: !orbitShown.arcOn })}>Trailing arc</button>
            <button aria-pressed={orbitShown.zoomOn} onClick={() => setOrbit({ zoomOn: !orbitShown.zoomOn })}>Brighten when zoomed out</button>
          </SettingButtons>
          {orbitSliders.main.map(orbitSlider)}
          <Collapsible id="orbit-fine-tune" title="Fine-tune" level={4} nested>
            {orbitSliders.fine.map(orbitSlider)}
          </Collapsible>
          <SettingButtons>
            <button onClick={resetOrbit}>Reset orbit lines</button>
          </SettingButtons>
        </>
      ),
    },
    bodySets.length === 0 && ringSystems.length === 0 ? null : {
      id: "moons-rings", title: "Moons and rings",
      body: (
        <MoonsAndRingsSettings bodySets={bodySets} ringSystems={ringSystems} setLook={setLook} changeSetLook={changeSetLook} ringLook={ringLook} changeRing={changeRing} controls={controls} setSetLook={setSetLook} setRingLook={setRingLook} />
      ),
    },
    !(runtime.sky.visible || glowShown !== null) ? null : {
      id: "sky-sun", title: "Sky and Sun",
      body: (
        <SkyAndSunSettings illuminateAll={illuminateAll} setIlluminateAll={setIlluminateAll} visible={runtime.sky.visible} glowShown={glowShown} setGlowShown={setGlowShown} controls={controls} milkyWayOn={milkyWayOn} setMilkyWayOn={setMilkyWayOn} starBrightness={starBrightness} setStarBrightness={setStarBrightness} milkyWayBrightness={milkyWayBrightness} setMilkyWayBrightness={setMilkyWayBrightness} />
      ),
    },
    {
      id: "labels", title: "Labels",
      body: (
        <LabelSettings controls={controls} hoverBrightness={hoverBrightness} setHoverBrightness={setHoverBrightness} labelToggles={labelToggles} trackedCount={runtime.trackedBodies.length} anchorLabels={anchorLabels} setAnchorLabels={setAnchorLabels} hiddenLabels={hiddenLabels} setHiddenLabels={setHiddenLabels} />
      ),
    },
    !showDisplay ? null : {
      id: "phone-layout", title: "Phone layout",
      body: (
        <>
        {([
          ["animationMs", "Drawer animation (ms)", "Phone drawer animation", "phone-animation-value"],
          ["controlsDrawerMaxPercent", "Top drawer height (% of screen)", "Phone top drawer height", "phone-controls-height-value"],
          ["timelineDrawerMaxPercent", "Timeline drawer height (% of screen)", "Phone timeline drawer height", "phone-timeline-height-value"],
          ["sheetMaxPercent", "Sheet height (% of screen)", "Phone sheet height", "phone-sheet-height-value"],
          ["swipeThresholdPx", "Swipe distance (px)", "Phone swipe distance", "phone-swipe-value"],
        ] as const).map(([key, label, ariaLabel, testId]) => (
          <SettingSlider key={key} label={label} ariaLabel={ariaLabel} testId={testId} display={String(phoneLayout[key])} min={PHONE_LAYOUT_LIMITS[key].min} max={PHONE_LAYOUT_LIMITS[key].max} step={PHONE_LAYOUT_LIMITS[key].step} value={phoneLayout[key]}
            onChange={(value) => setPhoneLayout({ ...phoneLayout, [key]: value })} />
        ))}
        <SettingButtons>
          <button onClick={() => setPhoneLayout(DEFAULT_PHONE_LAYOUT)}>Reset phone layout</button>
        </SettingButtons>
      
        </>
      ),
    },
    {
      id: "under-the-hood", title: "Under the hood",
      body: (
        <UnderTheHoodSettings hud={hud} frames={frames} fills={fills} fpsHistory={fpsHistory} alternates={showDisplay ? definition.alternates : undefined} />
      ),
    },
  ];
  const presentGroups = groups.filter((group) => group !== null);
  const developerTools = (
    <PanelLoadBoundary>
    <Suspense fallback={<p className="developer-loading" role="status">Loading developer tools...</p>}>
    <div className="hud">
      <header className="developer-heading">
        <h2>Developer tools</h2>
        <p>Live readouts, controls and diagnostics for this scene.</p>
      </header>
      {presentGroups.map((group, index) => (
        <Collapsible key={group.id} id={group.id} title={group.title} defaultOpen={index === 0} className={`dev-group${group.className === undefined ? "" : ` ${group.className}`}`}>
          {group.body}
        </Collapsible>
      ))}
    </div>
    </Suspense>
    </PanelLoadBoundary>
  );

  return (
    <AstraeusShell
      experience={shellExperience}
      snapshot={clockSnapshot}
      paceAuto={runtime.pacing === undefined ? undefined : paceAuto}
      developerMode={developerMode}
      onDeveloperModeChange={setDeveloperMode}
      onTogglePlayback={() => {
        if (runtime.clock.playing) runtime.clock.pause();
        else runtime.clock.play();
        setClockSnapshot(runtime.clock.snapshot());
        host?.publish(stateNow(), "visitor");
      }}
      onRateChange={(rate) => {
        changeRate(rate);
        host?.publish(stateNow(), "visitor");
      }}
      onSeek={(timeUtcMs) => {
        seekTo(timeUtcMs);
        host?.publish(stateNow(), "visitor");
      }}
      onCameraRequest={updateCameraRequest}
      onSelectionChange={updateSelectedObject}
      scaleId={scale}
      onScaleChange={updateScale}
      scaleChoices={scaleChoices}
      switcher={switcherOf(definition, runtime, onOpenAddress)}
      displaySwitches={displaySwitches}
      metricsFor={metricsFor}
      developerTools={developerTools}
      storyPanelSettings={{ autoOpen: storyAutoOpen, pauseSeconds: storyPauseSeconds }}
      timelineGlow={timelineGlow}
      phoneLayout={phoneLayout}
      highlightedFamily={setLook.highlightFamily}
      onHighlightFamily={highlightFamily}
      onSetPlaying={setPlaying}
      panelRequest={panelRequest}
      onOpenPanelChange={markOpenPanel}
      featureRequest={featureRequest}
      pickRequest={pickRequest}
      onOpenFeatureChange={markOpenFeature}
    >
      <div className="canvas-host">
        <AstraeusScene runtime={runtime} controls={controls.current} readout={readout} scaleId={scale} />
      </div>
    </AstraeusShell>
  );
}
