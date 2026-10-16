// Fetches the CAMS Meteoroid Orbit Database v3.0 and writes the orbits of ONE meteor shower, chosen by its IAU shower number, to the
// git-ignored data/local/cams-iau-<code>.json. Nothing from the database is committed or shipped (owner decision, T-051 data terms):
// a shower experience says the data is not fetched, and draws no stream, until this has been run on the machine that shows it.
//   node tools/data/fetch-meteoroid-orbits.mjs <iauCode> [--xlsx <localCopy>] [--out <file>] [--keep <downloadPath>]
//   e.g. node tools/data/fetch-meteoroid-orbits.mjs 7        (Perseids; the code is "iauCode" in the shower's settings file)
//
// Source: https://cams.seti.org/CAMS-v3-2010to2016.xlsx (readme https://cams.seti.org/Readme_CAMSv3.0.pdf). Citation requested by the
// database: Jenniskens et al. 2018, Planetary and Space Science 154, 21-29. The site answers a bare client with HTTP 410, so a
// browser-like User-Agent is sent. The workbook is read with Node built-ins only: the zip is opened through its central directory, each
// entry is inflated as a stream, and the sheet's XML is scanned row by row (it is about 1.5 GB of text; nothing is held whole).
// The workbook uses the 1904 date system (workbookPr date1904="1"): a serial plus 1462 days is the 1900 serial.
import { createReadStream, createWriteStream, mkdirSync, mkdtempSync, openSync, closeSync, readSync, fstatSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createInflateRaw } from "node:zlib";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { StringDecoder } from "node:string_decoder";

export const CAMS_URL = "https://cams.seti.org/CAMS-v3-2010to2016.xlsx";
export const CAMS_README_URL = "https://cams.seti.org/Readme_CAMSv3.0.pdf";
export const CAMS_CITATION = "P. Jenniskens, J. Baggaley, I. Crumpton, P. Aldous, P. Pokorny, D. Janches, P. S. Gural, D. Samuels, J. Albers, A. Howell, C. Johannink, M. Breukers, M. Odeh, N. Moskovitz, J. Collison, S. Ganju, 2018. A survey of southern hemisphere meteor showers. Planetary and Space Science 154, 21-29.";
/** The release T-051 recorded (2020-01-08 file). A different size or hash is reported, not refused. */
export const CAMS_EXPECTED = Object.freeze({ bytes: 321_511_540, sha256: "ec8864967785b18edcd78d503e82da77dfe837537e13dddde0fcd4b9c5a85845", rows: 471_582 });
export const BROWSER_USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const localFileFor = (iauCode) => join(ROOT, "data", "local", `cams-iau-${iauCode}.json`);

/**
 * Columns read, by sheet letter. The workbook's header labels (rows 4 and 5) sit over the WRONG letters: for example "a" is printed over
 * BJ while the values of a are in BL, and "Shower I.D." over AM while the shower number is in AK. So the letters below were found from the
 * data, not the labels, and `extractShower` verifies them from the data (see `checkLayout`). The same date and time are held twice (C, D and AN, AO).
 */
export const COLUMNS = Object.freeze({
  catalog: "A",
  date: "C",
  time: "D",
  dateRepeat: "AN",
  timeRepeat: "AO",
  iau: "AK",
  solarLongitude: "BF",
  a: "BL",
  e: "BM",
  i: "BO",
  w: "BQ",
  node: "BS",
  // Quality columns (T-038 reliable-orbits switch); the labels sit two letters left of the values here too: "Q (deg)" over AA, "V Geocentric" over AR, "±" over AS.
  q: "AC",
  vg: "AT",
  vgSigma: "AU",
  pairs: "BZ",
});

/** Header texts the workbook must still carry somewhere in rows 4 and 5; a change here means the layout was reworked. */
export const EXPECTED_HEADER_TEXTS = Object.freeze(["Catalog #", "Shower I.D.", "Solar Longitude", "Node", "Pairs Flag"]);

// ------------------------------------------------------------------------------------------------------------------ zip

function readAt(fd, position, length) {
  const buffer = Buffer.alloc(length);
  let done = 0;
  while (done < length) {
    const n = readSync(fd, buffer, done, length - done, position + done);
    if (n === 0) break;
    done += n;
  }
  return buffer.subarray(0, done);
}

/** The entries of a zip file (central directory, with zip64 sizes): [{ name, method, compressedSize, size, headerOffset }]. */
export function readZipEntries(path) {
  const fd = openSync(path, "r");
  try {
    const fileSize = fstatSync(fd).size;
    const tailLength = Math.min(fileSize, 70_000);
    const tail = readAt(fd, fileSize - tailLength, tailLength);
    let eocd = -1;
    for (let p = tail.length - 22; p >= 0; p--) if (tail.readUInt32LE(p) === 0x06054b50) { eocd = p; break; }
    if (eocd < 0) throw new Error(`${path} is not a zip file (no end-of-central-directory record)`);
    let count = tail.readUInt16LE(eocd + 10);
    let size = tail.readUInt32LE(eocd + 12);
    let offset = tail.readUInt32LE(eocd + 16);
    if (count === 0xffff || size === 0xffffffff || offset === 0xffffffff) {
      const locator = readAt(fd, fileSize - tailLength + eocd - 20, 20);
      if (locator.readUInt32LE(0) !== 0x07064b50) throw new Error("zip64 end-of-central-directory locator is missing");
      const z64 = readAt(fd, Number(locator.readBigUInt64LE(8)), 56);
      count = Number(z64.readBigUInt64LE(32));
      size = Number(z64.readBigUInt64LE(40));
      offset = Number(z64.readBigUInt64LE(48));
    }
    const directory = readAt(fd, offset, size);
    const entries = [];
    let p = 0;
    for (let n = 0; n < count; n++) {
      if (directory.readUInt32LE(p) !== 0x02014b50) throw new Error("bad central directory entry");
      const method = directory.readUInt16LE(p + 10);
      let compressedSize = directory.readUInt32LE(p + 20);
      let uncompressed = directory.readUInt32LE(p + 24);
      const nameLength = directory.readUInt16LE(p + 28);
      const extraLength = directory.readUInt16LE(p + 30);
      const commentLength = directory.readUInt16LE(p + 32);
      let headerOffset = directory.readUInt32LE(p + 42);
      const name = directory.toString("utf8", p + 46, p + 46 + nameLength);
      let q = p + 46 + nameLength;
      const extraEnd = q + extraLength;
      while (q + 4 <= extraEnd) {
        const id = directory.readUInt16LE(q);
        const length = directory.readUInt16LE(q + 2);
        if (id === 0x0001) {
          let r = q + 4;
          if (uncompressed === 0xffffffff) { uncompressed = Number(directory.readBigUInt64LE(r)); r += 8; }
          if (compressedSize === 0xffffffff) { compressedSize = Number(directory.readBigUInt64LE(r)); r += 8; }
          if (headerOffset === 0xffffffff) { headerOffset = Number(directory.readBigUInt64LE(r)); r += 8; }
        }
        q += 4 + length;
      }
      entries.push({ name, method, compressedSize, size: uncompressed, headerOffset });
      p += 46 + nameLength + extraLength + commentLength;
    }
    return entries;
  } finally {
    closeSync(fd);
  }
}

/** A stream of an entry's uncompressed bytes (stored or deflated). */
export function openEntry(path, entry) {
  const fd = openSync(path, "r");
  let start;
  try {
    const header = readAt(fd, entry.headerOffset, 30);
    if (header.readUInt32LE(0) !== 0x04034b50) throw new Error(`bad local header for ${entry.name}`);
    start = entry.headerOffset + 30 + header.readUInt16LE(26) + header.readUInt16LE(28);
  } finally {
    closeSync(fd);
  }
  const raw = createReadStream(path, { start, end: start + entry.compressedSize - 1, highWaterMark: 1 << 20 });
  if (entry.method === 0) return raw;
  if (entry.method !== 8) throw new Error(`${entry.name}: unsupported zip method ${entry.method}`);
  return raw.pipe(createInflateRaw());
}

// ------------------------------------------------------------------------------------------------------------------ xml

const ENTITIES = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'" };
const decodeText = (text) => text.replace(/&(amp|lt|gt|quot|apos);|&#(\d+);|&#x([0-9a-fA-F]+);/g, (m, name, dec, hex) =>
  name !== undefined ? ENTITIES[m] : String.fromCodePoint(dec !== undefined ? Number(dec) : parseInt(hex, 16)));

/** Calls `onChunk(string)` for each piece `<tag ...>...</tag>` of a text stream, without holding the stream whole. */
async function eachElement(stream, tag, onElement) {
  const decoder = new StringDecoder("utf8");
  const open = `<${tag}`;
  const close = `</${tag}>`;
  let rest = "";
  for await (const chunk of stream) {
    let buffer = rest + decoder.write(chunk);
    let from = 0;
    for (;;) {
      const s = buffer.indexOf(open, from);
      if (s < 0) { from = Math.max(from, buffer.length - open.length); break; }
      if (s + open.length >= buffer.length) { from = s; break; } // the tag name ends the chunk: wait for the next one
      const next = buffer.charCodeAt(s + open.length);
      if (next !== 32 && next !== 62 && next !== 47) { from = s + 1; continue; } // "<rowfoo", not "<row"
      const e = buffer.indexOf(close, s);
      if (e < 0) { from = s; break; }
      if (onElement(buffer.slice(s, e + close.length)) === false) return;
      from = e + close.length;
    }
    rest = buffer.slice(from);
  }
}

/** Shared strings, by index (`<si>` with its `<t>` runs joined). */
export async function readSharedStrings(path, entry) {
  const strings = [];
  await eachElement(openEntry(path, entry), "si", (si) => {
    let text = "";
    for (const m of si.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)) text += decodeText(m[1]);
    strings.push(text);
  });
  return strings;
}

export async function readWorkbookFlags(path, entry) {
  let xml = "";
  for await (const chunk of openEntry(path, entry)) xml += chunk.toString("utf8");
  const pr = /<workbookPr\b[^>]*>/.exec(xml)?.[0] ?? "";
  return { date1904: /date1904="(1|true)"/.test(pr) };
}

/** The cell with sheet column `letter` in one row's XML, as { text } or { number } or null. */
export function cellOf(rowXml, letter, rowNumber, strings) {
  const key = `<c r="${letter}${rowNumber}"`;
  const s = rowXml.indexOf(key);
  if (s < 0) return null;
  const tagEnd = rowXml.indexOf(">", s);
  const tag = rowXml.slice(s, tagEnd);
  if (tag.endsWith("/")) return null;
  const e = rowXml.indexOf("</c>", tagEnd);
  const body = rowXml.slice(tagEnd + 1, e);
  const type = /\bt="([^"]*)"/.exec(tag)?.[1];
  if (type === "inlineStr") return { text: decodeText(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/.exec(body)?.[1] ?? "") };
  const v = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1];
  if (v === undefined) return null;
  if (type === "s") return { text: strings[Number(v)] ?? "" };
  if (type === "str" || type === "e") return { text: decodeText(v) };
  if (type === "b") return { number: Number(v) };
  return { number: Number(v) };
}

/** Streams the rows of a sheet entry: `onRow(rowNumber, rowXml)`; return false to stop. */
export async function scanSheet(path, entry, onRow) {
  await eachElement(openEntry(path, entry), "row", (xml) => {
    const m = /^<row\b[^>]*?\br="(\d+)"/.exec(xml);
    if (m === null) return true;
    return onRow(Number(m[1]), xml);
  });
}

// ------------------------------------------------------------------------------------------------------------------ extraction

const EXCEL_1900_TO_UNIX_DAYS = 25569; // 1970-01-01 as a 1900-system serial
const DAYS_1904_TO_1900 = 1462;

/** UTC Unix milliseconds from the Date serial and Time (day fraction) cells. */
export function epochMs(dateSerial, dayFraction, date1904) {
  const days = dateSerial + (date1904 ? DAYS_1904_TO_1900 : 0) - EXCEL_1900_TO_UNIX_DAYS;
  return Math.round((days + dayFraction) * 86_400_000);
}

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

/**
 * Reads one shower's orbits out of the workbook. The header texts are checked first and the data layout is verified from the values
 * (`checkLayout`); a mismatch throws, because the layout changed. Returns { rows, counts, headers, date1904 } where rows are
 * [catalog, sheetRow, epochUtcMs, a, e, i, w, node, solarLongitude, Q, Vg, sigmaVg, pairsFlag] for bound orbits.
 */
export async function extractShower(xlsxPath, iauCode, { onProgress } = {}) {
  const entries = readZipEntries(xlsxPath);
  const find = (name) => {
    const entry = entries.find((candidate) => candidate.name === name);
    if (entry === undefined) throw new Error(`${xlsxPath} has no ${name}`);
    return entry;
  };
  const { date1904 } = await readWorkbookFlags(xlsxPath, find("xl/workbook.xml"));
  const strings = await readSharedStrings(xlsxPath, find("xl/sharedStrings.xml"));
  const sheet = find("xl/worksheets/sheet1.xml");

  const headerTexts = new Set();
  let firstDataRow = 0;
  const counts = { members: 0, unbound: 0, badSemiMajorAxis: 0, incomplete: 0, dropped: 0, pairsFlagged: 0 };
  const rows = [];
  const samples = [];
  let scanned = 0;
  await scanSheet(xlsxPath, sheet, (n, xml) => {
    scanned += 1;
    if (n <= 5) {
      for (const m of xml.matchAll(/<c r="[A-Z]+\d+"[^>]*?t="s"[^>]*><v>(\d+)<\/v>/g)) headerTexts.add((strings[Number(m[1])] ?? "").trim());
      return true;
    }
    if (firstDataRow === 0) {
      firstDataRow = n;
      const missing = EXPECTED_HEADER_TEXTS.filter((text) => !headerTexts.has(text));
      if (missing.length > 0) throw new Error(`header text ${missing.map((m) => `"${m}"`).join(", ")} not found in rows 1-5: the workbook layout changed`);
    }
    if (onProgress !== undefined && scanned % 50_000 === 0) onProgress(scanned);
    const ak = cellOf(xml, COLUMNS.iau, n, strings);
    const id = ak?.number ?? Number(ak?.text);
    if (id !== iauCode) return true;
    counts.members += 1;
    const get = (key) => {
      const cell = cellOf(xml, COLUMNS[key], n, strings);
      return cell?.number ?? (cell?.text === undefined ? Number.NaN : Number(cell.text));
    };
    const v = Object.fromEntries(Object.keys(COLUMNS).map((key) => [key, get(key)]));
    if (![v.catalog, v.date, v.time, v.solarLongitude, v.a, v.e, v.i, v.w, v.node, v.q, v.vg, v.vgSigma, v.pairs].every(Number.isFinite)) { counts.incomplete += 1; counts.dropped += 1; return true; }
    if (!(v.e < 1)) { counts.unbound += 1; counts.dropped += 1; return true; }
    if (!(v.a > 0)) { counts.badSemiMajorAxis += 1; counts.dropped += 1; return true; }
    samples.push(v);
    rows.push([String(v.catalog), n, epochMs(v.date, v.time, date1904), v.a, v.e, v.i, v.w, v.node, v.solarLongitude, v.q, v.vg, v.vgSigma, v.pairs]);
    if (v.pairs === 1) counts.pairsFlagged += 1; // double entries: counted and kept, no source says to drop them
    return true;
  });
  if (firstDataRow === 0) throw new Error("no data rows found: the workbook layout changed");
  const failures = checkLayout(samples);
  if (failures.length > 0) throw new Error(`the data layout is not what this tool reads: ${failures.join("; ")}`);
  return { rows, counts, headerTexts: [...headerTexts].filter((text) => EXPECTED_HEADER_TEXTS.includes(text)), firstDataRow, date1904, scannedRows: scanned };
}

export const ROW_COLUMNS = Object.freeze(["recordId", "sheetRow", "epochUtcMs", "semiMajorAxisAu", "eccentricity", "inclinationDeg", "argumentOfPeriapsisDeg", "raanDeg", "solarLongitudeDeg", "convergenceAngleDeg", "geocentricVelocityKmS", "geocentricVelocityErrorKmS", "pairsFlag"]);

/** The file written: a provenance header and the rows. */
export function showerFile({ iauCode, extraction, download, fetchedAt }) {
  return {
    provenance: {
      database: "CAMS Meteoroid Orbit Database v3.0 (CAMS combined, 2010-2016)",
      citation: CAMS_CITATION,
      source: CAMS_URL,
      readme: CAMS_README_URL,
      release: download,
      fetchedAt,
      iauCode,
      filter: "Shower I.D. (column AK) equals the IAU code; rows with e >= 1 (hyperbolic or parabolic, a is a sentinel) or a <= 0 or an empty element dropped",
      sheetColumns: { shower: "AK", recordId: "A (Catalog #)", epochUtcMs: "C Date + D Time (1904 date system)", semiMajorAxisAu: "BL", eccentricity: "BM", inclinationDeg: "BO", argumentOfPeriapsisDeg: "BQ", raanDeg: "BS", solarLongitudeDeg: "BF", convergenceAngleDeg: "AC (Q)", geocentricVelocityKmS: "AT", geocentricVelocityErrorKmS: "AU", pairsFlag: "BZ (1 = double entry)" },
      layoutNote: "Sheet header labels sit over the wrong letters (a is labelled over BJ but held in BL); the letters above were found from the data and verified from the values: elements in range, the repeated date/time columns equal, node within 1 degree of the solar longitude (mod 180) for 95% of rows.",
      headerTextsFound: extraction.headerTexts,
      firstDataRow: extraction.firstDataRow,
      date1904: extraction.date1904,
      counts: { ...extraction.counts, kept: extraction.rows.length },
      plane: "ecliptic-j2000 (readme: degrees, J2000); semi-major axis in AU",
      columns: ROW_COLUMNS,
      licenceNote: "Terms are silent beyond the citation request. Fetched to this machine only; never commit or ship (data/local/ is git-ignored and the public build is checked for it).",
    },
    rows: extraction.rows,
  };
}

async function sha256Of(path) {
  const hash = createHash("sha256");
  await pipeline(createReadStream(path), hash);
  return hash.digest("hex");
}

async function download(url, to) {
  const response = await fetch(url, { headers: { "User-Agent": BROWSER_USER_AGENT } });
  if (!response.ok || response.body === null) throw new Error(`${url}: HTTP ${response.status}`);
  await pipeline(Readable.fromWeb(response.body), createWriteStream(to));
  return { lastModified: response.headers.get("last-modified") };
}

function parseArgs(argv) {
  const options = { iauCode: null, xlsx: null, out: null, keep: null };
  for (let k = 0; k < argv.length; k++) {
    const arg = argv[k];
    if (arg === "--xlsx") options.xlsx = resolve(argv[++k]);
    else if (arg === "--out") options.out = resolve(argv[++k]);
    else if (arg === "--keep") options.keep = resolve(argv[++k]);
    else if (/^\d+$/.test(arg)) options.iauCode = Number(arg);
    else throw new Error(`unknown argument "${arg}"`);
  }
  if (options.iauCode === null) throw new Error("usage: node tools/data/fetch-meteoroid-orbits.mjs <iauCode> [--xlsx file] [--out file] [--keep downloadPath]");
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const out = options.out ?? localFileFor(options.iauCode);
  let xlsx = options.xlsx;
  let scratch = null;
  let lastModified = null;
  try {
    if (xlsx === null) {
      scratch = mkdtempSync(join(tmpdir(), "astraeus-cams-"));
      xlsx = options.keep ?? join(scratch, "CAMS-v3-2010to2016.xlsx");
      if (options.keep === null || !existsSync(xlsx)) {
        console.log(`downloading ${CAMS_URL} (about 322 MB) to ${xlsx}`);
        ({ lastModified } = await download(CAMS_URL, xlsx));
      }
    }
    const bytes = fstatSyncPath(xlsx);
    const sha256 = await sha256Of(xlsx);
    if (bytes !== CAMS_EXPECTED.bytes || sha256 !== CAMS_EXPECTED.sha256) {
      console.warn(`warning: the file is ${bytes} bytes with SHA-256 ${sha256}; T-051 recorded ${CAMS_EXPECTED.bytes} bytes and ${CAMS_EXPECTED.sha256}. The upstream file may have changed; the headers are still checked.`);
    }
    console.log(`reading shower ${options.iauCode} from ${xlsx}`);
    const extraction = await extractShower(xlsx, options.iauCode, { onProgress: (n) => process.stdout.write(`\r${n} rows scanned`) });
    process.stdout.write("\n");
    if (extraction.rows.length === 0) throw new Error(`no bound orbits found for IAU code ${options.iauCode}`);
    mkdirSync(dirname(out), { recursive: true });
    const fetchedAt = new Date().toISOString();
    writeFileSync(out, `${JSON.stringify(showerFile({ iauCode: options.iauCode, extraction, download: { bytes, sha256, lastModified, sheetRowsScanned: extraction.scannedRows }, fetchedAt }))}\n`);
    console.log(`wrote ${extraction.rows.length} orbits to ${out}`);
    console.log(JSON.stringify(extraction.counts));
  } finally {
    if (scratch !== null) rmSync(scratch, { recursive: true, force: true });
  }
}

function fstatSyncPath(path) {
  const fd = openSync(path, "r");
  try { return fstatSync(fd).size; } finally { closeSync(fd); }
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.message); process.exit(1); });
}
