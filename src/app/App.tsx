import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createOrbAstronomyAdapter } from "../core/astronomyAdapter";
import { SimulationClock } from "../core/clock";
import { MoonTrajectory } from "../core/moonTrajectory";
import { trueScale } from "../core/scalePolicy";
import type { CameraRequest } from "./CameraController";
import { DebugOverlay, type DebugReadout } from "./DebugOverlay";
import { cameraReachOf, experienceWithGroups, groupsOf, sunCentredOf, trackedBodiesOf, usesEarthMoon, type DeveloperSection, type ExperienceDefinition } from "./experienceDefinition";
import { AstraeusShell } from "../shell/AstraeusShell";
import type { ExperienceCameraRequest } from "../shell/experience";
import { scalePolicyFor, type ScaleId } from "../shell/scaleModel";
import { FrameRateSection, type GroupFill } from "./FrameRateSection";
import { FrameStats, type FrameSnapshot } from "./frameStats";
import { EarthMoonScene, type SceneControls } from "./EarthMoonScene";

/** Frames-per-second readings kept for the graph: one per 250 ms poll, so about 15 seconds. */
const FPS_HISTORY = 60;

export function App({ definition }: { readonly definition: ExperienceDefinition }) {
  const runtime = useMemo(() => {
    const adapter = createOrbAstronomyAdapter();
    const clock = new SimulationClock(definition.clock.startUtcMs);
    clock.setRate(definition.clock.rate);
    clock.play();
    return { clock, adapter, trajectory: new MoonTrajectory(adapter), trackedBodies: trackedBodiesOf(definition), groups: groupsOf(definition), ...sunCentredOf(definition), earthMoon: usesEarthMoon(definition), cameraReach: cameraReachOf(definition) };
  }, [definition]);
  const experienceRuntime = useMemo(
    () => ({ clock: runtime.clock, adapter: runtime.adapter, moon: runtime.trajectory }),
    [runtime],
  );
  const experience = useMemo(() => experienceWithGroups(definition), [definition]);
  const metricsFor = useMemo(() => definition.createMetrics(experienceRuntime), [definition, experienceRuntime]);
  const controls = useRef<SceneControls>({
    policy: trueScale,
    cameraRequest: null,
    showAnchorLabels: false,
    labelObjects: experience.objects,
    selectedObjectId: "earth",
    frameStats: null,
    groupFills: [],
  });
  const readout = useRef<DebugReadout | null>(null);
  const [clockSnapshot, setClockSnapshot] = useState(() => runtime.clock.snapshot());
  const [scale, setScale] = useState<ScaleId>("true-scale");
  const [developerMode, setDeveloperMode] = useState(false);
  const [anchorLabels, setAnchorLabels] = useState(false);
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
    controls.current.policy = scalePolicyFor(id);
    setScale(id);
  }, []);

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
      {runtime.trackedBodies.length > 0 && (
        <section className="hud-section" aria-labelledby="developer-display-heading">
          <h3 id="developer-display-heading">Display settings</h3>
          <div className="row scale-controls" role="group" aria-label="Scene labels">
            <button aria-pressed={anchorLabels} onClick={() => { controls.current.showAnchorLabels = !anchorLabels; setAnchorLabels(!anchorLabels); }}>Anchor labels</button>
          </div>
        </section>
      )}
      {sections.filter((section) => section.placement === "after-scene").map(renderSection)}
    </div>
  );

  return (
    <AstraeusShell
      experience={experience}
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
      metricsFor={metricsFor}
      developerTools={developerTools}
    >
      <div className="canvas-host">
        <EarthMoonScene runtime={runtime} controls={controls.current} readout={readout} scaleId={scale} />
      </div>
    </AstraeusShell>
  );
}
