// O-058 T-237 (Success Condition 4): `src/api/` reaches into `app/` and `shell/` only for the definition contract, the viewer port and the viewer itself.
// A parser or any other helper an api file needs belongs in `src/core/`; a new `app/` or `shell/` import must be added to ALLOWED below with its reason, which is a review decision.
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const SRC = fileURLToPath(new URL("../src", import.meta.url));
const API = join(SRC, "api");

/** Every `app/` and `shell/` module an api file may import, with why. */
const ALLOWED: Readonly<Record<string, string>> = {
  "app/experienceDefinition": "the definition contract: the shape a host's experience is written in",
  "app/mission": "the definition contract: tracked bodies and line stretches a path layer names",
  "app/bodyMetrics": "the definition contract: the metrics a body offers",
  "app/trackedMetrics": "the definition contract: readout metrics for tracked bodies",
  "app/catalogueItem": "the definition contract: catalogue entries a body layer resolves",
  "app/planetNeeds": "the definition contract: which planet series a definition needs loaded",
  "app/displaySwitches": "the definition contract: display switch ids and places (the viewer's own settings shape)",
  "app/look": "the look table: the one place each look's address parameter and range are written, which setLook checks against",
  "app/views": "the definition contract: view places and camera rules (the viewer's own settings shape)",
  "shell/metrics": "the definition contract: the Metric and RateMetric types",
  "shell/experience": "the definition contract: ExperienceObject and ExperienceConfig, what the scene hands the shell",
  "app/viewerPort": "the viewer port: the control and state a host link talks to",
  "app/CameraController": "the viewer port: the camera request a host link sends",
  "app/App": "the viewer: mount renders it",
  "app/style.css": "the viewer: mount loads its stylesheet",
};

const IMPORT = /(?:\bfrom\s*|\bimport\s*\(?\s*)["'](\.\.\/(?:app|shell)\/[^"']+)["']/g;

/** The `app/` and `shell/` modules a source text imports (any form: import, export-from, side-effect, dynamic). */
function displayImports(source: string): string[] {
  return [...source.matchAll(IMPORT)].map((match) => match[1].replace(/^\.\.\//, ""));
}

/** The imports in `files` (name to text) that ALLOWED does not list, as `file: module`. */
function disallowed(files: Readonly<Record<string, string>>): string[] {
  return Object.entries(files).flatMap(([file, text]) => displayImports(text).filter((module) => !(module in ALLOWED)).map((module) => `${file}: ${module}`));
}

function apiFiles(dir: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) Object.assign(out, apiFiles(path));
    else if (/\.tsx?$/.test(entry.name)) out[relative(SRC, path)] = readFileSync(path, "utf8");
  }
  return out;
}

describe("src/api imports of app/ and shell/", () => {
  it("only the allowed modules", () => {
    expect(disallowed(apiFiles(API))).toEqual([]);
  });

  it("fails on a planted import of shell/storyPanels", () => {
    const planted = { "api/story.ts": 'import { parseStoryPanels } from "../shell/storyPanels";\n' };
    expect(disallowed(planted)).toEqual(["api/story.ts: shell/storyPanels"]);
  });

  it("reads type-only, side-effect, export-from and dynamic imports too", () => {
    const text = 'import type { A } from "../app/x";\nimport "../app/y.css";\nexport { B } from "../shell/z";\nconst c = await import("../app/w");\n';
    expect(displayImports(text)).toEqual(["app/x", "app/y.css", "shell/z", "app/w"]);
  });

  it("lists nothing unused", () => {
    const used = new Set(Object.values(apiFiles(API)).flatMap(displayImports));
    expect(Object.keys(ALLOWED).filter((module) => !used.has(module))).toEqual([]);
  });
});
