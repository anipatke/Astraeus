export function extractAssertions(source: string): string[];
export function listAssertions(names: string[], read: (name: string) => string): Record<string, string[]>;
export function currentAssertions(): Record<string, string[]>;
export function assertionsAt(commit: string): Record<string, string[]>;
