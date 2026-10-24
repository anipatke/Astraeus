export interface MeasureRow { file: string; raw: number; gzip: number; when: "first-open" | "on-demand" }
export interface Measure { rows: MeasureRow[]; totals: { raw: number; gzip: number } }
export function measureBuild(dir: string): Measure;
export function formatMeasure(measure: Measure): string;
