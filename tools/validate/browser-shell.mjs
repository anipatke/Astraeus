// Focused UI smoke for the reusable shell, on the made-up scene (?experience=synthetic): events, camera presets, name tags, information and provenance, both scales,
// the developer panel and the fit of the information on a phone. The Apollo-only parts (its provenance wording, mission metrics, scale absence) are in browser-apollo-shell.mjs.
// npm run check:engine runs this; alone: ASTRAEUS_URL=<app.html url> node tools/validate/browser-shell.mjs
import assert from "node:assert/strict";
import { chooseScale, currentScale } from "./driver.mjs";
import * as ui from "./driver.mjs";

import { pw } from "./playwright.mjs";
const chromium = pw.chromium ?? pw.default.chromium;
const base = process.env.ASTRAEUS_URL ?? "http://localhost:5199/app.html";
const url = `${base}${base.includes("?") ? "&" : "?"}experience=synthetic`;
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });

try {
  await page.goto(url);
  await page.waitForSelector("canvas");
  await ui.waitForShell(page);
  assert.equal(await ui.developerOpen(page), false);
  assert.equal(await ui.developerPanel(page).isVisible(), false);

  // Events: the list, a marker's label on focus, the context line, next event.
  await ui.pausePlayback(page);
  await ui.toggleEventList(page);
  assert.equal(await ui.eventRowCount(page), 2);
  const firstLabel = await ui.eventRowLabel(page, 0);
  const secondLabel = await ui.eventRowLabel(page, 1);
  await ui.focusFirstTimelineMarker(page);
  assert.equal(await ui.firstTimelineMarkerLabelVisible(page), true);
  await ui.pickEventRow(page, 0);
  assert.ok((await ui.eventContextText(page)).includes(firstLabel));
  await ui.nextEvent(page);
  assert.ok((await ui.eventContextText(page)).includes(secondLabel));
  await ui.toggleEventList(page);

  // The marker is available through the whole timeline.
  assert.equal((await ui.bodyOptionInfo(page, "survey-marker")).disabled, false);
  // Camera presets: focus and follow show the marker's name tag, overview hides it; the visible tags never overlap.
  await ui.chooseCamera(page, "focus-earth");
  await ui.pickBody(page, "moon");
  await ui.chooseCamera(page, "overview");
  await ui.pickBody(page, "survey-marker");
  await ui.chooseCamera(page, "focus-marker");
  await page.waitForTimeout(1500);
  assert.equal(await ui.sceneLabelVisible(page, "survey-marker"), true);
  await ui.chooseCamera(page, "follow-marker");
  assert.equal(await ui.cameraActive(page, "follow-marker"), true);
  await page.waitForTimeout(450);
  await ui.chooseCamera(page, "overview");
  await page.waitForTimeout(1500);
  assert.equal(await ui.sceneLabelVisible(page, "survey-marker"), false);
  const visibleLabels = await ui.visibleSceneLabelBoxes(page);
  assert.ok(visibleLabels.length > 0);
  for (let i = 0; i < visibleLabels.length; i += 1) {
    for (let j = i + 1; j < visibleLabels.length; j += 1) {
      const a = visibleLabels[i];
      const b = visibleLabels[j];
      assert.ok(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top, "visible scene labels should not overlap");
    }
  }
  // Information panel and provenance on request, for the marker (the catalogue bodies carry none in this scene).
  const panel = ui.infoPanel(page);
  const provenanceText = {};
  for (const id of ["survey-marker"]) {
    await ui.pickBody(page, id);
    await panel.waitFor();
    assert.equal(await panel.getAttribute("data-info-id"), id);
    assert.ok(await ui.infoMetricCount(page) > 0, `${id} info shows Metric Visuals`);
    const badge = ui.provenanceBadge(page);
    assert.match(await badge.innerText(), /^\w+ ⓘ/);
    await ui.openProvenance(page);
    assert.equal(await badge.getAttribute("aria-expanded"), "true");
    provenanceText[id] = await ui.provenanceDetailRaw(page);
    for (const heading of ["Known limitations", "Sources", "Accuracy"]) assert.ok(provenanceText[id].includes(heading), `${id} provenance shows ${heading}`);
  }
  assert.match(provenanceText["survey-marker"], /Not a real object/);
  await ui.closeInfoByKeyboard(page);
  assert.equal(await panel.count(), 0, "Escape closes the info panel");

  // An event's information opens from the Events list (the made-up events carry no provenance).
  await ui.toggleEventList(page);
  await ui.openCurrentEventInfo(page);
  await ui.toggleEventList(page);
  await panel.waitFor();
  assert.equal(await panel.getAttribute("data-info-kind"), "event");
  await ui.closeInfoByPanelButton(page);

  // Both scales: names, identical readouts, the tooltip and the one-tap explanation.
  await ui.pickBody(page, "moon");
  await panel.waitFor();
  const metricsTrue = await ui.infoMetricsText(page);
  assert.equal(await currentScale(page), "true-scale");
  assert.equal(await ui.scaleToggleName(page), "Scale: True. Switch to Readable");
  await chooseScale(page, "Readable");
  assert.equal(await currentScale(page), "readable-scale");
  assert.equal(await ui.scaleToggleName(page), "Scale: Readable. Switch to True");
  await page.waitForTimeout(400);
  assert.equal(await ui.infoMetricsText(page), metricsTrue, "readouts are identical under True and Readable");
  assert.match(await ui.scaleToggleTitle(page), /closer[\s\S]*true size[\s\S]*drawn on top/);
  assert.equal(await ui.scaleInfoName(page), "About the scales");
  assert.equal(await ui.scaleExplanationText(page), null, "the explanation starts closed");
  await ui.pressScaleInfo(page);
  assert.equal(await ui.scaleInfoOpen(page), true);
  const explained = await ui.scaleExplanationText(page);
  assert.match(explained, /True\.[\s\S]*real proportion/);
  assert.match(explained, /Readable\.[\s\S]*closer together/);
  assert.match(explained, /Only the picture changes/);
  await ui.pressScaleInfo(page);
  assert.equal(await ui.scaleExplanationText(page), null, "a second tap closes it");
  await chooseScale(page, "True");
  await ui.closeInfoByPanelButton(page);

  // Following the marker, then jumping to the end of the timeline where it is still available: the camera stays; a drag and a zoom move it.
  await ui.pickBody(page, "survey-marker");
  await ui.chooseCamera(page, "follow-marker");
  const canvasBounds = await page.locator("canvas").boundingBox();
  assert.ok(canvasBounds);
  const centerX = canvasBounds.x + canvasBounds.width / 2;
  const centerY = canvasBounds.y + canvasBounds.height / 2;
  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX + 28, centerY + 12, { steps: 4 });
  await page.mouse.up();
  await page.mouse.wheel(0, -120);

  // Developer panel: advanced readouts; the metric visuals fit a phone.
  await ui.toggleDeveloper(page);
  await ui.developerPanel(page).waitFor();
  assert.equal(await ui.developerOpen(page), true);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  assert.deepEqual(await ui.overflowingMetrics(page), [], "metric visuals should fit mobile portrait without overflow");
  await page.setViewportSize({ width: 1280, height: 800 });
  await ui.openAdvancedReadouts(page);
  await ui.advancedReadouts(page).list.waitFor();
  assert.equal(await ui.advancedReadouts(page).list.count(), 1);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ url, viewports: ["1280x800", "390x844"], infoProvenance: Object.keys(provenanceText), events: await ui.eventRowCount(page), cameraModes: ["overview", "focus", "follow"], labels: visibleLabels.length, errors }, null, 2));
} finally {
  await browser.close();
}
