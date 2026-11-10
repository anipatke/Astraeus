export declare const EXAMPLES: string[];
export declare const EXAMPLE_PACKAGES: string[];
/** Builds the packages once, then every example (or only `only`, an example's folder name). */
export declare function buildExample(only?: string, options?: { buildPackages?: boolean }): void;
