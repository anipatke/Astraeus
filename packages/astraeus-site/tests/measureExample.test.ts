import { gzipSync } from "node:zlib";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { ALLOWED_PICTURES, formatMeasure, measureBuild, unexpectedPictures } from "../../../tools/measure-example.mjs";

// O-043 T-178: the first-open counting works on a made-up build folder (no real build).
const dir = mkdtempSync(join(tmpdir(), "measure-example-"));
const write = (file: string, text: string) => writeFileSync(join(dir, file), text);
mkdirSync(join(dir, "assets"));
write(
  "index.html",
  '<html><head><script type="module" crossorigin src="/assets/entry.js"></script><link rel="stylesheet" href="/assets/app.css"></head></html>',
);
write("assets/entry.js", 'import{a}from"./shared.js";const later=()=>import("./lazy.js");export{a,later};');
write("assets/shared.js", 'import"./deep.js";export const a=1;');
write("assets/deep.js", "export const d=2;");
write("assets/lazy.js", "export const l=3;");
write("assets/app.css", "body{margin:0}");
write("assets/picture.jpg", "not counted");

afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("measureBuild", () => {
  const result = measureBuild(dir);

  it("marks the entry, its static imports and the stylesheet first-open, and the dynamic import on demand", () => {
    const when = Object.fromEntries(result.rows.map((row) => [row.file, row.when]));
    expect(when).toEqual({
      "assets/app.css": "first-open",
      "assets/deep.js": "first-open",
      "assets/entry.js": "first-open",
      "assets/lazy.js": "on-demand",
      "assets/shared.js": "first-open",
    });
  });

  it("sums raw and gzip bytes over the first-open files only", () => {
    const css = "body{margin:0}";
    const entry = 'import{a}from"./shared.js";const later=()=>import("./lazy.js");export{a,later};';
    const shared = 'import"./deep.js";export const a=1;';
    const deep = "export const d=2;";
    expect(result.totals.raw).toBe(css.length + entry.length + shared.length + deep.length);
    expect(result.totals.gzip).toBe(
      [css, entry, shared, deep].reduce((sum, text) => sum + gzipSync(Buffer.from(text)).length, 0),
    );
  });

  it("prints a header, one tab-separated row per file and the totals", () => {
    const lines = formatMeasure(result).split("\n");
    expect(lines[0]).toBe("file\traw\tgzip\twhen");
    expect(lines).toHaveLength(7);
    expect(lines[6]).toBe(`first-open total\t${result.totals.raw}\t${result.totals.gzip}\t`);
  });

  it("fails, naming the file and who loads it, when a first-open script is missing from the build", () => {
    const broken = mkdtempSync(join(tmpdir(), "measure-example-missing-"));
    try {
      mkdirSync(join(broken, "assets"));
      writeFileSync(
        join(broken, "index.html"),
        '<script type="module" src="/assets/entry.js"></script><script type="module" src="https://cdn.example/x.js"></script>',
      );
      writeFileSync(join(broken, "assets/entry.js"), 'import"./gone.js";');
      expect(() => measureBuild(broken)).toThrow("assets/entry.js loads assets/gone.js");
    } finally {
      rmSync(broken, { recursive: true, force: true });
    }
  });
});

describe("unexpectedPictures", () => {
  it("lists a data picture that is not allowed, by path, and leaves the engine's own pictures and the allowed one alone", () => {
    const pictures = mkdtempSync(join(tmpdir(), "measure-example-pictures-"));
    try {
      mkdirSync(join(pictures, "assets"));
      for (const file of [
        "milky-way-3fa9c1.jpg",
        "titan-4k-9d8e7f.jpg",
        "venus-8k-balanced-aa11.jpg",
        "earth-bmng-july-4k-BJxMI6UV.jpg",
        "milky-way-extra.jpg.txt",
      ])
        writeFileSync(join(pictures, "assets", file), "x");
      expect(unexpectedPictures(pictures, ["milky-way"], ["milky-way", "titan-4k", "venus-8k-balanced"])).toEqual([
        "assets/titan-4k-9d8e7f.jpg",
        "assets/venus-8k-balanced-aa11.jpg",
      ]);
      expect(
        unexpectedPictures(
          pictures,
          ["milky-way", "titan-4k", "venus-8k-balanced"],
          ["milky-way", "titan-4k", "venus-8k-balanced"],
        ),
      ).toEqual([]);
    } finally {
      rmSync(pictures, { recursive: true, force: true });
    }
  });

  it("names hello-sky as an example that may emit the Milky Way alone", () => {
    expect(ALLOWED_PICTURES["hello-sky"]).toEqual(["milky-way"]);
  });
});
