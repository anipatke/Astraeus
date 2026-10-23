import { CALLISTO, EUROPA, GANYMEDE } from "../../core/bodies/jupiterMoons";
import { withPicture } from "../pictures";
import type { BodyMaterialConfig, BodyVisual } from "../visual";

/**
 * Europa, Ganymede and Callisto as Planetary Explorer draws them (the owner's own project, donor commit 84f8d3e): the donor's 2048x1024
 * maps copied byte for byte (SHA-256 equal to data/bodies/<moon>/map.json) and the donor materials, lit like Io. Sources and licences are
 * the donor's public/textures/README.md entries, read 2026-10-18 from the local donor checkout; the USGS pages were not opened.
 */

const LIGHT = Object.freeze({ ambient: 0.08, directional: 1.4 });
const visual = (picture: string, material: BodyMaterialConfig, textureYawRad: number): BodyVisual => withPicture(picture, { kind: "sphere", material: Object.freeze(material), textureYawRad, light: LIGHT });

export const EUROPA_VISUAL = visual("europa", { color: "#c8b898", roughness: 0.96, metalness: 0 }, Math.PI);
/** The donor's Ganymede picture is recentred by 180 degrees against the mosaic (data/bodies/ganymede/map.json textureRecentringDeg), so it is centred on 0 E like Io's and needs no turn (O-039 T-131). Europa and Callisto are centred on 180 E and turn half a revolution. */
export const GANYMEDE_VISUAL = visual("ganymede", { color: "#887868", roughness: 0.95, metalness: 0 }, 0);
export const CALLISTO_VISUAL = visual("callisto", { color: "#606070", roughness: 0.97, metalness: 0 }, Math.PI);

export const GALILEAN_ENTRIES = Object.freeze([
  Object.freeze({ body: EUROPA.id, visual: EUROPA_VISUAL }),
  Object.freeze({ body: GANYMEDE.id, visual: GANYMEDE_VISUAL }),
  Object.freeze({ body: CALLISTO.id, visual: CALLISTO_VISUAL }),
]);
