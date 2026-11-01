export interface Surface { root: Record<string, unknown>; packageExports: Record<string, Record<string, string>>; sourceExports: Record<string, Record<string, string>> }
export const REPO_ROOT: string;
export const PACKAGES_DIR: string;
export const LOCK_PATH: string;
export const REGENERATE: string;
export function publishedExports(packagesDir?: string, which?: "published" | "source"): Record<string, Record<string, string>>;
export function currentSurface(entry?: string, packagesDir?: string): Surface;
export function writeLock(path?: string): void;
export function readLock(path?: string): Surface;
export function surfaceDifferences(lock: Surface, now: Surface): string[];
export function outsideApiTypes(entry?: string, apiDir?: string, repoRoot?: string): string[];
export const OPTIONS: Record<string, unknown>;
export const isOwnFile: (file: string) => boolean;
export const privateName: (name: string) => boolean;
