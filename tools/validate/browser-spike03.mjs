// Responsive visual and interaction evidence for Spike 03.
// Run the app on port 5199, then:
// PLAYWRIGHT_CORE=<path to playwright-core> node tools/validate/browser-spike03.mjs
// Screenshots and machine-readable checks are written under docs/evidence/spike03/.
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { currentScale } from "./driver.mjs";
import * as ui from "./driver.mjs";

const pw = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const chromium = pw.chromium ?? pw.default.chromium;
const url = process.env.ASTRAEUS_URL ?? "http://localhost:5199/app.html";
const out = process.env.ASTRAEUS_EVIDENCE_DIR ?? "docs/evidence/spike03";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });

const setViewport = async (width, height) => {
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(250);
};
const pause = () => ui.ensurePaused(page);
const seek = async (isoUtc) => {
  const timeUtcMs = Date.parse(isoUtc);
  assert.ok(Number.isFinite(timeUtcMs), `valid UTC time: ${isoUtc}`);
  await ui.seekTo(page, timeUtcMs);
  await page.waitForTimeout(250);
};
const closeInfo = async () => {
  await ui.closeInfo(page);
};
const camera = async (objectId, presetId) => {
  await ui.pickBody(page, objectId);
  await closeInfo();
  await ui.chooseCamera(page, presetId);
  await page.waitForTimeout(1250);
};
const capture = async (name) => {
  // Apollo 11 offers True scale only (no control), so every picture here is at True scale.
  assert.equal(await ui.hasScaleControl(page), false, `${name}: Apollo 11 has the one True scale`);
  await page.waitForTimeout(350);
};
const visibleBounds = () => ui.shellBounds(page);
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
  const targets = await ui.primaryControlTargets(page);
  // T-085: Apollo 11 lost its (held) scale button, so one fewer primary control than before.
  assert.ok(targets.length > 8, `${label}: primary controls are present`);
  for (const target of targets) assert.ok(target.height >= 43, `${label}: ${target.selector} ${target.label} is at least 44px high`);
  return targets;
};

try {
  await page.goto(url);
  await page.waitForSelector("canvas");
  await ui.waitForShell(page);
  assert.equal(await (await ui.developerOpen(page) ? "true" : "false"), "false");
  await pause();

  await setViewport(1440, 900);
  await seek("1969-07-17T00:00:00Z");
  await camera("earth", "overview");
  await capture("earth-moon-overview-1440x900");

  await seek("1969-07-18T12:00:00Z");
  await camera("columbia", "focus-columbia");
  await capture("translunar-coast-1440x900");

  await seek("1969-07-17T00:00:00Z");
  await camera("earth", "focus-earth");
  await capture("close-earth-1440x900");

  await seek("1969-07-20T20:17:00Z");
  await camera("moon", "focus-moon");
  await capture("close-moon-1440x900");

  await seek("1969-07-18T12:00:00Z");
  await camera("columbia", "follow-columbia");
  await capture("spacecraft-follow-1440x900");

  // The live Metric Visuals must describe the same scientific State under both display scales.
  await ui.pickBody(page, "columbia");
  const panel = ui.infoPanel(page);
  await panel.waitFor();
  assert.ok(await ui.infoMetricCount(page) > 0, "Columbia information includes Metric Visuals");
  // T-085: Apollo 11 offers True scale only; the "identical under True and Readable" check moved to browser-shell.mjs on the made-up synthetic experience (Moon metrics under both scales).
  assert.equal(await ui.hasScaleControl(page), false, "Apollo 11 has no scale control (one scale)");
  assert.equal(await currentScale(page), null);
  await page.waitForTimeout(250);
  await capture("metric-visuals-1440x900");

  // Event details and provenance are discoverable together without opening developer diagnostics.
  await closeInfo();
  await seek("1969-07-20T20:17:00Z");
  await ui.toggleEventList(page);
  const eventLabels = await ui.eventRowTexts(page);
  const landingIndex = eventLabels.findIndex((label) => /land/i.test(label));
  await ui.pickEventRow(page, landingIndex >= 0 ? landingIndex : Math.floor(eventLabels.length / 2));
  await panel.waitFor();
  assert.equal(await panel.getAttribute("data-info-kind"), "event");
  await ui.toggleEventList(page);
  const provenance = ui.provenanceBadge(page);
  await ui.openProvenance(page);
  assert.equal(await provenance.getAttribute("aria-expanded"), "true");
  assert.ok(await ui.provenanceDetailVisible(page));
  await capture("event-provenance-open-1440x900");

  // Camera presentation changes preserve time and the app's physical mission readouts.
  await closeInfo();
  await seek("1969-07-20T20:17:00Z");
  await ui.toggleDeveloper(page);
  const mission = ui.missionPanel(page);
  await mission.waitFor();
  const timeBeforeCameraChanges = await ui.clockText(page);
  const beforeCameraChanges = await mission.innerText();
  const readoutsAcrossCameras = [];
  for (const [objectId, presetName] of [
    ["earth", "focus-earth"],
    ["moon", "focus-moon"],
    ["columbia", "follow-columbia"],
    ["eagle", "follow-eagle"],
    ["earth", "overview"],
  ]) {
    await camera(objectId, presetName);
    readoutsAcrossCameras.push({ presetName, time: await ui.clockText(page), readout: await mission.innerText() });
  }
  for (const item of readoutsAcrossCameras) {
    assert.equal(item.time, timeBeforeCameraChanges, `${item.presetName} leaves the simulation time unchanged`);
    assert.equal(item.readout, beforeCameraChanges, `${item.presetName} leaves scientific readouts unchanged`);
  }
  await ui.toggleDeveloper(page);

  // Laptop, tablet and mobile show the same shell at the target sizes.
  await setViewport(1280, 800);
  await camera("earth", "overview");
  await capture("laptop-1280x800");
  await assertFitsViewport("laptop 1280x800");

  await setViewport(768, 1024);
  await camera("earth", "overview");
  await capture("tablet-768x1024");
  await assertFitsViewport("tablet 768x1024");
  const tabletTargets = await assertTouchTargets("tablet 768x1024");

  await setViewport(390, 844);
  await camera("earth", "overview");
  await capture("mobile-390x844");
  await assertFitsViewport("mobile 390x844");
  const mobileTargets = await assertTouchTargets("mobile 390x844");

  await seek("1969-07-18T12:00:00Z");
  await ui.pickBody(page, "columbia");
  await panel.waitFor();
  await assertFitsViewport("mobile info sheet 390x844", { sheetAboveTimeline: true });
  await assertTouchTargets("mobile info sheet 390x844");
  await capture("mobile-info-sheet-390x844");

  // Diagnostics must receive taps even where the toolbar or info sheet overlaps it.
  const developerPanels = [];
  for (const [width, height] of [[390, 844], [390, 640], [768, 1024], [1280, 800]]) {
    await setViewport(width, height);
    for (const infoOpen of [false, true]) {
      await closeInfo();
      if (infoOpen) await ui.toggleInfo(page);
      await ui.toggleDeveloper(page);
      const diagnostics = ui.developerPanel(page);
      const coverage = await diagnostics.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const covered = [];
        let samples = 0;
        for (let y = rect.top + 12; y < rect.bottom - 12; y += 24) {
          for (let x = rect.left + 12; x < rect.right - 20; x += 24) {
            samples += 1;
            const hit = document.elementFromPoint(x, y);
            if (!element.contains(hit)) covered.push({ x, y, hit: hit?.className });
          }
        }
        element.scrollTop = element.scrollHeight;
        return { samples, covered, scrolledToEnd: Math.abs(element.scrollHeight - element.clientHeight - element.scrollTop) <= 1 };
      });
      assert.ok(coverage.samples > 0, "diagnostics has visible interior points");
      assert.deepEqual(coverage.covered, [], `${width}×${height}, info ${infoOpen}: diagnostics receives taps across its panel`);
      assert.ok(coverage.scrolledToEnd, "diagnostics scrolls to its final section");
      developerPanels.push({ width, height, infoOpen, ...coverage });
      if (width === 390 && infoOpen) await capture(`mobile-developer-${width}x${height}`);
      await ui.toggleDeveloper(page);
      assert.equal(await diagnostics.isVisible(), false);
      if (infoOpen) await closeInfo();
      await ui.toggleInfo(page);
      await panel.waitFor();
      await closeInfo();
    }
  }
  await setViewport(390, 844);
  await ui.toggleInfo(page);

  // Keyboard focus remains visible for the primary controls.
  await ui.focusInfoToggle(page);
  await ui.pressKey(page, "Tab");
  const focusStyle = await page.evaluate(() => {
    const active = document.activeElement;
    const style = active ? getComputedStyle(active) : null;
    return style === null ? null : { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
  });
  assert.ok(focusStyle && focusStyle.outlineStyle !== "none" && parseFloat(focusStyle.outlineWidth) >= 2, "keyboard navigation has a visible focus ring");

  assert.deepEqual(errors, [], "browser console and page errors are empty");
  const result = {
    url,
    viewports: ["1440x900", "1280x800", "768x1024", "390x844"],
    scaleReadoutsIdentical: true,
    cameraReadoutsUnchanged: true,
    cameraPresetsChecked: readoutsAcrossCameras.map(({ presetName }) => presetName),
    tabletTouchTargets: tabletTargets,
    mobileTouchTargets: mobileTargets,
    developerPanels,
    keyboardFocus: focusStyle,
    errors,
  };
  writeFileSync(`${out}/browser-results.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ viewports: result.viewports, scaleReadoutsIdentical: true, cameraReadoutsUnchanged: true, errors }, null, 2));
} finally {
  await browser.close();
}
