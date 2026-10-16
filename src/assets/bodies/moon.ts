import { MOON } from "../../core/bodies/moon";
import type { AssetLicence, TextureRef } from "../licence";
import type { BodyMaterialConfig, BodyVisual } from "../visual";
import moonTextureUrl from "../textures/moon-lroc-2k.jpg";

/** Donor material. */
export const MOON_MATERIAL: BodyMaterialConfig = Object.freeze({ color: "#f3ede4", roughness: 0.98, metalness: 0.02 });

/**
 * NASA Scientific Visualization Studio, CGI Moon Kit (SVS 4720), LROC WAC colour map with polar fill, lroc_color_poles_2k.tif
 * (2048x1024), converted to JPEG. The page asks "Please give credit for this item to: NASA's Scientific Visualization Studio".
 * Latitudes beyond 70 degrees are filled from the LOLA albedo map (the page says so); the image is for looks, not science.
 */
export const MOON_TEXTURE_LICENCE: AssetLicence = Object.freeze({
  source: "NASA Scientific Visualization Studio, CGI Moon Kit (SVS 4720), LROC WAC colour map with poles, 2k",
  url: "https://svs.gsfc.nasa.gov/4720",
  licence: "public domain",
  attribution: "NASA's Scientific Visualization Studio",
  accessed: "2026-10-16",
});

export const MOON_TEXTURE: TextureRef = Object.freeze({
  url: moonTextureUrl,
  widthPx: 2048,
  heightPx: 1024,
  licence: MOON_TEXTURE_LICENCE,
});

export const MOON_VISUAL: BodyVisual = Object.freeze({
  kind: "sphere",
  texture: MOON_TEXTURE,
  material: MOON_MATERIAL,
  textureYawRad: 0,
  light: Object.freeze({ ambient: 0.08, directional: 1.4 }),
});

export const MOON_ENTRY = Object.freeze({ body: MOON.id, visual: MOON_VISUAL });
