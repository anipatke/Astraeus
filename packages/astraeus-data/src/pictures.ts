// The pictures that ship in astraeus-data, each with the licence record that travels with the file (PROV-02). The engine draws a body
// whose picture is not registered as a flat colour; registering this set (`registerPictures(PICTURES)`, which `mount` does for a data
// package passed in `data`) gives it the map. The records were moved here unchanged from the engine's `assets/bodies/*` files (O-036 T-161).
import type { AssetLicence, TextureRef } from "astraeus";
import callistoUrl from "./textures/callisto-2k.jpg";
import charonUrl from "./textures/charon-2k.jpg";
import dioneUrl from "./textures/dione-4k.jpg";
import enceladusUrl from "./textures/enceladus-4k.jpg";
import europaUrl from "./textures/europa-2k.jpg";
import ganymedeUrl from "./textures/ganymede-2k.jpg";
import iapetusUrl from "./textures/iapetus-4k.jpg";
import ioUrl from "./textures/io-2k.jpg";
import mimasUrl from "./textures/mimas-4k.jpg";
import milkyWayLeftUrl from "./textures/milky-way-left.jpg";
import milkyWayRightUrl from "./textures/milky-way-right.jpg";
import plutoUrl from "./textures/pluto-4k.jpg";
import rheaUrl from "./textures/rhea-4k.jpg";
import tethysUrl from "./textures/tethys-4k.jpg";
import titanUrl from "./textures/titan-4k.jpg";
import tritonUrl from "./textures/triton-4k.jpg";
import venus8kUrl from "./textures/venus-8k-balanced.jpg";

const picture = (url: string, widthPx: number, heightPx: number, licence: AssetLicence): TextureRef => Object.freeze({ url, widthPx, heightPx, licence });

const accessed = "2026-10-21";
const RESIZE = "resized for the load budget with ImageMagick 6.9.12 `convert -resize 4096x2048! -quality 90` on 2026-10-21";
const NASA_JPL = "NASA/JPL image use policy: credit required (donor credits list: NASA/JPL, attribution required)";

const nasa = (name: string, source: string, url: string, credit: string, licence = NASA_JPL): AssetLicence => Object.freeze({
  source, url, licence, attribution: `${name} texture: ${credit}`, accessed,
});

const LPI = "NASA/JPL-Caltech/Space Science Institute/Lunar and Planetary Institute";
const SSI = "NASA/JPL-Caltech/Space Science Institute";

/**
 * Recorded in the donor's public/textures/README.md (Galilean Moons section), read 2026-10-12 from the local donor checkout; the USGS
 * page itself was not opened, so the licence is the donor's statement of it ("public domain; source lists no use constraints").
 */
const IO_TEXTURE_LICENCE: AssetLicence = Object.freeze({
  source: "USGS Astrogeology Io Galileo SSI Global Color Merge Mosaic 1km (credit: USGS Astrogeology Science Center; NASA/JPL Galileo and Voyager missions)",
  url: "https://astrogeology.usgs.gov/search/map/io_galileo_ssi_global_color_merge_mosaic_1km",
  licence: "public domain",
  attribution: "Io texture: USGS Astrogeology Science Center; NASA/JPL Galileo and Voyager missions",
  accessed: "2026-10-12",
});

const MILKY_WAY_LICENCE: AssetLicence = Object.freeze({
  source: "The Milky Way panorama (eso0932a), ESO/S. Brunier",
  url: "https://www.eso.org/public/images/eso0932a/",
  licence: "CC BY 4.0",
  attribution: "ESO/S. Brunier. The 6000x3000 original (TIFF) was cut into two 3000x3000 halves and re-encoded as JPEG; no other change.",
  accessed: "2026-10-13",
});


// Europa, Ganymede and Callisto (donor commit 84f8d3e, 2048x1024 maps copied byte for byte).
const galileanAccessed = "2026-10-18";
const EUROPA_TEXTURE_LICENCE: AssetLicence = Object.freeze({
  source: "USGS Astrogeology Europa Voyager-Galileo SSI Global Mosaic 500m (credit: USGS Astrogeology Science Center; NASA/JPL Galileo and Voyager missions)",
  url: "https://astrogeology.usgs.gov/search/map/europa_voyager_galileo_ssi_global_mosaic_500m",
  licence: "public domain",
  attribution: "Europa texture: USGS Astrogeology Science Center; NASA/JPL Galileo and Voyager missions",
  accessed: galileanAccessed,
});

const CALLISTO_TEXTURE_LICENCE: AssetLicence = Object.freeze({
  source: "USGS/NASA Callisto Voyager-Galileo SSI global mosaic 1km (https://planetarymaps.usgs.gov/mosaic/Callisto_Voyager_GalileoSSI_global_mosaic_1km.tif)",
  url: "https://planetarymaps.usgs.gov/mosaic/Callisto_Voyager_GalileoSSI_global_mosaic_1km.tif",
  licence: "public domain",
  attribution: "Callisto texture: USGS Astrogeology Science Center; NASA/JPL Galileo and Voyager missions",
  accessed: galileanAccessed,
});

/**
 * The donor README names the source only as "the checked-in USGS/NASA Ganymede Voyager-Galileo global mosaic" with no licence line; the
 * donor's credits list files it under "USGS / NASA, Public Domain". That credits entry is the recorded licence (T-098 Drift Note).
 */
const GANYMEDE_TEXTURE_LICENCE: AssetLicence = Object.freeze({
  source: "USGS/NASA Ganymede Voyager-Galileo global mosaic, as a local 2048x1024 derivative in Planetary Explorer (donor README and credits list)",
  url: "https://astrogeology.usgs.gov/",
  licence: "public domain",
  attribution: "Ganymede texture: USGS Astrogeology Science Center; NASA/JPL Galileo and Voyager missions",
  accessed: galileanAccessed,
});


const VENUS_LICENCE: AssetLicence = Object.freeze({
  source: "USGS Astrogeology / NASA Magellan Venus C3-MDIR colorized global mosaic",
  url: "https://astrogeology.usgs.gov/search/map/Venus/Magellan/Venus_Magellan_C3MDIR_Colorized_Global_Mosaic_4641m",
  licence: "public domain",
  attribution: "Venus texture: USGS Astrogeology / NASA Magellan C3-MDIR mosaic, public domain",
  accessed: "2026-10-22",
});

/** Every picture this package ships, by the name the engine looks it up under. */
export const PICTURES: Readonly<Record<string, TextureRef>> = Object.freeze({
  io: picture(ioUrl, 2048, 1024, IO_TEXTURE_LICENCE),
  europa: picture(europaUrl, 2048, 1024, EUROPA_TEXTURE_LICENCE),
  ganymede: picture(ganymedeUrl, 2048, 1024, GANYMEDE_TEXTURE_LICENCE),
  callisto: picture(callistoUrl, 2048, 1024, CALLISTO_TEXTURE_LICENCE),
  pluto: picture(plutoUrl, 4096, 2048, nasa("Pluto", `NASA Photojournal PIA11707, New Horizons global colour map (donor pluto-4k.jpg, 5,926x2,963, no donor README entry; source recorded by Astraeus, colour RMSE 0.25% against the NASA file); ${RESIZE}. Southern third is black (unlit at flyby)`, "https://photojournal.jpl.nasa.gov/catalog/PIA11707", "NASA/JHUAPL/SwRI")),
  mimas: picture(mimasUrl, 5760, 2880, nasa("Mimas", "NASA/JPL-Caltech/Space Science Institute Mimas Global Map - June 2017 (PIA17214), clean simple-cylindrical map (donor README)", "https://www.jpl.nasa.gov/images/pia17214-mimas-global-map-june-2017/", SSI)),
  enceladus: picture(enceladusUrl, 4096, 2048, nasa("Enceladus", "NASA/JPL-Caltech/Space Science Institute/Lunar and Planetary Institute Color Maps of Enceladus - 2014 (PIA18435), donor-resized 4096x2048 (donor README)", "https://science.nasa.gov/photojournal/color-maps-of-enceladus-2014/", LPI)),
  tethys: picture(tethysUrl, 4096, 2048, nasa("Tethys", "NASA/JPL-Caltech/Space Science Institute/Lunar and Planetary Institute Color Maps of Tethys - 2014 (PIA18439), donor-resized 4096x2048 (donor README)", "https://science.nasa.gov/photojournal/color-maps-of-tethys-2014/", LPI)),
  dione: picture(dioneUrl, 4096, 2048, nasa("Dione", `NASA/JPL-Caltech/Space Science Institute/Lunar and Planetary Institute Color Maps of Dione - 2014 (PIA18434), donor file 14,134x7,067 (donor README); ${RESIZE}`, "https://pds-rings.seti.org/press_releases/pages/PIA18xxx/PIA18434.html", LPI)),
  rhea: picture(rheaUrl, 4096, 2048, nasa("Rhea", "NASA/JPL-Caltech/Space Science Institute/Lunar and Planetary Institute Color Maps of Rhea - 2014 (PIA18438), donor-resized 4096x2048 (donor README)", "https://photojournal.jpl.nasa.gov/catalog/PIA18438", LPI)),
  titan: picture(titanUrl, 4096, 2048, nasa("Titan", "NASA/JPL-Caltech/Space Science Institute Titan Global Map - June 2015 (PIA19658), Cassini ISS albedo map, longitudes labelled 360 W at the left edge (donor README)", "https://science.nasa.gov/photojournal/titan-global-map-june-2015/", SSI)),
  iapetus: picture(iapetusUrl, 4096, 2048, nasa("Iapetus", "NASA/JPL-Caltech/Space Science Institute/Lunar and Planetary Institute Color Maps of Iapetus - 2014 (PIA18436), donor-resized 4096x2048; the donor notes it is registered 180 degrees from its marker frame (donor README)", "https://commons.wikimedia.org/wiki/File:Color_map_of_Iapetus_PIA18436_Nov._2014.jpg", LPI)),
  triton: picture(tritonUrl, 4096, 2048, nasa("Triton", `NASA/JPL-Caltech/Lunar & Planetary Institute Map of Triton (PIA18668), Voyager 2 simple-cylindrical colour map via the public-domain Wikimedia copy; donor file 14,138x7,069 (donor README); ${RESIZE}`, "https://pds-rings.seti.org/press_releases/pages/PIA18xxx/PIA18668.html", "NASA/JPL-Caltech/Lunar & Planetary Institute")),
  charon: picture(charonUrl, 1024, 512, nasa("Charon", "USGS Astrogeology, Charon New Horizons LORRI MVIC Global Mosaic 300 m (Jul 2017), 1024 px preview JPG (byte-identical to the donor's charon-2k.jpg; no donor README entry, source recorded by Astraeus)", "https://astrogeology.usgs.gov/", "New Horizons team; NASA, JHUAPL, SwRI, LPI; USGS Astrogeology 2017", "USGS use constraint: please cite authors")),
  "venus-8k": picture(venus8kUrl, 8192, 4096, VENUS_LICENCE),
  "milky-way-left": picture(milkyWayLeftUrl, 3000, 3000, MILKY_WAY_LICENCE),
  "milky-way-right": picture(milkyWayRightUrl, 3000, 3000, MILKY_WAY_LICENCE),
});

/** The bodies that gain a map from this package (the others in `PICTURES` are the sky and Venus's wide-screen file). */
export const PICTURED_BODIES: readonly string[] = Object.freeze(["io", "europa", "ganymede", "callisto", "mimas", "enceladus", "tethys", "dione", "rhea", "titan", "iapetus", "triton", "pluto", "charon"]);
