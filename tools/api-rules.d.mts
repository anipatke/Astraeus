export interface Break { rule: string; site: string; file?: string }
export const ENGINE_SRC: string;
export const UNIT_SUFFIX: RegExp;
export const ROOT_CLASS: string;
export const ERROR_TABLE_START: string;
export const ERROR_TABLE_END: string;
export function publicTypeBreaks(entry?: string): Break[];
export function errorBreaks(dir?: string): Break[];
export function errorCodes(file?: string): { code: string; meaning: string }[];
export function errorTable(codes?: { code: string; meaning: string }[]): string;
export function readmeErrorTable(readme: string): string | undefined;
export function addressParameters(src?: string): string[];
export function idLiteralBreaks(src?: string, dirs?: string[]): Break[];
export function cssSelectors(css: string): string[];
export function selectorBreaks(css: string): Break[];
export function styleSelectorBreaks(path?: string): Break[];
export function allowlistOffences(found: Break[], entries: { rule: string; site: string; finding?: string; removedBy?: string }[], name: string): string[];
