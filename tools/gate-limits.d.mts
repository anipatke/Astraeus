export interface GateLimits { about?: string; gates: Record<string, number>; browser: { total: number; steps: Record<string, number> } }
export const LIMITS_FILE: string;
export function loadLimits(file?: string): GateLimits;
export function overrun(label: string, seconds: number, limit: number | undefined): string;
