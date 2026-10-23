import { describe, expect, it } from "vitest";

const FORBIDDEN = ["assets", "app", "shell", "experiences", "mission", "showers", "synthetic"];

// Every source file under src/core/, read as text.
const coreSources = import.meta.glob("../src/core/**/*.{ts,tsx}", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

/** Module specifiers named by static, dynamic and re-export statements. */
function specifiers(source: string): string[] {
  return [...source.matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)].map((match) => match[1]);
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
    const offences: string[] = [];
    for (const file of files) {
      for (const specifier of specifiers(coreSources[file])) {
        if (specifier.startsWith(".") && FORBIDDEN.includes(layerOf(file, specifier))) offences.push(`${file} imports ${specifier}`);
      }
    }
    expect(offences).toEqual([]);
  });

  it("would catch an upward import, including from a subfolder", () => {
    const source = `import { x } from "../app/ephemerisProvenance";\nexport * from "../../shell/a";`;
    expect(specifiers(source)).toEqual(["../app/ephemerisProvenance", "../../shell/a"]);
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
