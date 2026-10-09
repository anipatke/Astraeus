// Focused UI smoke for the reusable shell. Run the app on port 5199, then:
// PLAYWRIGHT_CORE=<path to playwright-core> node tools/validate/browser-shell.mjs
import assert from "node:assert/strict";

const pw = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const chromium = pw.chromium ?? pw.default.chromium;
const url = process.env.ASTRAEUS_URL ?? "http://localhost:5199/";
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });

try {
  await page.goto(url);
  await page.waitForSelector("canvas");
  await page.getByRole("region", { name: "Timeline controls" }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Developer mode" }).getAttribute("aria-pressed"), "false");
  assert.equal(await page.locator(".developer-tools").isVisible(), false);
  assert.equal(await page.locator(".mission").count(), 0);
  if (process.env.ASTRAEUS_SCREENSHOT) {
    await page.waitForTimeout(2000);
    await page.screenshot({ path: process.env.ASTRAEUS_SCREENSHOT });
  }

  await page.getByRole("button", { name: "Pause playback" }).click();
  await page.locator(".timeline-event-list summary").click();
  const eventRows = page.locator(".timeline-event-list li button");
  assert.equal(await eventRows.count(), 30);
  const firstLabel = (await eventRows.nth(0).locator("span").textContent()).trim();
  const secondLabel = (await eventRows.nth(1).locator("span").textContent()).trim();
  const firstMarker = page.locator(".timeline-marker").first();
  await firstMarker.focus();
  assert.equal(await firstMarker.locator(".timeline-marker-label").isVisible(), true);
  await eventRows.nth(0).click();
  assert.ok((await page.locator(".timeline-event-context").innerText()).includes(firstLabel));
  await page.getByRole("button", { name: "Next event" }).click();
  assert.ok((await page.locator(".timeline-event-context").innerText()).includes(secondLabel));
  await page.locator(".timeline-event-list summary").click();

  const objectPicker = page.getByLabel("Select object");
  const columbiaOption = page.locator('option[value="columbia"]');
  const trajectoryStart = Number(await columbiaOption.getAttribute("data-available-from"));
  const trajectoryEnd = Number(await columbiaOption.getAttribute("data-available-to"));
  const seekTo = async (timeUtcMs) => page.locator('input[aria-label="Seek timeline"]').evaluate((element, value) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(element, String(value));
    element.dispatchEvent(new Event("input", { bubbles: true }));
  }, timeUtcMs);
  const timelineStart = Number(await page.locator('input[aria-label="Seek timeline"]').getAttribute("min"));
  await seekTo(timelineStart);
  await page.waitForFunction(() => document.querySelector('option[value="columbia"]').disabled);
  assert.equal(await columbiaOption.evaluate((option) => option.disabled), true);
  assert.match(await columbiaOption.textContent(), /Unavailable/);
  const trajectoryMidpoint = Math.round((trajectoryStart + trajectoryEnd) / 2);
  await seekTo(trajectoryMidpoint);
  await page.waitForFunction(() => !document.querySelector('option[value="columbia"]').disabled);
  await page.getByRole("button", { name: "Developer mode" }).click();
  await page.locator(".mission").waitFor();
  const missionReadoutBeforeCamera = await page.locator(".mission").innerText();
  await page.getByRole("button", { name: "Developer mode" }).click();

  await page.getByRole("button", { name: "Focus Earth", exact: true }).click();
  await objectPicker.selectOption("moon");
  await page.getByRole("button", { name: "Focus Moon", exact: true }).click();
  await page.getByRole("button", { name: "Earth–Moon overview", exact: true }).click();
  await objectPicker.selectOption("columbia");
  await page.getByRole("button", { name: "Focus Columbia (CSM)", exact: true }).click();
  await page.waitForTimeout(1500);
  assert.equal(await page.locator('[data-label-id="columbia"]').isVisible(), true);
  await page.getByRole("button", { name: "Follow Columbia (CSM)", exact: true }).click();
  assert.equal(await page.getByRole("button", { name: "Follow Columbia (CSM)", exact: true }).getAttribute("aria-pressed"), "true");
  await page.waitForTimeout(450);
  await page.getByRole("button", { name: "Earth–Moon overview", exact: true }).click();
  await page.waitForTimeout(1500);
  assert.equal(await page.locator('[data-label-id="columbia"]').isVisible(), false);
  const visibleLabels = await page.locator(".scene-object-label:visible").evaluateAll((elements) =>
    elements.map((element) => {
      const { left, top, right, bottom } = element.getBoundingClientRect();
      return { left, top, right, bottom };
    }),
  );
  assert.ok(visibleLabels.length > 0);
  for (let i = 0; i < visibleLabels.length; i += 1) {
    for (let j = i + 1; j < visibleLabels.length; j += 1) {
      const a = visibleLabels[i];
      const b = visibleLabels[j];
      assert.ok(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top, "visible scene labels should not overlap");
    }
  }

  await page.getByRole("button", { name: "Developer mode" }).click();
  const missionReadoutAfterCamera = await page.locator(".mission").innerText();
  assert.equal(missionReadoutAfterCamera, missionReadoutBeforeCamera, "range and speed readouts should remain fixed while camera modes change");
  await page.getByRole("button", { name: "Developer mode" }).click();

  const eagleOption = page.locator('option[value="eagle"]');
  const eagleStart = Number(await eagleOption.getAttribute("data-available-from"));
  const eagleEnd = Number(await eagleOption.getAttribute("data-available-to"));
  await seekTo(Math.round((eagleStart + eagleEnd) / 2));
  await page.waitForFunction(() => !document.querySelector('option[value="eagle"]').disabled);
  await objectPicker.selectOption("eagle");
  await page.getByRole("button", { name: "Focus Eagle (LM)", exact: true }).click();
  await page.waitForTimeout(1500);
  assert.equal(await page.locator('[data-label-id="eagle"]').isVisible(), true);
  await page.getByRole("button", { name: "Follow Eagle (LM)", exact: true }).click();
  assert.equal(await page.getByRole("button", { name: "Follow Eagle (LM)", exact: true }).getAttribute("aria-pressed"), "true");
  await page.getByRole("button", { name: "Earth–Moon overview", exact: true }).click();
  await page.waitForTimeout(1500);
  assert.equal(await page.locator('[data-label-id="eagle"]').isVisible(), false);

  // Info panel, provenance and scale choice on request (T-019), with both vehicles in bounds.
  const infoShot = process.env.ASTRAEUS_INFO_SCREENSHOTS;
  const panel = page.locator("#info-panel");
  const expectedStatus = { earth: "Ephemeris", moon: "Ephemeris", columbia: "Reconstructed", eagle: "Reconstructed" };
  const provenanceText = {};
  for (const [id, status] of Object.entries(expectedStatus)) {
    await objectPicker.selectOption(id);
    await panel.waitFor();
    assert.equal(await panel.getAttribute("data-info-id"), id);
    assert.ok(await panel.locator(".metric").count() > 0, `${id} info shows Metric Visuals`);
    const badge = panel.locator(".provenance-badge");
    assert.match(await badge.innerText(), new RegExp(`^${status} ⓘ`));
    await badge.click();
    assert.equal(await badge.getAttribute("aria-expanded"), "true");
    provenanceText[id] = await panel.locator(".provenance-detail").innerText();
    for (const heading of ["Known limitations", "Sources", "Accuracy"]) assert.ok(provenanceText[id].includes(heading), `${id} provenance shows ${heading}`);
    if (infoShot) await page.screenshot({ path: `${infoShot}/provenance-${id}-1280x800.png` });
  }
  for (const phrase of ["Smoothed joins", "Burn cutoffs", "translunar injection"]) assert.ok(provenanceText.columbia.includes(phrase), phrase);
  for (const phrase of ["Landing site", "Smoothed joins", "Burn cutoffs"]) assert.ok(provenanceText.eagle.includes(phrase), phrase);
  assert.match(provenanceText.moon, /no libration/);
  await panel.getByRole("button", { name: "Close information" }).focus();
  await page.keyboard.press("Escape");
  assert.equal(await panel.count(), 0, "Escape closes the info panel");

  await page.locator(".timeline-event-current").click();
  await panel.waitFor();
  assert.equal(await panel.getAttribute("data-info-kind"), "event");
  assert.match(await panel.locator(".provenance-badge").innerText(), /^Observed ⓘ/);
  if (infoShot) await page.screenshot({ path: `${infoShot}/event-info-1280x800.png` });

  await objectPicker.selectOption("columbia");
  await panel.waitFor();
  const metricsUnderTrue = await panel.locator(".info-panel-metrics").innerText();
  const readable = page.getByRole("button", { name: "Readable", exact: true });
  await readable.click();
  assert.equal(await readable.getAttribute("aria-pressed"), "true");
  await page.waitForTimeout(400);
  assert.equal(await panel.locator(".info-panel-metrics").innerText(), metricsUnderTrue, "readouts are identical under True and Readable");
  await page.getByRole("button", { name: "What do True and Readable scale mean?" }).click();
  assert.match(await page.locator(".scale-explanation").innerText(), /closer[\s\S]*true size[\s\S]*drawn on top/);
  if (infoShot) await page.screenshot({ path: `${infoShot}/scale-readable-1280x800.png` });
  await page.getByRole("button", { name: "What do True and Readable scale mean?" }).click();
  await page.getByRole("button", { name: "True", exact: true }).click();
  await panel.getByRole("button", { name: "Close information" }).click();

  await objectPicker.selectOption("columbia");
  await page.getByRole("button", { name: "Follow Columbia (CSM)", exact: true }).click();
  const timelineEnd = Number(await page.locator('input[aria-label="Seek timeline"]').getAttribute("max"));
  await seekTo(timelineEnd);
  await page.waitForFunction(() => document.querySelector('select[aria-label="Select object"]').value === "earth"
    && document.querySelector('option[value="columbia"]').disabled
    && document.querySelector('[data-camera-preset="overview"]').getAttribute("aria-pressed") === "true");

  const canvas = page.locator("canvas");
  const canvasBounds = await canvas.boundingBox();
  assert.ok(canvasBounds);
  const centerX = canvasBounds.x + canvasBounds.width / 2;
  const centerY = canvasBounds.y + canvasBounds.height / 2;
  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX + 28, centerY + 12, { steps: 4 });
  await page.mouse.up();
  await page.mouse.wheel(0, -120);

  await page.getByRole("button", { name: "Developer mode" }).click();
  await page.locator(".developer-tools").waitFor();
  assert.equal(await page.locator(".mission").count(), 1);
  assert.equal(await page.getByRole("button", { name: "Mission window", exact: true }).isVisible(), true);
  assert.equal(await page.getByLabel("UTC date and time").isVisible(), true);
  assert.equal(await page.getByRole("button", { name: "Anchor labels", exact: true }).isVisible(), true);
  await page.locator(".scientific-instruments .metric").first().waitFor();
  assert.equal(await page.locator(".scientific-instruments .metric").count(), 4);
  // Metric Visuals: a shape only where a real reference exists, and the same text without it.
  assert.equal(await page.locator('[data-metric="earth-moon-distance"] svg').count(), 0, "Earth–Moon distance has no reference, so it stays numeric-only");
  assert.equal(await page.locator('[data-metric="lunar-illumination"] svg[role="img"]').count(), 1);
  await seekTo(Math.round((eagleStart + eagleEnd) / 2)); // both vehicles in bounds
  await page.locator(".mission .metric-speed").nth(1).waitFor();
  const speedArc = page.locator('.mission .metric-speed svg[role="img"]').first();
  const rangeBar = page.locator('.mission .metric-distance svg[role="img"]').first();
  assert.match(await speedArc.getAttribute("aria-label"), /km\/s.*peak at NASA source anchors/);
  assert.match(await rangeBar.getAttribute("aria-label"), /Moon now [\d,]+ km/);
  for (const kind of ["relative-distance", "altitude", "uncertainty", "coordinates"]) {
    assert.equal(await page.locator(`.mission .metric-${kind}`).count(), 2, `each in-bounds vehicle shows a ${kind} metric`);
  }
  assert.match(await page.locator('[data-metric="eagle-altitude"]').innerText(), /(above|below) Moon mean radius/);
  assert.match(await page.locator('[data-metric="journey-progress"]').innerText(), /lift-off → splashdown/);
  assert.equal(await page.locator('[data-metric="moon-position"] .metric-reading').count(), 3);
  assert.equal(await page.locator('.mission [data-metric$="-position"] svg.metric-radar').count(), 2, "each vehicle position shows the radar view");
  assert.match(await page.locator('[data-metric="columbia-position"] svg.metric-radar').getAttribute("aria-label"), /round: top view x–y · tick: z · rim ±[\d,]+ km · lavender: Moon/);
  const metricShot = process.env.ASTRAEUS_METRIC_SCREENSHOTS;
  if (metricShot) {
    await page.locator('.hud-section:has(#developer-telemetry-heading)').screenshot({ path: `${metricShot}/metric-visuals-telemetry-1280x800.png` });
    await page.locator('.hud-section:has(#developer-scene-heading)').screenshot({ path: `${metricShot}/metric-visuals-scene-1280x800.png` });
    await page.locator(".hud-section-clock").screenshot({ path: `${metricShot}/metric-visuals-journey-1280x800.png` });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  const overflow = await page.evaluate(() => [...document.querySelectorAll(".metric")]
    .filter((metric) => metric.getBoundingClientRect().right > window.innerWidth + 0.5 || metric.scrollWidth > metric.clientWidth + 1)
    .map((metric) => metric.getAttribute("data-metric")));
  assert.deepEqual(overflow, [], "metric visuals should fit mobile portrait without overflow");
  if (metricShot) {
    await page.locator(".developer-tools").evaluate((panel) => { panel.scrollTop = panel.querySelector("#developer-telemetry-heading").offsetTop - 8; });
    await page.screenshot({ path: `${metricShot}/metric-visuals-390x844.png` });
  }
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.locator(".advanced-readouts summary").click();
  await page.locator("dl.overlay").waitFor();
  assert.equal(await page.locator("dl.overlay").count(), 1);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ url, viewports: ["1280x800", "390x844"], metricVisuals: true, infoProvenance: Object.keys(provenanceText), scaleReadoutsIdentical: true, events: await eventRows.count(), cameraModes: ["overview", "focus", "follow"], labels: visibleLabels.length, errors }, null, 2));
} finally {
  await browser.close();
}
