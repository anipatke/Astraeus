// Reads chosen sheet rows out of the CAMS workbook with the fetch tool's own zip/xml reader (for the optional source check in tests).
import { cellOf, COLUMNS, readSharedStrings, readZipEntries, scanSheet } from "../../tools/data/fetch-meteoroid-orbits.mjs";
import { existsSync } from "node:fs";

/** The workbook path named by CAMS_XLSX, when that file exists; otherwise null. */
export const workbookFromEnvironment = () => {
  const path = process.env.CAMS_XLSX;
  return path !== undefined && existsSync(path) ? path : null;
};

/** For each sheet row number, the catalogue number and elements in the workbook: { catalog, a, e, i, w, node }. */
export async function readSheetRows(path, rowNumbers) {
  const wanted = new Set(rowNumbers);
  const last = Math.max(...rowNumbers);
  const entries = readZipEntries(path);
  const strings = await readSharedStrings(path, entries.find((entry) => entry.name === "xl/sharedStrings.xml"));
  const found = new Map();
  await scanSheet(path, entries.find((entry) => entry.name === "xl/worksheets/sheet1.xml"), (n, xml) => {
    if (wanted.has(n)) {
      const get = (key) => cellOf(xml, COLUMNS[key], n, strings)?.number;
      found.set(n, { catalog: get("catalog"), iau: get("iau"), a: get("a"), e: get("e"), i: get("i"), w: get("w"), node: get("node") });
    }
    return n < last;
  });
  return found;
}
