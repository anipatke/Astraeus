import { MERCURY } from "../../core/bodies/mercury";
import type { AssetLicence, TextureRef } from "../licence";
import type { BodyMaterialConfig, BodyVisual } from "../visual";
import mercuryTextureUrl from "../textures/mercury-2k.jpg";

/** Donor material. */
export const MERCURY_MATERIAL: BodyMaterialConfig = Object.freeze({ color: "#d6af84", roughness: 0.84, metalness: 0.16 });

/**
 * Recorded in the donor's public/textures/README.md (Mercury section), read 2026-10-12 from the local donor checkout; the Solar System
 * Scope page itself was not opened, so the licence is the donor's statement of it. Endpoint used: 2k_mercury.jpg.
 */
export const MERCURY_TEXTURE_LICENCE: AssetLicence = Object.freeze({
  source: "Solar System Scope textures, based on NASA elevation and imagery data",
  url: "https://www.solarsystemscope.com/textures/",
  licence: "CC BY 4.0",
  attribution: "Mercury texture: Solar System Scope (solarsystemscope.com/textures), CC BY 4.0, based on NASA elevation and imagery data",
  accessed: "2026-10-12",
});

export const MERCURY_TEXTURE: TextureRef = Object.freeze({
  url: mercuryTextureUrl,
  widthPx: 2048,
  heightPx: 1024,
  licence: MERCURY_TEXTURE_LICENCE,
});

export const MERCURY_VISUAL: BodyVisual = Object.freeze({
  kind: "sphere",
  texture: MERCURY_TEXTURE,
  material: MERCURY_MATERIAL,
  textureYawRad: 0,
  light: Object.freeze({ ambient: 0.08, directional: 1.4 }),
});

export const MERCURY_ENTRY = Object.freeze({ body: MERCURY.id, visual: MERCURY_VISUAL });
