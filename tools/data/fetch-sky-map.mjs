// Fetches the NASA SVS "Deep Star Maps 2020" all-sky map, tone-maps it to sRGB JPEG and cuts it into tiles of at most 4096 px
// (phone GPUs commonly cap textures there), and writes the tiles plus a manifest to the git-ignored data/local/sky/nasa/.
//   node tools/data/fetch-sky-map.mjs [--size 16k|8k|32k|4k] [--exposure 10] [--gamma 2.2] [--quality 20] [--tile 4096] [--gain 1] [--out dir]
//
// LICENCE: local only. The map is built from Gaia DR2 (ESA, CC BY-NC 3.0 IGO per the Gaia users' licence page), Hipparcos-2 and Tycho-2; the SVS
// page states no licence of its own and says its content is public domain "unless otherwise noted". Whether the non-commercial term
// reaches a render of the catalogue is not established, so nothing from it is committed or shipped (docs/DONOR_PROVENANCE.md, I-026). The app draws ESO by default (owner decision 2026-10-16); this map is used only with ?skymap=nasa.
//
// Source: https://svs.gsfc.nasa.gov/4851 (API https://svs.gsfc.nasa.gov/api/4851); celestial (equatorial J2000) equirectangular, centred on
// RA 0h with RA increasing to the left; linear half-float OpenEXR. ImageMagick (`convert`, ImageMagick 6 Q16) reads it; this build is not
// HDRI, so linear values above 1.0 are clipped when read (only the very brightest stars; the exposure is applied after).
//
// Tone map, per channel, from linear L: out = min(1, L * exposure) ^ (1 / gamma). Exposure and gamma are settings with the defaults below
// (chosen by eye against the 2048 px preview: the glow reads as a backdrop and the baked-in stars stay faint beside the catalogue stars);
// they are recorded in the manifest. The map is cut into columns x rows tiles, row 0 at the top and column 0 at the left (RA +180).
import { execFileSync } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const SVS_PAGE = "https://svs.gsfc.nasa.gov/4851";
export const SVS_BASE = "https://svs.gsfc.nasa.gov/vis/a000000/a004800/a004851/";
export const SIZES = Object.freeze({ "4k": [4096, 2048], "8k": [8192, 4096], "16k": [16384, 8192], "32k": [32768, 16384] });
export const DEFAULTS = Object.freeze({ size: "16k", exposure: 10, gamma: 2.2, quality: 20, tile: 4096, gain: 1 });
export const DEFAULT_OUT = join(ROOT, "data", "local", "sky", "nasa");
export const SOURCE_DIR = join(ROOT, "data", "local", "sky-src");

/** Tile grid for a map: whole tiles of at most `tile` px (the sizes above divide evenly). */
export function tileGrid(widthPx, heightPx, tile = DEFAULTS.tile) {
  return { columns: Math.ceil(widthPx / tile), rows: Math.ceil(heightPx / tile) };
}

/** The tone-mapping ImageMagick arguments for linear input: multiply by the exposure, then encode with 1/gamma. */
export function toneArgs({ exposure, gamma }) {
  if (!(exposure > 0) || !(gamma > 0)) throw new RangeError("exposure and gamma must be positive numbers");
  return ["-evaluate", "multiply", String(exposure), "-gamma", String(gamma)];
}

/** The manifest the app reads (validated by parseSkyManifest in src/assets/sky.ts). */
export function buildManifest({ size, widthPx, heightPx, tilePx, exposure, gamma, quality, files, fetchedAt, gain = DEFAULTS.gain }) {
  const grid = tileGrid(widthPx, heightPx, tilePx);
  return {
    schema: 1,
    frame: "equatorial-j2000",
    name: `NASA SVS Deep Star Maps 2020 (${size})`,
    source: SVS_PAGE,
    credit: "NASA/Goddard Space Flight Center Scientific Visualization Studio; Gaia DR2: ESA/Gaia/DPAC; visualisation by Ernie Wright (USRA)",
    licence: "Local only: Gaia DR2 is CC BY-NC 3.0 IGO, the SVS states none of its own; terms for the render not established (docs/DONOR_PROVENANCE.md)",
    accessed: fetchedAt.slice(0, 10),
    widthPx,
    heightPx,
    grid,
    tilePx,
    // Strength relative to the ESO picture (the app's baseline). At exposure 10 the map's own faint stars are weak beside the catalogue
    // stars (the bright ones sit exactly under them, being the same stars), so no extra reduction is needed: 1.0. Lower it to tone the picture down.
    gain,
    tone: { exposure, gamma, quality, original: `starmap_2020_${size}.exr`, fetchedAt },
    tiles: files.map((file, index) => ({ column: index % grid.columns, row: Math.floor(index / grid.columns), file })),
  };
}

function parseArgs(argv) {
  const options = { ...DEFAULTS, out: DEFAULT_OUT };
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]?.replace(/^--/, "");
    if (!(key in options) || argv[i + 1] === undefined) throw new Error(`unknown or incomplete option ${argv[i]}; see the header of tools/data/fetch-sky-map.mjs`);
    options[key] = key === "size" || key === "out" ? argv[i + 1] : Number(argv[i + 1]);
  }
  if (!(options.size in SIZES)) throw new Error(`--size must be one of ${Object.keys(SIZES).join(", ")}`);
  return options;
}

async function download(url, file) {
  const response = await fetch(url, { headers: { "User-Agent": "Astraeus-sky-fetch/1.0 (local data tool)" } });
  if (!response.ok || response.body === null) throw new Error(`${url}: HTTP ${response.status}`);
  await pipeline(Readable.fromWeb(response.body), createWriteStream(file));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const [widthPx, heightPx] = SIZES[options.size];
  const name = `starmap_2020_${options.size}.exr`;
  mkdirSync(SOURCE_DIR, { recursive: true });
  const source = join(SOURCE_DIR, name);
  if (!existsSync(source)) { console.log(`downloading ${SVS_BASE}${name}`); await download(SVS_BASE + name, source); }
  const { columns, rows } = tileGrid(widthPx, heightPx, options.tile);
  mkdirSync(options.out, { recursive: true });
  for (const old of readdirSync(options.out)) if (/^tile-\d+\.jpg$/.test(old)) rmSync(join(options.out, old));
  console.log(`tone mapping (exposure ${options.exposure}, gamma ${options.gamma}) and cutting ${columns}x${rows} tiles of ${options.tile} px, JPEG quality ${options.quality}`);
  // Limits keep the 7 GB machine out of swap: the pixel cache spills to disk.
  execFileSync("convert", [
    "-limit", "memory", "1GiB", "-limit", "map", "2GiB", "-limit", "disk", "40GiB",
    source, ...toneArgs(options), "-depth", "8", "-strip", "-sampling-factor", "4:2:0", "-interlace", "none", "-quality", String(options.quality),
    "-crop", `${options.tile}x${options.tile}`, "+repage", join(options.out, "tile-%d.jpg"),
  ], { stdio: "inherit" });
  const files = Array.from({ length: columns * rows }, (_, i) => `tile-${i}.jpg`);
  const manifest = buildManifest({ size: options.size, widthPx, heightPx, tilePx: options.tile, exposure: options.exposure, gamma: options.gamma, quality: options.quality, gain: options.gain, files, fetchedAt: new Date().toISOString() });
  writeFileSync(join(options.out, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  const total = files.reduce((sum, file) => sum + statSync(join(options.out, file)).size, 0);
  console.log(`wrote ${files.length} tiles, ${(total / 1e6).toFixed(2)} MB, and manifest.json to ${options.out}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
