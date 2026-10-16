export const BSC_URL: string;
export const BSC_README_URL: string;
export const MAGNITUDE_LIMIT: number;
export const DEFAULT_OUT: string;
export function parseBsc(text: string, limit?: number): { records: number; skipped: number; stars: [number, number, number, number | null][] };
export function starFile(
  parsed: { stars: [number, number, number, number | null][]; records: number; skipped: number },
  fetchedAt: string,
  limit?: number,
): { provenance: Record<string, unknown>; stars: [number, number, number, number | null][] };
