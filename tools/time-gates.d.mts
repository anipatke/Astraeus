import type { GateLimits } from "./gate-limits.mjs";
export interface TimedRow { name: string; passed: boolean; seconds: number; limit: number | undefined; warning: string }
export function timeGates(gates: readonly { name: string; command: string; args?: readonly string[] }[], limits: Pick<GateLimits, "gates">, log?: (text: string) => void, cwd?: string): { ok: boolean; rows: TimedRow[] };
export function npmGates(names: readonly string[]): { name: string; command: string; args: string[] }[];
