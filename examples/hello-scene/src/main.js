import { Scene, earth, moon, mount, trueScale } from "astraeus";

// Two made-up probes circle Earth (positions in km, speeds in km/s, times as numbers of milliseconds): "probe" on a flat circle 120,000 km out, one lap in six hours, and "probe-b" on a tilted one 200,000 km out, one lap in nine.
const start = Date.parse("2026-01-01T00:00:00Z");
const HOUR = 3_600_000;
const circle = (radiusKm, lapHours, tiltDeg) => Array.from({ length: 73 }, (_, i) => {
  const angle = (2 * Math.PI * i) / (lapHours * 12), speed = (2 * Math.PI * radiusKm) / (lapHours * 3600), tilt = (tiltDeg * Math.PI) / 180;
  const at = (x, y, scale) => [scale * x, scale * y * Math.cos(tilt), scale * y * Math.sin(tilt)];
  return { time: start + i * 300_000, positionKm: at(Math.cos(angle), Math.sin(angle), radiusKm), velocityKmS: at(-Math.sin(angle), Math.cos(angle), speed) };
});

// Where the made-up times and sources come from, shown with the path and the events.
const madeUp = { sourceType: "illustrative", sources: ["Invented for this example"], accuracy: "None: nothing here was measured.", notes: "A circle, not a real flight." };

// A made-up ring of 40 orbits about Earth, each listed with its own shape and tilt.
const orbits = Array.from({ length: 40 }, (_, k) => ({ id: `rock-${k + 1}`, semiMajorAxisKm: 150_000 + 2_500 * k, eccentricity: 0.05 + 0.004 * k, inclinationDeg: 10 + (k % 9), raanDeg: 20 + 7 * k, argumentOfPeriapsisDeg: 15 * k }));

const scene = new Scene()
  .addBody(earth, { description: "The planet the made-up probe circles." })
  .addBody(moon, { orbit: true })
  .addTrajectory({
    id: "probe",
    label: "Hello probe",
    samples: circle(120_000, 6, 0),
    provenance: madeUp,
    description: "A made-up probe on a circular lap about Earth, one lap in six hours.",
    knownLimitations: ["Invented path: not a real spacecraft.", "Perfectly circular and flat, so it ignores gravity from the Moon."],
    // Dots on the path where the made-up fixes were "published".
    anchors: [
      { id: "fix-a", time: start },
      { id: "fix-b", time: start + 2 * HOUR },
      { id: "fix-c", time: start + 4 * HOUR },
    ],
    // Bars on the probe's info card, in order.
    readouts: [{ kind: "range", marker: "moon" }, { kind: "speed" }, { kind: "distance", to: "moon" }, { kind: "altitude", above: "earth" }],
  })
  .addTrajectory({ id: "probe-b", label: "Probe B", samples: circle(200_000, 9, 35), provenance: madeUp, description: "A second made-up probe on a tilted circle, one lap in nine hours.", knownLimitations: ["Invented path: not a real spacecraft."] })
  // The 40 orbits as one group of dots: one colour, one menu item and info card, a quarter of the dots drawn near the Moon.
  .addGroup({ id: "ring", label: "Made-up ring", orbits, color: "#9de3a8", seed: 7, clump: { near: "moon", fraction: 0.25, widthDeg: 20 }, provenance: madeUp, description: "Forty invented orbits about Earth, one dot each.", knownLimitations: ["Invented orbits: not a real population."] })
  // Two moments on the timeline, and one story panel that opens at the second.
  .addEvents(
    [
      { id: "burn", label: "Made-up burn", time: start + HOUR, type: "flyby", object: "probe" },
      { id: "halfway", label: "Half a lap", time: start + 3 * HOUR },
      { id: "pass-b", label: "Probe B pass", time: start + 4 * HOUR, type: "flyby", object: "probe-b" },
    ],
    { provenance: madeUp },
  )
  .addStoryPanels({
    panels: [
      {
        id: "half-lap",
        at: { event: "halfway" },
        title: "Half a lap",
        body: ["The probe is on the far side of Earth from where it began.", "Nothing here is real: the path is a circle."],
        badge: "illustrative",
        sources: ["Invented for this example"],
        object: "probe",
      },
    ],
  })
  // Two views of one scene: Probe A shows its own events, Probe B its own, Both shows every path and event. Earth, the Moon and the ring stay in every view.
  .setViews([
    { id: "a", label: "Probe A", paths: ["probe"], events: ["burn", "halfway"], camera: { focus: "probe" } },
    { id: "b", label: "Probe B", paths: ["probe-b"], events: ["pass-b"], camera: { focus: "probe-b" } },
    { id: "both", label: "Both", paths: ["probe", "probe-b"], events: ["burn", "halfway", "pass-b"] },
  ], { place: "top-bar" })
  // The timeline covers one lap and offers three speeds. Playback drops to 60x within 20 minutes of a "flyby" event, but only of the showing view's events.
  .setTimeline({ start, end: start + 6 * HOUR, rates: [60, 600, 3600], rate: 600, pacing: [{ near: { type: "flyby", within: 1200 }, rate: 60 }] })
  // Orbit lines get a button in the top bar and labels a row in the switch panel; the Milky Way picture stays in the Developer drawer, off.
  .setSwitches({ orbitLines: { place: "top-bar" }, labels: { place: "panel" }, milkyWay: { place: "developer", on: false } })
  // True scale only: the viewer offers no switch to the readable scale.
  .setScale(trueScale, { only: true })
  .setTime("2026-01-01T00:00:00Z");
// Opens framed on the probe, looking at it rather than following it.
scene.camera.lookAt("probe", { distance: 110 });

const viewer = mount(document.getElementById("app"), scene);
await viewer.ready;

// Camera to the encounter and back: the engine only says when playback enters or leaves a flyby; this page decides what the camera does.
let before;
viewer.onEventZone(({ entered, object, via }) => {
  if (entered) { before = viewer.camera; if (object) viewer.setCamera({ follow: object }); }
  else if (via === "time" && before) viewer.setCamera(before); // after a view switch the view's own camera rule owns the camera
  if (!entered) before = undefined;
});
