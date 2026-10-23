import { JUPITER } from "../../core/bodies/jupiter";
import type { AssetLicence, TextureRef } from "../licence";
import type { BodyMaterialConfig, BodyVisual } from "../visual";
import jupiterTextureUrl from "../textures/jupiter-2k.jpg";

/** Donor material (src/entities/jupiter.ts); the fallback colour under and without the texture. */
export const JUPITER_MATERIAL: BodyMaterialConfig = Object.freeze({ color: "#d4a97a", roughness: 0.85, metalness: 0 });

/**
 * Solar System Scope Jupiter map, https://www.solarsystemscope.com/textures/download/2k_jupiter.jpg, copied unchanged. The textures page
 * was opened on 2026-10-16 and states "Distributed under Attribution 4.0 International license"; the set is based on NASA imagery.
 */
export const JUPITER_TEXTURE_LICENCE: AssetLicence = Object.freeze({
  source: "Solar System Scope textures, based on NASA imagery",
  url: "https://www.solarsystemscope.com/textures/",
  licence: "CC BY 4.0",
  attribution: "Jupiter texture: Solar System Scope (solarsystemscope.com/textures), CC BY 4.0, based on NASA imagery",
  accessed: "2026-10-16",
});

export const JUPITER_TEXTURE: TextureRef = Object.freeze({
  url: jupiterTextureUrl,
  widthPx: 2048,
  heightPx: 1024,
  licence: JUPITER_TEXTURE_LICENCE,
});

/**
 * Drawn as a spheroid from its two radii. Jupiter's bands rotate differentially, so `textureYawRad` 0 is a visual stand-in,
 * not a measured prime meridian (stated in the body's orientation limitations).
 */
export const JUPITER_VISUAL: BodyVisual = Object.freeze({
  kind: "sphere",
  texture: JUPITER_TEXTURE,
  material: JUPITER_MATERIAL,
  textureYawRad: 0,
  light: Object.freeze({ ambient: 0.08, directional: 1.4 }),
});

export const JUPITER_ENTRY = Object.freeze({ body: JUPITER.id, visual: JUPITER_VISUAL });
