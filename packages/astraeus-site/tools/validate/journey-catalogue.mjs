// Journey "Catalogue" (O-080 T-335), a step of `npm run check:browser`: the component catalogue page (components.html) at 1280x720 and at 375x667 with touch. Every shelf part in data/shelf-catalogue.json has its entry with its
// import and add lines and its whole example; the page fits its window with the words and the example of an entry clear of each other; starting an example draws one viewer that holds the part's own words, starting another
// stops the first (one viewer at a time), and stopping leaves none. Everything goes through driver.mjs and the page's own data- readouts; no screenshot is taken.
// Alone: ASTRAEUS_URL=<app.html url> ASTRAEUS_EVIDENCE_DIR=<new dir> node tools/validate/journey-catalogue.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { holdsAddLines } from "./catalogue-lines.mjs";
import * as ui from "./driver.mjs";
import { appUrl, checkScript } from "./harness.mjs";

const SIZES = [
  { name: "desktop", width: 1280, height: 720 },
  { name: "phone", width: 375, height: 667, isMobile: true, hasTouch: true },
];
const catalogue = JSON.parse(readFileSync(new URL("../../data/shelf-catalogue.json", import.meta.url), "utf8"));
const PARTS = catalogue.parts.map((part) => part.export);
/** A word each example's own bar button or panel carries, found in the viewer's text (lower case): the part is really in the viewer. */
const ITS_WORDS = { panel: "about", customBlock: "own", explainer: "moves", actions: "fly", filterChips: "kinds", colourKey: "key" };

await checkScript({ name: "journey-catalogue", viewports: SIZES }, async (page, { name }) => {
  await page.goto(new URL("components.html", appUrl()).href);
  const listed = await ui.catalogueParts(page);
  assert.deepEqual(listed.map((entry) => entry.part), PARTS, "the page has one entry for each part of the catalogue, in its order");
  assert.ok(listed.every((entry) => entry.state === "idle"), "no example runs when the page opens");
  assert.equal(await ui.catalogueViewerCount(page), 0, "no viewer is drawn when the page opens");
  const basics = await ui.catalogueBasics(page);
  assert.deepEqual(basics, catalogue.outOfTheBox.map((item) => item.name), "the page lists what comes out of the box");

  const minButtonPx = name === "phone" ? 44 : 24;
  for (const part of PARTS) {
    const entry = await ui.catalogueEntry(page, part);
    assert.equal(entry.name, catalogue.parts.find((item) => item.export === part).name, `${part}: the entry opens with its plain name`);
    assert.equal(entry.devOpen, false, `${part}: the For developers fold starts closed`);
    assert.ok(entry.importLines.includes(`from "astraeus"`) && entry.importLines.includes(part), `${part}: the import line names the part`);
    assert.ok(entry.addLines.startsWith("scene.addParts(") && entry.addLines.includes(`${part}(`), `${part}: the add line holds the part`);
    assert.ok(holdsAddLines(entry.code, entry.addLines), `${part}: the shown code is the code that runs (it holds the add lines, each without its leading space)`);
    assert.ok(entry.runHeightPx >= minButtonPx, `${name}: ${part}'s Run button is big enough to press (${entry.runHeightPx} px, need ${minButtonPx})`);
  }
  const fit = await ui.catalogueFit(page);
  assert.equal(fit.sidewaysScrollPx, 0, `${name}: the page does not scroll sideways (${fit.sidewaysScrollPx} px)`);
  assert.deepEqual(fit.overlaps, [], `${name}: no entry's words and example cross`);
  assert.deepEqual(fit.outside, [], `${name}: every viewer box is inside the window's width`);

  // One viewer at a time: start the first, then the second (the first stops), then stop the second.
  const [first, second] = [PARTS[0], PARTS[PARTS.length - 2]];
  await ui.pressCatalogueRun(page, first);
  await ui.waitForCatalogueState(page, first, "running");
  assert.deepEqual(await ui.catalogueActive(page), [first], "the first example runs alone");
  assert.equal(await ui.catalogueViewerCount(page), 1, "one viewer is drawn");
  assert.ok((await ui.catalogueEntry(page, first)).stage.toLowerCase().includes(ITS_WORDS[first]), `${first}: the viewer holds the part's own words`);
  await ui.pressCatalogueRun(page, second);
  await ui.waitForCatalogueState(page, second, "running");
  assert.deepEqual(await ui.catalogueActive(page), [second], "starting another stops the first");
  assert.equal(await ui.catalogueViewerCount(page), 1, "still one viewer is drawn");
  assert.equal((await ui.catalogueParts(page)).find((entry) => entry.part === first).state, "idle", "the first entry is idle again");
  assert.ok((await ui.catalogueEntry(page, second)).stage.toLowerCase().includes(ITS_WORDS[second]), `${second}: the viewer holds the part's own words`);
  const running = await ui.catalogueFit(page);
  assert.equal(running.sidewaysScrollPx, 0, `${name}: the page does not scroll sideways while a viewer runs`);
  assert.deepEqual(running.overlaps, [], `${name}: nothing crosses while a viewer runs`);
  await ui.pressCatalogueRun(page, second);
  await ui.waitForCatalogueState(page, second, "idle");
  assert.equal(await ui.catalogueViewerCount(page), 0, "stopping leaves no viewer");

  // Every example starts (one after another, never two at once).
  for (const part of PARTS) {
    await ui.pressCatalogueRun(page, part);
    await ui.waitForCatalogueState(page, part, "running");
    assert.ok((await ui.catalogueEntry(page, part)).stage.toLowerCase().includes(ITS_WORDS[part]), `${part}: the viewer holds the part's own words`);
    assert.equal(await ui.catalogueViewerCount(page), 1, `${part}: one viewer is drawn`);
  }
  return { parts: PARTS.length, fit };
});
