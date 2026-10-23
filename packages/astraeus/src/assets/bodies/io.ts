import { IO } from "../../core/bodies/io";
import type { AssetLicence, TextureRef } from "../licence";
import type { BodyMaterialConfig, BodyVisual } from "../visual";
import ioTextureUrl from "../textures/io-2k.jpg";

/** Donor material (src/entities/io.ts), used as the flat colour while the texture loads and as the shell colour. */
export const IO_MATERIAL: BodyMaterialConfig = Object.freeze({ color: "#d4b840", roughness: 0.92, metalness: 0 });

/**
 * Recorded in the donor's public/textures/README.md (Galilean Moons section), read 2026-10-12 from the local donor checkout; the USGS
 * page itself was not opened, so the licence is the donor's statement of it ("public domain; source lists no use constraints").
 */
export const IO_TEXTURE_LICENCE: AssetLicence = Object.freeze({
  source: "USGS Astrogeology Io Galileo SSI Global Color Merge Mosaic 1km (credit: USGS Astrogeology Science Center; NASA/JPL Galileo and Voyager missions)",
  url: "https://astrogeology.usgs.gov/search/map/io_galileo_ssi_global_color_merge_mosaic_1km",
  licence: "public domain",
  attribution: "Io texture: USGS Astrogeology Science Center; NASA/JPL Galileo and Voyager missions",
  accessed: "2026-10-12",
});

/** The donor's 2048x1024 derivative: mixed native resolution, visible mosaic boundaries, interpolated polar coverage, enhanced colours. */
export const IO_TEXTURE: TextureRef = Object.freeze({
  url: ioTextureUrl,
  widthPx: 2048,
  heightPx: 1024,
  licence: IO_TEXTURE_LICENCE,
});

export const IO_VISUAL: BodyVisual = Object.freeze({
  kind: "sphere",
  texture: IO_TEXTURE,
  material: IO_MATERIAL,
  textureYawRad: 0,
  light: Object.freeze({ ambient: 0.08, directional: 1.4 }),
});

export const IO_ENTRY = Object.freeze({ body: IO.id, visual: IO_VISUAL });
