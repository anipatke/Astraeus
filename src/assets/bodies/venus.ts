import { VENUS } from "../../core/bodies/venus";
import type { AssetLicence, TextureRef } from "../licence";
import type { BodyMaterialConfig, BodyVisual } from "../visual";
import venusTextureUrl from "../textures/venus-2k.jpg";

/** Donor material. */
export const VENUS_MATERIAL: BodyMaterialConfig = Object.freeze({ color: "#f6e1b9", roughness: 0.9, metalness: 0.04 });

/**
 * Recorded in the donor's public/textures/README.md (Venus section), read 2026-10-12 from the local donor checkout; the Solar System
 * Scope page itself was not opened, so the licence is the donor's statement of it. Endpoint used: 2k_venus_surface.jpg.
 */
export const VENUS_TEXTURE_LICENCE: AssetLicence = Object.freeze({
  source: "Solar System Scope textures, based on NASA elevation and imagery data",
  url: "https://www.solarsystemscope.com/textures/",
  licence: "CC BY 4.0",
  attribution: "Venus texture: Solar System Scope (solarsystemscope.com/textures), CC BY 4.0, based on NASA elevation and imagery data",
  accessed: "2026-10-12",
});

export const VENUS_TEXTURE: TextureRef = Object.freeze({
  url: venusTextureUrl,
  widthPx: 2048,
  heightPx: 1024,
  licence: VENUS_TEXTURE_LICENCE,
});

export const VENUS_VISUAL: BodyVisual = Object.freeze({
  kind: "sphere",
  texture: VENUS_TEXTURE,
  material: VENUS_MATERIAL,
  textureYawRad: 0,
  light: Object.freeze({ ambient: 0.08, directional: 1.4 }),
});

export const VENUS_ENTRY = Object.freeze({ body: VENUS.id, visual: VENUS_VISUAL });
