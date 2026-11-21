export interface CatalogueUse { job: string; text: string }
export interface CataloguePart { export: string; uses: CatalogueUse[] }
export interface Catalogue { about: string; jobs: Record<string, string>; outOfTheBox: { name: string; text: string }[]; parts: CataloguePart[] }
export const CATALOGUE_FILE: string;
export const EXAMPLES_DIR: string;
export function readCatalogue(): Catalogue;
export function exampleNames(): string[];
export function shelfExports(): { name: string; doc: string }[];
export function firstSentence(doc: string): string;
export function renderCatalogueMain(): string;
