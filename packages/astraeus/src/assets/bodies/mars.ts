import { MARS } from "../../core/bodies/mars";
import type { AssetLicence, TextureRef } from "../licence";
import type { BodyMaterialConfig, BodyVisual } from "../visual";
import marsTextureUrl from "../textures/mars-2k.jpg";

/** Donor material. */
export const MARS_MATERIAL: BodyMaterialConfig = Object.freeze({ color: "#e3b28c", roughness: 0.94, metalness: 0.03 });

/**
 * Recorded in the donor's public/textures/README.md (Mars section), read 2026-10-12 from the local donor checkout; the Solar System
 * Scope page itself was not opened, so the licence is the donor's statement of it. Endpoint used: 8k_mars.jpg (the 2K file was derived locally from it).
 */
export const MARS_TEXTURE_LICENCE: AssetLicence = Object.freeze({
  source: "Solar System Scope textures, based on NASA elevation and imagery data",
  url: "https://www.solarsystemscope.com/textures/",
  licence: "CC BY 4.0",
  attribution: "Mars texture: Solar System Scope (solarsystemscope.com/textures), CC BY 4.0, based on NASA elevation and imagery data",
  accessed: "2026-10-12",
});

export const MARS_TEXTURE: TextureRef = Object.freeze({
  url: marsTextureUrl,
  widthPx: 2048,
  heightPx: 1024,
  licence: MARS_TEXTURE_LICENCE,
});

export const MARS_VISUAL: BodyVisual = Object.freeze({
  kind: "sphere",
  texture: MARS_TEXTURE,
  material: MARS_MATERIAL,
  textureYawRad: 0,
  light: Object.freeze({ ambient: 0.08, directional: 1.4 }),
});

export const MARS_ENTRY = Object.freeze({ body: MARS.id, visual: MARS_VISUAL });
