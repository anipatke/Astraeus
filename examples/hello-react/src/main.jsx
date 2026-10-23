import { createRoot } from "react-dom/client";
import { AstraeusScene, Scene, earth, moon } from "astraeus";

// A made-up probe on a circle 120,000 km from Earth, one lap in six hours (positions in km, times as ISO text).
const start = Date.parse("2026-01-01T00:00:00Z");
const samples = Array.from({ length: 73 }, (_, i) => {
  const angle = (i / 72) * 2 * Math.PI;
  return { time: start + i * 300_000, positionKm: [120_000 * Math.cos(angle), 120_000 * Math.sin(angle), 0] };
});

const scene = new Scene().addBody(earth).addBody(moon, { orbit: true }).addTrajectory({ id: "probe", label: "Hello probe", samples }).setTime("2026-01-01T00:00:00Z");
scene.camera.follow("probe", { distance: 110 });

createRoot(document.getElementById("app")).render(<AstraeusScene scene={scene} onError={console.error} />);
