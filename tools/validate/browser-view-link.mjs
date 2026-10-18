// Browser check for "Copy view link" (T-058): drag the camera, copy the link, open it in a fresh page and compare the views.
// PLAYWRIGHT_CORE=<path> ASTRAEUS_URL=<app.html url> node tools/validate/browser-view-link.mjs
import assert from "node:assert/strict";
import * as ui from "./driver.mjs";

const pw = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const chromium = pw.chromium ?? pw.default.chromium;
const base = process.env.ASTRAEUS_URL ?? "http://localhost:5199/app.html";
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const errors = [];
const results = {};
const open = async (query, context) => {
  const page = await context.newPage();
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${base}${query}`);
  await page.waitForTimeout(3000);
  await ui.toggleDeveloper(page);
  await page.waitForTimeout(800);
  return page;
};
const readView = async (page) => {
  const text = await ui.viewValuesText(page);
  const match = /View: ([^,]+),([\d.-]+),([\d.-]+),([\d.-]+)/.exec(text);
  assert.ok(match, `view text: ${text}`);
  return { focus: match[1], az: Number(match[2]), el: Number(match[3]), dist: Number(match[4]) };
};
const angleGap = (a, b) => Math.abs(((a - b + 540) % 360) - 180);

for (const [name, query] of [["perseids", "?experience=showers"], ["default", ""]]) {
  const context = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"] });
  const page = await open(query, context);
  // Move the camera by hand: drag, then zoom.
  await page.mouse.move(300, 400);
  await page.mouse.down();
  await page.mouse.move(200, 340, { steps: 8 });
  await page.mouse.up();
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(800);
  await ui.copyViewLink(page);
  await page.waitForTimeout(500);
  const link = await ui.viewLinkValue(page);
  assert.match(link, /[?&]view=[^&]+,[\d.]+,[-\d.]+,[\d.]+/, `${name}: link carries the view`);
  assert.match(link, /[?&]t=\d{4}-\d\d-\d\dT[\d:.]+Z/, `${name}: link carries the time`);
  assert.match(link, /[?&]scale=/, `${name}: link carries the scale`);
  assert.match(link, /[?&]up=/, `${name}: link carries the up direction`);
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  assert.equal(clip, link, `${name}: the link is on the clipboard`);
  assert.equal(new URL(page.url()).searchParams.get("view"), new URL(link).searchParams.get("view"), `${name}: the address holds the view`);
  const copied = await readView(page);
  assert.ok(angleGap(copied.az, 216) > 5 && Math.abs(copied.el - 14.32) > 2, `${name}: the drag moved the camera (${copied.az}, ${copied.el})`);
  await page.waitForTimeout(0);
  const second = await open(new URL(link).search, await browser.newContext());
  const restored = await readView(second);
  assert.equal(restored.focus, copied.focus, `${name}: same focus`);
  assert.ok(angleGap(restored.az, copied.az) < 1.5, `${name}: azimuth ${restored.az} vs ${copied.az}`);
  assert.ok(Math.abs(restored.el - copied.el) < 1.5, `${name}: elevation ${restored.el} vs ${copied.el}`);
  assert.ok(Math.abs(restored.dist - copied.dist) / copied.dist < 0.02, `${name}: distance ${restored.dist} vs ${copied.dist}`);
  results[name] = { link, copied, restored };
  await context.close();
}

// Clipboard refused: the link shows in a selectable field.
{
  const context = await browser.newContext();
  const page = await open("", context);
  await page.evaluate(() => { Object.defineProperty(navigator, "clipboard", { value: { writeText: () => Promise.reject(new Error("denied")) }, configurable: true }); });
  await ui.copyViewLink(page);
  await page.waitForTimeout(300);
  assert.ok((await ui.viewLinkValue(page)).includes("view="), "the fallback field shows the link");
  assert.match(await ui.viewLinkNote(page), /Clipboard unavailable/);
  results.fallback = "field shown";
}

// A malformed link opens the experience as usual.
{
  const page = await open("?view=nonsense", await browser.newContext());
  await readView(page);
  results.badLink = "opened normally";
}

assert.deepEqual(errors, [], "no console errors");
console.log(JSON.stringify({ ...results, errors }, null, 2));
await browser.close();
