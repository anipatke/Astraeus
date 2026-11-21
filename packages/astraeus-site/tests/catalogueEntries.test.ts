// The state and text checks of the browser step `journey-catalogue.mjs` (O-086 T-387), proved without a browser. The page is filled in two steps: `renderCatalogueMain()` writes the entries at build, and `src/catalogue/page.ts`
// cuts each entry's import and add lines from the example's own text when it loads; this test does both, on the same data, and reads what the browser step read: the entries and their order, idle at the start, the
// plain names, the closed fold, the import and add lines, the shown code, and the out-of-the-box list. What needs a real browser stays in the step: the page's fit, the Run buttons' size, one viewer at a time and what a running viewer holds.
// The part list, plain names and fold are also proved in shelfCatalogue.test.ts ("the page text"); the rows here read them the way the step does (the whole list, exactly).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { EXAMPLES_DIR, readCatalogue, renderCatalogueMain } from "../tools/site/shelf-catalogue.mjs";
import { addPartsStatement, importLines } from "../src/catalogue/sourceLines";
import { holdsAddLines } from "../tools/validate/catalogue-lines.mjs";

const catalogue = readCatalogue();
const main = renderCatalogueMain();
const PARTS: string[] = catalogue.parts.map((part: { export: string }) => part.export);
const entryOf = (part: string): string => main.slice(main.indexOf(`id="part-${part}"`)).split("</article>")[0]!;
const decode = (text: string): string =>
  text
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
/** What the page shows for an entry once its script has run: the same cuts it makes from the example's text. */
const shown = (part: string) => {
  const source = readFileSync(join(EXAMPLES_DIR, `${part}.ts`), "utf8");
  return { importLines: importLines(source), addLines: addPartsStatement(source), code: source };
};

describe("the catalogue page's entries, as the catalogue browser step reads them", () => {
  it("has one entry for each part of the catalogue, in its order, every one idle when the page opens", () => {
    const entries = [
      ...main.matchAll(/<article class="part" id="part-[^"]+" data-part="([^"]+)" data-state="([^"]+)"/g),
    ];
    expect(entries.map((entry) => entry[1])).toEqual(PARTS);
    expect(entries.map((entry) => entry[2])).toEqual(PARTS.map(() => "idle"));
    expect(main).not.toContain("<canvas");
  });

  it("lists what comes out of the box, in the catalogue's order", () => {
    const list = /<ul class="basic-list" data-basics>(.*?)<\/ul>/s.exec(main)![1]!;
    const names = [...list.matchAll(/<li><b>(.*?)<\/b>/g)].map((match) => decode(match[1]!));
    expect(names).toEqual(catalogue.outOfTheBox.map((item: { name: string }) => item.name));
  });

  it.each(PARTS)("%s: opens with its plain name, its For developers fold closed", (part) => {
    const entry = entryOf(part);
    const name = /<h2 data-part-name>(.*?)<\/h2>/.exec(entry)![1]!;
    expect(decode(name)).toBe(catalogue.parts.find((item: { export: string }) => item.export === part)!.name);
    expect(entry).toMatch(/<details class="dev"><summary>For developers<\/summary>/);
    expect(entry).not.toMatch(/<details class="dev" open/);
  });

  it.each(PARTS)(
    "%s: the import line names the part, the add line holds it, the shown code holds the add line",
    (part) => {
      const { importLines: imports, addLines, code } = shown(part);
      expect(imports.includes('from "astraeus"') && imports.includes(part)).toBe(true);
      expect(addLines.startsWith("scene.addParts(") && addLines.includes(`${part}(`)).toBe(true);
      expect(holdsAddLines(code, addLines)).toBe(true);
    },
  );
});
