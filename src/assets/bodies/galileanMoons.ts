import { CALLISTO, EUROPA, GANYMEDE } from "../../core/bodies/jupiterMoons";
import type { AssetLicence, TextureRef } from "../licence";
import type { BodyMaterialConfig, BodyVisual } from "../visual";
import callistoTextureUrl from "../textures/callisto-2k.jpg";
import europaTextureUrl from "../textures/europa-2k.jpg";
import ganymedeTextureUrl from "../textures/ganymede-2k.jpg";

/**
 * Europa, Ganymede and Callisto as Planetary Explorer draws them (the owner's own project, donor commit 84f8d3e): the donor's 2048x1024
 * maps copied byte for byte (SHA-256 equal to data/bodies/<moon>/map.json) and the donor materials, lit like Io. Sources and licences are
 * the donor's public/textures/README.md entries, read 2026-10-18 from the local donor checkout; the USGS pages were not opened.
 */
const accessed = "2026-10-18";

export const EUROPA_TEXTURE_LICENCE: AssetLicence = Object.freeze({
  source: "USGS Astrogeology Europa Voyager-Galileo SSI Global Mosaic 500m (credit: USGS Astrogeology Science Center; NASA/JPL Galileo and Voyager missions)",
  url: "https://astrogeology.usgs.gov/search/map/europa_voyager_galileo_ssi_global_mosaic_500m",
  licence: "public domain",
  attribution: "Europa texture: USGS Astrogeology Science Center; NASA/JPL Galileo and Voyager missions",
  accessed,
});

export const CALLISTO_TEXTURE_LICENCE: AssetLicence = Object.freeze({
  source: "USGS/NASA Callisto Voyager-Galileo SSI global mosaic 1km (https://planetarymaps.usgs.gov/mosaic/Callisto_Voyager_GalileoSSI_global_mosaic_1km.tif)",
  url: "https://planetarymaps.usgs.gov/mosaic/Callisto_Voyager_GalileoSSI_global_mosaic_1km.tif",
  licence: "public domain",
  attribution: "Callisto texture: USGS Astrogeology Science Center; NASA/JPL Galileo and Voyager missions",
  accessed,
});

/**
 * The donor README names the source only as "the checked-in USGS/NASA Ganymede Voyager-Galileo global mosaic" with no licence line; the
 * donor's credits list files it under "USGS / NASA, Public Domain". That credits entry is the recorded licence (T-098 Drift Note).
 */
export const GANYMEDE_TEXTURE_LICENCE: AssetLicence = Object.freeze({
  source: "USGS/NASA Ganymede Voyager-Galileo global mosaic, as a local 2048x1024 derivative in Planetary Explorer (donor README and credits list)",
  url: "https://astrogeology.usgs.gov/",
  licence: "public domain",
  attribution: "Ganymede texture: USGS Astrogeology Science Center; NASA/JPL Galileo and Voyager missions",
  accessed,
});

const texture = (url: string, licence: AssetLicence): TextureRef => Object.freeze({ url, widthPx: 2048, heightPx: 1024, licence });
const LIGHT = Object.freeze({ ambient: 0.08, directional: 1.4 });
const visual = (tex: TextureRef, material: BodyMaterialConfig, textureYawRad: number): BodyVisual => Object.freeze({ kind: "sphere", texture: tex, material: Object.freeze(material), textureYawRad, light: LIGHT });

export const EUROPA_VISUAL = visual(texture(europaTextureUrl, EUROPA_TEXTURE_LICENCE), { color: "#c8b898", roughness: 0.96, metalness: 0 }, 0);
/** The donor's Ganymede picture is recentred by 180 degrees against the mosaic (data/bodies/ganymede/map.json textureRecentringDeg), so it is turned back half a turn to share Io's convention. */
export const GANYMEDE_VISUAL = visual(texture(ganymedeTextureUrl, GANYMEDE_TEXTURE_LICENCE), { color: "#887868", roughness: 0.95, metalness: 0 }, Math.PI);
export const CALLISTO_VISUAL = visual(texture(callistoTextureUrl, CALLISTO_TEXTURE_LICENCE), { color: "#606070", roughness: 0.97, metalness: 0 }, 0);

export const GALILEAN_ENTRIES = Object.freeze([
  Object.freeze({ body: EUROPA.id, visual: EUROPA_VISUAL }),
  Object.freeze({ body: GANYMEDE.id, visual: GANYMEDE_VISUAL }),
  Object.freeze({ body: CALLISTO.id, visual: CALLISTO_VISUAL }),
]);
