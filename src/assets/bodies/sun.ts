import { SUN } from "../../core/bodies/sun";
import type { AssetLicence, TextureRef } from "../licence";
import type { BodyVisual } from "../visual";
import sunTextureUrl from "../textures/sun-2k.jpg";

/**
 * The Solar System Scope Sun map, from the same set and under the same licence as the Mercury, Venus and Mars maps: the textures page
 * (https://www.solarsystemscope.com/textures/, opened 2026-10-16) states "Distributed under Attribution 4.0 International license: You may use,
 * adapt, and share these textures for any purpose, even commercially". File https://www.solarsystemscope.com/textures/download/2k_sun.jpg (2048x1024),
 * copied unchanged.
 */
export const SUN_TEXTURE_LICENCE: AssetLicence = Object.freeze({
  source: "Solar System Scope textures, based on NASA imagery",
  url: "https://www.solarsystemscope.com/textures/",
  licence: "CC BY 4.0",
  attribution: "Sun texture: Solar System Scope (solarsystemscope.com/textures), CC BY 4.0, based on NASA imagery data",
  accessed: "2026-10-16",
});

export const SUN_TEXTURE: TextureRef = Object.freeze({ url: sunTextureUrl, widthPx: 2048, heightPx: 1024, licence: SUN_TEXTURE_LICENCE });

/**
 * An emissive (unlit) sphere at the Sun's true radius, 695,700 km (IAU 2015 Resolution B3 nominal solar radius, in the body record), with a soft
 * procedural halo, so it reads as the Sun at any zoom. Far away the sphere is under a pixel and the halo alone remains (a body with a halo draws no marker
 * dot). The Solar System Scope map is a visual stand-in at a fixed orientation: the real rotation axis and longitude are not modelled. The halo size, brightness and
 * reach are drawing choices.
 */
export const SUN_VISUAL: BodyVisual = Object.freeze({
  kind: "marker",
  emissive: true,
  texture: SUN_TEXTURE,
  textureYawRad: 0,
  glow: Object.freeze({ sizePx: 72, brightness: 1 }),
  material: Object.freeze({ color: "#fff1b0", roughness: 1, metalness: 0 }),
  marker: Object.freeze({ sizePx: 9 }),
});

export const SUN_ENTRY = Object.freeze({ body: SUN.id, visual: SUN_VISUAL });
