// The sky behind every experience: directions at infinity in the EQJ (J2000 equatorial) frame. Frame layer only; it never
// touches State (ARCH-02). The stars come from the committed HYG file (tools/data/fetch-hyg-stars.mjs, CC BY-SA 4.0); the Milky Way image is committed
// with its licence (PROV-02).
import type { AssetLicence, TextureRef } from "./licence";
import hygStarsUrl from "./stars/hyg-v42-naked-eye.json?url";
import milkyWayLeftUrl from "./textures/milky-way-left.jpg";
import milkyWayRightUrl from "./textures/milky-way-right.jpg";

const RAD = Math.PI / 180;

// ---------------------------------------------------------------- galactic frame

/** IAU 1958 galactic frame carried to J2000 (Astropy `galactic.py`, citing Blaauw et al. 1960; read 2026-10-13). */
export const GALACTIC_NORTH_POLE = Object.freeze({ raDeg: 192.8594812065348, decDeg: 27.12825118085622 });
/** Galactic longitude of the north celestial pole. */
export const NORTH_CELESTIAL_POLE_LONGITUDE_DEG = 122.9319185680026;
/** The galactic centre (l = 0, b = 0) in J2000, as the record computed it from the constants above. */
export const GALACTIC_CENTRE = Object.freeze({ raDeg: 266.405, decDeg: -28.936 });

type Vec3 = [number, number, number];
const dot = (a: ArrayLike<number>, b: ArrayLike<number>): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** Unit vector in EQJ for a right ascension and declination in degrees. */
export function eqjUnit(raDeg: number, decDeg: number): Vec3 {
  const ra = raDeg * RAD;
  const dec = decDeg * RAD;
  return [Math.cos(dec) * Math.cos(ra), Math.cos(dec) * Math.sin(ra), Math.sin(dec)];
}

/** The galactic axes in EQJ: x toward the centre (l = 0), y toward l = 90, z the north pole. */
export function galacticAxes(): { readonly x: Vec3; readonly y: Vec3; readonly z: Vec3 } {
  const z = eqjUnit(GALACTIC_NORTH_POLE.raDeg, GALACTIC_NORTH_POLE.decDeg);
  // The north celestial pole sits at galactic longitude l_NCP; its component perpendicular to z fixes x and y.
  const k = dot([0, 0, 1], z);
  const perpendicular: Vec3 = [-k * z[0], -k * z[1], 1 - k * z[2]];
  const length = Math.hypot(...perpendicular);
  const p = perpendicular.map((value) => value / length) as Vec3;
  const h = cross(z, p);
  const l = NORTH_CELESTIAL_POLE_LONGITUDE_DEG * RAD;
  const x = p.map((value, i) => Math.cos(l) * value - Math.sin(l) * h[i]) as Vec3;
  const y = p.map((value, i) => Math.sin(l) * value + Math.cos(l) * h[i]) as Vec3;
  return { x, y, z };
}

const AXES = galacticAxes();

/** EQJ unit vector of a galactic longitude and latitude, in degrees. */
export function galacticToEqj(lDeg: number, bDeg: number): Vec3 {
  const l = lDeg * RAD;
  const b = bDeg * RAD;
  const gx = Math.cos(b) * Math.cos(l);
  const gy = Math.cos(b) * Math.sin(l);
  const gz = Math.sin(b);
  return [0, 1, 2].map((i) => gx * AXES.x[i] + gy * AXES.y[i] + gz * AXES.z[i]) as Vec3;
}

/** Galactic longitude (-180..180) and latitude, in degrees, of an EQJ direction. */
export function eqjToGalactic(eqj: ArrayLike<number>): [lDeg: number, bDeg: number] {
  const length = Math.hypot(eqj[0], eqj[1], eqj[2]);
  const unit: Vec3 = [eqj[0] / length, eqj[1] / length, eqj[2] / length];
  return [Math.atan2(dot(unit, AXES.y), dot(unit, AXES.x)) / RAD, Math.asin(Math.max(-1, Math.min(1, dot(unit, AXES.z)))) / RAD];
}

/** The picture is equirectangular and galactic: longitude 0 at the centre, increasing leftwards; latitude +90 at the top. */
export function milkyWayUv(eqj: ArrayLike<number>): [u: number, v: number] {
  const [l, b] = eqjToGalactic(eqj);
  return [0.5 - l / 360, 0.5 + b / 180];
}

/** Equatorial J2000 equirectangular picture (NASA SVS): RA 0h at the centre, increasing leftwards; declination +90 at the top. */
export function equatorialUv(eqj: ArrayLike<number>): [u: number, v: number] {
  const length = Math.hypot(eqj[0], eqj[1], eqj[2]);
  const raDeg = Math.atan2(eqj[1], eqj[0]) / RAD; // -180..180
  const decDeg = Math.asin(Math.max(-1, Math.min(1, eqj[2] / length))) / RAD;
  return [0.5 - raDeg / 360, 0.5 + decDeg / 180];
}

// ---------------------------------------------------------------- picture sources (tiled, any size)

/** The frame a picture is registered in: `galactic` (the ESO panorama) or `equatorial-j2000` (the NASA map, exact, no rotation). */
export type PictureFrame = "galactic" | "equatorial-j2000";
export const PICTURE_FRAMES: readonly PictureFrame[] = Object.freeze(["galactic", "equatorial-j2000"]);
/** The sources the `?skymap=` setting names; `nasa` is local-only and falls back to `eso` when it has not been fetched. */
export const SKY_MAP_SOURCES = Object.freeze(["nasa", "eso"] as const);
export type SkyMapSource = (typeof SKY_MAP_SOURCES)[number];
/** The most a tile may measure on a side: phone GPUs commonly cap textures at 4096. */
export const MAX_TILE_PX = 4096;

export interface PictureTile {
  readonly column: number;
  readonly row: number;
  readonly url: string;
  readonly widthPx: number;
  readonly heightPx: number;
}

/** A picture ready to draw: a grid of tiles (column 0 at the left, row 0 at the top) in one frame. */
export interface PictureSet {
  readonly id: SkyMapSource;
  readonly name: string;
  readonly frame: PictureFrame;
  readonly columns: number;
  readonly rows: number;
  readonly tiles: readonly PictureTile[];
  /** Strength relative to the baseline (the NASA map has the catalogue stars baked in, so it is drawn weaker). */
  readonly gain: number;
  readonly credit: string;
  readonly licence: string;
  readonly source: string;
}

/** Validates a tile manifest written by `tools/data/fetch-sky-map.mjs` (schema 1) and returns the picture it describes; throws naming the problem. */
export function parseSkyManifest(json: unknown, baseUrl: string): PictureSet {
  const m = json as Record<string, any> | null;
  if (m === null || typeof m !== "object" || m.schema !== 1) throw new TypeError("sky manifest needs schema 1");
  if (!PICTURE_FRAMES.includes(m.frame)) throw new RangeError(`sky manifest frame must be one of ${PICTURE_FRAMES.join(", ")}, got ${String(m.frame)}`);
  for (const key of ["name", "source", "credit", "licence"]) if (typeof m[key] !== "string" || m[key] === "") throw new TypeError(`sky manifest needs a ${key}`);
  const { columns, rows } = (m.grid ?? {}) as { columns?: number; rows?: number };
  if (!Number.isInteger(columns) || !Number.isInteger(rows) || (columns as number) < 1 || (rows as number) < 1) throw new RangeError("sky manifest grid needs whole columns and rows");
  const { widthPx, heightPx, tilePx } = m;
  if (![widthPx, heightPx, tilePx].every((n) => Number.isInteger(n) && n > 0)) throw new RangeError("sky manifest needs whole widthPx, heightPx and tilePx");
  if (tilePx > MAX_TILE_PX) throw new RangeError(`sky manifest tilePx ${tilePx} exceeds the ${MAX_TILE_PX} px texture limit`);
  if (Math.ceil(widthPx / tilePx) !== columns || Math.ceil(heightPx / tilePx) !== rows) throw new RangeError("sky manifest grid does not match the picture and tile size");
  if (widthPx !== 2 * heightPx) throw new RangeError("sky manifest picture must be equirectangular (width twice the height)");
  if (!Array.isArray(m.tiles) || m.tiles.length !== (columns as number) * (rows as number)) throw new RangeError("sky manifest needs one tile per grid cell");
  const seen = new Set<string>();
  const tiles = m.tiles.map((tile: any, index: number): PictureTile => {
    const ok = tile !== null && typeof tile === "object" && Number.isInteger(tile.column) && Number.isInteger(tile.row)
      && tile.column >= 0 && tile.column < (columns as number) && tile.row >= 0 && tile.row < (rows as number) && typeof tile.file === "string" && /^[\w.-]+$/.test(tile.file);
    if (!ok) throw new RangeError(`sky manifest tile ${index} needs an in-grid column and row and a plain file name`);
    const key = `${tile.column},${tile.row}`;
    if (seen.has(key)) throw new RangeError(`sky manifest lists tile ${key} twice`);
    seen.add(key);
    return {
      column: tile.column,
      row: tile.row,
      url: baseUrl + tile.file,
      widthPx: Math.min(tilePx, widthPx - tile.column * tilePx),
      heightPx: Math.min(tilePx, heightPx - tile.row * tilePx),
    };
  });
  const gain = m.gain === undefined ? 1 : m.gain;
  if (!Number.isFinite(gain) || gain < 0 || gain > 2) throw new RangeError("sky manifest gain must be between 0 and 2");
  return { id: "nasa", name: m.name, frame: m.frame, columns: columns as number, rows: rows as number, tiles, gain, credit: m.credit, licence: m.licence, source: m.source };
}

/** The picture-space position (0..1, v up) of an EQJ direction in a frame. */
export function pictureUv(frame: PictureFrame, eqj: ArrayLike<number>): [u: number, v: number] {
  return frame === "galactic" ? milkyWayUv(eqj) : equatorialUv(eqj);
}

/** The tile and pixel (from the tile's top-left corner) where an EQJ direction falls in a tiled picture, as continuous pixel coordinates. */
export function pictureTexel(frame: PictureFrame, widthPx: number, heightPx: number, tilePx: number, eqj: ArrayLike<number>): { column: number; row: number; x: number; y: number } {
  const [u, v] = pictureUv(frame, eqj);
  const px = Math.min(widthPx - 1e-9, Math.max(0, u * widthPx));
  const py = Math.min(heightPx - 1e-9, Math.max(0, (1 - v) * heightPx));
  const column = Math.floor(px / tilePx);
  const row = Math.floor(py / tilePx);
  return { column, row, x: px - column * tilePx, y: py - row * tilePx };
}

// ---------------------------------------------------------------- stars

/** One catalogue row: J2000 right ascension and declination (degrees), V magnitude, B-V colour index (null when unknown). */
export type StarRow = readonly [raDeg: number, decDeg: number, vMag: number, bMinusV: number | null];

export interface StarCatalogue {
  readonly stars: readonly StarRow[];
  /** The file's own provenance header, if it has one. */
  readonly provenance?: Readonly<Record<string, unknown>>;
}

/** Validates a parsed star file (`{ provenance?, stars: [[ra, dec, v, bv|null], ...] }`); throws naming the first bad row. */
export function parseStarFile(json: unknown): StarCatalogue {
  const file = json as { stars?: unknown; provenance?: unknown } | null;
  if (file === null || typeof file !== "object" || !Array.isArray(file.stars)) throw new TypeError("star file needs a stars array");
  file.stars.forEach((row: unknown, index: number) => {
    const ok = Array.isArray(row) && row.length === 4
      && [0, 1, 2].every((i) => Number.isFinite(row[i]))
      && (row[3] === null || Number.isFinite(row[3]))
      && row[1] >= -90 && row[1] <= 90;
    if (!ok) throw new RangeError(`star ${index} must be [raDeg, decDeg, vMag, bMinusV|null]`);
  });
  const provenance = file.provenance !== null && typeof file.provenance === "object" ? (file.provenance as Record<string, unknown>) : undefined;
  return { stars: file.stars as StarRow[], ...(provenance === undefined ? {} : { provenance }) };
}

/** Rights for the committed HYG star file (PROV-02). The licence covers the star file only; the Astraeus code is MIT. */
export const HYG_STAR_LICENCE: AssetLicence = Object.freeze({
  source: "HYG database v4.2 (Hipparcos, Yale Bright Star, Gliese catalogues), astronexus",
  url: "https://www.astronexus.com/projects/hyg",
  licence: "CC BY-SA 4.0",
  attribution: "HYG database v4.2, astronexus (astronexus.com), CC BY-SA 4.0. Stars of V 6.5 or brighter kept, right ascension converted from hours to degrees; no other change.",
  accessed: "2026-10-16",
});

let starRequest: Promise<StarCatalogue | null> | undefined;

async function fetchStarFile(url: string): Promise<StarCatalogue | null> {
  try {
    const response = await fetch(url);
    return response.ok ? parseStarFile(JSON.parse(await response.text())) : null;
  } catch {
    return null;
  }
}

/** The star catalogue: the committed HYG file served with the app. Absent (null) when it cannot be read or is not a valid star file. */
export function loadStarCatalogue(): Promise<StarCatalogue | null> {
  starRequest ??= fetchStarFile(hygStarsUrl);
  return starRequest;
}

/** Temperature in kelvin from B-V (Ballesteros 2012). */
export function temperatureFromBV(bMinusV: number): number {
  return 4600 * (1 / (0.92 * bMinusV + 1.7) + 1 / (0.92 * bMinusV + 0.62));
}

/** sRGB 0..1 for a blackbody temperature (Tanner Helland's fit), blended halfway to white so the tints stay subtle. */
export function colourFromTemperature(kelvin: number): [number, number, number] {
  const t = Math.min(40000, Math.max(1000, kelvin)) / 100;
  const r = t <= 66 ? 255 : 329.698727446 * (t - 60) ** -0.1332047592;
  const g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * (t - 60) ** -0.0755148492;
  const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  const clamp = (value: number) => Math.min(255, Math.max(0, value)) / 255;
  return [clamp(r), clamp(g), clamp(b)].map((value) => 0.5 + 0.5 * value) as [number, number, number];
}

/**
 * Star width and brightness (0..1) from V magnitude. `sizePx` is the full width at half maximum of the star's bright core in CSS
 * pixels (never below 1.5, so the faintest star is still a visible point); brighter stars are wider and stronger.
 */
export function starAppearance(vMag: number): { readonly sizePx: number; readonly brightness: number } {
  const x = Math.min(1, Math.max(0, (6.5 - vMag) / 8));
  return { sizePx: 1.5 + 2.9 * x ** 0.9, brightness: 0.3 + 0.7 * x ** 0.55 };
}

// ---------------------------------------------------------------- sources and the shell item

export const MILKY_WAY_LICENCE: AssetLicence = Object.freeze({
  source: "The Milky Way panorama (eso0932a), ESO/S. Brunier",
  url: "https://www.eso.org/public/images/eso0932a/",
  licence: "CC BY 4.0",
  attribution: "ESO/S. Brunier. The 6000x3000 original (TIFF) was cut into two 3000x3000 halves and re-encoded as JPEG; no other change.",
  accessed: "2026-10-13",
});

/** The picture in two square halves, left (longitude 180 to 0, running to the centre) then right; each is under every GPU's texture limit. */
export const MILKY_WAY_TILES: readonly TextureRef[] = Object.freeze([
  Object.freeze({ url: milkyWayLeftUrl, widthPx: 3000, heightPx: 3000, licence: MILKY_WAY_LICENCE }),
  Object.freeze({ url: milkyWayRightUrl, widthPx: 3000, heightPx: 3000, licence: MILKY_WAY_LICENCE }),
]);

/** The ESO panorama as a two-tile galactic picture: the fallback, and the only source that may be shipped. */
export const ESO_PICTURE: PictureSet = Object.freeze({
  id: "eso",
  name: "ESO Milky Way panorama (eso0932a)",
  frame: "galactic",
  columns: 2,
  rows: 1,
  tiles: Object.freeze(MILKY_WAY_TILES.map((tile, column) => Object.freeze({ column, row: 0, url: tile.url, widthPx: tile.widthPx, heightPx: tile.heightPx }))),
  gain: 1,
  credit: "ESO/S. Brunier",
  licence: "CC BY 4.0",
  source: MILKY_WAY_LICENCE.url,
});

/** Where `tools/data/fetch-sky-map.mjs` writes the NASA tiles and manifest; local only, never read in a production build. */
export const LOCAL_NASA_SKY_DIR = "/data/local/sky/nasa/";
export const FETCH_SKY_MAP_COMMAND = "node tools/data/fetch-sky-map.mjs";

/** Default source: the ESO panorama (owner decision 2026-10-16: "use ESO, give credit"). The NASA map is local-only, by `?skymap=nasa` or the setting. */
export const DEFAULT_SKY_MAP: SkyMapSource = "eso";

/**
 * The picture for a source. `nasa` reads the local manifest and falls back to ESO when it is absent, invalid, a production build, or
 * the dev server answered with its page; `eso` is always the committed panorama. The returned set's `id` is the source actually used.
 */
export async function loadPictureSet(source: SkyMapSource, fetcher: typeof fetch = fetch, production: boolean = import.meta.env.PROD): Promise<PictureSet> {
  if (source === "eso" || production) return ESO_PICTURE;
  try {
    const response = await fetcher(`${LOCAL_NASA_SKY_DIR}manifest.json`);
    if (!response.ok) return ESO_PICTURE;
    return parseSkyManifest(JSON.parse(await response.text()), LOCAL_NASA_SKY_DIR);
  } catch {
    return ESO_PICTURE;
  }
}

export const SKY_SOURCES: readonly string[] = Object.freeze([
  "HYG star database v4.2 (Hipparcos, Yale Bright Star, Gliese catalogues), astronexus (https://www.astronexus.com/projects/hyg), CC BY-SA 4.0. The star file only; the code is MIT.",
  "The Milky Way panorama, ESO/S. Brunier (https://www.eso.org/public/images/eso0932a/), CC BY 4.0.",
  "Deep Star Maps 2020, NASA/Goddard Space Flight Center Scientific Visualization Studio (https://svs.gsfc.nasa.gov/4851); Gaia DR2: ESA/Gaia/DPAC. Fetched to this machine only; drawn only when asked for with ?skymap=nasa or the sky.source setting (the default picture is the ESO panorama).",
]);


// ---------------------------------------------------------------- settings

/** What an experience may say about the sky: all fields optional, default on at full brightness, with the Milky Way picture off. */
export interface SkySettings {
  readonly visible?: boolean;
  /** Scales the catalogue stars, 0 to 2; 1 is the baseline star curve and 0 hides them in effect. Defaults to 1. */
  readonly starBrightness?: number;
  /** Scales the Milky Way picture, 0 to 2; 1 is the baseline strength. Defaults to 1. */
  readonly milkyWayBrightness?: number;
  /** Whether the Milky Way picture is drawn behind the stars. Defaults to false (owner decision, 2026-10-15); the catalogue stars are drawn either way. */
  readonly milkyWay?: boolean;
  /** Which picture: `nasa` (local only; falls back to `eso` when not fetched) or `eso`. Defaults to `eso`. `?skymap=` overrides it. */
  readonly source?: SkyMapSource;
}

