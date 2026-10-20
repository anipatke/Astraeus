// Browser check for the moon panel on the Jupiter experience (?experience=jupiter-io) at desktop and phone size (O-025 T-099). Run the app on
// port 5199, then: PLAYWRIGHT_CORE=<path to playwright-core> ASTRAEUS_EVIDENCE_DIR=<fresh dir> node tools/validate/browser-moon-panel.mjs
//
// Asserted at both sizes, all through the shared driver and the scene's own readouts (no pictures): the panel lists every family in the data's
// order with a live count, the big four sit on top with pictures, each family shows its plain description, named moons come first and the
// provisional designations fold into "+N unnamed", opening a family lights exactly its moons in the scene (the readout names the family and how
// many dots are lit), opening another moves the light and closing it clears it, tapping a moon focuses the camera on it and opens its
// information with family, size, discovery and sources, the search finds a moon by name and by designation as it is typed, and on a phone every
// row is at least 44 px tall. Layout (collision rule, owner 2026-10-19): at 375x667, 390x844, 1280x720 and 1440x900 no two shell panels overlap and all sit on screen with the
// moons open, a family open, a moon's information open and the moons reopened; the moons sheet and the information panel never show together. The look is the owner's.
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import * as ui from "./driver.mjs";

import { pw } from "./playwright.mjs";
const chromium = pw.chromium ?? pw.default.chromium;
const base = process.env.ASTRAEUS_URL ?? "http://localhost:5199/app.html";
const outDir = process.env.ASTRAEUS_EVIDENCE_DIR;
if (outDir) mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const errors = [];
const results = {};
const data = JSON.parse(readFileSync(new URL("../../data/moons/jupiter.json", import.meta.url), "utf8"));
const inFamily = (id) => data.moons.filter((moon) => moon.family === id);
const MAPPED = ["io", "europa", "ganymede", "callisto"];

async function lit(page) {
  await page.waitForTimeout(600);
  const readout = await ui.bodySetReadout(page);
  return { highlight: readout.highlight, lit: readout.lit, panel: await ui.moonPanelHighlight(page) };
}

/** Every pair of showing shell panels is apart (a controls drawer holds the top bar and the moons on a phone, so those are one), and each is on screen. */
async function assertNoOverlap(page, label) {
  await page.waitForTimeout(400);
  const boxes = await ui.shellPanelBoxes(page);
  const view = await ui.viewportSize(page);
  const held = new Set(["top-bar", "controls-drawer"]);
  for (const box of boxes) {
    if (box.name === "controls-drawer" || box.name === "timeline-drawer") continue;
    assert.ok(box.left >= -1 && box.top >= -1 && box.right <= view.width + 1 && box.bottom <= view.height + 1, `${label}: ${box.name} is on screen (${JSON.stringify(box)})`);
  }
  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      const a = boxes[i];
      const b = boxes[j];
      if (held.has(a.name) && held.has(b.name)) continue;
      // The Developer button sits in the open controls drawer's right-hand gutter, which the drawer reserves (phone.css, I-044); its content (the top bar) is checked apart from the button.
      if ([a.name, b.name].sort().join() === "controls-drawer,developer-mode-toggle") continue;
      const apart = a.right <= b.left + 1 || b.right <= a.left + 1 || a.bottom <= b.top + 1 || b.bottom <= a.top + 1;
      assert.ok(apart, `${label}: ${a.name} and ${b.name} overlap (${JSON.stringify(a)} / ${JSON.stringify(b)})`);
    }
  }
  return boxes.map((box) => box.name);
}

/** The panels in their busiest arrangements at one size: moons open, then a moon's information, then the moons again (closes the information). */
async function layoutAt(name, viewport) {
  const phone = viewport.width <= 700;
  const page = await browser.newPage({ viewport });
  page.on("pageerror", (error) => errors.push(`${name} pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`${name} console: ${message.text()}`); });
  const label = `${name} ${viewport.width}x${viewport.height}`;
  try {
    await page.goto(`${base}?experience=jupiter-io&sky=off`);
    await page.waitForSelector("canvas");
    await ui.waitForShell(page);
    await ui.ensurePaused(page);
    const seen = {};
    seen.closed = await assertNoOverlap(page, `${label}, panels closed`);
    await ui.openMoonPanel(page);
    seen.moonsOpen = await assertNoOverlap(page, `${label}, moons open`);
    await ui.tapMoonFamily(page, "carme");
    seen.carmeOpen = await assertNoOverlap(page, `${label}, a family open`);
    await ui.chooseMoon(page, "europa");
    await ui.infoPanelFor(page, "europa").waitFor();
    seen.info = await assertNoOverlap(page, `${label}, a moon's information open`);
    assert.ok(!seen.info.includes("moons-sheet"), `${label}: opening a moon's information closes the moons sheet`);
    await ui.openMoonPanel(page);
    seen.moonsAgain = await assertNoOverlap(page, `${label}, moons opened over the information`);
    assert.ok(!seen.moonsAgain.includes("info-panel"), `${label}: opening the moons closes the information panel`);
    if (phone) for (const row of await ui.moonRows(page, "carme")) assert.ok(row.heightPx >= 44, `${label}: ${row.id}'s row is ${row.heightPx} px tall (at least 44)`);
    await ui.closeMoonPanel(page);
    return seen;
  } finally {
    await page.close();
  }
}

async function run(name, viewport) {
  const phone = name === "phone";
  const page = await browser.newPage({ viewport });
  page.on("pageerror", (error) => errors.push(`${name} pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`${name} console: ${message.text()}`); });
  const notes = {};
  results[name] = notes;
  try {
    await page.goto(`${base}?experience=jupiter-io&sky=off`);
    await page.waitForSelector("canvas");
    await ui.waitForShell(page);
    await ui.ensurePaused(page);
    await ui.openMoonPanel(page);
    assert.ok(await ui.moonPanelShown(page), `${name}: the moon panel opens`);

    // Every family in the data's order, with its live count; the big four on top with their pictures.
    const families = await ui.moonFamilies(page);
    notes.families = families.map((family) => family.heading);
    assert.deepEqual(families.map((family) => family.id), data.families.map((family) => family.id), `${name}: every family, in the data's order`);
    for (const family of families) {
      const count = inFamily(family.id).length;
      assert.ok(family.heading.includes(String(count)), `${name}: ${family.id}'s heading shows its count ${count} ("${family.heading}")`);
    }
    // The total and the Horizons list date come from the data (I-045), never typed here.
    const listDate = new Date(`${data.asOf}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
    const summary = await ui.moonListSummaryText(page);
    notes.summary = summary;
    assert.ok(summary.includes(`${data.moons.length} moons`) && summary.includes(listDate), `${name}: the moons panel states the total ${data.moons.length} and the list date ${listDate} ("${summary}")`);
    assert.equal(await ui.featuredMoonPictures(page, "galilean"), 4, `${name}: the big four show four pictures`);

    // Open Carme: description, named moons first, the rest folded; the family lights up in the scene.
    await ui.tapMoonFamily(page, "carme");
    assert.ok(await ui.moonFamilyFoldOpen(page, "carme"), `${name}: Carme's section opens`);
    assert.equal(await ui.moonFamilyDescription(page, "carme"), data.families.find((family) => family.id === "carme").description, `${name}: Carme's description is the data's plain line`);
    const carme = inFamily("carme");
    const named = carme.filter((moon) => moon.named);
    const namedRows = await ui.moonRows(page, "carme");
    assert.deepEqual(namedRows.map((row) => row.id), named.map((moon) => moon.id), `${name}: only the named Carme moons show until the unnamed fold opens`);
    assert.match(await ui.unnamedMoonsHeading(page, "carme"), new RegExp(`\\+${carme.length - named.length} unnamed`), `${name}: the unnamed ones are folded into a count`);
    if (phone) for (const row of namedRows) assert.ok(row.heightPx >= 44, `${name}: ${row.id}'s row is ${row.heightPx} px tall (at least 44)`);
    await ui.openUnnamedMoons(page, "carme");
    const allRows = await ui.moonRows(page, "carme");
    assert.equal(allRows.length, carme.length, `${name}: opening the unnamed fold lists the rest (${allRows.length})`);
    let state = await lit(page);
    notes.carmeLit = state;
    assert.deepEqual(state, { highlight: "carme", lit: carme.length, panel: "carme" }, `${name}: Carme's ${carme.length} moons are lit in the scene`);

    // Another family moves the light; closing it clears it.
    await ui.tapMoonFamily(page, "ananke");
    state = await lit(page);
    assert.deepEqual(state, { highlight: "ananke", lit: inFamily("ananke").length, panel: "ananke" }, `${name}: opening Ananke moves the light`);
    await ui.tapMoonFamily(page, "ananke");
    state = await lit(page);
    assert.deepEqual(state, { highlight: "", lit: 0, panel: "" }, `${name}: closing the lit family clears the light`);

    // Tap a moon: the camera focuses it and its information opens with family, size, discovery and sources.
    await ui.tapMoonFamily(page, "himalia");
    const himalia = inFamily("himalia").find((moon) => moon.id === "himalia");
    await ui.chooseMoon(page, "himalia");
    await ui.infoPanelFor(page, "himalia").waitFor();
    assert.ok(await ui.focusedOn(page, "himalia"), `${name}: the camera is focused on Himalia`);
    const info = await ui.infoText(page);
    notes.info = info.slice(0, 400);
    assert.match(info, /Himalia group/, `${name}: the information names the family`);
    assert.match(info, /km across/, `${name}: the information gives the size`);
    assert.match(info, new RegExp(String(himalia.discoveryYear)), `${name}: the information gives the discovery year`);
    // The sources are one list in the provenance, opened from the panel.
    await ui.openProvenance(page);
    const sourcesText = await ui.provenanceDetailRaw(page);
    assert.match(sourcesText, /JPL/, `${name}: the information names its sources`);
    assert.ok(sourcesText.includes(data.asOf), `${name}: a small moon's information names the date the list was fetched`);
    assert.ok(sourcesText.includes(String(data.moons.length)), `${name}: a small moon's information names the moon total`);
    await ui.closeInfoStrict(page);

    // A big-four moon takes the same path.
    await ui.openMoonPanel(page);
    await ui.chooseMoon(page, "europa");
    await ui.infoPanelFor(page, "europa").waitFor();
    assert.ok(await ui.focusedOn(page, "europa"), `${name}: the camera is focused on Europa`);
    await ui.closeInfoStrict(page);

    // Search by name and by designation, as it is typed.
    await ui.openMoonPanel(page);
    await ui.searchMoons(page, "Himal");
    let found = await ui.moonSearchResults(page);
    assert.ok(found.some((entry) => entry.id === "himalia"), `${name}: "Himal" finds Himalia`);
    await ui.searchMoons(page, "S/2003 J 19");
    found = await ui.moonSearchResults(page);
    assert.deepEqual(found.map((entry) => entry.id), ["s2003-j19"], `${name}: a designation finds its moon`);
    await ui.searchMoons(page, "himalia");
    await ui.chooseMoon(page, "himalia");
    await ui.infoPanelFor(page, "himalia").waitFor();
    assert.ok(await ui.focusedOn(page, "himalia"), `${name}: a found moon flies to it`);
    await ui.closeInfoStrict(page);
    await ui.openMoonPanel(page);
    await ui.searchMoons(page, "zzzz");
    assert.deepEqual(await ui.moonSearchResults(page), [], `${name}: a name nothing matches lists nothing`);
    await ui.searchMoons(page, "");
    await ui.closeMoonPanel(page);
    // Jupiter's own information states the same total and date, and a small moon's sources name the fetch date.
    await ui.pickBody(page, "jupiter");
    await ui.openInfo(page, "Jupiter");
    await ui.infoPanelFor(page, "jupiter").waitFor();
    const jupiterInfo = await ui.infoText(page);
    assert.ok(jupiterInfo.includes(`${data.moons.length} moons`) && jupiterInfo.includes(listDate), `${name}: Jupiter's information states the total and the list date`);
    await ui.closeInfoStrict(page);
    notes.mapped = MAPPED;
  } finally {
    await page.close();
  }
}

try {
  for (const [name, viewport] of [["phone", { width: 375, height: 667 }], ["phone", { width: 390, height: 844 }], ["laptop", { width: 1280, height: 720 }], ["laptop", { width: 1440, height: 900 }]]) {
    results[`layout ${name} ${viewport.width}x${viewport.height}`] = await layoutAt(name, viewport);
  }
  await run("desktop", { width: 1280, height: 800 });
  await run("phone", { width: 390, height: 844 });
} finally {
  await browser.close();
}
console.log(JSON.stringify({ results, errors }, null, 2));
if (outDir) writeFileSync(`${outDir}/results.json`, `${JSON.stringify({ at: new Date().toISOString(), results, errors }, null, 2)}\n`);
if (errors.length > 0) process.exit(1);
