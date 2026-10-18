import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createOrbAstronomyAdapter } from "../core/astronomyAdapter";
import type { GlowLook } from "./bodyDraw";
import { viewUpFromSearch, viewUpVector, type ViewUp } from "./viewUp";
import { SimulationClock } from "../core/clock";
import { createSolarSystemScale, type ScalePolicy } from "../core/scalePolicy";
import type { CameraRequest } from "./CameraController";
import { DebugOverlay, type DebugReadout } from "./DebugOverlay";
import { cameraReachOf, catalogueOf, compositionOf, experienceWithGroups, groupsOf, initialObjectIdOf, mountedBodiesOf, pageTitleOf, scaleChoiceIdsOf, sceneCenterOf, sunCentredOf, trackedBodiesOf, visualOverridesOf, type DeveloperSection, type ExperienceDefinition } from "./experienceDefinition";
import { AstraeusShell } from "../shell/AstraeusShell";
import type { ExperienceCameraRequest } from "../shell/experience";
import { scaleChoicesFor, scalePolicyFor, startScaleFor, type ScaleId } from "../shell/scaleModel";
import { formatView, scaleFromSearch, timeFromSearch, viewFromSearch, viewLinkSearch, type StartView } from "./viewLink";
import { Collapsible } from "../shell/Collapsible";
import { BOOT_FADE_LIMITS, bootFadeSeconds, saveBootFadeSeconds } from "../shell/bootLoader";
import { SettingButtons, SettingColor, SettingGroup, SettingSlider } from "./SettingControls";
import { DEFAULT_TIMELINE_GLOW, type TimelineGlowLook } from "../shell/timelineGlow";
import { MAX_PANEL_PAUSE_SECONDS } from "../shell/storyPanels";
import { DEFAULT_PHONE_LAYOUT, PHONE_LAYOUT_LIMITS, type PhoneLayoutSettings } from "../shell/phoneLayout";
import type { StoryMarkerSpec } from "./StoryMarkers";
import { FrameRateSection, type GroupFill } from "./FrameRateSection";
import { FrameStats, type FrameSnapshot } from "./frameStats";
import { AstraeusScene, type SceneControls } from "./AstraeusScene";
import { createSceneResolver } from "./sceneLayout";
import { loadStarCatalogue } from "../assets/sky";
import { resolveSkySettings, withSkyObject, type StarStatus } from "./skyModel";
import { ORBIT_LOOK_LIMITS, resolveOrbitLook, type OrbitLook } from "../assets/orbitLook";
import { baseGlowOf, GLOW_LIMITS, glowLookFromSearch, markerSettingsFromSearch } from "./bodyDraw";
import { brightnessFromSearch, milkyWayFromSearch, skyHiddenBySearch } from "./SkyView";

/** Frames-per-second readings kept for the graph: one per 250 ms poll, so about 15 seconds. */
const FPS_HISTORY = 60;

/** The sky settings in force: the experience's own, hidden when the address says `?sky=off`. */
function skySettingsOf(definition: ExperienceDefinition) {
  const settings = resolveSkySettings(definition.sky);
  const milkyWay = milkyWayFromSearch(window.location.search) ?? settings.milkyWay;
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

export function App({ definition }: { readonly definition: ExperienceDefinition }) {
  // The page heading names the experience once it is open; app.html says only "Astraeus" until then.
  useEffect(() => {
    document.title = pageTitleOf(definition);
  }, [definition]);
  const runtime = useMemo(() => {
    const adapter = createOrbAstronomyAdapter();
    const clock = new SimulationClock(definition.clock.startUtcMs);
    clock.setRate(definition.clock.rate);
    // A copied view link carries the time it was copied at.
    const linkedTime = timeFromSearch(window.location.search);
    if (linkedTime !== undefined) clock.seek(linkedTime);
    clock.play();
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
      sceneCenter: sceneCenterOf(definition),
      trackedBodies: trackedBodiesOf(definition),
      groups: groupsOf(definition),
      ...sunCentredOf(definition),
      cameraReach: cameraReachOf(definition),
      sky: skySettingsOf(definition),
      loopWindow: definition.experience.window,
      up: viewUpVector(viewUpFromSearch(window.location.search, definition.viewUp ?? "equatorial")),
    };
  }, [definition]);
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
  const controls = useRef<SceneControls>({
    policy: scalePolicyFor(startScale, suppliedPolicies),
    cameraRequest: null,
    showAnchorLabels: false,
    loop: loopFromSearch(window.location.search, definition.loop === true),
    up: viewUpVector(viewUpFromSearch(window.location.search, definition.viewUp ?? "equatorial")),
    showMilkyWay: runtime.sky.milkyWay,
    bodyMarker: markerSettingsFromSearch(window.location.search),
    ...(glowBase === null ? {} : { glowLook: glowLookFromSearch(window.location.search, glowBase) }),
    starBrightness: runtime.sky.starBrightness,
    milkyWayBrightness: runtime.sky.milkyWayBrightness,
    hiddenLabels: hiddenLabelsFrom(window.location.search, experience.objects),
    labelObjects: experience.objects,
    storyMarkers: storyMarkerSpecs,
    selectedObjectId: initialObjectIdOf(definition),
    frameStats: null,
    groupFills: [],
    ...((viewFromSearch(window.location.search) ?? definition.startView) === undefined ? {} : { startView: (viewFromSearch(window.location.search) ?? definition.startView)! }),
  });
  const readout = useRef<DebugReadout | null>(null);
  const [clockSnapshot, setClockSnapshot] = useState(() => runtime.clock.snapshot());
  const [scale, setScale] = useState<ScaleId>(startScale);
  const [developerMode, setDeveloperMode] = useState(false);
  const [timelineGlow, setTimelineGlow] = useState<TimelineGlowLook>(DEFAULT_TIMELINE_GLOW);
  const [phoneLayout, setPhoneLayout] = useState<PhoneLayoutSettings>(DEFAULT_PHONE_LAYOUT);
  const [anchorLabels, setAnchorLabels] = useState(false);
  const [glowShown, setGlowShown] = useState<GlowLook | null>(controls.current.glowLook === undefined ? null : { ...controls.current.glowLook });
  const orbitPaths = runtime.composition?.paths ?? [];
  const orbitDefault = useMemo(() => resolveOrbitLook(orbitPaths[0]?.look), [orbitPaths]);
  const [orbitShown, setOrbitShown] = useState<OrbitLook>(orbitDefault);
  const setOrbit = (change: Partial<OrbitLook>) => {
    controls.current.orbitLook = { ...controls.current.orbitLook, ...change };
    setOrbitShown({ ...orbitDefault, ...controls.current.orbitLook });
  };
  const resetOrbit = () => { delete controls.current.orbitLook; setOrbitShown(orbitDefault); };
  const labelToggles = useMemo(() => experience.objects.filter((object) => object.showLabel !== undefined), [experience]);
  const [hiddenLabels, setHiddenLabels] = useState<ReadonlySet<string>>(() => new Set(controls.current.hiddenLabels));
  const [loopOn, setLoopOn] = useState(controls.current.loop === true);
  const [upChoice, setUpChoice] = useState<ViewUp>(viewUpFromSearch(window.location.search, definition.viewUp ?? "equatorial"));
  const [milkyWayOn, setMilkyWayOn] = useState(runtime.sky.milkyWay);
  const [starBrightness, setStarBrightness] = useState(runtime.sky.starBrightness);
  const [milkyWayBrightness, setMilkyWayBrightness] = useState(runtime.sky.milkyWayBrightness);
  const [loadFade, setLoadFade] = useState(() => bootFadeSeconds());
  const [markerPx, setMarkerPx] = useState(() => controls.current.bodyMarker.minSpherePx);
  const [storyAutoOpen, setStoryAutoOpen] = useState(storySet?.autoOpen ?? false);
  const [storyPauseSeconds, setStoryPauseSeconds] = useState(storySet?.pauseSeconds ?? 0);
  const [panelRequest, setPanelRequest] = useState<{ readonly id: string; readonly serial: number } | null>(null);
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
  const markOpenPanel = useCallback((id: string | null) => { controls.current.openStoryPanelId = id; }, []);
  const setPlaying = useCallback((playing: boolean) => {
    if (playing) runtime.clock.play();
    else runtime.clock.pause();
    setClockSnapshot(runtime.clock.snapshot());
  }, [runtime]);
  controls.current.onStoryMarker = requestPanel;
  const updateSelectedObject = useCallback((objectId: string) => {
    controls.current.selectedObjectId = objectId;
  }, []);
  const updateScale = useCallback((id: ScaleId) => {
    controls.current.policy = scalePolicyFor(id, suppliedPolicies);
    setScale(id);
  }, [suppliedPolicies]);

  useEffect(() => {
    const id = window.setInterval(() => {
      // The readout wraps with the scene, so the shown time never rests past the end while looping.
      if (controls.current.loop === true) runtime.clock.wrapWithin(runtime.loopWindow);
      setClockSnapshot(runtime.clock.snapshot());
    }, 100);
    return () => window.clearInterval(id);
  }, [runtime]);

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
    const search = viewLinkSearch(window.location.search, { view, scaleId: scale, up: upChoice, timeUtcMs: runtime.clock.snapshot().timeUtcMs });
    try { window.history.replaceState(null, "", `${window.location.pathname}${search}${window.location.hash}`); } catch { /* the link below still works */ }
    const url = `${window.location.origin}${window.location.pathname}${search}`;
    let copied = false;
    try { await navigator.clipboard.writeText(url); copied = true; } catch { copied = false; }
    setViewLink({ url, copied });
  };
  const sections = definition.developerSections ?? [];
  const renderSection = (section: DeveloperSection) => (
    <section key={section.id} className={section.id === "clock" ? "hud-section hud-section-clock" : "hud-section"} aria-labelledby={`developer-${section.id}-heading`}>
      <h3 id={`developer-${section.id}-heading`}>{section.heading}</h3>
      {section.render(experienceRuntime)}
    </section>
  );
  const showDisplay = orbitPaths.length > 0 || runtime.trackedBodies.length > 0 || runtime.sky.visible || storyMarkerSpecs.length > 0 || (storySet?.panels.length ?? 0) > 0 || runtime.bodies.some((id) => runtime.catalogue.get(id).visual.kind === "sphere");
  const hasAlternates = (definition.alternates ?? []).length > 0;
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
          {viewNow !== null && <p className="view-link-values" data-testid="view-values">{`View: ${formatView(viewNow).replace(/%2C/g, ",")} (focus, azimuth °, elevation °, distance) · scale ${scale} · up ${upChoice}`}</p>}
          {viewLink !== null && (
            <p className="view-link-field">
              <input readOnly aria-label="View link" data-testid="view-link" value={viewLink.url} onFocus={(event) => event.currentTarget.select()} />
              <span>{viewLink.copied ? "Copied to the clipboard." : "Clipboard unavailable: select the link above and copy it."}</span>
            </p>
          )}
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
          {storySet !== undefined && storySet.panels.length > 0 && (
            <SettingGroup id="story-panels" title="Story panels">
              <SettingButtons>
                <button aria-pressed={storyAutoOpen} onClick={() => setStoryAutoOpen(!storyAutoOpen)}>Open panels automatically</button>
              </SettingButtons>
              <SettingSlider label="Pause when a panel opens (s)" ariaLabel="Story panel pause" testId="story-pause-value" display={storyPauseSeconds === 0 ? "off" : storyPauseSeconds.toFixed(1)} min={0} max={MAX_PANEL_PAUSE_SECONDS} step={0.5} value={storyPauseSeconds}
                onChange={setStoryPauseSeconds} />
            </SettingGroup>
          )}
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
    !(runtime.sky.visible || glowShown !== null) ? null : {
      id: "sky-sun", title: "Sky and Sun",
      body: (
        <>
          {runtime.sky.visible && (
            <SettingGroup id="sky" title="Sky">
              <SettingButtons>
                <button aria-pressed={milkyWayOn} onClick={() => { controls.current.showMilkyWay = !milkyWayOn; setMilkyWayOn(!milkyWayOn); }}>Milky Way picture</button>
              </SettingButtons>
              <SettingSlider label="Star brightness" ariaLabel="Star brightness" testId="star-brightness-value" display={starBrightness.toFixed(2)} min={0} max={2} step={0.05} value={starBrightness}
                onChange={(value) => { controls.current.starBrightness = value; setStarBrightness(value); }} />
              <SettingSlider label="Milky Way brightness" ariaLabel="Milky Way brightness" testId="milky-way-brightness-value" display={milkyWayBrightness.toFixed(2)} min={0} max={2} step={0.05} value={milkyWayBrightness}
                onChange={(value) => { controls.current.milkyWayBrightness = value; setMilkyWayBrightness(value); }} />
            </SettingGroup>
          )}
          {glowShown !== null && (
            <SettingGroup id="glow" title="Sun glow">
              <SettingSlider label="Glow size (px)" ariaLabel="Sun glow size" testId="sun-glow-size-value" display={glowShown.sizePx.toFixed(0)} min={GLOW_LIMITS.sizePx.min} max={GLOW_LIMITS.sizePx.max} step={1} value={glowShown.sizePx}
                onChange={(value) => { controls.current.glowLook!.sizePx = value; setGlowShown({ ...controls.current.glowLook! }); }} />
              <SettingSlider label="Glow brightness" ariaLabel="Sun glow brightness" testId="sun-glow-brightness-value" display={glowShown.brightness.toFixed(2)} min={GLOW_LIMITS.brightness.min} max={GLOW_LIMITS.brightness.max} step={0.05} value={glowShown.brightness}
                onChange={(value) => { controls.current.glowLook!.brightness = value; setGlowShown({ ...controls.current.glowLook! }); }} />
              <SettingSlider label="Glow reach (× disc)" ariaLabel="Sun glow reach" testId="sun-glow-scale-value" display={glowShown.scale.toFixed(1)} min={GLOW_LIMITS.scale.min} max={GLOW_LIMITS.scale.max} step={0.1} value={glowShown.scale}
                onChange={(value) => { controls.current.glowLook!.scale = value; setGlowShown({ ...controls.current.glowLook! }); }} />
            </SettingGroup>
          )}
        </>
      ),
    },
    !(labelToggles.length > 0 || runtime.trackedBodies.length > 0) ? null : {
      id: "labels", title: "Labels",
      body: (
        <>
          <SettingButtons>
            {runtime.trackedBodies.length > 0 && <button aria-pressed={anchorLabels} onClick={() => { controls.current.showAnchorLabels = !anchorLabels; setAnchorLabels(!anchorLabels); }}>Anchor labels</button>}
            {labelToggles.map((object) => (
              <button key={object.id} aria-pressed={!hiddenLabels.has(object.id)} onClick={() => {
                const hidden = controls.current.hiddenLabels ?? new Set<string>();
                if (hidden.has(object.id)) hidden.delete(object.id);
                else hidden.add(object.id);
                controls.current.hiddenLabels = hidden;
                setHiddenLabels(new Set(hidden));
              }}>{`${object.label} label`}</button>
            ))}
          </SettingButtons>
        
        </>
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
        <>
          {hud !== null && (
            <section className="hud-section" aria-labelledby="developer-scene-heading">
              <h4 id="developer-scene-heading">Scene instrumentation</h4>
              <DebugOverlay readout={hud} />
            </section>
          )}
          <FrameRateSection frames={frames} fills={fills} fpsHistory={fpsHistory} />
          {showDisplay && hasAlternates && (
            <SettingGroup id="data" title="Data">
              <SettingButtons>
                {(definition.alternates ?? []).map((alternate) => (
                  <button key={`${alternate.param}=${alternate.value}`} aria-pressed={alternate.active} onClick={() => {
                    const url = new URL(window.location.href);
                    url.searchParams.set(alternate.param, alternate.value);
                    window.location.assign(url.toString());
                  }}>{alternate.label}</button>
                ))}
              </SettingButtons>
            </SettingGroup>
          )}
        </>
      ),
    },
  ];
  const presentGroups = groups.filter((group) => group !== null);
  const developerTools = (
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
  );

  return (
    <AstraeusShell
      experience={shellExperience}
      snapshot={clockSnapshot}
      developerMode={developerMode}
      onDeveloperModeChange={setDeveloperMode}
      onTogglePlayback={() => {
        if (runtime.clock.playing) runtime.clock.pause();
        else runtime.clock.play();
        setClockSnapshot(runtime.clock.snapshot());
      }}
      onRateChange={(rate) => {
        runtime.clock.setRate(rate);
        setClockSnapshot(runtime.clock.snapshot());
      }}
      onSeek={(timeUtcMs) => {
        runtime.clock.seek(timeUtcMs);
        setClockSnapshot(runtime.clock.snapshot());
      }}
      onCameraRequest={updateCameraRequest}
      onSelectionChange={updateSelectedObject}
      scaleId={scale}
      onScaleChange={updateScale}
      scaleChoices={scaleChoices}
      switcher={definition.switcher}
      metricsFor={metricsFor}
      developerTools={developerTools}
      storyPanelSettings={{ autoOpen: storyAutoOpen, pauseSeconds: storyPauseSeconds }}
      timelineGlow={timelineGlow}
      phoneLayout={phoneLayout}
      onSetPlaying={setPlaying}
      panelRequest={panelRequest}
      onOpenPanelChange={markOpenPanel}
    >
      <div className="canvas-host">
        <AstraeusScene runtime={runtime} controls={controls.current} readout={readout} scaleId={scale} />
      </div>
    </AstraeusShell>
  );
}
