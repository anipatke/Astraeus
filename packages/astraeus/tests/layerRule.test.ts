import ts from "typescript6";
import { describe, expect, it } from "vitest";

// What src/core/ may import beyond itself: bare specifiers only, each with its reason.
const CORE_LIBRARIES = [{ name: "@lizard-isana/orb", reason: "the astronomy library behind the adapters" }];

// Every source file under src/core/, read as text.
const coreSources = import.meta.glob("../src/core/**/*.{ts,tsx}", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

/** Module specifiers of real static imports, re-exports and string-literal dynamic imports; text in strings and comments is ignored. */
function specifiers(source: string): string[] {
  return ts.preProcessFile(source, true, true).importedFiles.map((file) => file.fileName);
}

const isCoreLibrary = (specifier: string) => CORE_LIBRARIES.some(({ name }) => specifier === name || specifier.startsWith(`${name}/`));

// Relative paths that may leave src/core/: the package's own data folder, JSON only (orbit and ring tables); a data file holds no code that could import upward.
const isCoreData = (file: string, specifier: string) => specifier.endsWith(".json") && layerOf(file, specifier) === "data";

/** What src/core/ may not import: a relative path leaving src/core/ (except JSON data), or a bare specifier not on CORE_LIBRARIES. */
function coreOffences(file: string, source: string): string[] {
  return specifiers(source)
    .filter((specifier) => (specifier.startsWith(".") ? layerOf(file, specifier) !== "core" && !isCoreData(file, specifier) : !isCoreLibrary(specifier)))
    .map((specifier) => `${file} imports ${specifier}`);
}

/** The top-level src/ folder a relative specifier written in `file` (a ../src/core/... path) points into. */
function layerOf(file: string, specifier: string): string {
  const parts = file.split("/").slice(2, -1); // ["core", ...subfolders]
  for (const step of specifier.split("/")) {
    if (step === "..") parts.pop();
    else if (step !== ".") parts.push(step);
  }
  return parts[0];
}

const assetSources = import.meta.glob("../src/assets/**/*.ts", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

describe("layer rule (ARCH-04)", () => {
  it("lets nothing under src/core/ import a layer above it", () => {
    const files = Object.keys(coreSources);
    expect(files.length).toBeGreaterThan(10);
    const offences = files.flatMap((file) => coreOffences(file, coreSources[file]));
    expect(offences).toEqual([]);
  });

  it("would catch an upward import, including from a subfolder (whitelist)", () => {
    const source = [
      'import { x } from "../app/ephemerisProvenance";',
      'export * from "../../shell/a";',
      'import type { C } from "../api/errors";',
      'import { t } from "../types/orb";',
      'import { Vector3 } from "three";',
      'const lazy = () => import("../app/x");',
      'import { ok } from "./body";',
      'import orbit from "../../../data/orbits/io.json";',
      'import { Luna } from "@lizard-isana/orb/src/orb-luna.js";',
      "const message = `from \"${x}\" is not a specifier`; // import { y } from \"../app/y\"",
    ].join("\n");
    expect(specifiers(source)).toEqual(["../app/ephemerisProvenance", "../../shell/a", "../api/errors", "../types/orb", "three", "../app/x", "./body", "../../../data/orbits/io.json", "@lizard-isana/orb/src/orb-luna.js"]);
    expect(coreOffences("../src/core/stateResolver.ts", source).map((line) => line.split(" imports ")[1])).toEqual([
      "../app/ephemerisProvenance", "../../shell/a", "../api/errors", "../types/orb", "three", "../app/x",
    ]);
    expect(layerOf("../src/core/stateResolver.ts", "../app/ephemerisProvenance")).toBe("app");
    expect(layerOf("../src/core/bodies/earth.ts", "../../shell/a")).toBe("shell");
    expect(layerOf("../src/core/bodies/earth.ts", "../body")).toBe("core");
  });

  it("lets src/assets/ import only src/core/, itself and Three.js", () => {
    const files = Object.keys(assetSources);
    expect(files.length).toBeGreaterThan(4);
    const offences: string[] = [];
    for (const file of files) {
      for (const specifier of specifiers(assetSources[file])) {
        if (!specifier.startsWith(".")) {
          if (specifier !== "three") offences.push(`${file} imports ${specifier}`);
        } else if (!["core", "assets"].includes(layerOf(file, specifier))) offences.push(`${file} imports ${specifier}`);
      }
    }
    expect(offences).toEqual([]);
  });
});
