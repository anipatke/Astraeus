import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createOrbAstronomyAdapter } from "../core/astronomyAdapter";
import { SimulationClock } from "../core/clock";
import { createSolarSystemScale, type ScalePolicy } from "../core/scalePolicy";
import { catalogue } from "../assets/catalogue";
import type { CameraRequest } from "./CameraController";
import { DebugOverlay, type DebugReadout } from "./DebugOverlay";
import { cameraReachOf, compositionOf, experienceWithGroups, groupsOf, initialObjectIdOf, mountedBodiesOf, scaleChoiceIdsOf, sceneCenterOf, sunCentredOf, trackedBodiesOf, visualOverridesOf, type DeveloperSection, type ExperienceDefinition } from "./experienceDefinition";
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

export function App({ definition }: { readonly definition: ExperienceDefinition }) {
  const runtime = useMemo(() => {
    const adapter = createOrbAstronomyAdapter();
    const clock = new SimulationClock(definition.clock.startUtcMs);
    clock.setRate(definition.clock.rate);
    clock.play();
    // One resolver per mount: every position in the scene comes from it, whatever the scene centre.
    const resolver = createSceneResolver(adapter);
    return {
      clock,
      adapter,
      resolver,
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
    };
  }, [definition]);
  const experienceRuntime = useMemo(
    () => ({ clock: runtime.clock, resolver: runtime.resolver, catalogue }),
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
  const controls = useRef<SceneControls>({
    policy: scalePolicyFor(startScale, suppliedPolicies),
    cameraRequest: null,
    showAnchorLabels: false,
    showMilkyWay: runtime.sky.milkyWay,
    starBrightness: runtime.sky.starBrightness,
    milkyWayBrightness: runtime.sky.milkyWayBrightness,
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
  const [milkyWayOn, setMilkyWayOn] = useState(runtime.sky.milkyWay);
  const [starBrightness, setStarBrightness] = useState(runtime.sky.starBrightness);
  const [milkyWayBrightness, setMilkyWayBrightness] = useState(runtime.sky.milkyWayBrightness);
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
    const id = window.setInterval(() => setClockSnapshot(runtime.clock.snapshot()), 100);
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
      {(runtime.trackedBodies.length > 0 || runtime.sky.visible) && (
        <section className="hud-section" aria-labelledby="developer-display-heading">
          <h3 id="developer-display-heading">Display settings</h3>
          <div className="row scale-controls" role="group" aria-label="Scene labels">
            {runtime.trackedBodies.length > 0 && <button aria-pressed={anchorLabels} onClick={() => { controls.current.showAnchorLabels = !anchorLabels; setAnchorLabels(!anchorLabels); }}>Anchor labels</button>}
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
