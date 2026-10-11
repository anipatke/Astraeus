import { EARTH } from "../../core/bodies/earth";
import type { TextureRef } from "../licence";
import type { AtmosphereConfig, BodyMaterialConfig, BodyVisual } from "../visual";
import earthTextureUrl from "../textures/earth-2k.jpg";

/** Donor material. */
export const EARTH_MATERIAL: BodyMaterialConfig = Object.freeze({ color: "#e8e8e8", roughness: 0.82, metalness: 0.05 });
/** Donor Earth atmosphere parameters. */
export const EARTH_ATMOSPHERE: AtmosphereConfig = Object.freeze({ color: "#6eaaff", intensity: 0.4, power: 4.5, scale: 1.04 });

export const EARTH_TEXTURE: TextureRef = Object.freeze({
  url: earthTextureUrl,
  widthPx: 4096,
  heightPx: 2048,
  localOnly: Object.freeze({
    reason: "The donor records this as a NASA Blue Marble equirectangular map but not which product or URL, so its licence cannot be stated.",
    publicReplacement: "material-colour" as const,
  }),
});

export const EARTH_VISUAL: BodyVisual = Object.freeze({
  kind: "sphere",
  texture: EARTH_TEXTURE,
  material: EARTH_MATERIAL,
  textureYawRad: 0,
  atmosphere: EARTH_ATMOSPHERE,
  light: Object.freeze({ ambient: 0.18, directional: 1.8 }),
});

export const EARTH_ENTRY = Object.freeze({ body: EARTH.id, visual: EARTH_VISUAL });
