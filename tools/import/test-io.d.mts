export declare const exists: (path: string) => boolean;
export declare const readText: (path: string) => string;
export declare const readJson: (path: string) => unknown;
export declare const runImporter: (importer: string, out: string) => void;
export declare const scratchDir: () => string;
export declare const readBytes: (path: string) => Uint8Array;
