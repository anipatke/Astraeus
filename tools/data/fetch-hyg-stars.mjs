// Fetches the HYG star database v4.2 and writes the naked-eye subset to src/assets/stars/hyg-v42-naked-eye.json, a shippable asset
// (CC BY-SA 4.0, attribution below; the licence covers this star file only, the code stays MIT).
//   node tools/data/fetch-hyg-stars.mjs [outFile] [--from path/to/hygdata_v42.csv.gz]
//
// Source: https://www.astronexus.com/downloads/catalogs/hygdata_v42.csv.gz (project page https://www.astronexus.com/projects/hyg, whose
// text names v4.2 as current and the licence as Creative Commons Attribution-ShareAlike 4.0). The archive's own home is
// https://codeberg.org/astronexus/hyg, which has since moved to v4.4 (labels and duplicate Gliese entries only; same licence).
// Columns used (header names): ra (hours, J2000), dec (degrees, J2000), mag (V), ci (B-V), id (0 is the Sun, skipped).
// The download is data, never code: it is parsed as CSV text and nothing in it is run.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const HYG_URL = "https://www.astronexus.com/downloads/catalogs/hygdata_v42.csv.gz";
export const HYG_PAGE_URL = "https://www.astronexus.com/projects/hyg";
export const HYG_ARCHIVE_URL = "https://codeberg.org/astronexus/hyg";
export const HYG_LICENCE = "CC BY-SA 4.0";
export const HYG_LICENCE_URL = "https://creativecommons.org/licenses/by-sa/4.0/";
/** Faintest magnitude kept: the naked-eye limit. */
export const MAGNITUDE_LIMIT = 6.5;
export const DEFAULT_OUT = join(ROOT, "src", "assets", "stars", "hyg-v42-naked-eye.json");
export const ATTRIBUTION = "HYG database v4.2 (Hipparcos, Yale Bright Star, Gliese catalogues), astronexus (astronexus.com), CC BY-SA 4.0. Rows with V <= 6.5 kept; right ascension converted from hours to degrees and rounded to 5 decimals; no other change.";

/** Splits one CSV line into fields, honouring double quotes (HYG quotes empty text fields and names). */
export function splitCsvLine(line) {
  const fields = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i += 1; } else if (ch === '"') quoted = false; else current += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { fields.push(current); current = ""; } else current += ch;
  }
  fields.push(current);
  return fields;
}

/** Parses HYG CSV text into [raDeg, decDeg, vMag, bMinusV | null] rows with V <= `limit`, the Sun and rows without a usable position or V skipped. */
export function parseHyg(text, limit = MAGNITUDE_LIMIT) {
  const lines = text.split(/\r?\n/);
  const header = splitCsvLine(lines[0] ?? "");
  const column = Object.fromEntries(["id", "ra", "dec", "mag", "ci"].map((name) => [name, header.indexOf(name)]));
  for (const [name, index] of Object.entries(column)) if (index < 0) throw new Error(`HYG header has no "${name}" column`);
  const stars = [];
  let records = 0;
  let skipped = 0;
  for (const line of lines.slice(1)) {
    if (line.trim() === "") continue;
    records += 1;
    const f = splitCsvLine(line);
    if (f[column.id] === "0") { skipped += 1; continue; }
    const ra = f[column.ra] === "" ? NaN : Number(f[column.ra]);
    const dec = f[column.dec] === "" ? NaN : Number(f[column.dec]);
    const mag = f[column.mag] === "" ? NaN : Number(f[column.mag]);
    if (![ra, dec, mag].every(Number.isFinite) || dec < -90 || dec > 90 || ra < 0 || ra >= 24) { skipped += 1; continue; }
    if (mag > limit) continue;
    const ci = f[column.ci] === "" ? NaN : Number(f[column.ci]);
    stars.push([Number((ra * 15).toFixed(5)), Number(dec.toFixed(5)), mag, Number.isFinite(ci) ? ci : null]);
  }
  return { records, skipped, stars };
}

/** The file written: a provenance header with the AssetLicence fields (PROV-02) and the rows. */
export function starFile({ stars, records, skipped }, accessed, limit = MAGNITUDE_LIMIT) {
  return {
    provenance: {
      catalogue: "HYG database v4.2 (Hipparcos-Yale-Gliese), astronexus",
      version: "4.2",
      source: HYG_URL,
      page: HYG_PAGE_URL,
      archive: HYG_ARCHIVE_URL,
      licence: HYG_LICENCE,
      licenceUrl: HYG_LICENCE_URL,
      attribution: ATTRIBUTION,
      accessed,
      filter: `mag <= ${limit}; the Sun and records without a J2000 position or magnitude skipped`,
      records,
      skipped,
      count: stars.length,
      epoch: "J2000.0 as given by HYG (proper motion not applied)",
      columns: ["raDeg", "decDeg", "vMag", "bMinusV"],
      licenceScope: "This file only. The Astraeus code is MIT.",
    },
    stars,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const fromAt = args.indexOf("--from");
  const from = fromAt >= 0 ? args.splice(fromAt, 2)[1] : undefined;
  const out = resolve(args[0] ?? DEFAULT_OUT);
  let bytes;
  if (from !== undefined) bytes = readFileSync(resolve(from));
  else {
    const response = await fetch(HYG_URL);
    if (!response.ok) throw new Error(`${HYG_URL}: HTTP ${response.status}`);
    bytes = Buffer.from(await response.arrayBuffer());
    // The project page must still name CC BY-SA 4.0 and v4.2; if it does not, the licence record here is stale.
    const page = await (await fetch(HYG_PAGE_URL)).text();
    if (!/Attribution-ShareAlike 4\.0/i.test(page) || !/v\.? ?4\.2/.test(page)) throw new Error(`${HYG_PAGE_URL} no longer names v4.2 under CC BY-SA 4.0; check the licence before shipping`);
  }
  if (bytes[0] !== 0x1f || bytes[1] !== 0x8b) throw new Error(`not a gzip file (${bytes.length} bytes)`);
  const parsed = parseHyg(gunzipSync(bytes).toString("utf8"));
  if (parsed.stars.length < 8000 || parsed.stars.length > 10000) throw new Error(`expected about 8,900 stars with mag <= ${MAGNITUDE_LIMIT}, got ${parsed.stars.length}; the upstream file may have changed`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(starFile(parsed, new Date().toISOString().slice(0, 10)))}\n`);
  console.log(`wrote ${parsed.stars.length} stars (${parsed.records} records, ${parsed.skipped} skipped) to ${out}`);
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.message); process.exit(1); });
}
