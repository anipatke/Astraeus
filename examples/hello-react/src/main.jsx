import { useRef } from "react";
import { createRoot } from "react-dom/client";
import { AstraeusScene, Scene, earth, moon } from "astraeus";

// Two made-up probes on circles about Earth, one lap in six hours (positions in km, times as numbers of milliseconds).
const start = Date.parse("2026-01-01T00:00:00Z");
const circle = (radiusKm, tilt) => Array.from({ length: 73 }, (_, i) => {
  const angle = (i / 72) * 2 * Math.PI;
  return { time: start + i * 300_000, positionKm: [radiusKm * Math.cos(angle), radiusKm * Math.sin(angle) * Math.cos(tilt), radiusKm * Math.sin(angle) * Math.sin(tilt)] };
});

const scene = new Scene()
  .addBody(earth)
  .addBody(moon, { orbit: true })
  .addTrajectory({ id: "probe", label: "Hello probe", samples: circle(120_000, 0) })
  .addTrajectory({ id: "probe-b", label: "Probe B", samples: circle(200_000, 0.6) })
  .addEvents([{ id: "pass", label: "Probe pass", time: start + 3_600_000, type: "flyby", object: "probe" }])
  .addEvents([{ id: "pass-b", label: "Probe B pass", time: start + 4 * 3_600_000, type: "flyby", object: "probe-b" }])
  .setViews([
    { id: "a", label: "Probe A", objects: ["probe"], events: ["pass"] },
    { id: "b", label: "Probe B", objects: ["probe-b"], events: ["pass-b"], camera: { follow: "probe-b" } },
    { id: "both", label: "Both" },
  ], { place: "top-bar" })
  .setTimeline({ start, end: start + 6 * 3_600_000, rates: [60, 600, 3600], rate: 600, pacing: [{ near: { type: "flyby", withinSeconds: 1200 }, rate: 60 }] })
  .setTime("2026-01-01T00:00:00Z");
scene.camera.follow("probe", { distance: 110 });

function App() {
  // The handle comes through `ref` (`onReady(handle)` gives the same one). The engine only says when playback enters or leaves a flyby; this page decides what the camera does: follow the probe of the encounter, then put the camera back.
  const handle = useRef(null);
  const saved = useRef(undefined);
  const onEventZone = ({ entered, object, via }) => {
    const viewer = handle.current;
    if (!viewer) return;
    if (entered) { saved.current = viewer.camera; if (object) viewer.setCamera({ follow: object }); }
    else if (via === "time" && saved.current) viewer.setCamera(saved.current); // after a view switch the view's own camera rule owns the camera
    if (!entered) saved.current = undefined;
  };
  return <AstraeusScene ref={handle} scene={scene} onEventZone={onEventZone} onError={console.error} />;
}

createRoot(document.getElementById("app")).render(<App />);
