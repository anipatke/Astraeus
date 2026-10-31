export const ENGINE_EXAMPLE_DIR: string;
export const ENGINE_LIMIT: { rawLimit: number; gzipLimit: number };
export function checkEngineBudget(input?: { exampleDir?: string; limit?: { rawLimit: number; gzipLimit: number } }): { ok: boolean; raw: number; gzip: number; rawLimit: number; gzipLimit: number; problems: string[] };
type Verdict = { ok: boolean; problems: string[] };
export function proveEngineDemoSplit(): Record<"base" | "engineGrown" | "demoGrown", { page: Verdict; engine: Verdict }>;
