/**
 * Saturn's, Uranus's and Neptune's ring bands as they are read (data/rings/<planet>.json, O-033 T-118). Raw JSON in its own file, apart from the moon lists
 * in `outerPlanetData.ts`, so a planet that carries its rings in the catalogue (O-048 T-205) does not pull the moon lists into the first download.
 */
import neptuneRings from "../../../data/rings/neptune.json" with { type: "json" };
import saturnRings from "../../../data/rings/saturn.json" with { type: "json" };
import uranusRings from "../../../data/rings/uranus.json" with { type: "json" };

export const SATURN_RING_FILE: unknown = saturnRings;
export const URANUS_RING_FILE: unknown = uranusRings;
export const NEPTUNE_RING_FILE: unknown = neptuneRings;
