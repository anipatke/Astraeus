// The public catalogue page's text (O-080 T-335, design note `docs/architecture/viewer-interface.md` section 11): one entry for every root export of the engine whose doc comment carries `@shelf`,
// with what it is (the first sentence of its doc comment, so the README and the API page share its one source), its plain name, purpose, example and tags by story job (data/shelf-catalogue.json) and an example's place
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
export const exampleNames = () =>
  readdirSync(EXAMPLES_DIR)
    .filter((file) => file.endsWith(".ts"))
    .map((file) => file.slice(0, -3))
    .sort();
/** The root exports whose doc comment carries `@shelf`, as `{ name, doc }`. */
export const shelfExports = () =>
  collectExports()
    .filter((item) => item.shelf)
    .map(({ name, doc }) => ({ name, doc }));

/** The first sentence of a doc comment: up to the first full stop followed by a space or the end; the whole text when it has none. */
export const firstSentence = (doc) => (doc.match(/^.*?[.!?](?=\s|$)/s)?.[0] ?? doc).replace(/\s+/g, " ").trim();

const escape = (value) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const prose = (value) => escape(value).replace(/`([^`]+)`/g, "<code>$1</code>");

/** One part's entry, plain words first: its name, what it is for, an example, the story jobs as small tags and the Run button; the developer material (code name, doc-comment sentence, import and add lines, the whole example) sits in a closed "For developers" fold. Every hook is a `data-` attribute, which the browser driver reads (textContent, so a closed fold still reads). */
function renderPart(part, doc, jobs, jobLabels) {
  const uses = part.uses
    .map(
      (use) =>
        `<li><span class="job" data-job="${escape(use.job)}" title="${escape(jobs[use.job] ?? use.job)}">${escape(jobLabels[use.job] ?? use.job)}</span>${prose(use.text)}</li>`,
    )
    .join("");
  return `<article class="part" id="part-${escape(part.export)}" data-part="${escape(part.export)}" data-state="idle">
  <div class="part-text">
    <h2 data-part-name>${escape(part.name)}</h2>
    <p class="purpose">${prose(part.purpose)}</p>
    <p class="example"><b>For example:</b> ${prose(part.example)}</p>
    <ul class="uses" aria-label="Good for">${uses}</ul>
    <button type="button" class="run" data-part-run>Run the example</button>
  </div>
  <div class="part-demo">
    <div class="stage" data-part-stage><p class="idle-note">The example runs when you press the button; one viewer at a time.</p></div>
    <details class="dev"><summary>For developers</summary>
      <div class="dev-body">
        <p class="code-name"><code>${escape(part.export)}</code></p>
        <p class="what">${prose(firstSentence(doc))}</p>
        <div class="lines"><span class="eyebrow">Import</span><pre data-part-import></pre><span class="eyebrow">Add</span><pre data-part-add></pre></div>
        <span class="eyebrow">The whole example</span><pre data-part-code></pre>
      </div>
    </details>
  </div>
</article>`;
}

/** The page's body text: the out-of-the-box list, then one entry per part. A part whose export is not a `@shelf` export fails the build here. */
export function renderCatalogueMain() {
  const catalogue = readCatalogue();
  const docs = new Map(shelfExports().map(({ name, doc }) => [name, doc]));
  const parts = catalogue.parts.map((part) => {
    const doc = docs.get(part.export);
    if (doc === undefined)
      throw new Error(`data/shelf-catalogue.json names "${part.export}", which is not an engine export with @shelf`);
    return renderPart(part, doc, catalogue.jobs, catalogue.jobLabels);
  });
  const basics = catalogue.outOfTheBox
    .map((item) => `<li><b>${escape(item.name)}</b><span>${prose(item.text)}</span></li>`)
    .join("");
  const basicCode = catalogue.outOfTheBox
    .filter((item) => item.code)
    .map((item) => `<li><b>${escape(item.name)}</b> <code>${escape(item.code)}</code></li>`)
    .join("");
  return `<section class="basics" id="out-of-the-box"><div class="head"><h2>Already in every viewer</h2><p>You do not need to add any of these; they come with the viewer, and you fill them with your own words and numbers.</p></div><ul class="basic-list" data-basics>${basics}</ul>
<details class="dev"><summary>For developers</summary><div class="dev-body"><p>The calls that set these up:</p><ul class="code-list">${basicCode}</ul></div></details></section>
<section class="parts" id="parts"><div class="head"><h2>Ready-made pieces</h2><p>Each one is added on top of the viewer. The examples run on a made-up scene.</p></div>
${parts.join("\n")}
</section>`;
}
