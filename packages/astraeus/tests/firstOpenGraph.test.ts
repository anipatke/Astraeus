import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), "../src");

/** Relative modules a file loads at start-up: static value imports and re-exports, not `import type` and not `import()`. */
function staticImports(file: string): string[] {
  const text = readFileSync(file, "utf8");
  const found: string[] = [];
  for (const match of text.matchAll(/^(?:import|export)\s+(type\s+)?([^;]*?)\s+from\s+"(\.[^"]+)";/gms)) {
    const [, typeOnly, names, spec] = match;
    if (typeOnly !== undefined) continue;
    if (/^\{[^}]*\}$/.test(names) && names.slice(1, -1).split(",").map((n) => n.trim()).filter(Boolean).every((n) => n.startsWith("type "))) continue;
    for (const ext of [".ts", ".tsx", "/index.ts"]) {
      const path = join(dirname(file), spec + ext);
      if (existsSync(path)) { found.push(path); break; }
    }
  }
  return found;
}

function firstOpenGraph(entry: string): Set<string> {
  const seen = new Set<string>();
  const queue = [entry];
  for (let file = queue.pop(); file !== undefined; file = queue.pop()) {
    if (seen.has(file)) continue;
    seen.add(file);
    queue.push(...staticImports(file));
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
