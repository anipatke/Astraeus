// Fetches the Yale Bright Star Catalogue (5th rev. ed., preliminary version) and writes the naked-eye subset to the git-ignored
// data/local/yale-bsc-v65.json. Nothing from the catalogue is committed or shipped (owner decision, T-051 data terms): the sky
// draws the Milky Way only until this has been run on the machine that shows it.
//   node tools/data/fetch-stars.mjs [outFile]
//
// Source: https://cdsarc.cds.unistra.fr/ftp/V/50/catalog.gz (ReadMe: .../V/50/ReadMe), Hoffleit and Warren, ADC/NSSDC 1991.
// Columns used (ReadMe byte ranges, 1-based): J2000 RA h/m/s 76-77, 78-79, 80-83; Dec sign 84, d/m/s 85-86, 87-88, 89-90; Vmag 103-107; B-V 110-114.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";

export const BSC_URL = "https://cdsarc.cds.unistra.fr/ftp/V/50/catalog.gz";
export const BSC_README_URL = "https://cdsarc.cds.unistra.fr/ftp/V/50/ReadMe";
/** Faintest magnitude kept: the naked-eye limit (8,404 of the 9,110 records). */
export const MAGNITUDE_LIMIT = 6.5;
export const DEFAULT_OUT = join(resolve(dirname(fileURLToPath(import.meta.url)), "..", ".."), "data", "local", "yale-bsc-v65.json");

/** Text of a 1-based inclusive byte range, trimmed. */
const field = (line, from, to) => line.slice(from - 1, to).trim();

/**
 * Parses fixed-width Yale BSC records into [raDeg, decDeg, vMag, bMinusV | null] rows with V <= `limit`. Records without a J2000
 * position or magnitude (novae and extragalactic entries kept for numbering) are skipped and counted.
 */
export function parseBsc(text, limit = MAGNITUDE_LIMIT) {
  const stars = [];
  let records = 0;
  let skipped = 0;
  for (const line of text.split("\n")) {
    if (line.trim() === "") continue;
    records += 1;
    const ra = [field(line, 76, 77), field(line, 78, 79), field(line, 80, 83)];
    const dec = [field(line, 85, 86), field(line, 87, 88), field(line, 89, 90)];
    const v = field(line, 103, 107);
    if (ra.some((part) => part === "") || dec.some((part) => part === "") || v === "") { skipped += 1; continue; }
    const vmag = Number(v);
    const raDeg = 15 * (Number(ra[0]) + Number(ra[1]) / 60 + Number(ra[2]) / 3600);
    const decAbs = Number(dec[0]) + Number(dec[1]) / 60 + Number(dec[2]) / 3600;
    const decDeg = line[83] === "-" ? -decAbs : decAbs;
    if (![raDeg, decDeg, vmag].every(Number.isFinite)) { skipped += 1; continue; }
    if (vmag > limit) continue;
    const bv = field(line, 110, 114);
    stars.push([Number(raDeg.toFixed(5)), Number(decDeg.toFixed(5)), vmag, bv === "" || !Number.isFinite(Number(bv)) ? null : Number(bv)]);
  }
  return { records, skipped, stars };
}

/** The file written: a provenance header and the rows. */
export function starFile({ stars, records, skipped }, fetchedAt, limit = MAGNITUDE_LIMIT) {
  return {
    provenance: {
      catalogue: "Yale Bright Star Catalogue, 5th Revised Ed. (Preliminary Version), Hoffleit and Warren, ADC/NSSDC 1991",
      source: BSC_URL,
      readme: BSC_README_URL,
      fetchedAt,
      filter: `Vmag <= ${limit}; records without a J2000 position or Vmag skipped`,
      records,
      skipped,
      count: stars.length,
      epoch: "J2000.0 (proper motion not applied)",
      columns: ["raDeg", "decDeg", "vMag", "bMinusV"],
      licenceNote: "Terms not established as public domain. Fetched to this machine only; never commit or ship (data/local/ is git-ignored and the public build is checked for it).",
    },
    stars,
  };
}

async function main() {
  const out = resolve(process.argv[2] ?? DEFAULT_OUT);
  const response = await fetch(BSC_URL, { headers: { "User-Agent": "curl/8.5.0" } }); // a browser-like agent gets the site's bot-challenge page instead of the file
  if (!response.ok) throw new Error(`${BSC_URL}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes[0] !== 0x1f || bytes[1] !== 0x8b) throw new Error(`${BSC_URL} did not return a gzip file (${bytes.length} bytes; a bot-challenge page?)`);
  const text = gunzipSync(bytes).toString("latin1");
  const parsed = parseBsc(text);
  if (parsed.records !== 9110 || parsed.stars.length !== 8404) {
    console.warn(`warning: expected 9,110 records and 8,404 stars with V <= ${MAGNITUDE_LIMIT}, got ${parsed.records} and ${parsed.stars.length}; the upstream file may have changed`);
  }
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(starFile(parsed, new Date().toISOString()))}\n`);
  console.log(`wrote ${parsed.stars.length} stars (${parsed.records} records, ${parsed.skipped} skipped) to ${out}`);
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.message); process.exit(1); });
}
