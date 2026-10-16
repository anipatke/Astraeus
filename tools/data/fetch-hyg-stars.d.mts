export type HygRow = [raDeg: number, decDeg: number, vMag: number, bMinusV: number | null];
export interface HygParsed {
  readonly records: number;
  readonly skipped: number;
  readonly stars: HygRow[];
}
export const HYG_URL: string;
export const HYG_PAGE_URL: string;
export const HYG_ARCHIVE_URL: string;
export const HYG_LICENCE: string;
export const HYG_LICENCE_URL: string;
export const MAGNITUDE_LIMIT: number;
export const DEFAULT_OUT: string;
export const ATTRIBUTION: string;
export function splitCsvLine(line: string): string[];
export function parseHyg(text: string, limit?: number): HygParsed;
export function starFile(parsed: HygParsed, accessed: string, limit?: number): { provenance: Record<string, unknown>; stars: HygRow[] };
