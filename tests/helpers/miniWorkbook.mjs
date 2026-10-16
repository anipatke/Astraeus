// Builds a small .xlsx in a temp directory with the same layout quirks as the CAMS workbook (1904 dates, shared strings, header labels over the
// wrong letters, empty self-closing cells), for testing the fetch tool's reader without the 322 MB file.
import { deflateRawSync } from "node:zlib";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (buffer) => { let c = 0xffffffff; for (const byte of buffer) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };

function zip(files) {
  const parts = [];
  const central = [];
  let offset = 0;
  for (const [name, content] of files) {
    const raw = Buffer.from(content);
    const data = deflateRawSync(raw);
    const nameBytes = Buffer.from(name);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(8, 8);
    local.writeUInt32LE(crc32(raw), 14); local.writeUInt32LE(data.length, 18); local.writeUInt32LE(raw.length, 22); local.writeUInt16LE(nameBytes.length, 26);
    parts.push(local, nameBytes, data);
    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50, 0); entry.writeUInt16LE(20, 4); entry.writeUInt16LE(20, 6); entry.writeUInt16LE(8, 10);
    entry.writeUInt32LE(crc32(raw), 16); entry.writeUInt32LE(data.length, 20); entry.writeUInt32LE(raw.length, 24); entry.writeUInt16LE(nameBytes.length, 28); entry.writeUInt32LE(offset, 42);
    central.push(entry, nameBytes);
    offset += 30 + nameBytes.length + data.length;
  }
  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10); end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, directory, end]);
}

const HEADER_TEXTS = ["Catalog #", "Shower I.D.", "Solar Longitude", "Node", "Pairs Flag"];

/**
 * `members`: [{ iau, catalog, date1904Serial, dayFraction, a, e, i, w, node, solarLongitude }]. Returns the path of the written workbook.
 * Header texts are written over letters that do not match the data columns, as in the real file.
 */
export function writeMiniWorkbook(members, { date1904 = true, header = HEADER_TEXTS } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "astraeus-mini-xlsx-"));
  const strings = ["CAMS test workbook", ...header];
  const cell = (letter, row, value) => (value === null ? `<c r="${letter}${row}" s="1"/>` : `<c r="${letter}${row}"><v>${value}</v></c>`);
  const headerRow = (n, texts) => `<row r="${n}" spans="1:82">${texts.map((t, k) => `<c r="${["A", "BJ", "BD", "BQ", "BZ"][k]}${n}" t="s"><v>${strings.indexOf(t)}</v></c>`).join("")}</row>`;
  const rows = members.map((m, k) => {
    const n = 6 + k + (k > 3 ? 1 : 0); // a gap in the row numbers, as the real sheet has
    const cells = [
      cell("A", n, m.catalog), cell("B", n, null), cell("C", n, m.date1904Serial), cell("D", n, m.dayFraction),
      cell("AK", n, m.iau), cell("AN", n, m.date1904Serial), cell("AO", n, m.dayFraction), cell("BF", n, m.solarLongitude),
      cell("AC", n, m.q ?? 40), cell("AT", n, m.vg ?? 59), cell("AU", n, m.vgSigma ?? 0.4), cell("BZ", n, m.pairs ?? 0),
      cell("BL", n, m.a), cell("BM", n, m.e), cell("BO", n, m.i), cell("BQ", n, m.w), cell("BS", n, m.node),
    ];
    return `<row r="${n}" spans="1:82">${cells.join("")}</row>`;
  });
  const sheet = `<?xml version="1.0"?><worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c></row>${headerRow(4, header)}${rows.join("")}</sheetData></worksheet>`;
  const sharedStrings = `<?xml version="1.0"?><sst count="${strings.length}">${strings.map((s) => `<si><t>${s}</t></si>`).join("")}</sst>`;
  const workbook = `<?xml version="1.0"?><workbook><workbookPr date1904="${date1904 ? 1 : 0}"/></workbook>`;
  const path = join(dir, "mini.xlsx");
  writeFileSync(path, zip([["xl/workbook.xml", workbook], ["xl/sharedStrings.xml", sharedStrings], ["xl/worksheets/sheet1.xml", sheet]]));
  return path;
}
