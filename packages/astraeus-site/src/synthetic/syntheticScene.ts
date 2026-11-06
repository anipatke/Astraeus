// O-059 T-271: a tiny made-up scene, built only through the public Scene API (ARCH-01: no real mission, name or data); it proves the viewer mounts something other than Apollo.
// Earth and the Moon, an invented "survey marker" on a tilted circle about Earth (twelve marks along it, three bars on its card), two events, two story panels and a contact window with a rate curve whose two halves have different sources.
import { earth, moon, Scene } from "astraeus";

export const SYNTHETIC_START_UTC_MS = Date.UTC(2030, 0, 1, 0, 0, 0);
const MINUTE_MS = 60_000;
const SAMPLE_COUNT = 97;
const ORBIT_RADIUS_KM = 20_000;
const SPEED_KM_S = 4.465;
const TILT = Math.PI / 6;
const OMEGA_RAD_S = SPEED_KM_S / ORBIT_RADIUS_KM;
const ANCHOR_COUNT = 12;

const at = (minutes: number): number => SYNTHETIC_START_UTC_MS + minutes * MINUTE_MS;
const markerProvenance = {
  sourceType: "illustrative",
  sources: ["Made up for the plug-in contract test; not a real object"],
  accuracy: "None claimed. A circular, tilted, Earth-centred path invented for this fixture.",
  notes: "Exists to prove a second experience mounts through the same contract as the first.",
} as const;
const windowProvenance = (accuracy: string, notes: string) => ({ sourceType: "illustrative", sources: ["Made up for the window contract test; not real observations"], accuracy, notes }) as const;

/** The made-up scene. The contact window's own card shows its rate; the marker's card has no rate row, because a rate readout belongs to a group (O-059 T-271). */
export function buildSyntheticScene(): Scene {
  const samples = Array.from({ length: SAMPLE_COUNT }, (_, index) => {
    const angle = OMEGA_RAD_S * index * 5 * 60;
    const [c, s] = [Math.cos(angle), Math.sin(angle)];
    return {
      time: at(index * 5),
      positionKm: [ORBIT_RADIUS_KM * c, ORBIT_RADIUS_KM * s * Math.cos(TILT), ORBIT_RADIUS_KM * s * Math.sin(TILT)],
      velocityKmS: [-SPEED_KM_S * s, SPEED_KM_S * c * Math.cos(TILT), SPEED_KM_S * c * Math.sin(TILT)],
    };
  });
  const scene = new Scene()
    .addBody(earth, { color: "#9fd8ff", labelPriority: 100, labelReach: 500, description: "The planet the marker circles." })
    .addBody(moon, { color: "#ded7cc", labelPriority: 90, labelReach: 500, description: "Shown for scale only." })
    .addTrajectory({
      id: "survey-marker",
      label: "Survey marker",
      color: "#ffb347",
      center: "earth",
      samples,
      labelReach: 4,
      provenance: markerProvenance,
      description: "An invented object on a simple loop around Earth.",
      knownLimitations: ["Not a real object; the loop is a plain circle chosen for testing."],
      // Made-up marks along the loop, one every 40 minutes, labelled "mark-1" and on; they give the anchor-label layer something to show.
      anchors: Array.from({ length: ANCHOR_COUNT }, (_, index) => ({ id: `mark-${index + 1}`, time: at((index + 1) * 40) })),
      readouts: [{ kind: "range", marker: "moon" }, { kind: "speed" }, { kind: "distance", to: "moon" }],
    })
    .addEvents([
      { id: "marker-start", label: "Marker starts its loop", time: SYNTHETIC_START_UTC_MS },
      { id: "marker-quarter", label: "Marker passes a quarter turn", time: at(120) },
    ])
    // Two made-up story panels (one about the marker, one about nothing in particular) so the story-panel checks run without a real story.
    .addStoryPanels({
      pauseSeconds: 2,
      panels: [
        { id: "marker-loop", at: { utc: new Date(at(60)).toISOString() }, title: "The marker's loop", body: ["The survey marker goes round a made-up circle.", "Nothing here is a real object."], details: ["The loop radius and speed were chosen for this fixture."], badge: "illustrative", sources: ["Made up for the story-panel test; not a real source"], object: "survey-marker" },
        { id: "marker-late", at: { utc: new Date(at(300)).toISOString() }, title: "A later note", body: ["A second made-up panel, further along the timeline."], badge: "modelled", sources: ["Made up for the story-panel test; not a real source"] },
      ],
    })
    .addActivity({
      id: "contact-window",
      label: "Contact window",
      type: "contact",
      unit: "passes per hour",
      start: at(30),
      end: at(210),
      peak: at(135),
      samples: [[30, 0], [60, 12], [90, 30], [135, 48], [165, 30], [190, 12], [210, 0]].map(([minutes, value]) => ({ time: at(minutes!), value: value! })),
      provenance: [
        { start: at(30), end: at(135), provenance: windowProvenance("None claimed. A smooth rise invented for this fixture.", "First half: a plain made-up ramp up to the peak.") },
        { start: at(135), end: at(210), provenance: windowProvenance("None claimed. A looser fall invented for this fixture, less certain than the rise.", "Second half: a made-up fall, drawn with wider guesses than the first half.") },
      ],
    })
    .setTimeline({ start: SYNTHETIC_START_UTC_MS, end: at((SAMPLE_COUNT - 1) * 5), rates: [60, 600, 3_600], rate: 600 })
    .setTime(SYNTHETIC_START_UTC_MS);
  scene.camera.setFollowChoices(["survey-marker"]);
  return scene;
}
