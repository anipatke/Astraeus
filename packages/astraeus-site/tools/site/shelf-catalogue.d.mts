export interface CatalogueUse {
  job: string;
  text: string;
}
export interface CataloguePart {
  export: string;
  name: string;
  purpose: string;
  example: string;
  uses: CatalogueUse[];
}
export interface Catalogue {
  about: string;
  jobs: Record<string, string>;
  jobLabels: Record<string, string>;
  outOfTheBox: { name: string; text: string; code: string }[];
  parts: CataloguePart[];
}
export const CATALOGUE_FILE: string;
export const EXAMPLES_DIR: string;
export function readCatalogue(): Catalogue;
export function exampleNames(): string[];
export function shelfExports(): { name: string; doc: string }[];
export function firstSentence(doc: string): string;
export function renderCatalogueMain(): string;
