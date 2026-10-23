import { EARTH } from "../../core/bodies/earth";
import type { AssetLicence, TextureRef } from "../licence";
import type { AtmosphereConfig, BodyMaterialConfig, BodyVisual } from "../visual";
import earthTextureUrl from "../textures/earth-bmng-july-4k.jpg";

/** Donor material. */
export const EARTH_MATERIAL: BodyMaterialConfig = Object.freeze({ color: "#e8e8e8", roughness: 0.82, metalness: 0.05 });
/** Donor Earth atmosphere parameters. */
export const EARTH_ATMOSPHERE: AtmosphereConfig = Object.freeze({ color: "#6eaaff", intensity: 0.4, power: 4.5, scale: 1.04 });

/**
 * NASA Earth Observatory, Blue Marble: Next Generation with Topography and Bathymetry, July 2004 (produced by Reto Stöckli), file
 * world.topo.bathy.200407.3x5400x2700.jpg (5400x2700), resampled to 4096x2048. The page asks republishers to credit "NASA Earth
 * Observatory"; NASA imagery is not copyrighted (NASA media usage guidelines).
 */
export const EARTH_TEXTURE_LICENCE: AssetLicence = Object.freeze({
  source: "NASA Earth Observatory, Blue Marble: Next Generation with Topography and Bathymetry, July 2004 (Reto Stöckli)",
  url: "https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-topography-bathymetry/",
  licence: "public domain",
  attribution: "NASA Earth Observatory (Blue Marble: Next Generation, Reto Stöckli)",
  accessed: "2026-10-16",
});

export const EARTH_TEXTURE: TextureRef = Object.freeze({
  url: earthTextureUrl,
  widthPx: 4096,
  heightPx: 2048,
  licence: EARTH_TEXTURE_LICENCE,
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
