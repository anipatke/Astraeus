import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), "../src");

/** Where a walk reads modules from: the real folder, or a made-up graph in a test. */
interface Source { read(file: string): string; exists(file: string): boolean }

const disk: Source = { read: (file) => readFileSync(file, "utf8"), exists: existsSync };

/** Specifiers a file loads at start-up: bare `import "./x"`, `import ... from`, `export ... from` and `export * from`; not `import type`, `export type` or `import()`. */
function staticSpecifiers(text: string): string[] {
  const found: string[] = [];
  for (const match of text.matchAll(/^import\s+["'](\.[^"']+)["']/gm)) found.push(match[1]);
  for (const match of text.matchAll(/^(?:import|export)\s+(type\s+)?([^;'"]*?)\s+from\s+["'](\.[^"']+)["']/gms)) {
    const [, typeOnly, names, spec] = match;
    if (typeOnly !== undefined) continue;
    if (/^\{[^}]*\}$/.test(names) && names.slice(1, -1).split(",").map((n) => n.trim()).filter(Boolean).every((n) => n.startsWith("type "))) continue;
    found.push(spec);
  }
  return found;
}

function staticImports(file: string, source: Source = disk): string[] {
  const found: string[] = [];
  for (const spec of staticSpecifiers(source.read(file))) {
    for (const ext of [".ts", ".tsx", "/index.ts"]) {
      const path = join(dirname(file), spec + ext);
      if (source.exists(path)) { found.push(path); break; }
    }
  }
  return found;
}

function firstOpenGraph(entry: string, source: Source = disk): Set<string> {
  const seen = new Set<string>();
  const queue = [entry];
  for (let file = queue.pop(); file !== undefined; file = queue.pop()) {
    if (seen.has(file)) continue;
    seen.add(file);
    queue.push(...staticImports(file, source));
  }
  return seen;
}

const names = (graph: Set<string>) => [...graph].map((path) => path.slice(SRC.length + 1));

describe("first-open import graph (T-179)", () => {
  const graph = names(firstOpenGraph(join(SRC, "api/index.ts")));

  it("reaches the scene and the per-frame debug figures", () => {
    expect(graph).toContain("app/App.tsx");
    expect(graph).toContain("app/developerPanels.tsx");
    expect(graph).toContain("app/sceneDebug.ts");
    expect(graph).toContain("app/debugReadout.ts");
  });

  it("does not reach the developer panels", () => {
    for (const panel of ["app/DeveloperSettings.tsx", "app/DebugOverlay.tsx", "app/FrameRateSection.tsx"]) {
      expect(graph, panel).not.toContain(panel);
    }
  });

  it("loads the developer panels through a dynamic import", () => {
    const text = readFileSync(join(SRC, "app/developerPanels.tsx"), "utf8");
    expect(text).toContain('import("./DeveloperSettings")');
    expect(staticImports(join(SRC, "app/developerPanels.tsx"))).toEqual([]);
  });
});

describe("first-open walker on a made-up graph (I-090)", () => {
  const graphOf = (files: Record<string, string>) => {
    const source: Source = { read: (f) => files[f] ?? "", exists: (f) => f in files };
    return [...firstOpenGraph("/m/index.ts", source)];
  };
  const panel = { "/m/Panel.tsx": "export const Panel = 1;" };

  it("follows a bare side-effect import", () => {
    expect(graphOf({ "/m/index.ts": 'import "./Panel";', ...panel })).toContain("/m/Panel.tsx");
  });

  it("follows an export-star chain", () => {
    const graph = graphOf({ "/m/index.ts": 'export * from "./mid";', "/m/mid.ts": 'export { Panel } from "./Panel";', ...panel });
    expect(graph).toContain("/m/mid.ts");
    expect(graph).toContain("/m/Panel.tsx");
  });

  it("does not follow a dynamic import", () => {
    expect(graphOf({ "/m/index.ts": 'const load = () => import("./Panel");', ...panel })).not.toContain("/m/Panel.tsx");
  });

  it("does not follow type-only imports or exports", () => {
    const text = 'import type { P } from "./Panel";\nexport type { P } from "./Panel";\nimport { type P } from "./Panel";';
    expect(graphOf({ "/m/index.ts": text, ...panel })).not.toContain("/m/Panel.tsx");
  });
});
