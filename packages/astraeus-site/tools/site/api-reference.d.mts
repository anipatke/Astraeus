export interface ApiMember { name: string; optional: boolean; signature: string; method: boolean; doc: string }
export interface ApiExport { name: string; kind: "class" | "interface" | "type" | "function" | "const" | "other"; doc: string; examples: string[]; signature: string; members: ApiMember[]; constructors: string[]; body: boolean }
export const PUBLIC_ENTRY: string;
export function collectExports(entry?: string): ApiExport[];
export function undocumentedExports(entry?: string): string[];
export function renderApiPage(items: ApiExport[]): string;
export function buildApiPage(entry?: string): string;
