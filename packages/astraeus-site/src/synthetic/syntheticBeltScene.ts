// O-059 T-271: the made-up Sun-centred belt and the scenes that grow from it, built only through the public Scene API (ARCH-01: no real mission, name or data).
// The Sun, Earth on its year's path, a belt of 10,000 invented orbits about the Sun and one made-up far object on its own orbit. The camera is allowed far enough out to frame the belt.
import { earth, Scene, sun, type ElementsBodyRecord } from "astraeus";
import { AU_KM, julianDateOf, madeUpOrbitRecord, spreadOrbits } from "./madeUpOrbits";

export const BELT_START_UTC_MS = Date.UTC(2030, 0, 1, 0, 0, 0);
export const BELT_MEMBER_COUNT = 10_000;
const HOUR_MS = 3_600_000;

/** The made-up far object: about 4.5 AU from the Sun, nearest the Sun at the start. */
export const FAR_MARKER: ElementsBodyRecord = madeUpOrbitRecord({
  id: "far-marker",
  label: "Made-up far object",
  epochUtcMs: BELT_START_UTC_MS,
  color: "#c79bff",
  sizePx: 7,
  what: "path capability",
  elements: { semiMajorAxisAu: 4.5, eccentricity: 0.2, inclinationDeg: 5, ascendingNodeDeg: 60, argumentOfPerihelionDeg: 30, perihelionJdTdb: julianDateOf(BELT_START_UTC_MS) },
});

/** The Sun, Earth on its orbit and the belt group; the scene every Sun-centred made-up scene starts from. */
export function startSunScene(earthEnlarge?: number): Scene {
  return new Scene()
    .addBody(sun, { labelPriority: 95, description: "The Sun, the centre the belt and the paths circle. The marker's size is a drawing choice, not the Sun's real size." })
    .addBody(earth, { color: "#9fd8ff", orbit: true, ...(earthEnlarge === undefined ? {} : { enlarge: earthEnlarge }), labelPriority: 100, labelReachEarthRadii: 500, description: "Earth, on its path round the Sun; the belt circles the Sun." })
    .addGroup({
      id: "dust-belt",
      label: "Dust belt",
      center: "sun",
      plane: "ecliptic-j2000",
      orbits: spreadOrbits("belt", BELT_MEMBER_COUNT, 7,
        { semiMajorAxisKm: 2.5 * AU_KM, eccentricity: 0.1, inclinationDeg: 8, raanDeg: 0, argumentOfPeriapsisDeg: 0 },
        { semiMajorAxisKm: 0.3 * AU_KM, eccentricity: 0.08, inclinationDeg: 6, raanDeg: 180, argumentOfPeriapsisDeg: 180 }),
      color: "#ffd27f",
      seed: 7,
      provenance: { sourceType: "illustrative", sources: ["Made up for the group capability test; not a real population"], accuracy: "None claimed. A scattered belt of invented members on Sun-centred two-body orbits.", notes: "Exists to prove a Sun-centred group is placed through centre composition." },
      description: "10,000 invented fragments circling the Sun. One item stands for the whole belt; its focus point is the centroid of the members.",
      knownLimitations: ["Made up; not a real population.", "Members move on unperturbed two-body orbits about the Sun."],
    })
    .addEvents([{ id: "belt-start", label: "Belt begins", time: BELT_START_UTC_MS }, { id: "belt-half", label: "Belt half a day on", time: BELT_START_UTC_MS + 12 * HOUR_MS }])
    .setTimeline({ start: BELT_START_UTC_MS, end: BELT_START_UTC_MS + 24 * HOUR_MS, rates: [60, 600, 3_600], rate: 600 })
    .setTime(BELT_START_UTC_MS);
}

/** A made-up Sun-centred scene, about 2.5 AU across, with a camera reach that frames the whole belt (Earth radii: 1 AU is about 23,500). */
export function buildSyntheticBeltScene(): Scene {
  const scene = startSunScene().addBodyFromElements(FAR_MARKER, { orbit: true, labelPriority: 55, description: "An invented object about 4.5 AU from the Sun, drawn from invented orbital elements." });
  scene.camera.setReach(400_000).setFollowChoices(["dust-belt"]);
  return scene;
}
