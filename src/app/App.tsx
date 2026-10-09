import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createOrbAstronomyAdapter } from "../core/astronomyAdapter";
import { SimulationClock } from "../core/clock";
import { MoonTrajectory } from "../core/moonTrajectory";
import { readableScale, trueScale } from "../core/scalePolicy";
import type { CameraRequest } from "./CameraController";
import { DebugControls } from "./DebugControls";
import { JourneyProgress, MissionSummary, MissionTelemetry } from "./MissionPanel";
import { DebugOverlay, type DebugReadout } from "./DebugOverlay";
import { apollo11Experience, apollo11Mission } from "../mission/apollo11";
import { AstraeusShell } from "../shell/AstraeusShell";
import type { ExperienceCameraRequest } from "../shell/experience";
import { EarthMoonScene, type SceneControls } from "./EarthMoonScene";

export function App() {
  const runtime = useMemo(() => {
    const adapter = createOrbAstronomyAdapter();
    const clock = new SimulationClock(apollo11Mission.window.startUtcMs);
    clock.setRate(3_600);
    clock.play();
    return { clock, adapter, trajectory: new MoonTrajectory(adapter), mission: apollo11Mission };
  }, []);
  const controls = useRef<SceneControls>({
    policy: trueScale,
    cameraRequest: null,
    showAnchorLabels: false,
    labelObjects: apollo11Experience.objects,
    selectedObjectId: "earth",
  });
  const readout = useRef<DebugReadout | null>(null);
  const [clockSnapshot, setClockSnapshot] = useState(() => runtime.clock.snapshot());
  const [scale, setScale] = useState<"readable-scale" | "true-scale">("true-scale");
  const [developerMode, setDeveloperMode] = useState(false);
  const [anchorLabels, setAnchorLabels] = useState(false);
  const [hud, setHud] = useState<DebugReadout | null>(null);
  const updateCameraRequest = useCallback((request: ExperienceCameraRequest) => {
    controls.current.cameraRequest = request as CameraRequest;
  }, []);
  const updateSelectedObject = useCallback((objectId: string) => {
    controls.current.selectedObjectId = objectId;
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setClockSnapshot(runtime.clock.snapshot()), 100);
    return () => window.clearInterval(id);
  }, [runtime]);

  useEffect(() => {
    if (!developerMode) return undefined;
    const id = window.setInterval(() => setHud(readout.current), 250);
    return () => window.clearInterval(id);
  }, [developerMode]);

  const developerTools = (
    <div className="hud">
      <header className="developer-heading">
        <h2>Developer tools</h2>
        <p>Time controls, mission context, live telemetry and scene diagnostics.</p>
      </header>
      <section className="hud-section hud-section-clock" aria-labelledby="developer-clock-heading">
        <h3 id="developer-clock-heading">Time and playback</h3>
        <DebugControls clock={runtime.clock} mission={runtime.mission} />
        <JourneyProgress mission={runtime.mission} clock={runtime.clock} />
      </section>
      <section className="hud-section" aria-labelledby="developer-telemetry-heading">
        <h3 id="developer-telemetry-heading">Spacecraft telemetry</h3>
        <MissionTelemetry mission={runtime.mission} clock={runtime.clock} moon={runtime.trajectory} />
      </section>
      <section className="hud-section" aria-labelledby="developer-scene-heading">
        <h3 id="developer-scene-heading">Scene instrumentation</h3>
        <DebugOverlay readout={hud} />
      </section>
      <section className="hud-section" aria-labelledby="developer-display-heading">
        <h3 id="developer-display-heading">Display settings</h3>
        <div className="row scale-controls" role="group" aria-label="Scene scale and labels">
          <button
            aria-pressed={scale === "readable-scale"}
            title="Compresses Earth–Moon distances to one tenth; body sizes remain physical."
            onClick={() => { controls.current.policy = readableScale; setScale("readable-scale"); }}
          >ReadableScale</button>
          <button
            aria-pressed={scale === "true-scale"}
            title="Keeps Earth–Moon distances and body sizes in physical proportion. This is the default."
            onClick={() => { controls.current.policy = trueScale; setScale("true-scale"); }}
          >TrueScale</button>
          <button aria-pressed={anchorLabels} onClick={() => { controls.current.showAnchorLabels = !anchorLabels; setAnchorLabels(!anchorLabels); }}>Anchor labels</button>
          <p className="scale-help">True scale is the default. ReadableScale compresses distances to 10%; body sizes stay physical.</p>
        </div>
      </section>
      <section className="hud-section" aria-labelledby="developer-mission-heading">
        <h3 id="developer-mission-heading">Mission context</h3>
        <MissionSummary mission={runtime.mission} />
      </section>
    </div>
  );

  return (
    <AstraeusShell
      experience={apollo11Experience}
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
      developerTools={developerTools}
    >
      <div className="canvas-host">
        <EarthMoonScene runtime={runtime} controls={controls.current} readout={readout} scaleId={scale} />
      </div>
    </AstraeusShell>
  );
}
