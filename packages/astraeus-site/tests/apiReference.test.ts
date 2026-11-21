// O-040 T-165: the API reference is generated from the engine's public entry, and every export of that entry carries a doc comment.
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { beforeAll, describe, expect, it } from "vitest";
import { PAGES } from "../tools/validate/load-budget.mjs";
import {
  collectExports,
  renderApiPage,
  renderShelfApiPage,
  shelfExports,
  undocumentedExports,
} from "../tools/site/api-reference.mjs";

describe("API reference", () => {
  // I-080: building the TypeScript program of the public entry is the slow part (several seconds under coverage), so it is done once for the file.
  let items: ReturnType<typeof collectExports>;
  beforeAll(() => {
    items = collectExports();
  }, 60_000);

  it("has a doc comment on every export of the public entry", () => {
    expect(items.filter((item) => item.doc === "").map((item) => item.name)).toEqual([]);
  });

  it("keeps the generated page within the api/index.html raw and gzip limits of load-budget.mjs (I-142)", () => {
    const limit = PAGES.find((page) => page.id === "api/index.html");
    if (limit === undefined) throw new Error("load-budget.mjs lists no api/index.html page");
    const page = Buffer.from(renderApiPage(items));
    expect(page.length).toBeLessThanOrEqual(limit.rawLimit);
    expect(gzipSync(page).length).toBeLessThanOrEqual(limit.gzipLimit);
  });

  it("names an export that has no doc comment (proved on a made-up entry)", () => {
    const dir = mkdtempSync(join(tmpdir(), "astraeus-api-doc-"));
    try {
      const entry = join(dir, "index.ts");
      writeFileSync(
        entry,
        "/** Documented. */\nexport const kept = 1;\nexport function forgotten(): number { return 2; }\nexport interface AlsoForgotten { readonly a: number }\n",
      );
      expect(undocumentedExports(entry)).toEqual(["forgotten", "AlsoForgotten"]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("lists the public calls, the React component and the ready-made bodies, with examples for Scene, mount and AstraeusScene", () => {
    const names = items.map((item) => item.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "Scene",
        "SceneCamera",
        "mount",
        "AstraeusScene",
        "AstraeusSceneProps",
        "SceneError",
        "AnchorInput",
        "ReadoutInput",
        "Provenance",
        "ProvenanceSourceType",
        "trueScale",
        "readableScale",
        "earth",
        "titan",
      ]),
    );
    for (const name of ["Scene", "mount", "AstraeusScene"])
      expect(items.find((item) => item.name === name)?.examples.length, name).toBeGreaterThan(0);
    const page = renderApiPage(items);
    for (const name of names) expect(page, name).toContain(name);
    expect(page).toContain("addTrajectory");
    expect(page).toContain('name="viewport"');
    expect(page).not.toContain("<script");
  });

  it("puts the shelf parts' exports on api/shelf.html within its load-budget limits, each named and linked from the main page (O-080 T-336)", () => {
    const shelf = shelfExports(items);
    expect(shelf.filter((item) => item.shelf).map((item) => item.name)).toEqual(
      expect.arrayContaining(["panel", "customBlock", "explainer", "actions", "filterChips", "colourKey"]),
    );
    expect(shelf.every((item) => item.shelf || item.module.startsWith("shelf/"))).toBe(true);
    expect(items.filter((item) => item.module.startsWith("shelf/") && !shelf.includes(item))).toEqual([]);
    const limit = PAGES.find((page) => page.id === "api/shelf.html");
    if (limit === undefined) throw new Error("load-budget.mjs lists no api/shelf.html page");
    const page = renderShelfApiPage(items);
    expect(Buffer.byteLength(page)).toBeLessThanOrEqual(limit.rawLimit);
    expect(gzipSync(Buffer.from(page)).length).toBeLessThanOrEqual(limit.gzipLimit);
    const main = renderApiPage(items);
    for (const item of shelf) {
      expect(page, item.name).toContain(`id="${item.name.toLowerCase()}"`);
      expect(main, item.name).toContain(`href="shelf.html#${item.name.toLowerCase()}"`);
      expect(main, item.name).not.toContain(`<h3 id="${item.name.toLowerCase()}">`);
    }
    expect(page).toContain('href="./"');
    expect(page).toContain('href="../components.html"');
    expect(page).not.toContain("<script");
  });

  it("lists the chart and the readout tile, with their inputs, controls and the tile's part type, on api/shelf.html (O-081 T-339)", () => {
    const page = renderShelfApiPage(items);
    for (const name of [
      "chart",
      "readoutTile",
      "ChartInput",
      "ChartControl",
      "ReadoutTileInput",
      "ReadoutTileControl",
      "ReadoutScale",
      "TilePart",
    ])
      expect(page, name).toContain(`id="${name.toLowerCase()}"`);
    expect(page).toContain("setHighlight");
    expect(page).toContain("setScaleValue");
  });
});
