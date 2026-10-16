import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createOrbAstronomyAdapter } from "../core/astronomyAdapter";
import type { GlowLook } from "./bodyDraw";
import { viewUpFromSearch, viewUpVector, type ViewUp } from "./viewUp";
import { SimulationClock } from "../core/clock";
import { createSolarSystemScale, type ScalePolicy } from "../core/scalePolicy";
import type { CameraRequest } from "./CameraController";
import { DebugOverlay, type DebugReadout } from "./DebugOverlay";
import { cameraReachOf, catalogueOf, compositionOf, experienceWithGroups, groupsOf, initialObjectIdOf, mountedBodiesOf, scaleChoiceIdsOf, sceneCenterOf, sunCentredOf, trackedBodiesOf, visualOverridesOf, type DeveloperSection, type ExperienceDefinition } from "./experienceDefinition";
import { AstraeusShell } from "../shell/AstraeusShell";
import type { ExperienceCameraRequest } from "../shell/experience";
import { scaleChoicesFor, scalePolicyFor, type ScaleId } from "../shell/scaleModel";
import { FrameRateSection, type GroupFill } from "./FrameRateSection";
import { FrameStats, type FrameSnapshot } from "./frameStats";
import { AstraeusScene, type SceneControls } from "./AstraeusScene";
import { lightingFromSearch, sunLightFromSearch } from "./lighting";
import { createSceneResolver } from "./sceneLayout";
import { loadStarCatalogue } from "../assets/sky";
import { resolveSkySettings, withSkyObject, type StarStatus } from "./skyModel";
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
  const runtime = useMemo(() => {
    const adapter = createOrbAstronomyAdapter();
    const clock = new SimulationClock(definition.clock.startUtcMs);
    clock.setRate(definition.clock.rate);
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
      lighting: lightingFromSearch(window.location.search),
      sunLight: sunLightFromSearch(window.location.search),
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
  const startScale: ScaleId = scaleChoiceIds?.[0] ?? "true-scale";
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
    selectedObjectId: initialObjectIdOf(definition),
    frameStats: null,
    groupFills: [],
  });
  const readout = useRef<DebugReadout | null>(null);
  const [clockSnapshot, setClockSnapshot] = useState(() => runtime.clock.snapshot());
  const [scale, setScale] = useState<ScaleId>(startScale);
  const [developerMode, setDeveloperMode] = useState(false);
  const [anchorLabels, setAnchorLabels] = useState(false);
  const [glowShown, setGlowShown] = useState<GlowLook | null>(controls.current.glowLook === undefined ? null : { ...controls.current.glowLook });
  const labelToggles = useMemo(() => experience.objects.filter((object) => object.showLabel !== undefined), [experience]);
  const [hiddenLabels, setHiddenLabels] = useState<ReadonlySet<string>>(() => new Set(controls.current.hiddenLabels));
  const [loopOn, setLoopOn] = useState(controls.current.loop === true);
  const [upChoice, setUpChoice] = useState<ViewUp>(viewUpFromSearch(window.location.search, definition.viewUp ?? "equatorial"));
  const [milkyWayOn, setMilkyWayOn] = useState(runtime.sky.milkyWay);
  const [starBrightness, setStarBrightness] = useState(runtime.sky.starBrightness);
  const [milkyWayBrightness, setMilkyWayBrightness] = useState(runtime.sky.milkyWayBrightness);
  const [markerPx, setMarkerPx] = useState(() => controls.current.bodyMarker.minSpherePx);
  const [hud, setHud] = useState<DebugReadout | null>(null);
  const [frames, setFrames] = useState<FrameSnapshot | null>(null);
  const [fpsHistory, setFpsHistory] = useState<readonly number[]>([]);
  const [fills, setFills] = useState<readonly GroupFill[]>([]);
  const updateCameraRequest = useCallback((request: ExperienceCameraRequest) => {
    controls.current.cameraRequest = request as CameraRequest;
  }, []);
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
    }, 250);
    return () => {
      window.clearInterval(id);
      controls.current.frameStats = null;
      setFrames(null);
      setFpsHistory([]);
    };
  }, [developerMode, runtime]);

  const sections = definition.developerSections ?? [];
  const renderSection = (section: DeveloperSection) => (
    <section key={section.id} className={section.id === "clock" ? "hud-section hud-section-clock" : "hud-section"} aria-labelledby={`developer-${section.id}-heading`}>
      <h3 id={`developer-${section.id}-heading`}>{section.heading}</h3>
      {section.render(experienceRuntime)}
    </section>
  );
  const developerTools = (
    <div className="hud">
      <header className="developer-heading">
        <h2>Developer tools</h2>
        <p>Time controls, mission context, live telemetry and scene diagnostics.</p>
      </header>
      {sections.filter((section) => section.placement === "before-scene").map(renderSection)}
      <section className="hud-section" aria-labelledby="developer-scene-heading">
        <h3 id="developer-scene-heading">Scene instrumentation</h3>
        <DebugOverlay readout={hud} />
      </section>
      <FrameRateSection frames={frames} fills={fills} fpsHistory={fpsHistory} />
      {(runtime.trackedBodies.length > 0 || runtime.sky.visible || runtime.bodies.some((id) => runtime.catalogue.get(id).visual.kind === "sphere")) && (
        <section className="hud-section" aria-labelledby="developer-display-heading">
          <h3 id="developer-display-heading">Display settings</h3>
          <div className="row" role="group" aria-label="Small bodies">
            <label>Body marker threshold (px) <output data-testid="body-marker-value">{markerPx.toFixed(1)}</output>
              <input type="range" min={0} max={20} step={0.5} value={markerPx} aria-label="Body marker threshold" onChange={(event) => { const value = Number(event.target.value); controls.current.bodyMarker = { ...controls.current.bodyMarker, minSpherePx: value }; setMarkerPx(value); }} />
            </label>
          </div>
          {glowShown !== null && (
            <div className="row" role="group" aria-label="Sun glow">
              <label>Sun glow size (px) <output data-testid="sun-glow-size-value">{glowShown.sizePx.toFixed(0)}</output>
                <input type="range" min={GLOW_LIMITS.sizePx.min} max={GLOW_LIMITS.sizePx.max} step={1} value={glowShown.sizePx} aria-label="Sun glow size" onChange={(event) => { const value = Number(event.target.value); controls.current.glowLook!.sizePx = value; setGlowShown({ ...controls.current.glowLook! }); }} />
              </label>
              <label>Sun glow reach (× disc) <output data-testid="sun-glow-scale-value">{glowShown.scale.toFixed(1)}</output>
                <input type="range" min={GLOW_LIMITS.scale.min} max={GLOW_LIMITS.scale.max} step={0.1} value={glowShown.scale} aria-label="Sun glow reach" onChange={(event) => { const value = Number(event.target.value); controls.current.glowLook!.scale = value; setGlowShown({ ...controls.current.glowLook! }); }} />
              </label>
              <label>Sun glow brightness <output data-testid="sun-glow-brightness-value">{glowShown.brightness.toFixed(2)}</output>
                <input type="range" min={GLOW_LIMITS.brightness.min} max={GLOW_LIMITS.brightness.max} step={0.05} value={glowShown.brightness} aria-label="Sun glow brightness" onChange={(event) => { const value = Number(event.target.value); controls.current.glowLook!.brightness = value; setGlowShown({ ...controls.current.glowLook! }); }} />
              </label>
            </div>
          )}
          {labelToggles.length > 0 && (
            <div className="row scale-controls" role="group" aria-label="Object labels">
              {labelToggles.map((object) => (
                <button key={object.id} aria-pressed={!hiddenLabels.has(object.id)} onClick={() => {
                  const hidden = controls.current.hiddenLabels ?? new Set<string>();
                  if (hidden.has(object.id)) hidden.delete(object.id);
                  else hidden.add(object.id);
                  controls.current.hiddenLabels = hidden;
                  setHiddenLabels(new Set(hidden));
                }}>{`${object.label} label`}</button>
              ))}
            </div>
          )}
          <div className="row scale-controls" role="group" aria-label="Up direction">
            <span>Up direction</span>
            {([["ecliptic", "Planets' plane (ecliptic)"], ["equatorial", "Earth's pole (equatorial)"]] as const).map(([choice, text]) => (
              <button key={choice} aria-pressed={upChoice === choice} onClick={() => { controls.current.up = viewUpVector(choice); setUpChoice(choice); }}>{text}</button>
            ))}
          </div>
          <div className="row scale-controls" role="group" aria-label="Scene labels">
            {runtime.trackedBodies.length > 0 && <button aria-pressed={anchorLabels} onClick={() => { controls.current.showAnchorLabels = !anchorLabels; setAnchorLabels(!anchorLabels); }}>Anchor labels</button>}
            <button aria-pressed={loopOn} onClick={() => { controls.current.loop = !loopOn; setLoopOn(!loopOn); }}>Loop playback</button>
            {(definition.alternates ?? []).map((alternate) => (
              <button key={`${alternate.param}=${alternate.value}`} aria-pressed={alternate.active} onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set(alternate.param, alternate.value);
                window.location.assign(url.toString());
              }}>{alternate.label}</button>
            ))}
            {runtime.sky.visible && <button aria-pressed={milkyWayOn} onClick={() => { controls.current.showMilkyWay = !milkyWayOn; setMilkyWayOn(!milkyWayOn); }}>Milky Way picture</button>}
          </div>
          {runtime.sky.visible && (
            <div className="row" role="group" aria-label="Sky brightness">
              <label>Star brightness <output data-testid="star-brightness-value">{starBrightness.toFixed(2)}</output>
                <input type="range" min={0} max={2} step={0.05} value={starBrightness} aria-label="Star brightness" onChange={(event) => { const value = Number(event.target.value); controls.current.starBrightness = value; setStarBrightness(value); }} />
              </label>
              <label>Milky Way brightness <output data-testid="milky-way-brightness-value">{milkyWayBrightness.toFixed(2)}</output>
                <input type="range" min={0} max={2} step={0.05} value={milkyWayBrightness} aria-label="Milky Way brightness" onChange={(event) => { const value = Number(event.target.value); controls.current.milkyWayBrightness = value; setMilkyWayBrightness(value); }} />
              </label>
            </div>
          )}
        </section>
      )}
      {sections.filter((section) => section.placement === "after-scene").map(renderSection)}
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
      metricsFor={metricsFor}
      developerTools={developerTools}
    >
      <div className="canvas-host">
        <AstraeusScene runtime={runtime} controls={controls.current} readout={readout} scaleId={scale} />
      </div>
    </AstraeusShell>
  );
}
