// Responsive visual and interaction evidence for Spike 03.
// Run the app on port 5199, then:
// PLAYWRIGHT_CORE=<path to playwright-core> node tools/validate/browser-spike03.mjs
// Screenshots and machine-readable checks are written under docs/evidence/spike03/.
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";

const pw = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const chromium = pw.chromium ?? pw.default.chromium;
const url = process.env.ASTRAEUS_URL ?? "http://localhost:5199/";
const out = "docs/evidence/spike03";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });

const screenshots = [];
const setViewport = async (width, height) => {
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(250);
};
const pause = async () => {
  const button = page.getByRole("button", { name: "Pause playback", exact: true });
  if (await button.count()) await button.click();
};
const seek = async (isoUtc) => {
  const timeUtcMs = Date.parse(isoUtc);
  assert.ok(Number.isFinite(timeUtcMs), `valid UTC time: ${isoUtc}`);
  await page.locator('input[aria-label="Seek timeline"]').evaluate((input, time) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, String(time));
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, timeUtcMs);
  await page.waitForTimeout(250);
};
const closeInfo = async () => {
  const close = page.locator("#info-panel .info-panel-close");
  if (await close.count()) await close.click();
};
const camera = async (objectId, presetName) => {
  await page.getByLabel("Select object").selectOption(objectId);
  await closeInfo();
  const compactCameraPicker = page.locator(".object-camera-picker");
  if (await compactCameraPicker.isVisible()) {
    const optionValue = await compactCameraPicker.evaluate((select, label) => {
      const option = [...select.options].find((candidate) => candidate.textContent.trim() === label);
      return option?.value ?? null;
    }, presetName);
    assert.ok(optionValue, `camera preset option exists: ${presetName}`);
    await compactCameraPicker.selectOption(optionValue);
  } else {
    await page.getByRole("button", { name: presetName, exact: true }).click();
  }
  await page.waitForTimeout(1250);
};
const capture = async (name) => {
  const trueScale = page.getByRole("button", { name: "True", exact: true });
  if (await trueScale.getAttribute("aria-pressed") !== "true") {
    await trueScale.click();
    await page.waitForTimeout(250);
  }
  assert.equal(await trueScale.getAttribute("aria-pressed"), "true", `${name}: screenshot uses the app's default True scale`);
  await page.waitForTimeout(350);
  const path = `${out}/${name}.png`;
  await page.screenshot({ path });
  screenshots.push({ name, path, viewport: page.viewportSize() });
};
const visibleBounds = async () => page.evaluate(() => {
  const selectors = [".shell-toolbar", ".developer-mode-toggle", ".timeline-bar", "#info-panel"];
  return selectors.flatMap((selector) => {
    const element = document.querySelector(selector);
    if (!element || getComputedStyle(element).display === "none" || getComputedStyle(element).visibility === "hidden") return [];
    const rect = element.getBoundingClientRect();
    return [{ selector, left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom }];
  });
});
const assertFitsViewport = async (label, { sheetAboveTimeline = false } = {}) => {
  const { width, height } = page.viewportSize();
  const bounds = await visibleBounds();
  for (const rect of bounds) {
    assert.ok(rect.left >= -0.5, `${label}: ${rect.selector} left edge fits`);
    assert.ok(rect.top >= -0.5, `${label}: ${rect.selector} top edge fits`);
    assert.ok(rect.right <= width + 0.5, `${label}: ${rect.selector} right edge fits`);
    assert.ok(rect.bottom <= height + 0.5, `${label}: ${rect.selector} bottom edge fits`);
  }
  const toolbar = bounds.find((rect) => rect.selector === ".shell-toolbar");
  const developerToggle = bounds.find((rect) => rect.selector === ".developer-mode-toggle");
  if (toolbar && developerToggle) {
    const overlaps = toolbar.left < developerToggle.right && toolbar.right > developerToggle.left
      && toolbar.top < developerToggle.bottom && toolbar.bottom > developerToggle.top;
    assert.equal(overlaps, false, `${label}: toolbar does not overlap the developer toggle`);
  }
  if (sheetAboveTimeline) {
    const panel = bounds.find((rect) => rect.selector === "#info-panel");
    const timeline = bounds.find((rect) => rect.selector === ".timeline-bar");
    assert.ok(panel && timeline && panel.bottom <= timeline.top + 1, `${label}: info sheet clears the timeline`);
  }
  return bounds;
};
const assertTouchTargets = async (label) => {
  const targets = await page.evaluate(() => {
    const selectors = [
      ".object-controls button",
      ".object-controls select",
      ".scale-control button",
      ".info-panel button",
      ".timeline-transport button",
      ".timeline-speed select",
      ".timeline-event-list summary",
      '.timeline-track input[type="range"]',
    ];
    return selectors.flatMap((selector) => [...document.querySelectorAll(selector)]
      .filter((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
      })
      .map((element) => ({ selector, label: element.getAttribute("aria-label") ?? element.textContent.trim(), height: element.getBoundingClientRect().height })));
  });
  assert.ok(targets.length > 10, `${label}: primary controls are present`);
  for (const target of targets) assert.ok(target.height >= 43, `${label}: ${target.selector} ${target.label} is at least 44px high`);
  return targets;
};

try {
  await page.goto(url);
  await page.waitForSelector("canvas");
  await page.getByRole("region", { name: "Timeline controls" }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Developer mode" }).getAttribute("aria-pressed"), "false");
  await pause();

  await setViewport(1440, 900);
  await seek("1969-07-17T00:00:00Z");
  await camera("earth", "Earth–Moon overview");
  await capture("earth-moon-overview-1440x900");

  await seek("1969-07-18T12:00:00Z");
  await camera("columbia", "Focus Columbia (CSM)");
  await capture("translunar-coast-1440x900");

  await seek("1969-07-17T00:00:00Z");
  await camera("earth", "Focus Earth");
  await capture("close-earth-1440x900");

  await seek("1969-07-20T20:17:00Z");
  await camera("moon", "Focus Moon");
  await capture("close-moon-1440x900");

  await seek("1969-07-18T12:00:00Z");
  await camera("columbia", "Follow Columbia (CSM)");
  await capture("spacecraft-follow-1440x900");

  // The live Metric Visuals must describe the same scientific State under both display scales.
  await page.getByLabel("Select object").selectOption("columbia");
  const panel = page.locator("#info-panel");
  await panel.waitFor();
  assert.ok(await panel.locator(".metric").count() > 0, "Columbia information includes Metric Visuals");
  await page.getByRole("button", { name: "True", exact: true }).click();
  await page.waitForTimeout(250);
  const metricsUnderTrue = await panel.locator(".info-panel-metrics").innerText();
  await page.getByRole("button", { name: "Readable", exact: true }).click();
  await page.waitForTimeout(250);
  const metricsUnderReadable = await panel.locator(".info-panel-metrics").innerText();
  assert.equal(metricsUnderReadable, metricsUnderTrue, "Metric Visual readouts are identical under True and Readable scales");
  await capture("metric-visuals-1440x900");

  // Event details and provenance are discoverable together without opening developer diagnostics.
  await closeInfo();
  await seek("1969-07-20T20:17:00Z");
  const eventSummary = page.locator(".timeline-event-list summary");
  await eventSummary.click();
  const eventRows = page.locator(".timeline-event-list li button");
  const eventLabels = await eventRows.allTextContents();
  const landingIndex = eventLabels.findIndex((label) => /land/i.test(label));
  await eventRows.nth(landingIndex >= 0 ? landingIndex : Math.floor(eventLabels.length / 2)).click();
  await panel.waitFor();
  assert.equal(await panel.getAttribute("data-info-kind"), "event");
  await eventSummary.click();
  const provenance = panel.locator(".provenance-badge");
  await provenance.click();
  assert.equal(await provenance.getAttribute("aria-expanded"), "true");
  assert.ok(await panel.locator(".provenance-detail").isVisible());
  await capture("event-provenance-open-1440x900");

  // Camera presentation changes preserve time and the app's physical mission readouts.
  await closeInfo();
  await seek("1969-07-20T20:17:00Z");
  await page.getByRole("button", { name: "Developer mode" }).click();
  const mission = page.locator(".mission");
  await mission.waitFor();
  const timeBeforeCameraChanges = await page.locator(".timeline-time").innerText();
  const beforeCameraChanges = await mission.innerText();
  const readoutsAcrossCameras = [];
  for (const [objectId, presetName] of [
    ["earth", "Focus Earth"],
    ["moon", "Focus Moon"],
    ["columbia", "Follow Columbia (CSM)"],
    ["eagle", "Follow Eagle (LM)"],
    ["earth", "Earth–Moon overview"],
  ]) {
    await camera(objectId, presetName);
    readoutsAcrossCameras.push({ presetName, time: await page.locator(".timeline-time").innerText(), readout: await mission.innerText() });
  }
  for (const item of readoutsAcrossCameras) {
    assert.equal(item.time, timeBeforeCameraChanges, `${item.presetName} leaves the simulation time unchanged`);
    assert.equal(item.readout, beforeCameraChanges, `${item.presetName} leaves scientific readouts unchanged`);
  }
  await page.getByRole("button", { name: "Developer mode" }).click();

  // Laptop, tablet and mobile screenshots show the same shell at the target sizes.
  await setViewport(1280, 800);
  await camera("earth", "Earth–Moon overview");
  await capture("laptop-1280x800");
  await assertFitsViewport("laptop 1280x800");

  await setViewport(768, 1024);
  await camera("earth", "Earth–Moon overview");
  await capture("tablet-768x1024");
  await assertFitsViewport("tablet 768x1024");
  const tabletTargets = await assertTouchTargets("tablet 768x1024");

  await setViewport(390, 844);
  await camera("earth", "Earth–Moon overview");
  await capture("mobile-390x844");
  await assertFitsViewport("mobile 390x844");
  const mobileTargets = await assertTouchTargets("mobile 390x844");

  await seek("1969-07-18T12:00:00Z");
  await page.getByLabel("Select object").selectOption("columbia");
  await panel.waitFor();
  await assertFitsViewport("mobile info sheet 390x844", { sheetAboveTimeline: true });
  await assertTouchTargets("mobile info sheet 390x844");
  await capture("mobile-info-sheet-390x844");

  // Keyboard focus remains visible for the primary controls.
  await page.locator(".object-info-toggle").focus();
  await page.keyboard.press("Tab");
  const focusStyle = await page.evaluate(() => {
    const active = document.activeElement;
    const style = active ? getComputedStyle(active) : null;
    return style === null ? null : { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
  });
  assert.ok(focusStyle && focusStyle.outlineStyle !== "none" && parseFloat(focusStyle.outlineWidth) >= 2, "keyboard navigation has a visible focus ring");

  assert.deepEqual(errors, [], "browser console and page errors are empty");
  const result = {
    url,
    screenshots,
    viewports: ["1440x900", "1280x800", "768x1024", "390x844"],
    scaleReadoutsIdentical: true,
    cameraReadoutsUnchanged: true,
    cameraPresetsChecked: readoutsAcrossCameras.map(({ presetName }) => presetName),
    tabletTouchTargets: tabletTargets,
    mobileTouchTargets: mobileTargets,
    keyboardFocus: focusStyle,
    errors,
  };
  writeFileSync(`${out}/browser-results.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ screenshots: screenshots.map(({ path }) => path), viewports: result.viewports, scaleReadoutsIdentical: true, cameraReadoutsUnchanged: true, errors }, null, 2));
} finally {
  await browser.close();
}
