export const CAMS_URL: string;
export const CAMS_README_URL: string;
export const CAMS_CITATION: string;
export const CAMS_EXPECTED: { readonly bytes: number; readonly sha256: string; readonly rows: number };
export const BROWSER_USER_AGENT: string;
export const COLUMNS: Readonly<Record<string, string>>;
export const EXPECTED_HEADER_TEXTS: readonly string[];
export const ROW_COLUMNS: readonly string[];
export function localFileFor(iauCode: number): string;
export interface ZipEntry { name: string; method: number; compressedSize: number; size: number; headerOffset: number }
export function readZipEntries(path: string): ZipEntry[];
export function openEntry(path: string, entry: ZipEntry): AsyncIterable<Uint8Array>;
export function readSharedStrings(path: string, entry: ZipEntry): Promise<string[]>;
export function readWorkbookFlags(path: string, entry: ZipEntry): Promise<{ date1904: boolean }>;
export function cellOf(rowXml: string, letter: string, rowNumber: number, strings: string[]): { text?: string; number?: number } | null;
export function scanSheet(path: string, entry: ZipEntry, onRow: (rowNumber: number, rowXml: string) => boolean | void): Promise<void>;
export function epochMs(dateSerial: number, dayFraction: number, date1904: boolean): number;
export function checkLayout(samples: Record<string, number>[]): string[];
export interface Extraction {
  rows: [string, number, number, number, number, number, number, number, number, number, number, number, number][];
  counts: { members: number; unbound: number; badSemiMajorAxis: number; incomplete: number; dropped: number; pairsFlagged: number };
  headerTexts: string[];
  firstDataRow: number;
  date1904: boolean;
  scannedRows: number;
}
export function extractShower(xlsxPath: string, iauCode: number, options?: { onProgress?: (rows: number) => void }): Promise<Extraction>;
export function showerFile(input: { iauCode: number; extraction: Extraction; download: Record<string, unknown>; fetchedAt: string }): { provenance: Record<string, any>; rows: Extraction["rows"] };
