import { NEPTUNE, PLUTO, SATURN, URANUS } from "../../core/bodies/outerPlanets";
import { CHARON, DEIMOS, DIONE, ENCELADUS, IAPETUS, MIMAS, PHOBOS, RHEA, TETHYS, TITAN, TRITON } from "../../core/bodies/planetMoons";
import type { AssetLicence, TextureRef } from "../licence";
import type { BodyVisual } from "../visual";
import charonUrl from "../textures/charon-2k.jpg";
import dioneUrl from "../textures/dione-4k.jpg";
import enceladusUrl from "../textures/enceladus-4k.jpg";
import iapetusUrl from "../textures/iapetus-4k.jpg";
import mimasUrl from "../textures/mimas-4k.jpg";
import neptuneUrl from "../textures/neptune-2k.jpg";
import plutoUrl from "../textures/pluto-4k.jpg";
import rheaUrl from "../textures/rhea-4k.jpg";
import saturnUrl from "../textures/saturn-2k.jpg";
import tethysUrl from "../textures/tethys-4k.jpg";
import titanUrl from "../textures/titan-4k.jpg";
import tritonUrl from "../textures/triton-4k.jpg";
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
const RESIZE = "resized for the load budget with ImageMagick 6.9.12 `convert -resize 4096x2048! -quality 90` on 2026-10-21";
const NASA_JPL = "NASA/JPL image use policy: credit required (donor credits list: NASA/JPL, attribution required)";

const solarSystemScope = (name: string, source: string): AssetLicence => Object.freeze({
  source,
  url: "https://www.solarsystemscope.com/textures/",
  licence: "CC BY 4.0",
  attribution: `${name} texture: Solar System Scope (solarsystemscope.com/textures), CC BY 4.0, based on NASA imagery`,
  accessed,
});

const nasa = (name: string, source: string, url: string, credit: string, licence = NASA_JPL): AssetLicence => Object.freeze({
  source, url, licence, attribution: `${name} texture: ${credit}`, accessed,
});

const LPI = "NASA/JPL-Caltech/Space Science Institute/Lunar and Planetary Institute";
const SSI = "NASA/JPL-Caltech/Space Science Institute";

const sphere = (url: string, widthPx: number, heightPx: number, licence: AssetLicence, color: string, roughness: number, textureYawRad = 0): BodyVisual => Object.freeze({
  kind: "sphere",
  texture: Object.freeze<TextureRef>({ url, widthPx, heightPx, licence }),
  material: Object.freeze({ color, roughness, metalness: 0 }),
  textureYawRad,
  light: LIGHT,
});

/** Phobos and Deimos: grey spheres at their mean radius, with no map (the donor draws them as dots; no map of either is shipped). */
const greyBall = (color: string): BodyVisual => Object.freeze({ kind: "sphere", material: Object.freeze({ color, roughness: 0.97, metalness: 0 }), light: LIGHT });

export const SATURN_VISUAL = sphere(saturnUrl, 2048, 1024, solarSystemScope("Saturn", "Solar System Scope Saturn texture (donor saturn-2k.jpg, derived locally from its saturn-4k.jpg, which is the 4096x2048 file the Solar System Scope download endpoint gave; donor README: License CC BY 4.0 per the Solar System Scope textures page)"), "#d8c090", 0.85);
export const URANUS_VISUAL = sphere(uranusUrl, 2048, 1024, solarSystemScope("Uranus", "Solar System Scope 2k_uranus.jpg (byte-identical to the donor's uranus-2k.jpg; no donor README entry, source recorded by Astraeus in tools/import/planetary-explorer-map-sources.json)"), "#9fd5df", 0.85);
export const NEPTUNE_VISUAL = sphere(neptuneUrl, 2048, 1024, solarSystemScope("Neptune", "Solar System Scope 2k_neptune.jpg (byte-identical to the donor's neptune-2k.jpg; no donor README entry, source recorded by Astraeus in tools/import/planetary-explorer-map-sources.json)"), "#4a6fd0", 0.85);
export const PLUTO_VISUAL = sphere(plutoUrl, 4096, 2048, nasa("Pluto", `NASA Photojournal PIA11707, New Horizons global colour map (donor pluto-4k.jpg, 5,926x2,963, no donor README entry; source recorded by Astraeus, colour RMSE 0.25% against the NASA file); ${RESIZE}. Southern third is black (unlit at flyby)`, "https://photojournal.jpl.nasa.gov/catalog/PIA11707", "NASA/JHUAPL/SwRI"), "#c4a58a", 0.95, Math.PI);

export const MIMAS_VISUAL = sphere(mimasUrl, 5760, 2880, nasa("Mimas", "NASA/JPL-Caltech/Space Science Institute Mimas Global Map - June 2017 (PIA17214), clean simple-cylindrical map (donor README)", "https://www.jpl.nasa.gov/images/pia17214-mimas-global-map-june-2017/", SSI), "#a8a8a8", 0.95);
export const ENCELADUS_VISUAL = sphere(enceladusUrl, 4096, 2048, nasa("Enceladus", "NASA/JPL-Caltech/Space Science Institute/Lunar and Planetary Institute Color Maps of Enceladus - 2014 (PIA18435), donor-resized 4096x2048 (donor README)", "https://science.nasa.gov/photojournal/color-maps-of-enceladus-2014/", LPI), "#e8eef0", 0.9);
export const TETHYS_VISUAL = sphere(tethysUrl, 4096, 2048, nasa("Tethys", "NASA/JPL-Caltech/Space Science Institute/Lunar and Planetary Institute Color Maps of Tethys - 2014 (PIA18439), donor-resized 4096x2048 (donor README)", "https://science.nasa.gov/photojournal/color-maps-of-tethys-2014/", LPI), "#c8c8c8", 0.95, Math.PI);
export const DIONE_VISUAL = sphere(dioneUrl, 4096, 2048, nasa("Dione", `NASA/JPL-Caltech/Space Science Institute/Lunar and Planetary Institute Color Maps of Dione - 2014 (PIA18434), donor file 14,134x7,067 (donor README); ${RESIZE}`, "https://pds-rings.seti.org/press_releases/pages/PIA18xxx/PIA18434.html", LPI), "#b8b8b8", 0.95, Math.PI);
export const RHEA_VISUAL = sphere(rheaUrl, 4096, 2048, nasa("Rhea", "NASA/JPL-Caltech/Space Science Institute/Lunar and Planetary Institute Color Maps of Rhea - 2014 (PIA18438), donor-resized 4096x2048 (donor README)", "https://photojournal.jpl.nasa.gov/catalog/PIA18438", LPI), "#b4b0aa", 0.95, Math.PI);
export const TITAN_VISUAL = sphere(titanUrl, 4096, 2048, nasa("Titan", "NASA/JPL-Caltech/Space Science Institute Titan Global Map - June 2015 (PIA19658), Cassini ISS albedo map, longitudes labelled 360 W at the left edge (donor README)", "https://science.nasa.gov/photojournal/titan-global-map-june-2015/", SSI), "#c8943c", 0.9, Math.PI);
export const IAPETUS_VISUAL = sphere(iapetusUrl, 4096, 2048, nasa("Iapetus", "NASA/JPL-Caltech/Space Science Institute/Lunar and Planetary Institute Color Maps of Iapetus - 2014 (PIA18436), donor-resized 4096x2048; the donor notes it is registered 180 degrees from its marker frame (donor README)", "https://commons.wikimedia.org/wiki/File:Color_map_of_Iapetus_PIA18436_Nov._2014.jpg", LPI), "#8a7a6a", 0.95, Math.PI);
export const TRITON_VISUAL = sphere(tritonUrl, 4096, 2048, nasa("Triton", `NASA/JPL-Caltech/Lunar & Planetary Institute Map of Triton (PIA18668), Voyager 2 simple-cylindrical colour map via the public-domain Wikimedia copy; donor file 14,138x7,069 (donor README); ${RESIZE}`, "https://pds-rings.seti.org/press_releases/pages/PIA18xxx/PIA18668.html", "NASA/JPL-Caltech/Lunar & Planetary Institute"), "#c9bfb5", 0.95);
export const CHARON_VISUAL = sphere(charonUrl, 1024, 512, nasa("Charon", "USGS Astrogeology, Charon New Horizons LORRI MVIC Global Mosaic 300 m (Jul 2017), 1024 px preview JPG (byte-identical to the donor's charon-2k.jpg; no donor README entry, source recorded by Astraeus)", "https://astrogeology.usgs.gov/", "New Horizons team; NASA, JHUAPL, SwRI, LPI; USGS Astrogeology 2017", "USGS use constraint: please cite authors"), "#8a8486", 0.95);

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
