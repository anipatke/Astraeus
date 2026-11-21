export interface PackRow {
  name: string;
  packedMB: number;
  unpackedMB: number;
  files: number;
  limit: { packed: number; unpacked: number; files?: number };
}
export const LIMITS: Record<string, { packed: number; unpacked: number; files?: number }>;
export function checkPacks(options?: { build?: boolean; only?: readonly string[] }): {
  ok: boolean;
  rows: PackRow[];
  problems: string[];
};
export function extensionlessImports(dir: string): string[];
export function strayFiles(paths: readonly string[], sourceDir: string, publishFiles: readonly string[]): string[];
export function enginePeerRange(version: string): string;
export const REACT_PEER_RANGE: string;
export function ringFactProblems(dir: string): string[];
export function pastTheEntry(source: string): string[];
export function packedComments(text: string): string[];

/** Packed paths that are forbidden or outside the package's allow-list. */
export function fileListProblems(name: string, paths: readonly string[]): string[];
/** Stray-file problems of the engine's pack (none for other packages). */
export function strayProblems(name: string, paths: readonly string[]): string[];
/** Compiled-code problems in a package folder: extensionless imports, packed comments, chunk list rules. */
export function codeProblems(name: string, dir: string): string[];
/** Peer-library problems of a manifest. */
export function peerProblems(name: string, manifest: Record<string, unknown>): string[];
/** The React range the engine takes. */
export const REACT_PEER_RANGE: string;
/** Builds the self-proof folder and returns what the stray and import rules name. */
export function selfProof(): { stray: string[]; extensionless: string[] };
