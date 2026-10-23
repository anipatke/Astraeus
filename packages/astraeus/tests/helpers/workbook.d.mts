export function workbookFromEnvironment(): string | null;
export function readSheetRows(path: string, rowNumbers: number[]): Promise<Map<number, { catalog: number; iau: number; a: number; e: number; i: number; w: number; node: number }>>;
