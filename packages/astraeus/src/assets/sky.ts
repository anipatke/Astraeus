// The sky behind every experience: directions at infinity in the EQJ (J2000 equatorial) frame. Frame layer only; it never
// touches State (ARCH-02). The stars come from the committed HYG file (tools/data/fetch-hyg-stars.mjs, CC BY-SA 4.0); the Milky Way image is committed
// with its licence (PROV-02).
import type { AssetLicence, TextureRef } from "./licence";
import hygStarsUrl from "./stars/hyg-v42-naked-eye.json?url";
import { pictureOf } from "./pictures";

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

// ---------------------------------------------------------------- picture (tiled)

/** The most a tile may measure on a side: phone GPUs commonly cap textures at 4096. */
export const MAX_TILE_PX = 4096;

export interface PictureTile {
  readonly column: number;
  readonly row: number;
  readonly url: string;
  readonly widthPx: number;
  readonly heightPx: number;
}

/** A picture ready to draw: a grid of tiles (column 0 at the left, row 0 at the top), registered in the galactic frame. */
export interface PictureSet {
  readonly name: string;
  readonly columns: number;
  readonly rows: number;
  readonly tiles: readonly PictureTile[];
  readonly credit: string;
  readonly licence: string;
  readonly source: string;
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

/**
 * The picture in two square halves, left (longitude 180 to 0, running to the centre) then right; each is under every GPU's texture limit.
 * The files ship in astraeus-data (names "milky-way-left", "milky-way-right"); without that package the list is empty and no picture is drawn.
 */
export const milkyWayTiles = (): readonly TextureRef[] => ["milky-way-left", "milky-way-right"].flatMap((name) => pictureOf(name) ?? []);

/** The ESO panorama as a two-tile galactic picture: the one Milky Way picture. */
export const ESO_PICTURE: PictureSet = Object.freeze<PictureSet>({
  name: "ESO Milky Way panorama (eso0932a)",
  columns: 2,
  rows: 1,
  get tiles(): readonly PictureTile[] {
    const halves = milkyWayTiles();
    return halves.length < 2 ? [] : halves.map((tile, column) => Object.freeze({ column, row: 0, url: tile.url, widthPx: tile.widthPx, heightPx: tile.heightPx }));
  },
  credit: "ESO/S. Brunier",
  licence: "CC BY 4.0",
  source: "https://www.eso.org/public/images/eso0932a/",
});

export const SKY_SOURCES: readonly string[] = Object.freeze([
  "HYG star database v4.2 (Hipparcos, Yale Bright Star, Gliese catalogues), astronexus (https://www.astronexus.com/projects/hyg), CC BY-SA 4.0. The star file only; the code is MIT.",
  "The Milky Way panorama, ESO/S. Brunier (https://www.eso.org/public/images/eso0932a/), CC BY 4.0.",
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
}

