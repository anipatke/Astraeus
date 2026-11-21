// The public catalogue page's text (O-080 T-335, design note `docs/architecture/viewer-interface.md` section 11): one entry for every root export of the engine whose doc comment carries `@shelf`,
// with what it is (the first sentence of its doc comment, so the README and the API page share its one source), its suggested uses by story job (data/shelf-catalogue.json) and an example's place
// for the page script to fill. `tests/shelfCatalogue.test.ts` holds the JSON, the examples and the `@shelf` exports together. The page script (src/catalogue/page.ts) adds the live example and its source.
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { collectExports } from "./api-reference.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const site = join(here, "..", "..");
export const CATALOGUE_FILE = join(site, "data", "shelf-catalogue.json");
export const EXAMPLES_DIR = join(site, "src", "catalogue", "examples");

export const readCatalogue = () => JSON.parse(readFileSync(CATALOGUE_FILE, "utf8"));
/** The names of the example modules in src/catalogue/examples (without `.ts`). */
export const exampleNames = () => readdirSync(EXAMPLES_DIR).filter((file) => file.endsWith(".ts")).map((file) => file.slice(0, -3)).sort();
/** The root exports whose doc comment carries `@shelf`, as `{ name, doc }`. */
export const shelfExports = () => collectExports().filter((item) => item.shelf).map(({ name, doc }) => ({ name, doc }));

/** The first sentence of a doc comment: up to the first full stop followed by a space or the end; the whole text when it has none. */
export const firstSentence = (doc) => (doc.match(/^.*?[.!?](?=\s|$)/s)?.[0] ?? doc).replace(/\s+/g, " ").trim();

const escape = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const prose = (value) => escape(value).replace(/`([^`]+)`/g, "<code>$1</code>");

/** One part's entry. The run button, the viewer box and the code are inert until the page script wires them (every hook is a `data-` attribute, which the browser driver reads). */
function renderPart(part, doc, jobs) {
  const uses = part.uses.map((use) => `<li><span class="job" data-job="${escape(use.job)}" title="${escape(jobs[use.job] ?? use.job)}">${escape(use.job)}</span>${prose(use.text)}</li>`).join("");
  return `<article class="part" id="part-${escape(part.export)}" data-part="${escape(part.export)}" data-state="idle">
  <div class="part-text">
    <h2><code>${escape(part.export)}</code></h2>
    <p class="what">${prose(firstSentence(doc))}</p>
    <ul class="uses" aria-label="Suggested uses">${uses}</ul>
    <button type="button" class="run" data-part-run>Run the example</button>
  </div>
  <div class="part-demo">
    <div class="stage" data-part-stage><p class="idle-note">The example runs when you press the button; one viewer at a time.</p></div>
    <div class="lines"><span class="eyebrow">Import</span><pre data-part-import></pre><span class="eyebrow">Add</span><pre data-part-add></pre></div>
    <details class="source"><summary>The whole example</summary><pre data-part-code></pre></details>
  </div>
</article>`;
}

/** The page's body text: the out-of-the-box list, then one entry per part. A part whose export is not a `@shelf` export fails the build here. */
export function renderCatalogueMain() {
  const catalogue = readCatalogue();
  const docs = new Map(shelfExports().map(({ name, doc }) => [name, doc]));
  const parts = catalogue.parts.map((part) => {
    const doc = docs.get(part.export);
    if (doc === undefined) throw new Error(`data/shelf-catalogue.json names "${part.export}", which is not an engine export with @shelf`);
    return renderPart(part, doc, catalogue.jobs);
  });
  const basics = catalogue.outOfTheBox.map((item) => `<li><b>${escape(item.name)}</b><span>${prose(item.text)}</span></li>`).join("");
  return `<section class="basics" id="out-of-the-box"><div class="head"><h2>What you get out of the box</h2><p>The basic interface needs no shelf part; these come with every viewer.</p></div><ul class="basic-list" data-basics>${basics}</ul></section>
<section class="parts" id="parts"><div class="head"><h2>The shelf</h2><p>Parts a story adds on top. Each example runs on a made-up scene, built only through the public API.</p></div>
${parts.join("\n")}
</section>`;
}
