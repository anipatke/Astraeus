// O-059 T-271: the made-up listed orbits, built only through the public Scene API (ARCH-01: no real mission, name or data).
// 3,000 invented orbits about the Sun, each listed with its own elements and record id, a quarter of the dots drawn near a made-up parent body, Earth on its path.
import { earth, Scene, sun } from "astraeus";
import { AU_KM, madeUpOrbitRecord, meanAnomalyDegOf } from "./madeUpOrbits";

const START_UTC_MS = Date.UTC(2030, 0, 1, 0, 0, 0);
const DAY_MS = 86_400_000;
export const LISTED_MEMBER_COUNT = 3_000;

// A small deterministic generator, so the made-up list is the same every time (the engine fixture's own linear generator, kept so the orbits match).
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Invented orbits: each has its own shape, orientation, record id and record time. */
export function listedOrbits() {
  const random = lcg(20300101);
  return Array.from({ length: LISTED_MEMBER_COUNT }, (_, k) => ({
    id: `made-up-${String(k + 1).padStart(5, "0")}`,
    time: Date.UTC(2020 + (k % 8), k % 12, 1 + (k % 27)),
    semiMajorAxisKm: (2.4 + 1.4 * random()) * AU_KM,
    eccentricity: 0.45 + 0.2 * random(),
    inclinationDeg: 20 + 12 * random(),
    raanDeg: 40 + 14 * random(),
    argumentOfPeriapsisDeg: 70 + 16 * random(),
  }));
}

/** A made-up Sun-centred scene whose group is drawn from a list of per-member orbits; proves the listed capability needs no particular population. */
export function buildSyntheticListedScene(): Scene {
  const scene = new Scene()
    .addBody(sun, { labelPriority: 95, description: "The Sun, the centre the listed orbits circle. The marker's size is a drawing choice, not the Sun's real size." })
    .addBody(earth, { color: "#9fd8ff", orbit: true, labelPriority: 100, labelReach: 500, description: "Earth, on its path round the Sun; the listed orbits circle the Sun." })
    .addBodyFromElements(madeUpOrbitRecord({
      id: "listed-parent",
      label: "Made-up parent",
      epochUtcMs: START_UTC_MS,
      color: "#ffb4a2",
      sizePx: 7,
      what: "listed-orbits capability",
      elements: { semiMajorAxisAu: 3.1, eccentricity: 0.55, inclinationDeg: 25, ascendingNodeDeg: 47, argumentOfPerihelionDeg: 78, meanAnomalyDeg: meanAnomalyDegOf(100, 0.55) },
    }), { orbit: true, labelPriority: 55, description: "The invented body the clump is drawn near, from invented orbital elements." })
    .addGroup({
      id: "listed-orbits",
      label: "Listed orbits",
      center: "sun",
      plane: "ecliptic-j2000",
      orbits: listedOrbits(),
      color: "#9de3a8",
      dotSizePx: 2.5,
      seed: 7,
      referenceTime: START_UTC_MS,
      refillAfterMs: DAY_MS / 4,
      clump: { near: "listed-parent", fraction: 0.25, widthDeg: 15 },
      provenance: { sourceType: "illustrative", sources: ["Made up for the listed-orbits capability test; not a real population"], accuracy: "None claimed. Invented orbits listed one by one.", notes: "Exists to prove a group can be drawn from a list of per-member orbits through the same contract as any group." },
      description: "3,000 invented orbits, each listed with its own elements and record id, circling the Sun. One item stands for the whole group; its focus point is the centroid of the dots.",
      knownLimitations: ["Made up; not a real population."],
    })
    .addEvents([{ id: "listed-start", label: "Listing begins", time: START_UTC_MS }, { id: "listed-half", label: "Half a year on", time: START_UTC_MS + 182 * DAY_MS }])
    .setTimeline({ start: START_UTC_MS, end: START_UTC_MS + 400 * DAY_MS, rates: [3_600, 86_400, 604_800], rate: 86_400 })
    .setTime(START_UTC_MS);
  scene.camera.setReach(400_000).setFollowChoices(["listed-orbits"]);
  return scene;
}
