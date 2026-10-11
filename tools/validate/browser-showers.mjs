// Browser check for a shower built from a settings file (default: Perseids). Run the app on port 5199, then:
// PLAYWRIGHT_CORE=<path to playwright-core> ASTRAEUS_EVIDENCE_DIR=<fresh dir> [ASTRAEUS_SHOWER=perseids] node tools/validate/browser-showers.mjs
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";

const pw = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const chromium = pw.chromium ?? pw.default.chromium;
const base = process.env.ASTRAEUS_URL ?? "http://localhost:5199/";
const shower = process.env.ASTRAEUS_SHOWER ?? "perseids";
const outDir = process.env.ASTRAEUS_EVIDENCE_DIR;
if (outDir) mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const errors = [];
const results = {};

async function openPage(viewport) {
  const page = await browser.newPage({ viewport });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  return page;
}

// Stream-coloured pixels on the canvas (amber dots, not the grey orbit lines, white text or blue Earth): the stream is visible when its dots are drawn.
const litPixels = async (page) => {
  const png = (await page.getByTestId("earth-moon-canvas").screenshot()).toString("base64");
  return page.evaluate(async (data) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const copy = document.createElement("canvas");
    copy.width = image.width; copy.height = image.height;
    const ctx = copy.getContext("2d");
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, copy.width, copy.height).data;
    let lit = 0;
    for (let i = 0; i < pixels.length; i += 4) if (pixels[i] > 150 && pixels[i + 1] > 90 && pixels[i + 1] < 215 && pixels[i + 2] < 150 && pixels[i] - pixels[i + 2] > 70) lit += 1;
    return lit;
  }, png);
};

const seek = async (page, timeUtcMs) => {
  await page.locator('input[aria-label="Seek timeline"]').evaluate((input, time) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, String(time));
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, timeUtcMs);
  await page.waitForTimeout(500);
};

async function run(label, viewport) {
  const page = await openPage(viewport);
  const shot = async (name) => { if (outDir) await page.screenshot({ path: `${outDir}/${label}-${name}.png` }); };
  const streamId = `${shower}-stream`;
  try {
    await page.goto(`${base}?experience=shower-${shower}`);
    await page.waitForSelector("canvas");
    await page.getByRole("region", { name: "Timeline controls" }).waitFor();
    const canvas = page.getByTestId("earth-moon-canvas");
    assert.equal(await canvas.getAttribute("data-point-groups"), "1", `${label}: one stream group is mounted`);
    assert.equal(await page.locator(`option[value="${streamId}"]`).count(), 1, `${label}: the stream is listed once`);
    assert.equal(await page.locator('option[value="columbia"]').count(), 0, `${label}: no Apollo objects`);
    await page.getByRole("button", { name: "Pause playback" }).click();

    // The activity window and its peak are on the timeline.
    const windowButton = page.locator("button.timeline-window");
    assert.equal(await windowButton.count(), 1, `${label}: one activity window`);
    const peakButton = page.locator("button.timeline-window-peak");
    assert.equal(await peakButton.count(), 1, `${label}: the peak is marked`);
    assert.ok(await page.locator(".timeline-window-curve path").count() >= 2, `${label}: the rate curve is drawn`);
    const windowLabel = await windowButton.getAttribute("aria-label");
    const [startText, endText] = windowLabel.split(", ").slice(1).join(", ").split(" to ");
    results[label] = { windowLabel, startText, endText, readings: {} };

    // Step to window start, peak and end; the stream is drawn and the rate readout follows the curve.
    const panel = page.locator("#info-panel");
    // Select the stream, frame it with the Focus stream preset, then open its details with Info.
    const focusStream = async () => {
      await page.getByLabel("Select object").selectOption("earth");
      await page.getByLabel("Select object").selectOption(streamId);
      const close = page.locator("#info-panel .info-panel-close");
      if (await close.count()) await close.click();
      const compactPicker = page.locator(".object-camera-picker");
      if (await compactPicker.isVisible()) {
        const value = await compactPicker.evaluate((select) => [...select.options].find((o) => o.textContent.trim() === "Focus stream")?.value ?? null);
        assert.ok(value, `${label}: Focus stream preset exists`);
        await compactPicker.selectOption(value);
      } else {
        await page.getByRole("button", { name: "Focus stream", exact: true }).click();
      }
      await page.waitForTimeout(1500);
    };
    const openDetails = async () => {
      if (!(await panel.count())) await page.getByRole("button", { name: /^Information about Perseids stream$/ }).click();
      await panel.waitFor();
      assert.equal(await panel.getAttribute("data-info-id"), streamId, `${label}: the stream's details are shown`);
    };

    const start = await page.locator('input[aria-label="Seek timeline"]').getAttribute("min");
    const end = await page.locator('input[aria-label="Seek timeline"]').getAttribute("max");
    for (const [name, move] of [
      ["start", () => seek(page, Number(start))],
      ["peak", async () => { await peakButton.click(); await page.waitForTimeout(500); }],
      ["end", () => seek(page, Number(end))],
    ]) {
      await move();
      // Jumping to the peak opens the window's details; frame the stream again, then read its own details.
      await focusStream();
      const lit = await litPixels(page);
      assert.ok(lit > 150, `${label}/${name}: stream dots are visible (${lit})`);
      await shot(`${name}-focus`);
      await openDetails();
      const text = await panel.innerText();
      assert.match(text, /Activity rate/, `${label}/${name}: rate readout is shown`);
      results[label].readings[name] = { lit, panel: text.replace(/\s+/g, " ").slice(0, 400) };
      await shot(name);
    }
    // Zoomed far out the stream and Earth are in one view.
    await focusStream();
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    for (let i = 0; i < 8; i += 1) await page.mouse.wheel(0, 600);
    await page.waitForTimeout(800);
    results[label].zoomedOutLit = await litPixels(page);
    assert.ok(results[label].zoomedOutLit > 150, `${label}: stream visible zoomed out (${results[label].zoomedOutLit})`);
    await shot("zoomed-out");
    await openDetails();
    // The readout rises to the peak and falls again.
    const rateOf = (name) => Number(results[label].readings[name].panel.match(/Activity rate\D*([\d.]+)/)?.[1]);
    assert.ok(rateOf("peak") > rateOf("start"), `${label}: rate at the peak is above the start`);
    assert.ok(rateOf("peak") > rateOf("end"), `${label}: rate at the peak is above the end`);

    // The radiant and the published/modelled split are visible in the stream's details.
    const text = await panel.innerText();
    assert.match(text, /Radiant/, `${label}: radiant readout`);
    assert.match(text, /RA 48\.0/, `${label}: radiant right ascension`);
    const badge = panel.locator(".provenance-badge");
    assert.match(await badge.innerText(), /^Illustrative/, `${label}: the stream is marked illustrative`);
    await badge.click();
    const detail = await panel.locator(".provenance-detail").innerText();
    assert.match(detail, /Modelled spread, two-body, not observed/i, `${label}: limitation is stated`);
    await shot("stream-details");

    // The window's own details name the published night and the modelled shape.
    await windowButton.click();
    await page.waitForTimeout(400);
    const windowPanel = await page.locator("#info-panel").innerText();
    assert.match(windowPanel, /activity/i, `${label}: window details open`);
    results[label].windowPanel = windowPanel.replace(/\s+/g, " ").slice(0, 600);
    await shot("window-details");
  } finally {
    await page.close();
  }
}

try {
  await run("desktop", { width: 1280, height: 800 });
  await run("phone", { width: 390, height: 844 });
  // Existing experiences still mount by their old names.
  const page = await openPage({ width: 1280, height: 800 });
  await page.goto(base);
  await page.waitForSelector("canvas");
  assert.equal(await page.locator('option[value="columbia"]').count(), 1, "Apollo is still the default");
  await page.goto(`${base}?experience=synthetic-ring`);
  await page.waitForSelector("canvas");
  assert.equal(await page.locator('option[value="debris-ring"]').count(), 1, "synthetic-ring still mounts");
  await page.close();
} finally {
  await browser.close();
}
console.log(JSON.stringify({ shower, results, errors }, null, 2));
if (errors.length > 0) process.exit(1);
