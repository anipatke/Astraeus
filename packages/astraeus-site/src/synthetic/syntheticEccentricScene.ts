// O-059 T-271: the made-up belt with a made-up 51 AU orbit, built only through the public Scene API (ARCH-01: no real mission, name or data).
import type { ElementsBodyRecord, Scene } from "astraeus";
import { BELT_START_UTC_MS, startSunScene } from "./syntheticBeltScene";
import { julianDateOf, madeUpOrbitRecord } from "./madeUpOrbits";

/** A made-up long orbit: eccentricity 0.96, semi-major axis 26 AU, so it runs from 1.04 AU out to 50.96 AU. It is at its nearest point at the start. */
export const ECCENTRIC_BODY: ElementsBodyRecord = madeUpOrbitRecord({
  id: "far-eccentric",
  label: "Made-up eccentric object",
  epochUtcMs: BELT_START_UTC_MS,
  color: "#ff9fd0",
  sizePx: 7,
  what: "long-orbit capability",
  elements: { semiMajorAxisAu: 26, eccentricity: 0.96, inclinationDeg: 40, ascendingNodeDeg: 100, argumentOfPerihelionDeg: 20, perihelionJdTdb: julianDateOf(BELT_START_UTC_MS) },
});

/** The belt, Earth drawn 200 times larger than life and a made-up 51 AU orbit, with the camera allowed out to frame the whole orbit. */
export function buildSyntheticEccentricScene(): Scene {
  const scene = startSunScene(200).addBodyFromElements(ECCENTRIC_BODY, { orbit: true, labelPriority: 58, description: "The whole orbit of an invented object that swings from about 1 AU to about 51 AU from the Sun, drawn from invented orbital elements." });
  // 51 AU is about 1.2 million Earth radii: the camera may pull back to frame the whole orbit, and the far plane clears it.
  scene.camera.setReach(4_000_000, { farEarthRadii: 12_000_000 }).setFollowChoices(["dust-belt"]);
  return scene;
}
