import ts from "typescript6";
import { describe, expect, it } from "vitest";

// The presentation layer (ARCH-04): story-panel, start-view and look wording. It reads only src/core/ and itself; src/core/ never reads it.
const presentationSources = import.meta.glob("../src/presentation/**/*.{ts,tsx}", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const coreSources = import.meta.glob("../src/core/**/*.{ts,tsx}", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

/** Module specifiers from the real import, export-from and dynamic-import declarations (the compiler's reader, not a regex). */
function specifiers(source: string): string[] {
  return ts.preProcessFile(source, true, true).importedFiles.map((imported) => imported.fileName);
}

/** The top-level src/ folder a specifier written in `file` (a ../src/<layer>/... path) points into, or null for a package. */
function layerOf(file: string, specifier: string): string | null {
  if (!specifier.startsWith(".")) return null;
  const parts = file.split("/").slice(2, -1);
  for (const step of specifier.split("/")) {
    if (step === "..") parts.pop();
    else if (step !== ".") parts.push(step);
  }
  return parts[0];
}

/** Offences in a tree of sources: core importing presentation, or presentation importing anything but core, itself or no package. */
function offences(core: Readonly<Record<string, string>>, presentation: Readonly<Record<string, string>>): string[] {
  const found: string[] = [];
  for (const [file, source] of Object.entries(core)) {
    for (const specifier of specifiers(source)) if (layerOf(file, specifier) === "presentation") found.push(`${file} imports ${specifier}`);
  }
  for (const [file, source] of Object.entries(presentation)) {
    for (const specifier of specifiers(source)) {
      const layer = layerOf(file, specifier);
      if (layer === null || !["core", "presentation"].includes(layer)) found.push(`${file} imports ${specifier}`);
    }
  }
  return found;
}

describe("presentation layer rule (ARCH-04)", () => {
  it("keeps src/core/ from importing src/presentation/, and src/presentation/ to core and itself", () => {
    expect(Object.keys(presentationSources).length).toBeGreaterThanOrEqual(6);
    expect(Object.keys(coreSources).length).toBeGreaterThan(10);
    expect(offences(coreSources, presentationSources)).toEqual([]);
  });

  it("catches core importing presentation, including from a subfolder", () => {
    const core = { "../src/core/bodies/x.ts": 'import { a } from "../../presentation/startView";\nexport * from "../../presentation/skyTrace";' };
    expect(offences(core, {})).toEqual(["../src/core/bodies/x.ts imports ../../presentation/startView", "../src/core/bodies/x.ts imports ../../presentation/skyTrace"]);
  });

  it("catches presentation importing a higher layer or a package", () => {
    const presentation = {
      "../src/presentation/a.ts": 'import { a } from "../app/look";\nimport { b } from "three";\nconst c = import("../shell/x");\nimport { d } from "../core/state";\nimport { e } from "./b";',
    };
    expect(offences({}, presentation)).toEqual([
      "../src/presentation/a.ts imports ../app/look",
      "../src/presentation/a.ts imports three",
      "../src/presentation/a.ts imports ../shell/x",
    ]);
  });
});
