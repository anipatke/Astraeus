import { MOON } from "../../core/bodies/moon";
import type { AssetLicence, TextureRef } from "../licence";
import type { BodyMaterialConfig, BodyVisual } from "../visual";
import moonTextureUrl from "../textures/moon-orig-2k.jpg";

/** Donor material. */
export const MOON_MATERIAL: BodyMaterialConfig = Object.freeze({ color: "#f3ede4", roughness: 0.98, metalness: 0.02 });

/** The donor's public-domain LROC map is the named replacement; it is not copied into this repository yet. */
const LROC_REPLACEMENT: AssetLicence = Object.freeze({
  source: "NASA LROC global mosaic, as listed in the planetary-explorer donor texture README",
  url: "planetary-explorer/public/textures/moon-2k.jpg",
  licence: "public domain",
  accessed: "2026-10-11",
});

export const MOON_TEXTURE: TextureRef = Object.freeze({
  url: moonTextureUrl,
  widthPx: 2048,
  heightPx: 1024,
  localOnly: Object.freeze({
    reason: "The origin of this original Moon map is unknown; the donor texture README has no source or licence entry for it.",
    publicReplacement: Object.freeze({ url: "textures/moon-2k.jpg (not copied in T-043)", licence: LROC_REPLACEMENT }),
  }),
});

export const MOON_VISUAL: BodyVisual = Object.freeze({
  kind: "sphere",
  texture: MOON_TEXTURE,
  material: MOON_MATERIAL,
  textureYawRad: 0,
  light: Object.freeze({ ambient: 0.08, directional: 1.4 }),
});

export const MOON_ENTRY = Object.freeze({ body: MOON.id, visual: MOON_VISUAL });
