import { Scene, mars, mercury, earth, mount, sun, venus, solarSystemScale } from "astraeus";

// The Sun and the four inner planets, each with its orbit line, enlarged so they show at the Sun-centred distances. Only the engine is installed: no data package, so no pictures.
const scene = new Scene().addBody(sun);
for (const planet of [mercury, venus, earth, mars]) {
  // Earth's card also reads "Distance from the Sun" (a range readout measures from the scene's centre, the Sun).
  scene.addBody(planet, { orbit: true, enlarge: 60, ...(planet === earth ? { readouts: [{ kind: "range" }] } : {}) });
}
scene
  .setTime("2026-01-01T00:00:00Z")
  .setTimeline({ start: Date.parse("2026-01-01T00:00:00Z"), end: Date.parse("2027-01-01T00:00:00Z") })
  .setScale(solarSystemScale)
  // The looks the sliders start from; presentation only. The Milky Way picture comes from the astraeus-data package, which this example does not install, so there is no Milky Way slider.
  .setLook({ starBrightness: 1, sunGlow: { sizePx: 72, brightness: 1 } });
// Zoom out just far enough that Mars's whole orbit fits from any direction.
scene.camera.fitOrbit(mars);

const viewer = mount(document.getElementById("app"), scene);
await viewer.ready;

// The app's own controls read the viewer's state and set it back through the handle. setLook replaces the whole look, so each slider sends the current look with its one change.
const look = () => viewer.look;
const bind = (id, read, change) => {
  const input = document.getElementById(id);
  input.value = read(look());
  input.addEventListener("input", () => viewer.setLook(change(look(), Number(input.value))));
};
bind("stars", (l) => l.starBrightness, (l, v) => ({ ...l, starBrightness: v }));
bind("glow", (l) => l.sunGlow.brightness, (l, v) => ({ ...l, sunGlow: { ...l.sunGlow, brightness: v } }));
bind("glow-size", (l) => l.sunGlow.sizePx, (l, v) => ({ ...l, sunGlow: { ...l.sunGlow, sizePx: v } }));

// The scale switch cycles through the scales the scene offers (scene.scales) and follows changes made elsewhere.
const names = { "solar-system": "Solar system", "readable-scale": "Readable", "true-scale": "True scale" };
const button = document.getElementById("scale");
const showScale = () => { button.textContent = `Scale: ${names[viewer.scale] ?? viewer.scale}`; };
button.addEventListener("click", () => {
  const next = scene.scales[(scene.scales.indexOf(viewer.scale) + 1) % scene.scales.length];
  viewer.setScale(next);
  showScale();
});
showScale();
