// Story panels (O-015 / T-059): auto-open on forward playback, brief pause, one at a time, markers, settings, phone sheet.
// Run the app, then:
//   PLAYWRIGHT_CORE=<path to playwright-core> ASTRAEUS_URL=http://localhost:5401/app.html ASTRAEUS_OUT=docs/evidence/o015-t059-<UTC stamp> node tools/validate/browser-story-panels.mjs
// Writes screenshots and results.json into ASTRAEUS_OUT, which must not already hold files (historical evidence is never overwritten).
import assert from "node:assert/strict";
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";

const pw = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const chromium = pw.chromium ?? pw.default.chromium;
const url = process.env.ASTRAEUS_URL ?? "http://localhost:5199/app.html";
const out = process.env.ASTRAEUS_OUT;
if (out === undefined) throw new Error("set ASTRAEUS_OUT to a fresh evidence directory");
mkdirSync(out, { recursive: true });
if (readdirSync(out).length > 0) throw new Error(`${out} is not empty; use a fresh directory`);

const TLI = -14542676800; // anchor A-02
const LANDING = -14182940100; // anchor A-LND
const results = [];
const errors = [];
const note = (name, detail = "") => { results.push({ name, detail }); console.log(`ok  ${name}${detail === "" ? "" : ` (${detail})`}`); };

const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });

async function open(viewport, extra = {}) {
  const context = await browser.newContext({ viewport, ...extra });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  await page.goto(url);
  await page.waitForSelector("canvas");
  await page.getByRole("region", { name: "Timeline controls" }).waitFor();
  return { context, page };
}

const seekTo = (page, timeUtcMs) => page.locator('input[aria-label="Seek timeline"]').evaluate((element, value) => {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(element, String(value));
  element.dispatchEvent(new Event("input", { bubbles: true }));
}, timeUtcMs);
const setSlider = (page, label, value) => page.getByLabel(label).evaluate((element, v) => {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(element, String(v));
  element.dispatchEvent(new Event("input", { bubbles: true }));
}, value);
const isPlaying = async (page) => (await page.getByRole("button", { name: /(Pause|Play) playback/ }).getAttribute("aria-label")) === "Pause playback";
const openPanelIds = (page) => page.locator(".story-panel").evaluateAll((els) => els.map((el) => el.dataset.panelId));

try {
  // ---- Desktop ----
  const { context, page } = await open({ width: 1440, height: 900 });
  assert.equal(await page.locator(".timeline-panel-marker").count(), 2, "two timeline markers");
  note("timeline shows a marker per panel", "2");

  // Panel 1 opens by itself as playback reaches the cutoff anchor, and playback holds.
  await page.locator('.story-panel[data-panel-id="tli-cutoff"]').waitFor({ timeout: 15000 });
  assert.equal(await isPlaying(page), false, "playback holds while the panel opens");
  assert.deepEqual(await openPanelIds(page), ["tli-cutoff"]);
  const panel = page.locator(".story-panel");
  assert.match(await panel.innerText(), /Leaving Earth orbit/);
  assert.equal(await panel.locator(".story-badge").getAttribute("data-badge"), "observed");
  assert.ok((await panel.locator(".story-panel-sources li").count()) >= 1, "a source line");
  const box = await panel.boundingBox();
  assert.ok(box.x > 1440 / 2 && box.x + box.width <= 1440, "desktop side panel sits on the right");
  await page.screenshot({ path: `${out}/desktop-panel-open.png` });
  note("forward playback opens the first panel and holds playback", "side panel at right");

  // Resumes on its own after the pause length (6 s default).
  await page.waitForFunction(() => document.querySelector('[aria-label="Pause playback"]') !== null, null, { timeout: 12000 });
  assert.deepEqual(await openPanelIds(page), ["tli-cutoff"], "panel stays open after resuming");
  note("playback resumes on its own after the pause", "panel stays open");

  // Close, then Continue-on-tap path: a second hold ended by the tap.
  await page.getByRole("button", { name: "Close story panel" }).click();
  assert.equal((await openPanelIds(page)).length, 0);
  await page.getByRole("button", { name: "Pause playback" }).click();
  await seekTo(page, LANDING - 60_000);
  await page.waitForTimeout(400);
  assert.equal((await openPanelIds(page)).length, 0, "a seek forward opens nothing");
  await page.getByRole("button", { name: "Play playback" }).click();
  await page.locator('.story-panel[data-panel-id="touchdown"]').waitFor({ timeout: 10000 });
  assert.equal(await isPlaying(page), false);
  await page.getByRole("button", { name: "Continue playback" }).click();
  assert.equal(await isPlaying(page), true, "Continue resumes at once");
  note("a tap on Continue resumes playback early");

  // Scrubbing across both markers never opens a panel or stacks one.
  await page.getByRole("button", { name: "Close story panel" }).click();
  // While playing, a seek far past the markers opens nothing (the check starts again from the new time, and 150 ms of playback is short).
  for (const t of [LANDING + 1000, TLI - 3_600_000 * 2, (TLI + LANDING) / 2]) {
    await seekTo(page, Math.round(t));
    await page.waitForTimeout(150);
    assert.equal((await openPanelIds(page)).length, 0, "a seek while playing opens nothing");
  }
  await page.getByRole("button", { name: "Pause playback" }).click();
  for (const t of [TLI + 1000, LANDING + 1000, TLI - 5000, LANDING - 5000, TLI - 1, LANDING - 1]) { await seekTo(page, Math.round(t)); await page.waitForTimeout(150); }
  assert.equal((await openPanelIds(page)).length, 0, "scrubbing while paused opens nothing");
  note("scrubbing back and forth past the markers opens nothing");

  // Timeline marker: seeks and opens; a second marker replaces, never stacks.
  await page.locator('.timeline-panel-marker[data-panel-id="tli-cutoff"]').click();
  assert.deepEqual(await openPanelIds(page), ["tli-cutoff"]);
  await page.locator('.timeline-panel-marker[data-panel-id="touchdown"]').click();
  assert.deepEqual(await openPanelIds(page), ["touchdown"]);
  assert.equal(await page.locator('.timeline-panel-marker[data-panel-id="touchdown"]').getAttribute("aria-pressed"), "true");
  note("timeline markers open their panel, one at a time");

  // Scene marker on Eagle (touchdown time, Eagle in bounds).
  await page.getByRole("button", { name: "Close story panel" }).click();
  await page.getByLabel("Select object").selectOption("eagle");
  await page.getByRole("button", { name: "Focus Eagle (LM)", exact: true }).click();
  await page.waitForTimeout(1800);
  const sceneMarker = page.locator('.story-marker[data-panel-id="touchdown"]');
  assert.equal(await sceneMarker.isVisible(), true, "scene marker shows on Eagle");
  await sceneMarker.click();
  assert.deepEqual(await openPanelIds(page), ["touchdown"]);
  assert.equal(await sceneMarker.getAttribute("aria-pressed"), "true");
  await page.screenshot({ path: `${out}/desktop-scene-marker-panel.png` });
  note("scene marker on the named body reopens its panel");
  await page.keyboard.press("Escape");
  assert.equal((await openPanelIds(page)).length, 0);
  note("Escape closes the panel");

  // Settings: live controls in Developer > Display settings.
  await page.getByRole("button", { name: "Developer mode" }).click();
  const group = page.getByRole("group", { name: "Story panels" });
  await group.waitFor();
  await page.screenshot({ path: `${out}/desktop-developer-story-settings.png` });
  await setSlider(page, "Story panel pause", 0);
  assert.equal(await page.getByTestId("story-pause-value").innerText(), "off");
  await seekTo(page, TLI - 60_000);
  await page.getByRole("button", { name: "Play playback" }).click();
  await page.locator('.story-panel[data-panel-id="tli-cutoff"]').waitFor({ timeout: 10000 });
  assert.equal(await isPlaying(page), true, "pause 0 never holds playback");
  note("pause length 0 opens a panel without pausing");

  await setSlider(page, "Story panel pause", 2);
  assert.equal(await page.getByTestId("story-pause-value").innerText(), "2.0");
  await page.getByRole("button", { name: "Close story panel" }).click();
  await seekTo(page, TLI - 60_000);
  await page.locator('.story-panel[data-panel-id="tli-cutoff"]').waitFor({ timeout: 10000 });
  const heldAt = Date.now();
  assert.equal(await isPlaying(page), false);
  await page.waitForFunction(() => document.querySelector('[aria-label="Pause playback"]') !== null, null, { timeout: 8000 });
  const held = Date.now() - heldAt;
  assert.ok(held >= 1000 && held < 4500, `held about 2 s (measured from when the panel was seen, so a little under), got ${held} ms`);
  note("pause length setting is live", `held ${held} ms for a 2 s setting`);

  const auto = group.getByRole("button", { name: "Open panels automatically" });
  assert.equal(await auto.getAttribute("aria-pressed"), "true");
  await auto.click();
  assert.equal(await auto.getAttribute("aria-pressed"), "false");
  await page.getByRole("button", { name: "Close story panel" }).click();
  await seekTo(page, TLI - 60_000);
  await page.waitForTimeout(2500);
  assert.equal((await openPanelIds(page)).length, 0, "auto-open off opens nothing");
  assert.equal(await isPlaying(page), true);
  await page.locator('.timeline-panel-marker[data-panel-id="tli-cutoff"]').click();
  assert.deepEqual(await openPanelIds(page), ["tli-cutoff"]);
  note("auto-open off: playback crosses silently, markers still open panels");
  await context.close();

  // ---- Phone ----
  const phone = await open({ width: 390, height: 844 }, { hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const p = phone.page;
  await p.locator('.story-panel[data-panel-id="tli-cutoff"]').waitFor({ timeout: 15000 });
  const sheet = p.locator(".story-panel");
  const sbox = await sheet.boundingBox();
  assert.ok(Math.abs(sbox.y + sbox.height - 844) < 2 && sbox.width >= 388, "phone sheet sits at the bottom, full width");
  assert.equal(await sheet.locator(".story-panel-handle").isVisible(), true, "grab handle shows");
  assert.ok(sbox.height <= 844 / 2 + 1, "sheet is at most half the screen");
  const scrollWidth = await p.evaluate(() => document.documentElement.scrollWidth);
  assert.ok(scrollWidth <= 390, `no horizontal scroll, got ${scrollWidth}`);
  await p.screenshot({ path: `${out}/phone-sheet-open.png` });
  note("phone shows a bottom sheet with a handle", `${Math.round(sbox.height)} px tall`);

  const cdp = await phone.context.newCDPSession(p);
  const touch = (type, y) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x: 195, y }] });
  const startY = sbox.y + 14;
  await touch("touchStart", startY);
  for (let dy = 20; dy <= 140; dy += 20) await touch("touchMove", startY + dy);
  await p.screenshot({ path: `${out}/phone-sheet-mid-swipe.png` });
  await touch("touchEnd", startY + 140);
  await p.waitForTimeout(300);
  assert.equal((await openPanelIds(p)).length, 0, "a swipe down dismisses the sheet");
  note("swipe down dismisses the phone sheet");

  // A short drag does not dismiss.
  await p.locator('.timeline-panel-marker[data-panel-id="touchdown"]').click({ force: true });
  await p.locator('.story-panel[data-panel-id="touchdown"]').waitFor();
  const b2 = await p.locator(".story-panel").boundingBox();
  await touch("touchStart", b2.y + 14);
  await touch("touchMove", b2.y + 40);
  await touch("touchEnd", b2.y + 40);
  await p.waitForTimeout(200);
  assert.deepEqual(await openPanelIds(p), ["touchdown"], "a short drag keeps the sheet");
  await p.screenshot({ path: `${out}/phone-sheet-touchdown.png` });
  note("a short drag keeps the sheet open");
  await phone.context.close();

  assert.deepEqual(errors, [], "zero console errors");
  note("zero console errors");
} catch (error) {
  writeFileSync(`${out}/results.json`, JSON.stringify({ passed: false, results, errors, failure: String(error?.stack ?? error) }, null, 2));
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
}
if (process.exitCode !== 1) writeFileSync(`${out}/results.json`, JSON.stringify({ passed: true, command: "node tools/validate/browser-story-panels.mjs", url, at: new Date().toISOString(), results, errors }, null, 2));
