export const PACKAGES: readonly string[];
export function buildPackage(name: string): { name: string; out: string; assets: number; chunks: number };
