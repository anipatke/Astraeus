// Browser check for the phone layout (T-081, O-020 Done When 2, 3, 4, 8): at phone sizes, portrait (390x844) and landscape (844x390), for an
// experience with story panels (Apollo 11, the default) and one with moons (Jupiter-Io):
//   - the scene fills the screen: only the name pill, the cog and the two-line timeline show; no horizontal scroll;
//   - the top drawer opens and closes by a tap on the pill and the handle, and by a swipe down and a swipe up;
//   - the timeline drawer opens and closes by a tap on its handle and by swipes; its speed slider drives the speed;
//   - a drag on the scene (every direction) never opens a drawer; time, playing state and the picked object survive opening and closing;
//   - an information panel opens as a sheet above the timeline (Play stays reachable) with Sources closed, one tap opens them, a swipe down dismisses the sheet;
//   - a story panel's Sources are closed by default, and the panel never covers the timeline's Play button;
//   - touch targets are at least 44 px; the settings that drive the layout have live controls in the developer panel;
//   - reduced motion removes the drawer animation; zero console and page errors.
// Safe-area insets cannot be emulated headlessly; the stylesheet's use of them is asserted by reading it (see assertSafeAreaInStylesheet).
//   PLAYWRIGHT_CORE=<path> ASTRAEUS_URL=<app.html url> [ASTRAEUS_EVIDENCE_DIR=<fresh dir>] node tools/validate/browser-phone.mjs
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import * as ui from "./driver.mjs";

const pw = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const chromium = pw.chromium ?? pw.default.chromium;
const base = process.env.ASTRAEUS_URL ?? "http://localhost:5199/app.html";
const outDir = process.env.ASTRAEUS_EVIDENCE_DIR;
if (outDir !== undefined) mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const errors = [];
const log = [];
const note = (text) => { log.push(text); console.log(text); };

const SIZES = [
  { name: "portrait", viewport: { width: 390, height: 844 } },
  { name: "landscape", viewport: { width: 844, height: 390 } },
];
const EXPERIENCES = [
  { name: "apollo11", query: "", hasPanels: true },
  { name: "jupiter-io", query: "?experience=jupiter-io", hasPanels: false },
];

async function openPage(size, query, extra = {}) {
  const context = await browser.newContext({ viewport: size.viewport, isMobile: true, hasTouch: true, ...extra });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  await page.goto(`${base}${query}`, { waitUntil: "load", timeout: 60000 });
  await ui.waitForShell(page, { timeout: 60000 });
  await ui.ensurePausedQuietly(page);
  await page.waitForTimeout(1500);
  return { context, page };
}
const shot = async (page, name) => { if (outDir !== undefined) await page.screenshot({ path: `${outDir}/${name}.png` }); };

function assertSafeAreaInStylesheet() {
  const css = readFileSync(new URL("../../src/shell/phone.css", import.meta.url), "utf8");
  for (const edge of ["top", "bottom", "left", "right"]) assert.ok(css.includes(`env(safe-area-inset-${edge}`), `phone.css respects the ${edge} safe-area inset`);
}

async function checkLayout(label, page) {
  const boxes = await ui.phoneBoxes(page);
  const viewport = page.viewportSize();
  assert.ok(boxes.pill !== null, `${label}: the name pill shows`);
  assert.ok(await ui.controlsPillName(page), `${label}: the pill names the picked object`);
  assert.deepEqual(await ui.drawerStates(page), { controls: false, timeline: false }, `${label}: both drawers start closed`);
  assert.ok(boxes.cog !== null && boxes.cog.right <= viewport.width, `${label}: the cog shows`);
  assert.ok(boxes.bar.bottom <= viewport.height && boxes.bar.left >= 0 && boxes.bar.right <= viewport.width, `${label}: the timeline fits the screen`);
  assert.ok(!(await ui.scrollsSideways(page)), `${label}: no horizontal scroll`);
  const filled = (boxes.bar.height + boxes.pill.height) / viewport.height;
  assert.ok(filled < (viewport.height < 500 ? 0.62 : 0.3), `${label}: the chrome leaves the scene most of the screen (${(filled * 100).toFixed(0)}%)`);
  note(`  ${label}: pill ${Math.round(boxes.pill.width)}x${Math.round(boxes.pill.height)}, bar ${Math.round(boxes.bar.height)} px tall, chrome ${(filled * 100).toFixed(0)}% of the height`);
}

async function checkTouchTargets(label, page) {
  const small = (await ui.controlStyles(page)).filter((control) => control.rect.height < 43.5 || control.rect.width < 43.5);
  assert.ok(small.length === 0, `${label}: every control is at least 44 px each way; too small: ${small.map((c) => `${c.name} ${Math.round(c.rect.width)}x${Math.round(c.rect.height)}`).join(", ")}`);
}

async function checkControlsDrawer(label, page) {
  // Tap opens and closes; the object list is out of sight until it opens.
  assert.ok(!(await ui.objectListShown(page)), `${label}: the object list is hidden while the drawer is closed`);
  await ui.tapPill(page);
  await ui.waitForDrawer(page, "controls", true);
  assert.deepEqual(await ui.drawerStates(page), { controls: true, timeline: false }, `${label}: a tap on the pill opens the top drawer`);
  assert.ok(await ui.objectListShown(page), `${label}: the object list shows in the open drawer`);
  await checkTouchTargets(`${label} top drawer`, page);
  await shot(page, `${label}-controls-open`);
  const boxes = await ui.phoneBoxes(page);
  assert.ok(boxes.drawer.bottom < page.viewportSize().height * 0.7, `${label}: the top drawer leaves part of the scene (${Math.round(boxes.drawer.bottom)} px)`);
  await ui.tapControlsHandle(page);
  await ui.waitForDrawer(page, "controls", false);
  assert.deepEqual(await ui.drawerStates(page), { controls: false, timeline: false }, `${label}: a tap on the handle closes it`);
  // Swipes.
  await ui.swipePillDown(page);
  await ui.waitForDrawer(page, "controls", true);
  assert.equal((await ui.drawerStates(page)).controls, true, `${label}: a swipe down on the pill opens it`);
  await ui.swipeControlsHandleUp(page);
  await ui.waitForDrawer(page, "controls", false);
  assert.equal((await ui.drawerStates(page)).controls, false, `${label}: a swipe up on the handle closes it`);
  await ui.tapPill(page);
  await ui.waitForDrawer(page, "controls", true);
  await ui.pressKey(page, "Escape");
  await ui.waitForDrawer(page, "controls", false);
  assert.equal((await ui.drawerStates(page)).controls, false, `${label}: Escape closes it`);
}

async function checkTimelineDrawer(label, page) {
  const before = await ui.clockAndPlaying(page);
  assert.ok(!(await ui.speedSliderShown(page)), `${label}: the speed slider is hidden while the timeline drawer is closed`);
  const closedHeight = (await ui.phoneBoxes(page)).bar.height;
  await ui.tapTimelineHandle(page);
  await ui.waitForDrawer(page, "timeline", true);
  assert.deepEqual(await ui.drawerStates(page), { controls: false, timeline: true }, `${label}: a tap on the timeline handle opens its drawer`);
  assert.ok(await ui.speedSliderShown(page), `${label}: the speed slider shows`);
  const open = (await ui.phoneBoxes(page)).bar;
  assert.ok(open.height > closedHeight + 40, `${label}: the drawer grows the timeline (${Math.round(closedHeight)} to ${Math.round(open.height)} px)`);
  assert.ok(open.top > 0, `${label}: the open timeline stays on screen`);
  assert.match(await ui.eventContextText(page), /Just happened/, `${label}: the events context is in the drawer`);
  assert.match(await ui.eventListText(page), /Up next/, `${label}: and shows with the drawer open`);
  assert.ok(!(await ui.scrollsSideways(page)), `${label}: no horizontal scroll with the drawer open`);
  await checkTouchTargets(`${label} timeline drawer`, page);
  await shot(page, `${label}-timeline-open`);
  // The speed slider drives the speed picker.
  await ui.setSpeedSlider(page, 1);
  const speedAfterSlider = await ui.speed(page);
  await ui.setSpeedSlider(page, 0);
  assert.notEqual(speedAfterSlider, await ui.speed(page), `${label}: the speed slider changes the playback speed`);
  await ui.tapTimelineHandle(page);
  await ui.waitForDrawer(page, "timeline", false);
  assert.deepEqual(await ui.drawerStates(page), { controls: false, timeline: false }, `${label}: a tap closes it`);
  await ui.swipeTimelineHandleUp(page);
  await ui.waitForDrawer(page, "timeline", true);
  assert.equal((await ui.drawerStates(page)).timeline, true, `${label}: a swipe up on the handle opens it`);
  await ui.swipeTimelineHandleDown(page);
  await ui.waitForDrawer(page, "timeline", false);
  assert.equal((await ui.drawerStates(page)).timeline, false, `${label}: a swipe down closes it`);
  // The drawers share the screen: opening one closes the other.
  await ui.tapTimelineHandle(page);
  await ui.waitForDrawer(page, "timeline", true);
  await ui.tapPill(page);
  await ui.waitForDrawer(page, "controls", true);
  assert.deepEqual(await ui.drawerStates(page), { controls: true, timeline: false }, `${label}: opening the top drawer closes the timeline drawer`);
  await ui.tapControlsHandle(page);
  await ui.waitForDrawer(page, "controls", false);
  const after = await ui.clockAndPlaying(page);
  assert.deepEqual(after, before, `${label}: time and playback survive the drawers`);
}

async function checkSceneDrag(label, page) {
  await ui.dragOnScene(page);
  await page.waitForTimeout(400);
  assert.deepEqual(await ui.drawerStates(page), { controls: false, timeline: false }, `${label}: dragging the scene opens no drawer`);
  await ui.tapPill(page);
  await ui.waitForDrawer(page, "controls", true);
  await ui.tapControlsHandle(page);
  await ui.waitForDrawer(page, "controls", false);
  await ui.dragOnScene(page);
  assert.deepEqual(await ui.drawerStates(page), { controls: false, timeline: false }, `${label}: a drawer swipe leaves the scene drag working and a scene drag leaves the drawers shut`);
}

async function checkInfoSheet(label, page) {
  const picked = await ui.firstPickableBody(page);
  assert.ok(picked !== null);
  const second = (await ui.pickableBodies(page))[1]?.value ?? picked;
  await ui.pickBody(page, second);
  assert.ok((await ui.controlsPillName(page)) !== null, `${label}: the pill follows the pick`);
  await ui.openInfo(page, /^Information about /);
  await ui.waitForInfo(page);
  // The drawer closes itself so the sheet and the scene show.
  assert.equal((await ui.drawerStates(page)).controls, false, `${label}: opening information closes the top drawer`);
  const { sheet, bar, play } = await ui.phoneBoxes(page);
  const viewport = page.viewportSize();
  assert.ok(sheet.bottom <= bar.top + 0.5 && sheet.left >= 0 && sheet.right <= viewport.width, `${label}: the information panel is a sheet above the timeline (O-020 Decision 13)`);
  assert.ok(play !== null && sheet.bottom <= play.top + 0.5, `${label}: the sheet does not cover the Play button`);
  assert.ok(sheet.top > 52, `${label}: the sheet leaves the top row clear`);
  assert.equal(await ui.infoSourcesClosed(page), true, `${label}: Sources start closed`);
  assert.ok((await ui.sourceLines(page)).length > 0, `${label}: the sources are in the page, closed`);
  await shot(page, `${label}-info-sheet-sources-closed`);
  await ui.openSources(page);
  assert.equal(await ui.sourcesOpen(page), true, `${label}: one tap opens Sources`);
  assert.ok(await ui.infoSourceLinesShown(page), `${label}: the opened sources show`);
  await checkTouchTargets(`${label} info sheet`, page);
  await shot(page, `${label}-info-sheet-sources-open`);
  await ui.swipeInfoSheetDown(page);
  await ui.waitForInfoClosed(page);
  assert.equal(await ui.infoOpen(page), false, `${label}: a swipe down dismisses the sheet`);
}

async function checkStoryPanel(label, page) {
  const id = await ui.firstStoryMarkerId(page);
  await ui.openStoryPanel(page, id, { force: true });
  await ui.waitForStoryPanel(page, id);
  assert.equal(await ui.storySourcesOpen(page), false, `${label}: the story panel's Sources start closed`);
  assert.ok(await ui.storyPanelSources(page) >= 1, `${label}: the source lines are there`);
  assert.equal(await ui.storyPanelClearOfPlay(page), true, `${label}: the story panel does not cover the Play button`);
  await ui.tapTimelineHandle(page);
  await ui.waitForDrawer(page, "timeline", true);
  await page.waitForTimeout(400);
  assert.equal(await ui.storyPanelClearOfPlay(page), true, `${label}: nor does it with the timeline drawer open`);
  await ui.tapTimelineHandle(page);
  await ui.waitForDrawer(page, "timeline", false);
  await ui.openStorySources(page);
  assert.equal(await ui.storySourcesOpen(page), true, `${label}: one tap opens the story Sources`);
  await shot(page, `${label}-story-sources-open`);
  await ui.closeStoryPanel(page);
}

/** The developer panel as a first-time viewer finds it (T-090): short list of group headings, the first open, 44 px tall, each folding with one press, remembered. */
async function checkDeveloperGroups(label, page) {
  await ui.toggleDeveloper(page, { expand: false });
  const groups = await ui.developerGroups(page);
  assert.ok(groups.length >= 3 && groups.length <= 8, `${label}: a short list of group headings (${groups.map((g) => g.label).join(", ")})`);
  assert.deepEqual(groups.map((g) => g.open), groups.map((_, i) => i === 0), `${label}: only the first group starts open`);
  for (const g of groups) assert.ok(g.height >= 44, `${label}: the "${g.label}" heading is at least 44 px tall (${g.height})`);
  const second = groups[1].id;
  await ui.toggleDeveloperGroup(page, second);
  assert.equal(await ui.developerGroupOpen(page, second), true, `${label}: one press opens "${groups[1].label}"`);
  await page.reload({ waitUntil: "load" });
  await ui.toggleDeveloper(page, { expand: false });
  assert.equal(await ui.developerGroupOpen(page, second), true, `${label}: an opened group is remembered after a reload`);
  await ui.toggleDeveloperGroup(page, second);
  assert.equal(await ui.developerGroupOpen(page, second), false, `${label}: one press closes it again`);
  await ui.closeDeveloper(page);
}

async function checkSettings(label, page) {
  await ui.openDeveloper(page);
  for (const name of ui.PHONE_LAYOUT_SLIDERS) assert.ok(await ui.phoneSettingShown(page, name), `${label}: a live control for "${name}"`);
  await ui.setPhoneSetting(page, "Phone drawer animation", 0);
  assert.equal(await ui.drawerTransition(page), "0s", `${label}: the animation setting reaches the drawer`);
  await ui.closeDeveloper(page);
}

const failures = [];
const attempt = async (label, fn) => {
  try { await fn(); note(`ok   ${label}`); } catch (error) { failures.push(`${label}: ${String(error?.message ?? error).split("\n")[0]}`); note(`FAIL ${label}: ${String(error?.message ?? error).split("\n")[0]}`); }
};

assertSafeAreaInStylesheet();
for (const experience of EXPERIENCES) {
  for (const size of SIZES) {
    const label = `${experience.name} ${size.name}`;
    const { context, page } = await openPage(size, experience.query);
    await attempt(`${label}: layout`, async () => { await checkLayout(label, page); await shot(page, `${label}-closed`); });
    await attempt(`${label}: top drawer`, () => checkControlsDrawer(label, page));
    await attempt(`${label}: timeline drawer`, () => checkTimelineDrawer(label, page));
    await attempt(`${label}: scene drag`, () => checkSceneDrag(label, page));
    await attempt(`${label}: information sheet`, () => checkInfoSheet(label, page));
    if (experience.hasPanels) await attempt(`${label}: story panel`, () => checkStoryPanel(label, page));
    if (experience.name === "apollo11") await attempt(`${label}: developer groups`, () => checkDeveloperGroups(label, page));
    if (experience.name === "apollo11") await attempt(`${label}: settings`, () => checkSettings(label, page));
    await context.close();
  }
}
// Reduced motion: the drawers move at once.
{
  const { context, page } = await openPage(SIZES[0], "", { reducedMotion: "reduce" });
  await attempt("reduced motion", async () => {
    assert.equal(await ui.drawerTransition(page), "0s", "no drawer animation under reduced motion");
    await ui.tapPill(page);
    await ui.waitForDrawer(page, "controls", true);
  });
  await context.close();
}
await browser.close();
for (const error of errors) failures.push(error);
note(`console and page problems: ${errors.length}`);
if (outDir !== undefined) writeFileSync(`${outDir}/results.json`, JSON.stringify({ at: new Date().toISOString(), base, failures, log }, null, 2));
if (failures.length > 0) { console.log("FAILED:"); for (const failure of failures) console.log(`  ${failure}`); process.exit(1); }
console.log("phone layout check passed");
