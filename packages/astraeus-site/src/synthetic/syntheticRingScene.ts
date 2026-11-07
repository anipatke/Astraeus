// O-059 T-271: the made-up debris ring, built only through the public Scene API (ARCH-01: no real mission, name or data). Earth and the Moon for scale; 10,000 invented orbits about Earth drawn as one group.
import { earth, moon, Scene, type GroupOrbitInput } from "astraeus";
import { spreadOrbits } from "./madeUpOrbits";

const START_UTC_MS = Date.UTC(2030, 0, 1, 0, 0, 0);
const HOUR_MS = 3_600_000;
export const RING_MEMBER_COUNT = 10_000;

/** The ring's invented orbits: the same base, spread and seed as the engine fixture it replaces, so the shapes match; where each dot sits along its orbit is the group's own spread. */
export function ringOrbits(): GroupOrbitInput[] {
  return spreadOrbits("ring", RING_MEMBER_COUNT, 20300101,
    { semiMajorAxisKm: 26_000, eccentricity: 0.02, inclinationDeg: 15, raanDeg: 0, argumentOfPeriapsisDeg: 0 },
    { semiMajorAxisKm: 1_500, eccentricity: 0.02, inclinationDeg: 2, raanDeg: 180, argumentOfPeriapsisDeg: 180 });
}

/** A made-up scene whose only object besides Earth and the Moon is a group; proves the group capability is not specific to any one demo. */
export function buildSyntheticRingScene(): Scene {
  const scene = new Scene()
    .addBody(earth, { color: "#9fd8ff", labelPriority: 100, labelReachEarthRadii: 500, description: "The planet the ring circles." })
    .addBody(moon, { color: "#ded7cc", labelPriority: 90, labelReachEarthRadii: 500, description: "Shown for scale only." })
    .addGroup({
      id: "debris-ring",
      label: "Debris ring",
      center: "earth",
      plane: "EQJ",
      orbits: ringOrbits(),
      color: "#7fd1ff",
      seed: 20300101,
      provenance: { sourceType: "illustrative", sources: ["Made up for the group capability test; not a real population"], accuracy: "None claimed. A scattered ring of invented members on Earth-centred two-body orbits.", notes: "Exists to prove a group of objects mounts through the same contract as a single body." },
      description: "10,000 invented fragments circling Earth. One item stands for the whole ring; its focus point is the centroid of the members.",
      knownLimitations: ["Made up; not a real population.", "Members move on unperturbed two-body orbits about Earth: no drag, no Moon or Sun pull, no collisions."],
    })
    .addEvents([{ id: "ring-start", label: "Ring begins", time: START_UTC_MS }, { id: "ring-half", label: "Ring half a day on", time: START_UTC_MS + 12 * HOUR_MS }])
    .setTimeline({ start: START_UTC_MS, end: START_UTC_MS + 24 * HOUR_MS, rates: [60, 600, 3_600], rate: 600 })
    .setTime(START_UTC_MS);
  scene.camera.setFollowChoices(["debris-ring"]);
  return scene;
}
