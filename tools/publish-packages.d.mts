export function planFor(input: { name: string; version: string; tag?: string; published: boolean }): { name: string; action: "publish" | "skip" | "refuse"; reason: string };
export function publishArgs(dir: string, dryRun: boolean): string[];
export function publishAll(options?: { dryRun?: boolean; tag?: string }): { name: string; dir: string; action: string; reason: string }[];
