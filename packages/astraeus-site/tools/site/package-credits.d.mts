export interface PackageCredits { readonly package: string; readonly licenceFiles: readonly string[]; readonly dataLicences: readonly { readonly file: string; readonly licence: string }[] }
export function packageNames(rootDir?: string): string[];
export function gatherPackageCredits(rootDir?: string): PackageCredits[];
export const ENGINE_LIBRARY_LICENCES: readonly string[];
export function checkEngineLicences(rootDir?: string): { ok: boolean; missing: string[] };
