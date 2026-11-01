import { useState } from "react";
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
    { id: "a", label: "Probe A", paths: ["probe"], events: ["pass"] },
    { id: "b", label: "Probe B", paths: ["probe-b"], events: ["pass-b"], camera: { follow: "probe-b" } },
    { id: "both", label: "Both" },
  ], { place: "top-bar" })
  .setTimeline({ start, end: start + 6 * 3_600_000, rates: [60, 600, 3600], rate: 600, pacing: [{ near: { type: "flyby", within: 1200 }, rate: 60 }] })
  .setTime("2026-01-01T00:00:00Z");
scene.camera.follow("probe", { distance: 110 });

function App() {
  // The engine only says when playback enters a flyby; this page decides what the camera does, here by following the probe of the encounter. (To put the camera back afterwards, read `camera` from a `mount` handle; see the vanilla example.)
  const [camera, setCamera] = useState({ follow: "probe" });
  const onEventZone = ({ entered, object }) => { if (entered && object) setCamera({ follow: object }); };
  return <AstraeusScene scene={scene} camera={camera} onEventZone={onEventZone} onError={console.error} />;
}

createRoot(document.getElementById("app")).render(<App />);
