// O-080 T-335: the component catalogue page stays complete. A root export whose doc comment carries `@shelf` needs a catalogue entry (data/shelf-catalogue.json) and an example (src/catalogue/examples/<name>.ts);
// an entry or an example naming no such export fails. Each example builds a scene through the public API alone, adds its part with `scene.addParts` and shows the import and add lines the page prints; the page text carries
// every entry with the first sentence of its doc comment.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { Scene } from "astraeus";
import {
  EXAMPLES_DIR,
  exampleNames,
  firstSentence,
  readCatalogue,
  renderCatalogueMain,
  shelfExports,
} from "../tools/site/shelf-catalogue.mjs";
import { addPartsStatement, importLines } from "../src/catalogue/sourceLines";
import { holdsAddLines } from "../tools/validate/catalogue-lines.mjs";

const shelf = shelfExports();
const shelfNames = shelf.map(({ name }) => name).sort();
const catalogue = readCatalogue();
const entryNames = catalogue.parts.map((part) => part.export).sort();
const exampleSource = (name: string): string => readFileSync(join(EXAMPLES_DIR, `${name}.ts`), "utf8");

describe("the catalogue holds every shelf export and nothing else", () => {
  it("finds every shelf part as an @shelf export", () => {
    expect(shelfNames).toEqual([
      "actions",
      "chart",
      "colourKey",
      "customBlock",
      "explainer",
      "filterChips",
      "panel",
      "readoutTile",
    ]);
  });
  it("has an entry for each @shelf export", () => {
    expect(
      shelfNames.filter((name) => !entryNames.includes(name)),
      "exports with no entry in data/shelf-catalogue.json",
    ).toEqual([]);
  });
  it("has an example for each @shelf export", () => {
    expect(
      shelfNames.filter((name) => !exampleNames().includes(name)),
      "exports with no example in src/catalogue/examples",
    ).toEqual([]);
  });
  it("names no entry or example that is not a @shelf export", () => {
    expect(
      entryNames.filter((name) => !shelfNames.includes(name)),
      "entries naming no such export",
    ).toEqual([]);
    expect(
      exampleNames().filter((name) => !shelfNames.includes(name)),
      "examples naming no such export",
    ).toEqual([]);
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
    expect(new Set(catalogue.parts.flatMap((part) => part.uses.map((use) => use.job)))).toEqual(
      new Set(["switch", "filter", "readout", "explainer"]),
    );
  });
  it("gives every entry its plain words: a name, a purpose and an example, and a plain label for each story job", () => {
    for (const part of catalogue.parts) {
      for (const field of ["name", "purpose", "example"] as const)
        expect(typeof part[field] === "string" && part[field].trim() !== "", `${part.export}: ${field}`).toBe(true);
    }
    for (const job of Object.keys(catalogue.jobs))
      expect(catalogue.jobLabels[job]?.trim(), `job label for ${job}`).toBeTruthy();
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
    // the first thing added is a call to a shelf part (a panel, or a tile that stands alone); a block added alone is refused by `addParts` when the scene builds (the build test below)
    const first = /^scene\.addParts\(\[\s*(\w+)\(/.exec(addPartsStatement(source))?.[1];
    expect(shelfNames, "the first thing added is a call to a shelf part").toContain(first);
    expect(addPartsStatement(source).endsWith("]);")).toBe(true);
  });
  it("the journey's shown-code check holds for the lines the page prints (I-188: the Add box is left-aligned, the whole example is not)", () => {
    const source = exampleSource(name);
    const add = addPartsStatement(source);
    expect(holdsAddLines(source, add)).toBe(true);
    // the journey's first assertion compared the left-aligned lines with the indented code as they stand, and failed for every example
    // (a statement the layout keeps on one line is a substring of its indented line, so the point is made for statements of several lines)
    if (add.includes("\n"))
      expect(
        source.includes(add),
        "the example's addParts statement is indented, so a plain substring test cannot be the check",
      ).toBe(false);
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
    const found = [...main.matchAll(/<article class="part" id="part-([^"]+)" data-part="([^"]+)"/g)].map(
      (match) => match[2],
    );
    expect(found).toEqual(catalogue.parts.map((part) => part.export));
    expect(main.match(/data-part-run/g)?.length).toBe(shelfNames.length);
    for (const hook of ["data-part-stage", "data-part-import", "data-part-add", "data-part-code"])
      expect(main.match(new RegExp(hook, "g"))?.length, hook).toBe(shelfNames.length);
  });
  it("gives each part the first sentence of its doc comment (in the developers fold)", () => {
    for (const { name, doc } of shelf) {
      const sentence = firstSentence(doc)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/`([^`]+)`/g, "<code>$1</code>");
      expect(main, name).toContain(`<p class="what">${sentence}</p>`);
    }
  });
  it("opens each entry with its plain name, purpose and example, and folds the developer material away", () => {
    for (const part of catalogue.parts) {
      const entry = main.slice(main.indexOf(`id="part-${part.export}"`)).split("</article>")[0]!;
      const head = entry.split('<details class="dev">')[0]!;
      expect(head, `${part.export}: name`).toContain(`<h2 data-part-name>${part.name}</h2>`);
      expect(head, `${part.export}: example line`).toContain("For example:");
      expect(head, `${part.export}: no code name before the fold`).not.toContain(`<code>${part.export}</code>`);
      expect(entry, `${part.export}: fold`).toMatch(/<details class="dev"><summary>For developers<\/summary>/);
      expect(entry.match(/<details class="dev" open/)).toBeNull();
      expect(entry, `${part.export}: code name inside the fold`).toContain(`<code>${part.export}</code>`);
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

describe("holdsAddLines (the catalogue journey's shown-code check, I-188)", () => {
  const code =
    'export function buildScene() {\n  const scene = makeScene();\n  scene.addParts([\n    panel({ id: "a" }),\n  ]);\n  return scene;\n}';
  it("finds left-aligned add lines in indented code, line by line", () => {
    expect(holdsAddLines(code, 'scene.addParts([\n  panel({ id: "a" }),\n]);')).toBe(true);
  });
  it("refuses add lines the code does not hold as written, out of order, split from each other or empty", () => {
    expect(holdsAddLines(code, 'scene.addParts([\n  panel({ id: "b" }),\n]);')).toBe(false);
    expect(holdsAddLines(code, "]);\nscene.addParts([")).toBe(false);
    expect(holdsAddLines(code, "scene.addParts([\n]);")).toBe(false);
    expect(holdsAddLines(code, "addParts([")).toBe(false);
    expect(holdsAddLines(code, "")).toBe(false);
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

describe("addPartsStatement reads brackets, not lines (a reformat must not change what the page shows)", () => {
  it("cuts the same statement whether the call is on one line or several, and ignores brackets in strings", () => {
    const one = '  const scene = makeScene();\n  scene.addParts([panel({ id: "a)" })]);\n  return scene;';
    const many = '  const scene = makeScene();\n  scene.addParts([\n    panel({ id: "a)" }),\n  ]);\n  return scene;';
    expect(addPartsStatement(one)).toBe('scene.addParts([panel({ id: "a)" })]);');
    expect(addPartsStatement(many)).toBe('scene.addParts([\n  panel({ id: "a)" }),\n]);');
    expect(addPartsStatement("const scene = makeScene();")).toBe("");
    expect(addPartsStatement("scene.addParts([panel(")).toBe("");
  });
});
