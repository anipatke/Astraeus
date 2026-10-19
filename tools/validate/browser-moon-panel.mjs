// Browser check for the moon panel on the Jupiter experience (?experience=jupiter-io) at desktop and phone size (O-025 T-099). Run the app on
// port 5199, then: PLAYWRIGHT_CORE=<path to playwright-core> ASTRAEUS_EVIDENCE_DIR=<fresh dir> node tools/validate/browser-moon-panel.mjs
//
// Asserted at both sizes, all through the shared driver and the scene's own readouts (no pictures): the panel lists every family in the data's
// order with a live count, the big four sit on top with pictures, each family shows its plain description, named moons come first and the
// provisional designations fold into "+N unnamed", opening a family lights exactly its moons in the scene (the readout names the family and how
// many dots are lit), opening another moves the light and closing it clears it, tapping a moon focuses the camera on it and opens its
// information with family, size, discovery and sources, the search finds a moon by name and by designation as it is typed, and on a phone every
// row is at least 44 px tall. The look is the owner's.
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import * as ui from "./driver.mjs";

const pw = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
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
    assert.match(info, /JPL/, `${name}: the information names its sources`);
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
    notes.mapped = MAPPED;
  } finally {
    await page.close();
  }
}

try {
  await run("desktop", { width: 1280, height: 800 });
  await run("phone", { width: 390, height: 844 });
} finally {
  await browser.close();
}
console.log(JSON.stringify({ results, errors }, null, 2));
if (outDir) writeFileSync(`${outDir}/results.json`, `${JSON.stringify({ at: new Date().toISOString(), results, errors }, null, 2)}\n`);
if (errors.length > 0) process.exit(1);
