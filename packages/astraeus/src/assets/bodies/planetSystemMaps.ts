import { NEPTUNE, PLUTO, SATURN, URANUS } from "../../core/bodies/outerPlanets";
import { CHARON, DEIMOS, DIONE, ENCELADUS, IAPETUS, MIMAS, PHOBOS, RHEA, TETHYS, TITAN, TRITON } from "../../core/bodies/planetMoons";
import type { AssetLicence, TextureRef } from "../licence";
import type { BodyVisual } from "../visual";
import { withPicture } from "../pictures";
import neptuneUrl from "../textures/neptune-2k.jpg";
import saturnUrl from "../textures/saturn-2k.jpg";
import uranusUrl from "../textures/uranus-2k.jpg";

/**
 * Saturn, Uranus, Neptune and Pluto, nine moons with maps, and Phobos and Deimos without (O-033 T-116). The maps are copied from Planetary Explorer
 * (the owner's own project, donor commit 84f8d3e), byte for byte where shippable (SHA-256 equal to `data/bodies/<body>/map.json`); Dione, Triton and
 * Pluto are resized to 4096x2048 because the donor files are 14,134, 14,138 and 5,926 px wide (the resize is recorded in each licence's source).
 * Sources and licences are the donor README entries recorded in each `map.json`, read 2026-10-21 from the local donor checkout; no source page was
 * opened. Pluto, Uranus, Neptune and Charon have no donor README entry: their sources are the ones Astraeus recorded in
 * `tools/import/planetary-explorer-map-sources.json` (docs/DONOR_TEXTURE_INVENTORY.md, section C). `textureYawRad` is PI for Pluto, Tethys, Dione, Rhea, Titan and Iapetus (their maps are centred on 180 E; Iapetus proved in T-130, the rest
 * measured in docs/evidence/map-audit-20261021/report.md and pinned in tests/mapOrientation.test.ts, T-131) and 0 for the rest.
 */
const accessed = "2026-10-21";
const LIGHT = Object.freeze({ ambient: 0.08, directional: 1.4 });

const solarSystemScope = (name: string, source: string): AssetLicence => Object.freeze({
  source,
  url: "https://www.solarsystemscope.com/textures/",
  licence: "CC BY 4.0",
  attribution: `${name} texture: Solar System Scope (solarsystemscope.com/textures), CC BY 4.0, based on NASA imagery`,
  accessed,
});

const sphere = (url: string, widthPx: number, heightPx: number, licence: AssetLicence, color: string, roughness: number, textureYawRad = 0): BodyVisual => Object.freeze({
  kind: "sphere",
  texture: Object.freeze<TextureRef>({ url, widthPx, heightPx, licence }),
  material: Object.freeze({ color, roughness, metalness: 0 }),
  textureYawRad,
  light: LIGHT,
});

/** A sphere whose picture (and its licence) ships in astraeus-data and is registered by name; without it the sphere is a flat colour. */
const pictured = (picture: string, color: string, roughness: number, textureYawRad = 0): BodyVisual => withPicture(picture, { kind: "sphere", material: Object.freeze({ color, roughness, metalness: 0 }), textureYawRad, light: LIGHT });

/** Phobos and Deimos: grey spheres at their mean radius, with no map (the donor draws them as dots; no map of either is shipped). */
const greyBall = (color: string): BodyVisual => Object.freeze({ kind: "sphere", material: Object.freeze({ color, roughness: 0.97, metalness: 0 }), light: LIGHT });

export const SATURN_VISUAL = sphere(saturnUrl, 2048, 1024, solarSystemScope("Saturn", "Solar System Scope Saturn texture (donor saturn-2k.jpg, derived locally from its saturn-4k.jpg, which is the 4096x2048 file the Solar System Scope download endpoint gave; donor README: License CC BY 4.0 per the Solar System Scope textures page)"), "#d8c090", 0.85);
export const URANUS_VISUAL = sphere(uranusUrl, 2048, 1024, solarSystemScope("Uranus", "Solar System Scope 2k_uranus.jpg (byte-identical to the donor's uranus-2k.jpg; no donor README entry, source recorded by Astraeus in tools/import/planetary-explorer-map-sources.json)"), "#9fd5df", 0.85);
export const NEPTUNE_VISUAL = sphere(neptuneUrl, 2048, 1024, solarSystemScope("Neptune", "Solar System Scope 2k_neptune.jpg (byte-identical to the donor's neptune-2k.jpg; no donor README entry, source recorded by Astraeus in tools/import/planetary-explorer-map-sources.json)"), "#4a6fd0", 0.85);
export const PLUTO_VISUAL = pictured("pluto", "#c4a58a", 0.95, Math.PI);

export const MIMAS_VISUAL = pictured("mimas", "#a8a8a8", 0.95);
export const ENCELADUS_VISUAL = pictured("enceladus", "#e8eef0", 0.9);
export const TETHYS_VISUAL = pictured("tethys", "#c8c8c8", 0.95, Math.PI);
export const DIONE_VISUAL = pictured("dione", "#b8b8b8", 0.95, Math.PI);
export const RHEA_VISUAL = pictured("rhea", "#b4b0aa", 0.95, Math.PI);
export const TITAN_VISUAL = pictured("titan", "#c8943c", 0.9, Math.PI);
export const IAPETUS_VISUAL = pictured("iapetus", "#8a7a6a", 0.95, Math.PI);
export const TRITON_VISUAL = pictured("triton", "#c9bfb5", 0.95);
export const CHARON_VISUAL = pictured("charon", "#8a8486", 0.95);

export const PLANET_SYSTEM_ENTRIES = Object.freeze([
  { body: SATURN.id, visual: SATURN_VISUAL },
  { body: URANUS.id, visual: URANUS_VISUAL },
  { body: NEPTUNE.id, visual: NEPTUNE_VISUAL },
  { body: PLUTO.id, visual: PLUTO_VISUAL },
  { body: PHOBOS.id, visual: greyBall("#8a8580") },
  { body: DEIMOS.id, visual: greyBall("#9a948c") },
  { body: MIMAS.id, visual: MIMAS_VISUAL },
  { body: ENCELADUS.id, visual: ENCELADUS_VISUAL },
  { body: TETHYS.id, visual: TETHYS_VISUAL },
  { body: DIONE.id, visual: DIONE_VISUAL },
  { body: RHEA.id, visual: RHEA_VISUAL },
  { body: TITAN.id, visual: TITAN_VISUAL },
  { body: IAPETUS.id, visual: IAPETUS_VISUAL },
  { body: TRITON.id, visual: TRITON_VISUAL },
  { body: CHARON.id, visual: CHARON_VISUAL },
].map((entry) => Object.freeze(entry)));
