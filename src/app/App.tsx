import { useEffect, useMemo, useRef, useState } from "react";
import { createOrbAstronomyAdapter } from "../core/astronomyAdapter";
import { SimulationClock } from "../core/clock";
import { MoonTrajectory } from "../core/moonTrajectory";
import { readableScale, trueScale } from "../core/scalePolicy";
import type { CameraRequest, FocusId } from "./CameraController";
import { DebugControls } from "./DebugControls";
import { MissionPanel } from "./MissionPanel";
import { DebugOverlay, type DebugReadout } from "./DebugOverlay";
import { apollo11Mission } from "../mission/apollo11";
import { EarthMoonScene, type SceneControls } from "./EarthMoonScene";

export function App() {
  const runtime = useMemo(() => {
    const adapter = createOrbAstronomyAdapter();
    const clock = new SimulationClock(Date.now());
    clock.setRate(3_600);
    clock.play();
    return { clock, adapter, trajectory: new MoonTrajectory(adapter), mission: apollo11Mission };
  }, []);
  const controls = useRef<SceneControls>({ policy: readableScale, cameraRequest: null, showAnchorLabels: false });
  const readout = useRef<DebugReadout | null>(null);
  const [scale, setScale] = useState<"readable-scale" | "true-scale">("readable-scale");
  const [focus, setFocus] = useState<FocusId>("earth");
  const [following, setFollowing] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [anchorLabels, setAnchorLabels] = useState(false);
  const [hud, setHud] = useState<DebugReadout | null>(null);

  const focusTargets = useMemo(() => [
    { id: "earth", label: "Earth" },
    { id: "moon", label: "Moon" },
    ...runtime.mission.bodies.map((body) => ({ id: body.id, label: body.label })),
  ], [runtime]);
  const request = (next: CameraRequest, target: FocusId) => {
    controls.current.cameraRequest = next;
    setFocus(target);
    setFollowing(next.kind === "follow");
  };

  useEffect(() => {
    if (!showOverlay) return undefined;
    const id = window.setInterval(() => setHud(readout.current), 250);
    return () => window.clearInterval(id);
  }, [showOverlay]);

  return (
    <>
      <div className="canvas-host">
        <EarthMoonScene runtime={runtime} controls={controls.current} readout={readout} scaleId={scale} />
      </div>
      <div className="hud">
        <DebugControls clock={runtime.clock} mission={runtime.mission} />
        <MissionPanel mission={runtime.mission} clock={runtime.clock} />
        <div className="row">
          {focusTargets.map(({ id, label }) => (
            <button key={id} aria-pressed={focus === id && !following} onClick={() => request({ kind: "focus", target: id }, id)}>
              Focus {label}
            </button>
          ))}
          <button onClick={() => request({ kind: "overview" }, "earth")}>Earth–Moon overview</button>
          {runtime.mission.bodies.map((body) => (
            <button key={body.id} aria-pressed={focus === body.id && following} onClick={() => request({ kind: "follow", target: body.id }, body.id)}>
              Follow {body.label}
            </button>
          ))}
          <button aria-pressed={scale === "readable-scale"} onClick={() => { controls.current.policy = readableScale; setScale("readable-scale"); }}>ReadableScale</button>
          <button aria-pressed={scale === "true-scale"} onClick={() => { controls.current.policy = trueScale; setScale("true-scale"); }}>TrueScale</button>
          <button aria-pressed={anchorLabels} onClick={() => { controls.current.showAnchorLabels = !anchorLabels; setAnchorLabels(!anchorLabels); }}>Anchor labels</button>
          <button aria-pressed={showOverlay} onClick={() => setShowOverlay(!showOverlay)}>Debug overlay</button>
        </div>
        {showOverlay && <DebugOverlay readout={hud} />}
      </div>
    </>
  );
}
