import { Scene, earth, moon, mount, trueScale } from "astraeus";

// A made-up probe on a circle 120,000 km from Earth, one lap in six hours (positions in km, speeds in km/s, times as numbers of milliseconds).
const start = Date.parse("2026-01-01T00:00:00Z");
const HOUR = 3_600_000;
const speed = (2 * Math.PI * 120_000) / (6 * 3600);
const samples = Array.from({ length: 73 }, (_, i) => {
  const angle = (i / 72) * 2 * Math.PI;
  return {
    time: start + i * 300_000,
    positionKm: [120_000 * Math.cos(angle), 120_000 * Math.sin(angle), 0],
    velocityKmS: [-speed * Math.sin(angle), speed * Math.cos(angle), 0],
  };
});

// Where the made-up times and sources come from, shown with the path and the events.
const madeUp = { sourceType: "illustrative", sources: ["Invented for this example"], accuracy: "None: nothing here was measured.", notes: "A circle, not a real flight." };

const scene = new Scene()
  .addBody(earth, { description: "The planet the made-up probe circles." })
  .addBody(moon, { orbit: true })
  .addTrajectory({
    id: "probe",
    label: "Hello probe",
    samples,
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
  // Two moments on the timeline, and one story panel that opens at the second.
  .addEvents(
    [
      { id: "burn", label: "Made-up burn", time: start + HOUR, type: "burn" },
      { id: "halfway", label: "Half a lap", time: start + 3 * HOUR },
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
  // The timeline covers one lap, offers three speeds and opens at the second.
  .setTimeline({ start, end: start + 6 * HOUR, rates: [60, 600, 3600], rate: 600 })
  // Orbit lines get a button in the top bar and labels a row in the switch panel; the Milky Way picture stays in the Developer drawer, off.
  .setSwitches({ orbitLines: { place: "top-bar" }, labels: { place: "panel" }, milkyWay: { place: "developer", on: false } })
  // True scale only: the viewer offers no switch to the readable scale.
  .setScale(trueScale, { only: true })
  .setTime("2026-01-01T00:00:00Z");
// Opens framed on the probe, looking at it rather than following it.
scene.camera.lookAt("probe", { distance: 110 });

mount(document.getElementById("app"), scene);
