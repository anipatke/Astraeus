import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PICTURES } from "astraeus-data";
import { checkPacks, extensionlessImports, LIMITS } from "../../../tools/check-packs.mjs";
import { PACKAGES } from "../../../tools/build-packages.mjs";

// O-036 T-161: the publishable packages build and pack within the decided contents and sizes (the same check as `npm run check:pack`).
// Slow part first: one build and eight `npm pack --dry-run` runs, about 12 s.
describe("publishable packages", () => {
  it("every package builds, packs only allowed files and stays under its limits", () => {
    const result = checkPacks();
    expect(result.problems).toEqual([]);
    expect(result.rows.map((row) => row.name)).toEqual([...PACKAGES]);
    expect(Object.keys(LIMITS).sort()).toEqual([...PACKAGES].sort());
  }, 120_000);

  it("fails on a test file, a source file and a cache folder in a package", () => {
    const dist = join(__dirname, "..", "..", "astraeus-data-pluto", "dist");
    mkdirSync(join(dist, "src", "tests"), { recursive: true });
    writeFileSync(join(dist, "src", "x.test.js"), "");
    writeFileSync(join(dist, "src", "stray.ts"), "");
    writeFileSync(join(dist, "src", "notes.txt"), "");
    try {
      const result = checkPacks({ build: false, only: ["astraeus-data-pluto"] });
      expect(result.ok).toBe(false);
      expect(result.problems).toEqual(expect.arrayContaining([
        "astraeus-data-pluto: forbidden file src/x.test.js",
        "astraeus-data-pluto: forbidden file src/stray.ts",
        "astraeus-data-pluto: unexpected file src/notes.txt",
      ]));
    } finally {
      rmSync(join(dist, "src", "tests"), { recursive: true, force: true });
      rmSync(join(dist, "src", "x.test.js"), { force: true });
      rmSync(join(dist, "src", "stray.ts"), { force: true });
      rmSync(join(dist, "src", "notes.txt"), { force: true });
    }
  }, 60_000);

  it("fails on a compiled file with an extensionless relative import (webpack 5, I-077)", () => {
    const dist = join(__dirname, "..", "..", "astraeus-data-pluto", "dist");
    writeFileSync(join(dist, "src", "bad.js"), 'export { a } from "./chunks";\nconst b = await import("../x/y");\nexport * from "./chunks.js";\n');
    try {
      expect(extensionlessImports(dist)).toEqual(["src/bad.js: ./chunks", "src/bad.js: ../x/y"]);
      expect(checkPacks({ build: false, only: ["astraeus-data-pluto"] }).problems).toContain("astraeus-data-pluto: extensionless relative import in src/bad.js: ./chunks");
    } finally {
      rmSync(join(dist, "src", "bad.js"), { force: true });
    }
  }, 60_000);

  it("fails on a chunk URL a bundler could inline, and on a missing chunk list type (I-078)", () => {
    const dist = join(__dirname, "..", "..", "astraeus-data-pluto", "dist");
    const list = join(dist, "src", "chunks.js");
    const types = join(dist, "src", "chunks.d.ts");
    const original = readFileSync(list, "utf8");
    const declaration = readFileSync(types, "utf8");
    const problem = "astraeus-data-pluto: a chunk URL in src/chunks.js lacks ?no-inline (Vite would inline it)";
    try {
      for (const broken of [original.replace("?no-inline", ""), original.replace("?no-inline", "?no-inline=0")]) {
        writeFileSync(list, broken);
        expect(checkPacks({ build: false, only: ["astraeus-data-pluto"] }).problems).toContain(problem);
      }
      writeFileSync(list, original);
      rmSync(types);
      expect(checkPacks({ build: false, only: ["astraeus-data-pluto"] }).problems).toContain("astraeus-data-pluto: src/chunks.d.ts is missing (chunkUrls would be untyped)");
    } finally {
      writeFileSync(list, original);
      writeFileSync(types, declaration);
    }
  }, 60_000);
});

describe("astraeus-data credits (PROV-02)", () => {
  it("every picture carries a licence with a credit and a source page", () => {
    expect(Object.keys(PICTURES).length).toBe(17);
    for (const [name, texture] of Object.entries(PICTURES)) {
      expect(texture.licence, name).toBeDefined();
      expect(texture.licence!.attribution, name).toBeTruthy();
      expect(texture.licence!.url, name).toMatch(/^https:\/\//);
    }
  });
});
