export interface PackRow { name: string; packedMB: number; unpackedMB: number; files: number; limit: { packed: number; unpacked: number; files: number } }
export const LIMITS: Record<string, { packed: number; unpacked: number; files: number }>;
export function checkPacks(options?: { build?: boolean; only?: readonly string[] }): { ok: boolean; rows: PackRow[]; problems: string[] };
