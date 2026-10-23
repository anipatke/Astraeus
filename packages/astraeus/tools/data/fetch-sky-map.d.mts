export const SIZES: Readonly<Record<string, readonly [number, number]>>;
export const DEFAULTS: Readonly<{ size: string; exposure: number; gamma: number; quality: number; tile: number; gain: number }>;
export function tileGrid(widthPx: number, heightPx: number, tile?: number): { columns: number; rows: number };
export function toneArgs(tone: { exposure: number; gamma: number }): string[];
export function buildManifest(input: { size: string; widthPx: number; heightPx: number; tilePx: number; exposure: number; gamma: number; quality: number; files: string[]; fetchedAt: string; gain?: number }): Record<string, unknown>;
