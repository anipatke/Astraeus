export interface DriverViolation {
  readonly file: string;
  readonly line: number;
  readonly text: string;
  readonly problems: readonly string[];
}
export const OPT_OUT: ReadonlyMap<string, string>;
export function violationsIn(text: string): readonly { readonly line: number; readonly text: string; readonly problems: readonly string[] }[];
export function scriptFiles(root?: string): readonly string[];
export function findViolations(root?: string): readonly DriverViolation[];
