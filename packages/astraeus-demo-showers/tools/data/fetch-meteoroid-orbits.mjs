// Fetches the Global Meteor Network's monthly trajectory summaries and writes the orbits of ONE meteor shower, chosen by its IAU shower number:
//   node tools/data/fetch-meteoroid-orbits.mjs <iauCode> --months 202507,202508 [--dir <folder holding the monthly files>] [--out <file>] [--ship <story>]
// The full file goes to the git-ignored data/local/gmn-iau-<code>.json. --ship <story> also writes the compact, committable copy
// data/stories/<story>/gmn-iau-<code>.json, only for a licence on SHIPPABLE_LICENCES (CC BY 4.0, CC0 1.0).
// GMN is the only measured-orbit source (CAMS was removed in O-017; see docs/ASTRAEUS_SPIKE_04.md).
import { createInterface } from "node:readline";
import { readFileSync, createReadStream, createWriteStream, mkdirSync, mkdtempSync, openSync, closeSync, fstatSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createInflateRaw } from "node:zlib";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

export const BROWSER_USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
/** Licences under which a measured-orbit file may be copied into a public build (tests keep this equal to src/experiences/showers/measuredOrbits.ts). */
export const SHIPPABLE_LICENCES = Object.freeze(["CC BY 4.0", "CC0 1.0"]);
/** The layout of a shipped file: the orbit elements only. The three quality columns (convergence angle, geocentric velocity and its error) are not shipped (O-042 T-172). */
export const SHIPPED_COLUMNS = Object.freeze(["recordId", "epochUtcMs", "semiMajorAxisAu", "eccentricity", "inclinationDeg", "argumentOfPeriapsisDeg", "raanDeg"]);
/** The quality columns the fetched file carries (not shipped); they feed the published counts kept as text in the shipped header. */
export const QUALITY_COLUMNS = Object.freeze(["convergenceAngleDeg", "geocentricVelocityKmS", "geocentricVelocityErrorKmS"]);
/** The published quality cut the counts are taken with (settings stream.quality.rule: Qc at least 15 deg, Vgeo sigma at most 10% of Vgeo). */
export const QUALITY_RULE = Object.freeze({ minConvergenceAngleDeg: 15, maxVelocityErrorFraction: 0.1 });
/** `provenance.layout` of a shipped file whose `rows` hold one array per column, not one per orbit; the epoch column is stored as differences from the row before (T-070). */
export const COLUMN_LAYOUT = "columns";
/** `provenance.recordIds` of a shipped file whose record ids drop the time they repeat: "20250717204730_uGG34" with epoch 2025-07-17 20:47:30 is stored "_uGG34". */
export const TRIMMED_IDS = "time-trimmed";
const EPOCH_COLUMN = SHIPPED_COLUMNS.indexOf("epochUtcMs");
/** The id's own time text for an epoch: UTC year to second, 14 digits. */
const idStamp = (epochUtcMs) => new Date(epochUtcMs).toISOString().slice(0, 19).replace(/[-:T]/g, "");
/** An id without its repeated time (kept in full when its time differs from the epoch's). */
export function trimId(id, epochUtcMs) {
  if (id.startsWith("_")) throw new Error(`record id "${id}" starts with the trim marker`);
  return id.startsWith(`${idStamp(epochUtcMs)}_`) ? id.slice(14) : id;
}
/** The id `trimId` shortened. */
export const restoreId = (id, epochUtcMs) => (id.startsWith("_") ? `${idStamp(epochUtcMs)}${id}` : id);
/** Rows (one array per orbit) to columns (one array per column, the epoch as differences, ids trimmed). Lossless: `fromColumns` returns the same rows. */
export function toColumns(rows) {
  const columns = SHIPPED_COLUMNS.map((_, c) => rows.map((row) => row[c]));
  const epochs = columns[EPOCH_COLUMN];
  columns[0] = columns[0].map((id, k) => trimId(id, epochs[k]));
  columns[EPOCH_COLUMN] = epochs.map((epoch, k) => (k === 0 ? epoch : epoch - epochs[k - 1]));
  return columns;
}
/** Columns back to rows; ids are restored only when the file says they were trimmed. */
export function fromColumns(columns, trimmed = true) {
  const epochs = [];
  columns[EPOCH_COLUMN].forEach((step, k) => epochs.push(k === 0 ? step : epochs[k - 1] + step));
  return columns[0].map((_, k) => columns.map((column, c) => (c === EPOCH_COLUMN ? epochs[k] : c === 0 && trimmed ? restoreId(column[k], epochs[k]) : column[k])));
}
/** The rows of a shipped or fetched file in either layout. */
export const rowsOfFile = (file) => (file.provenance.layout === COLUMN_LAYOUT ? fromColumns(file.rows, file.provenance.recordIds === TRIMMED_IDS) : file.rows);
export const shippedFileFor = (story, iauCode) => join(ROOT, "data", "stories", story, `gmn-iau-${iauCode}.json`);
export const localFileFor = (iauCode) => join(ROOT, "data", "local", `gmn-iau-${iauCode}.json`);

const angleGapDeg = (x, y) => { const d = Math.abs(x - y) % 180; return Math.min(d, 180 - d); };

/**
 * Verifies the data layout from the values themselves, over the kept bound rows: elements in range, the repeated date and time equal, and
 * the longitude of the node within 1 degree (modulo 180, ascending or descending) of the solar longitude for at least 95% of an
 * Earth-crossing shower's orbits. A shifted column fails at least one of these.
 */
export function checkLayout(samples) {
  const failures = [];
  const total = samples.length;
  if (total === 0) return failures;
  const share = (count) => count / total;
  const inRange = samples.filter((s) => s.a > 0 && s.e >= 0 && s.e < 1 && s.i >= 0 && s.i <= 180 && s.w >= 0 && s.w <= 360 && s.node >= 0 && s.node <= 360 && s.solarLongitude >= 0 && s.solarLongitude <= 360).length;
  if (share(inRange) < 0.999) failures.push(`${total - inRange} of ${total} rows have an element out of range (a, e, i, w, node or solar longitude)`);
  const same = samples.filter((s) => s.date === s.dateRepeat && Math.abs(s.time - s.timeRepeat) < 1e-4).length;
  if (share(same) < 0.999) failures.push(`the repeated date/time columns (AN, AO) differ by more than 9 seconds from C, D in ${total - same} of ${total} rows`);
  const withQuality = samples.filter((s) => s.q !== undefined);
  if (withQuality.length > 0) {
    const sane = withQuality.filter((s) => s.q >= 0 && s.q <= 90 && s.vg >= 10 && s.vg <= 75 && s.vgSigma >= 0 && s.vgSigma <= 0.5 * s.vg && (s.pairs === 0 || s.pairs === 1)).length;
    if (sane / withQuality.length < 0.999) failures.push(`${withQuality.length - sane} of ${withQuality.length} rows have a convergence angle (AC) outside 0-90 deg, a geocentric velocity (AT) outside 10-75 km/s, an error (AU) over half of it, or a pairs flag (BZ) that is not 0 or 1`);
  }
  const aligned = samples.filter((s) => angleGapDeg(s.node, s.solarLongitude) < 1).length;
  if (share(aligned) < 0.95) failures.push(`node (BS) is within 1 degree of the solar longitude (BF) in only ${(100 * share(aligned)).toFixed(1)}% of ${total} rows`);
  return failures;
}

export const ROW_COLUMNS = Object.freeze(["recordId", "sheetRow", "epochUtcMs", "semiMajorAxisAu", "eccentricity", "inclinationDeg", "argumentOfPeriapsisDeg", "raanDeg", "solarLongitudeDeg", "convergenceAngleDeg", "geocentricVelocityKmS", "geocentricVelocityErrorKmS", "pairsFlag"]);

// ------------------------------------------------------------------------------------------------------------------ GMN (T-056)

export const GMN_BASE_URL = "https://globalmeteornetwork.org/data/traj_summary_data/monthly/";
export const GMN_COLUMNS_URL = "https://globalmeteornetwork.org/data/media/GMN_orbit_data_columns.pdf";
export const GMN_DATA_PAGE = "https://globalmeteornetwork.org/data/";
export const GMN_LICENCE = "CC BY 4.0";
export const GMN_LICENCE_URL = "https://creativecommons.org/licenses/by/4.0/";
export const GMN_CITATIONS = Object.freeze([
  "Vida, D., Segon, D., Gural, P. S., Brown, P. G., McIntyre, M. J. M., Dijkema, T. J., Pavletic, L., Kukic, P., Mazur, M. J., Eschman, P., Roggemans, P., Merlak, A., Zubovic, D., 2021. The Global Meteor Network - Methodology and first results. Monthly Notices of the Royal Astronomical Society 506(4), 5046-5074.",
  "Vida, D., Gural, P. S., Brown, P. G., Campbell-Brown, M., Wiegert, P., 2020. Estimating trajectories of meteors: an observational Monte Carlo approach - I. Theory. Monthly Notices of the Royal Astronomical Society 491(2), 2688-2705.",
]);
export const gmnMonthUrl = (month) => `${GMN_BASE_URL}traj_summary_monthly_${month}.txt`;
export const gmnMonthFile = (month) => `traj_summary_monthly_${month}.txt`;

/**
 * The columns read, as "name|unit" keys of the file's two header rows (the name row and the unit row under it): the names repeat ("IAU", "Beginning", "+/-"), so
 * the unit row tells them apart. Each key maps to the field it feeds; a value column's uncertainty is the column right after it (name "+/-", unit "sigma").
 * The positions are looked up from the header on every run, never assumed.
 */
export const GMN_HEADER_KEYS = Object.freeze({
  iauNumber: "IAU|No",
  iauCode: "IAU|code",
  utc: "Beginning|UTC Time",
  solarLongitude: "Sol lon|deg",
  vg: "Vgeo|km/s",
  a: "a|AU",
  e: "e|",
  i: "i|deg",
  w: "peri|deg",
  node: "node|deg",
  q: "Qc|deg",
});

/** Maps the file's header rows to column positions. Throws when a column is missing or its uncertainty column does not follow it. */
export function gmnLayout(nameRow, unitRow) {
  const split = (row) => row.replace(/^#/, "").split(";").map((cell) => cell.trim());
  const names = split(nameRow);
  const units = split(unitRow);
  if (names.length !== units.length) throw new Error(`the GMN header rows differ in width (${names.length} names, ${units.length} units): the layout changed`);
  const keys = names.map((name, k) => `${name}|${units[k]}`);
  const at = {};
  for (const [field, key] of Object.entries(GMN_HEADER_KEYS)) {
    const k = keys.indexOf(key);
    if (k < 0) throw new Error(`the GMN header has no column "${key}": the layout changed`);
    if (keys.indexOf(key, k + 1) >= 0) throw new Error(`the GMN header has the column "${key}" twice: the layout changed`);
    at[field] = k;
  }
  if (keys[at.vg + 1] !== "+/-|sigma") throw new Error(`the column after "Vgeo|km/s" is "${keys[at.vg + 1]}", not its uncertainty ("+/-|sigma"): the layout changed`);
  return { at, columns: names.length, vgSigmaAt: at.vg + 1 };
}

const GMN_UTC = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?$/;
/** UTC Unix milliseconds of a "2025-08-01 00:00:08.235723" time. */
export function gmnEpochMs(text) {
  const m = GMN_UTC.exec(text.trim());
  if (m === null) return Number.NaN;
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6])) + Math.round(Number(`0.${m[7] ?? "0"}`) * 1000);
}

/** The row of one GMN data line: { id, epoch, v } with v the numeric elements, or null when the line is not a member of the shower. */
function gmnMember(cells, layout, iauCode) {
  if (Number(cells[layout.at.iauNumber]) !== iauCode) return null;
  const num = (field) => Number(cells[layout.at[field]]);
  const v = { a: num("a"), e: num("e"), i: num("i"), w: num("w"), node: num("node"), solarLongitude: num("solarLongitude"), q: num("q"), vg: num("vg"), vgSigma: Number(cells[layout.vgSigmaAt]) };
  return { v, epoch: gmnEpochMs(cells[layout.at.utc]), id: cells[0].trim() };
}

/** Which count a dropped member goes to ("incomplete", "unbound", "badSemiMajorAxis"), or null when the member is kept. */
function gmnDropReason({ id, epoch, v }) {
  if (id === "" || !Number.isFinite(epoch) || !Object.values(v).every(Number.isFinite)) return "incomplete";
  if (!(v.e < 1)) return "unbound";
  if (!(v.a > 0)) return "badSemiMajorAxis";
  return null;
}

/** Reads one monthly file's lines into `acc` ({ counts, rows, samples, codes }); returns the file's { members, layout }. */
async function readGmnMonth({ month, lines }, iauCode, acc, onProgress) {
  const { counts, rows, samples, codes } = acc;
  let lineNumber = 0;
  let layout = null;
  let nameRow = null;
  let unitRow = null;
  let members = 0;
  for await (const line of lines) {
    lineNumber += 1;
    if (line.startsWith("#")) {
      if (/^#\s*Unique trajectory/.test(line)) nameRow = line;
      else if (nameRow !== null && unitRow === null) unitRow = line;
      continue;
    }
    if (line.trim() === "") continue;
    if (layout === null) {
      if (nameRow === null || unitRow === null) throw new Error(`${month}: the file has data before its two column-header rows: the layout changed`);
      layout = gmnLayout(nameRow, unitRow);
    }
    counts.rowsScanned += 1;
    if (onProgress !== undefined && counts.rowsScanned % 50_000 === 0) onProgress(counts.rowsScanned);
    const cells = line.split(";");
    if (cells.length !== layout.columns) throw new Error(`${month} line ${lineNumber}: ${cells.length} columns, the header has ${layout.columns}: the layout changed`);
    const member = gmnMember(cells, layout, iauCode);
    if (member === null) continue;
    counts.members += 1;
    members += 1;
    codes.add(cells[layout.at.iauCode].trim());
    const { v, epoch, id } = member;
    const reason = gmnDropReason(member);
    if (reason !== null) { counts[reason] += 1; counts.dropped += 1; continue; }
    samples.push({ ...v, date: epoch, dateRepeat: epoch, time: 0, timeRepeat: 0, pairs: 0 });
    rows.push([id, lineNumber, epoch, v.a, v.e, v.i, v.w, v.node, v.solarLongitude, v.q, v.vg, v.vgSigma, 0]);
  }
  if (layout === null) throw new Error(`${month}: no data rows found: the layout changed`);
  return { members, layout };
}

/**
 * Reads one shower out of GMN monthly summary lines (any iterable or async iterable of lines). `files` are [{ month, lines }]; rows are
 * [trajectoryId, lineNumber, epochUtcMs, a, e, i, peri, node, solLon, Qc, Vgeo, sigmaVgeo, 0]; GMN has no double-entry flag, so the last column is 0.
 * The selection is the IAU shower NUMBER (column "IAU No"); the three-letter code the matching rows carry is recorded (it must be one code).
 */
export async function extractGmn(files, iauCode, { onProgress } = {}) {
  const acc = {
    counts: { members: 0, unbound: 0, badSemiMajorAxis: 0, incomplete: 0, dropped: 0, pairsFlagged: 0, rowsScanned: 0 },
    rows: [],
    samples: [],
    codes: new Set(),
  };
  const perFile = [];
  for (const file of files) {
    const { members, layout } = await readGmnMonth(file, iauCode, acc, onProgress);
    perFile.push({ month: file.month, members, columns: layout.columns, columnPositions: layout.at });
  }
  const { counts, rows, samples, codes } = acc;
  if (codes.size > 1) throw new Error(`IAU number ${iauCode} carries more than one three-letter code (${[...codes].join(", ")}): the layout changed`);
  const failures = checkLayout(samples);
  if (failures.length > 0) throw new Error(`the data layout is not what this tool reads: ${failures.join("; ")}`);
  return { rows, counts, perFile, iauLetters: [...codes][0] ?? null };
}

/** The file written: the rows and columns of ROW_COLUMNS, with a provenance header that adds the licence, the months and each file's size and hash. */
export function gmnShowerFile({ iauCode, extraction, downloads, fetchedAt }) {
  const kept = extraction.rows.length;
  return {
    provenance: {
      database: `Global Meteor Network trajectory summary, monthly files ${downloads.map((d) => d.month).join(", ")}`,
      citation: GMN_CITATIONS.join(" "),
      citations: GMN_CITATIONS,
      source: `${GMN_BASE_URL}traj_summary_monthly_YYYYMM.txt`,
      readme: GMN_COLUMNS_URL,
      dataPage: GMN_DATA_PAGE,
      licence: GMN_LICENCE,
      licenceUrl: GMN_LICENCE_URL,
      licenceNote: "CC BY 4.0: may be copied, adapted and shipped with credit to the Global Meteor Network and the two citations. data/local/ is still git-ignored; whether to ship a subset is an owner decision (T-056).",
      files: downloads,
      release: { bytes: downloads.reduce((sum, d) => sum + d.bytes, 0), sha256: createHash("sha256").update(downloads.map((d) => `${d.month}:${d.sha256}`).join("\n")).digest("hex"), note: "bytes: the sum over the monthly files; sha256: of the lines \"YYYYMM:<file sha256>\", one per file, in the order listed" },
      fetchedAt,
      iauCode,
      iauLetters: extraction.iauLetters,
      filter: "column \"IAU No\" equals the IAU shower number; rows with e >= 1 (hyperbolic or parabolic) or a <= 0 or an empty element dropped",
      headerColumns: Object.fromEntries(Object.entries(GMN_HEADER_KEYS).map(([field, key]) => [field, key])),
      columnPositionsByFile: Object.fromEntries(extraction.perFile.map((f) => [f.month, f.columnPositions])),
      layoutNote: "Positions are looked up from the header rows (names over units) on every run; the tool throws if a column is missing, repeated, or the data fail the range and node-vs-solar-longitude checks.",
      counts: { members: extraction.counts.members, unbound: extraction.counts.unbound, badSemiMajorAxis: extraction.counts.badSemiMajorAxis, incomplete: extraction.counts.incomplete, dropped: extraction.counts.dropped, pairsFlagged: 0, rowsScanned: extraction.counts.rowsScanned, perMonth: Object.fromEntries(extraction.perFile.map((f) => [f.month, f.members])), kept },
      plane: "ecliptic-j2000 (the elements as GMN publishes them; the check in the facts compares the node with the solar longitude); semi-major axis in AU",
      columns: ROW_COLUMNS,
      columnNotes: { sheetRow: "line number in the monthly file", recordId: "unique trajectory identifier", convergenceAngleDeg: "Qc, the maximum convergence angle between the stations that saw the meteor", geocentricVelocityKmS: "Vgeo", geocentricVelocityErrorKmS: "Vgeo sigma", pairsFlag: "always 0: GMN has no double-entry flag" },
    },
    rows: extraction.rows,
  };
}

/** The lines of a file, opened only when iteration starts (a readline interface made early would lose lines before it was iterated). */
async function* linesOf(path) {
  yield* createInterface({ input: createReadStream(path, { encoding: "utf8", highWaterMark: 1 << 20 }), crlfDelay: Infinity });
}

/**
 * The shippable copy of a fetched file: the same provenance header (licence, citations, months, files with SHA-256, counts) and the compact columns.
 * Throws unless the file's own provenance declares a licence on the shippable list; a file with no licence cannot be made public by any option.
 */
export function shippedCopy(file) {
  const licence = file?.provenance?.licence;
  if (!SHIPPABLE_LICENCES.includes(licence)) throw new Error(`refusing to ship: the file's licence is ${licence === undefined ? "not declared" : `"${licence}"`}, not one of ${SHIPPABLE_LICENCES.join(", ")}`);
  const from = file.provenance.columns;
  const keep = SHIPPED_COLUMNS.map((name) => from.indexOf(name));
  if (keep.some((k) => k < 0)) throw new Error(`the file's columns ${JSON.stringify(from)} lack one of ${JSON.stringify(SHIPPED_COLUMNS)}`);
  const { columnPositionsByFile, ...header } = file.provenance;
  const rows = rowsOfFile(file);
  // The published counts, kept as text when the file still has the quality columns (a file shipped before keeps the text it already has).
  const at = QUALITY_COLUMNS.map((name) => from.indexOf(name));
  const reliable = at.some((k) => k < 0) ? null : rows.filter((r) => r[at[0]] >= QUALITY_RULE.minConvergenceAngleDeg && r[at[2]] <= QUALITY_RULE.maxVelocityErrorFraction * r[at[1]]).length;
  const qualityCounts = reliable === null ? file.provenance.shipped?.qualityCounts : `Of ${rows.length} bound orbits, ${reliable} pass the published quality cut (convergence angle Qc at least ${QUALITY_RULE.minConvergenceAngleDeg} deg and Vgeo sigma at most ${QUALITY_RULE.maxVelocityErrorFraction * 100}% of Vgeo) and ${rows.length - reliable} fail it.`;
  const dropped = [...new Set([...(file.provenance.shipped?.droppedColumns ?? []), ...from.filter((name) => !SHIPPED_COLUMNS.includes(name))])];
  return {
    provenance: { ...header, columns: [...SHIPPED_COLUMNS], layout: COLUMN_LAYOUT, recordIds: TRIMMED_IDS, shipped: { droppedColumns: dropped, ...(qualityCounts === undefined ? {} : { qualityCounts }), note: "Shipped copy of the fetched file: same records and header, without the columns the app never reads (the sheet row, the solar longitude, the pairs flag, which is always 0 for GMN) and without the three quality columns (convergence angle, geocentric velocity and its error; the published counts are kept as text in qualityCounts). Rows are stored column by column, the epoch as differences from the row before; a record id drops the time it repeats (stored from the underscore on), ids whose time differs from the epoch's are kept in full; every kept value is unchanged. Credit: Global Meteor Network, CC BY 4.0." } },
    rows: toColumns(rows.map((row) => keep.map((k) => row[k]))),
  };
}

async function fetchGmnMonth(month, dir) {
  const path = join(dir, gmnMonthFile(month));
  const url = gmnMonthUrl(month);
  let lastModified = null;
  if (!existsSync(path)) {
    console.log(`downloading ${url} to ${path}`);
    const response = await fetch(url, { headers: { "User-Agent": BROWSER_USER_AGENT } });
    if (!response.ok || response.body === null) throw new Error(`${url}: HTTP ${response.status}`);
    lastModified = response.headers.get("last-modified");
    await pipeline(Readable.fromWeb(response.body), createWriteStream(path));
  }
  return { month, url, path, bytes: fstatSyncPath(path), sha256: await sha256Of(path), lastModified };
}

async function main(options) {
  const out = options.out ?? localFileFor(options.iauCode);
  if (options.months.length === 0) throw new Error("--source gmn needs --months, for example --months 202507,202508");
  for (const m of options.months) if (!/^\d{4}(0[1-9]|1[0-2])$/.test(m)) throw new Error(`month "${m}" must be YYYYMM`);
  let scratch = null;
  try {
    let dir = options.dir;
    if (dir === null) { scratch = mkdtempSync(join(tmpdir(), "astraeus-gmn-")); dir = scratch; }
    const downloads = [];
    for (const month of options.months) downloads.push(await fetchGmnMonth(month, dir));
    const extraction = await extractGmn(downloads.map((d) => ({ month: d.month, lines: linesOf(d.path) })), options.iauCode, { onProgress: (n) => process.stdout.write(`\r${n} rows scanned`) });
    process.stdout.write("\n");
    if (extraction.rows.length === 0) throw new Error(`no bound orbits found for IAU number ${options.iauCode} in ${options.months.join(", ")}`);
    mkdirSync(dirname(out), { recursive: true });
    const fetchedAt = new Date().toISOString();
    writeFileSync(out, `${JSON.stringify(gmnShowerFile({ iauCode: options.iauCode, extraction, downloads: downloads.map(({ month, url, bytes, sha256, lastModified }) => ({ month, url, bytes, sha256, lastModified })), fetchedAt }))}\n`);
    console.log(`wrote ${extraction.rows.length} orbits to ${out}`);
    console.log(JSON.stringify(extraction.counts));
    if (options.ship !== null) {
      const shipped = shippedFileFor(options.ship, options.iauCode);
      mkdirSync(dirname(shipped), { recursive: true });
      writeFileSync(shipped, `${JSON.stringify(shippedCopy(JSON.parse(readFileSync(out, "utf8"))))}\n`);
      console.log(`wrote the shippable copy to ${shipped} (a story's data: commit it with the story)`);
    }
  } finally {
    if (scratch !== null) rmSync(scratch, { recursive: true, force: true });
  }
}

async function sha256Of(path) {
  const hash = createHash("sha256");
  await pipeline(createReadStream(path), hash);
  return hash.digest("hex");
}
function parseArgs(argv) {
  const options = { iauCode: null, out: null, months: [], dir: null, ship: null };
  for (let k = 0; k < argv.length; k++) {
    const arg = argv[k];
    if (arg === "--out") options.out = resolve(argv[++k]);
    else if (arg === "--months") options.months = argv[++k].split(",").map((m) => m.trim()).filter(Boolean);
    else if (arg === "--ship") options.ship = argv[++k];
    else if (arg === "--dir") options.dir = resolve(argv[++k]);
    else if (/^\d+$/.test(arg)) options.iauCode = Number(arg);
    else throw new Error(`unknown argument "${arg}"`);
  }
  if (options.iauCode === null) throw new Error("usage: node tools/data/fetch-meteoroid-orbits.mjs <iauCode> --months YYYYMM,YYYYMM [--dir folder] [--out file] [--ship <story>]");
  return options;
}

function fstatSyncPath(path) {
  const fd = openSync(path, "r");
  try { return fstatSync(fd).size; } finally { closeSync(fd); }
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(parseArgs(process.argv.slice(2))).catch((error) => { console.error(error.message); process.exit(1); });
}
