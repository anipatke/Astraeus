import { VENUS } from "../../core/bodies/venus";
import type { AssetLicence, TextureRef } from "../licence";
import type { BodyMaterialConfig, BodyVisual } from "../visual";
import venus2kUrl from "../textures/venus-2k-balanced.jpg";
import { pictureOf } from "../pictures";

/** Donor material (planetary-explorer src/entities/venus.ts, commit 84f8d3ee). */
export const VENUS_MATERIAL: BodyMaterialConfig = Object.freeze({ color: "#f6e1b9", emissive: "#4f2e16", emissiveIntensity: 0.04, roughness: 0.9, metalness: 0.04 });

/** Donor lighting, same file. */
export const VENUS_LIGHT = Object.freeze({ ambient: 0.24, directional: 1.18 });

/**
 * Recorded in the donor's public/textures/README.md (Venus section) and data/bodies/venus/map.json: the donor's balanced derivatives of the
 * USGS Astrogeology / NASA Magellan C3-MDIR colorized global mosaic (4641 m). US Government work, public domain.
 */
export const VENUS_TEXTURE_LICENCE: AssetLicence = Object.freeze({
  source: "USGS Astrogeology / NASA Magellan Venus C3-MDIR colorized global mosaic",
  url: "https://astrogeology.usgs.gov/search/map/Venus/Magellan/Venus_Magellan_C3MDIR_Colorized_Global_Mosaic_4641m",
  licence: "public domain",
  attribution: "Venus texture: USGS Astrogeology / NASA Magellan C3-MDIR mosaic, public domain",
  accessed: "2026-10-22",
});

export const VENUS_TEXTURE: TextureRef = Object.freeze<TextureRef>({
  url: venus2kUrl,
  widthPx: 2048,
  heightPx: 1024,
  licence: VENUS_TEXTURE_LICENCE,
  /** The 8k file ships in astraeus-data (name "venus-8k"); without it the 2k file is used at every width. */
  get desktop() {
    const large = pictureOf("venus-8k");
    return large === undefined ? undefined : { url: large.url, widthPx: large.widthPx, heightPx: large.heightPx, minViewportWidth: 768 };
  },
});

export const VENUS_VISUAL: BodyVisual = Object.freeze({
  kind: "sphere",
  texture: VENUS_TEXTURE,
  material: VENUS_MATERIAL,
  textureYawRad: 0,
  light: VENUS_LIGHT,
});

export const VENUS_ENTRY = Object.freeze({ body: VENUS.id, visual: VENUS_VISUAL });
