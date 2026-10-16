export interface LocalOnlySource {
  readonly file: string;
  readonly path: string;
  readonly text?: boolean;
}
export interface PublicBuildMatch {
  readonly source: string;
  readonly path: string;
  readonly how: "identical file" | "embedded as base64" | "embedded as text" | "path under data/local";
}
export interface PublicBuildResult {
  readonly ok: boolean;
  readonly checked: number;
  readonly sources: readonly { readonly file: string; readonly sha256: string; readonly bytes: number }[];
  readonly matches: readonly PublicBuildMatch[];
}
export function findLocalOnlySources(rootDir?: string): readonly LocalOnlySource[];
export function findLocalDataSources(rootDir?: string): readonly LocalOnlySource[];
export function checkPublicBuild(input: { readonly distDir: string; readonly sources: readonly LocalOnlySource[] }): PublicBuildResult;
export function proveItFails(): {
  readonly clean: PublicBuildResult;
  readonly copied: PublicBuildResult;
  readonly embedded: PublicBuildResult;
  readonly dataSources: number;
  readonly dataClean: PublicBuildResult;
  readonly dataCopied: PublicBuildResult;
  readonly dataEmbedded: PublicBuildResult;
  readonly dataPath: PublicBuildResult;
};
export const REQUIRED_PAGES: readonly string[];
export const SHIPPABLE_LICENCES: readonly string[];
/** Which files of a made-up data/local/ the validator would still check (CAMS, Yale, a non-shippable licence) and which it passes (a declared CC BY 4.0). */
export function proveLicenceHandling(): readonly string[];
