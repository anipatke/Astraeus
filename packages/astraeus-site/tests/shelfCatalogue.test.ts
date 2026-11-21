// O-080 T-335: the component catalogue page stays complete. A root export whose doc comment carries `@shelf` needs a catalogue entry (data/shelf-catalogue.json) and an example (src/catalogue/examples/<name>.ts);
// an entry or an example naming no such export fails. Each example builds a scene through the public API alone, adds its part with `scene.addParts` and shows the import and add lines the page prints; the page text carries
// every entry with the first sentence of its doc comment.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { Scene } from "astraeus";
import { EXAMPLES_DIR, exampleNames, firstSentence, readCatalogue, renderCatalogueMain, shelfExports } from "../tools/site/shelf-catalogue.mjs";
import { addPartsStatement, importLines } from "../src/catalogue/sourceLines";

const shelf = shelfExports();
const shelfNames = shelf.map(({ name }) => name).sort();
const catalogue = readCatalogue();
const entryNames = catalogue.parts.map((part) => part.export).sort();
const exampleSource = (name: string): string => readFileSync(join(EXAMPLES_DIR, `${name}.ts`), "utf8");

describe("the catalogue holds every shelf export and nothing else", () => {
  it("finds the six parts of this Objective as @shelf exports", () => {
    expect(shelfNames).toEqual(["actions", "colourKey", "customBlock", "explainer", "filterChips", "panel"]);
  });
  it("has an entry for each @shelf export", () => {
    expect(shelfNames.filter((name) => !entryNames.includes(name)), "exports with no entry in data/shelf-catalogue.json").toEqual([]);
  });
  it("has an example for each @shelf export", () => {
    expect(shelfNames.filter((name) => !exampleNames().includes(name)), "exports with no example in src/catalogue/examples").toEqual([]);
  });
  it("names no entry or example that is not a @shelf export", () => {
    expect(entryNames.filter((name) => !shelfNames.includes(name)), "entries naming no such export").toEqual([]);
    expect(exampleNames().filter((name) => !shelfNames.includes(name)), "examples naming no such export").toEqual([]);
  });
  it("lists no export twice, and gives every entry a use for a known story job", () => {
    expect(new Set(entryNames).size).toBe(entryNames.length);
    for (const part of catalogue.parts) {
      expect(part.uses.length, `${part.export} uses`).toBeGreaterThan(0);
      for (const use of part.uses) {
        expect(Object.keys(catalogue.jobs), `${part.export}: ${use.job}`).toContain(use.job);
        expect(use.text.trim(), `${part.export} use text`).not.toBe("");
      }
    }
  });
  it("covers the four story jobs between its uses", () => {
    expect(new Set(catalogue.parts.flatMap((part) => part.uses.map((use) => use.job)))).toEqual(new Set(["switch", "filter", "readout", "explainer"]));
  });
  it("has an out-of-the-box section", () => {
    expect(catalogue.outOfTheBox.length).toBeGreaterThan(3);
    for (const item of catalogue.outOfTheBox) expect(item.name !== "" && item.text !== "").toBe(true);
  });
});

describe.each(shelfNames)("the example for %s", (name) => {
  it("imports from astraeus alone and adds its part with scene.addParts", () => {
    const source = exampleSource(name);
    const imports = [...source.matchAll(/^import .* from "([^"]+)";/gm)].map((match) => match[1]);
    expect(imports.filter((from) => from !== "astraeus" && from !== "../madeUpScene")).toEqual([]);
    expect(importLines(source)).toContain(name);
    expect(addPartsStatement(source)).toMatch(/^scene\.addParts\(\[\n\s+panel\(/);
    expect(addPartsStatement(source).endsWith("]);")).toBe(true);
  });
  it("uses the part it is for", () => {
    const body = addPartsStatement(exampleSource(name));
    expect(body, `${name}( is in the addParts statement`).toContain(`${name}(`);
  });
  it("builds a scene on made-up data with its parts added", async () => {
    const example = (await import(`../src/catalogue/examples/${name}.ts`)) as { buildScene(): Scene };
    const scene = example.buildScene();
    expect(scene).toBeInstanceOf(Scene);
    expect(scene.bodies.map((body) => body.id)).toEqual(["lantern"]);
    await scene.load(); // the scene is checked as a viewer checks it: an action's camera names an object the scene has
  });
});

describe("the page text", () => {
  const main = renderCatalogueMain();
  it("has an entry, a run button and the code places for each part, in the catalogue's order", () => {
    const found = [...main.matchAll(/<article class="part" id="part-([^"]+)" data-part="([^"]+)"/g)].map((match) => match[2]);
    expect(found).toEqual(catalogue.parts.map((part) => part.export));
    expect(main.match(/data-part-run/g)?.length).toBe(shelfNames.length);
    for (const hook of ["data-part-stage", "data-part-import", "data-part-add", "data-part-code"]) expect(main.match(new RegExp(hook, "g"))?.length, hook).toBe(shelfNames.length);
  });
  it("gives each part the first sentence of its doc comment", () => {
    for (const { name, doc } of shelf) {
      const sentence = firstSentence(doc).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/`([^`]+)`/g, "<code>$1</code>");
      expect(main, name).toContain(`<p class="what">${sentence}</p>`);
    }
  });
  it("lists the out-of-the-box parts", () => {
    for (const item of catalogue.outOfTheBox) expect(main).toContain(`<b>${item.name}</b>`);
  });
  it("is linked from the pitch page and listed in the build", () => {
    expect(readFileSync(join(__dirname, "..", "index.html"), "utf8")).toContain('href="components.html"');
    expect(readFileSync(join(__dirname, "..", "vite.config.ts"), "utf8")).toContain("components.html");
    expect(readFileSync(join(__dirname, "..", "components.html"), "utf8")).toContain("<!--shelf-catalogue-->");
  });
  it("sees an entry removed or an export without an entry (the test's own proof)", () => {
    const without = catalogue.parts.filter((part) => part.export !== "colourKey").map((part) => part.export);
    expect(shelfNames.filter((name) => !without.includes(name))).toEqual(["colourKey"]);
    expect([...without, "ghost"].filter((name) => !shelfNames.includes(name))).toEqual(["ghost"]);
  });
});

describe("firstSentence", () => {
  it.each([
    ["One. Two.", "One."],
    ["No full stop here", "No full stop here"],
    ["A (b.c) d; e. Then f", "A (b.c) d; e."],
    ["Line one\nline two. After", "Line one line two."],
  ])("%j gives %j", (doc, sentence) => expect(firstSentence(doc)).toBe(sentence));
});
