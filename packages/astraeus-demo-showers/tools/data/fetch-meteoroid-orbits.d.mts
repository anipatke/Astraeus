export const BROWSER_USER_AGENT: string;
export const ROW_COLUMNS: readonly string[];
export function localFileFor(iauCode: number): string;
export function checkLayout(samples: Record<string, number>[]): string[];
export interface Extraction {
  rows: [string, number, number, number, number, number, number, number, number, number, number, number, number][];
  counts: { members: number; unbound: number; badSemiMajorAxis: number; incomplete: number; dropped: number; pairsFlagged: number };
}

export const GMN_BASE_URL: string;
export const GMN_COLUMNS_URL: string;
export const GMN_DATA_PAGE: string;
export const GMN_LICENCE: string;
export const GMN_LICENCE_URL: string;
export const GMN_CITATIONS: readonly string[];
export const GMN_HEADER_KEYS: Readonly<Record<string, string>>;
export function gmnMonthUrl(month: string): string;
export function gmnMonthFile(month: string): string;
export function gmnLayout(nameRow: string, unitRow: string): { at: Record<string, number>; columns: number; vgSigmaAt: number };
export function gmnEpochMs(text: string): number;
export interface GmnExtraction {
  rows: Extraction["rows"];
  counts: { members: number; unbound: number; badSemiMajorAxis: number; incomplete: number; dropped: number; pairsFlagged: number; rowsScanned: number };
  perFile: { month: string; members: number; columns: number; columnPositions: Record<string, number> }[];
  iauLetters: string | null;
}
export function extractGmn(files: { month: string; lines: AsyncIterable<string> | Iterable<string> }[], iauCode: number, options?: { onProgress?: (rows: number) => void }): Promise<GmnExtraction>;
export function gmnShowerFile(input: { iauCode: number; extraction: GmnExtraction; downloads: { month: string; url: string; bytes: number; sha256: string; lastModified: string | null }[]; fetchedAt: string }): { provenance: Record<string, any>; rows: Extraction["rows"] };
export const SHIPPABLE_LICENCES: readonly string[];
export const SHIPPED_COLUMNS: readonly string[];
export const COLUMN_LAYOUT: "columns";
export const TRIMMED_IDS: "time-trimmed";
export const QUALITY_COLUMNS: readonly string[];
export const QUALITY_RULE: { readonly minConvergenceAngleDeg: number; readonly maxVelocityErrorFraction: number };
export function trimId(id: string, epochUtcMs: number): string;
export function restoreId(id: string, epochUtcMs: number): string;
export function toColumns(rows: unknown[][]): unknown[][];
export function fromColumns(columns: unknown[][], trimmed?: boolean): unknown[][];
export function rowsOfFile(file: { provenance: Record<string, any>; rows: unknown[][] }): unknown[][];
export function shippedFileFor(story: string, iauCode: number): string;
export function shippedCopy(file: { provenance: Record<string, any>; rows: unknown[][] }): { provenance: Record<string, any>; rows: unknown[][] };
