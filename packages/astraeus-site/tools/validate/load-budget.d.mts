export interface PageBudget {
  id: string;
  files: string[];
  htmlPage?: string;
  rawLimit: number;
  gzipLimit: number;
}
export interface BudgetResult {
  ok: boolean;
  pages: { id: string; files: number; raw: number; gzip: number; rawLimit: number; gzipLimit: number; problems: string[] }[];
}
export const PAGES: PageBudget[];
export const BUILD_LIMIT: { id: string; rawLimit: number; gzipLimit: number };
export function staticImportsOf(text: string): string[];
export function checkLoadBudget(input: { distDir: string; pages?: PageBudget[]; buildLimit?: { id: string; rawLimit: number; gzipLimit: number } }): BudgetResult;
export function proveLoadBudgetFails(): Record<"within" | "heavier" | "missing" | "unlistedImport" | "unlistedFile", BudgetResult>;
export function proveSameStemChunks(): Record<"first" | "chained" | "stemLeftOut" | "notImported", BudgetResult["pages"][number]>;
/** The planets a public build offers (Jupiter alone), and the files only the other planets' views list (T-136). */
export const PUBLIC_PLANETS: readonly string[];
export const NON_PUBLIC_PLANET_FILES: readonly string[];
