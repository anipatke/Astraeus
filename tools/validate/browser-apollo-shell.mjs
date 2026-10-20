// Apollo-only parts of the shell smoke (provenance wording, mission metrics, 30 events, scale absence). The generic shell checks moved to browser-shell.mjs on the made-up scene (O-034 T-111); T-112 trims this to what only Apollo can show.
// PLAYWRIGHT_CORE=<optional override> node tools/validate/browser-apollo-shell.mjs
import assert from "node:assert/strict";
import { chooseScale, currentScale } from "./driver.mjs";
import * as ui from "./driver.mjs";

import { pw } from "./playwright.mjs";
const chromium = pw.chromium ?? pw.default.chromium;
const url = process.env.ASTRAEUS_URL ?? "http://localhost:5199/app.html";
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });

try {
  await page.goto(url);
  await page.waitForSelector("canvas");
  await ui.waitForShell(page);
  assert.equal(await (await ui.developerOpen(page) ? "true" : "false"), "false");
  assert.equal(await ui.developerPanel(page).isVisible(), false);
  assert.equal(await ui.missionPanel(page).count(), 0);

  await ui.pausePlayback(page);
  await ui.toggleEventList(page);
  assert.equal(await ui.eventRowCount(page), 30);
  const firstLabel = await ui.eventRowLabel(page, 0);
  const secondLabel = await ui.eventRowLabel(page, 1);
  await ui.focusFirstTimelineMarker(page);
  assert.equal(await ui.firstTimelineMarkerLabelVisible(page), true);
  await ui.pickEventRow(page, 0);
  assert.ok((await ui.eventContextText(page)).includes(firstLabel));
  await ui.nextEvent(page);
  assert.ok((await ui.eventContextText(page)).includes(secondLabel));
  await ui.toggleEventList(page);

  const { from: trajectoryStart, to: trajectoryEnd } = await ui.bodyOptionInfo(page, "columbia");
  const seekTo = (timeUtcMs) => ui.seekTo(page, timeUtcMs);
  const timelineStart = (await ui.seekRange(page)).min;
  await seekTo(timelineStart);
  await ui.waitForBodyAvailability(page, "columbia", false);
  const columbiaAtStart = await ui.bodyOptionInfo(page, "columbia");
  assert.equal(columbiaAtStart.disabled, true);
  assert.match(columbiaAtStart.text, /Unavailable/);
  const trajectoryMidpoint = Math.round((trajectoryStart + trajectoryEnd) / 2);
  await seekTo(trajectoryMidpoint);
  await ui.waitForBodyAvailability(page, "columbia", true);
  await ui.toggleDeveloper(page);
  await ui.waitForMission(page);
  const missionReadoutBeforeCamera = await ui.missionPanel(page).innerText();
  await ui.toggleDeveloper(page);

  await ui.chooseCamera(page, "focus-earth");
  await ui.pickBody(page, "moon");
  await ui.chooseCamera(page, "focus-moon");
  await ui.chooseCamera(page, "overview");
  await ui.pickBody(page, "columbia");
  await ui.chooseCamera(page, "focus-columbia");
  await page.waitForTimeout(1500);
  assert.equal(await ui.sceneLabelVisible(page, "columbia"), true);
  await ui.chooseCamera(page, "follow-columbia");
  assert.equal(await ui.cameraActive(page, "follow-columbia"), true);
  await page.waitForTimeout(450);
  await ui.chooseCamera(page, "overview");
  await page.waitForTimeout(1500);
  assert.equal(await ui.sceneLabelVisible(page, "columbia"), false);
  const visibleLabels = await ui.visibleSceneLabelBoxes(page);
  assert.ok(visibleLabels.length > 0);
  for (let i = 0; i < visibleLabels.length; i += 1) {
    for (let j = i + 1; j < visibleLabels.length; j += 1) {
      const a = visibleLabels[i];
      const b = visibleLabels[j];
      assert.ok(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top, "visible scene labels should not overlap");
    }
  }

  await ui.toggleDeveloper(page);
  const missionReadoutAfterCamera = await ui.missionPanel(page).innerText();
  assert.equal(missionReadoutAfterCamera, missionReadoutBeforeCamera, "range and speed readouts should remain fixed while camera modes change");
  await ui.toggleDeveloper(page);

  const { from: eagleStart, to: eagleEnd } = await ui.bodyOptionInfo(page, "eagle");
  await seekTo(Math.round((eagleStart + eagleEnd) / 2));
  await ui.waitForBodyAvailability(page, "eagle", true);
  await ui.pickBody(page, "eagle");
  await ui.chooseCamera(page, "focus-eagle");
  await page.waitForTimeout(1500);
  assert.equal(await ui.sceneLabelVisible(page, "eagle"), true);
  await ui.chooseCamera(page, "follow-eagle");
  assert.equal(await ui.cameraActive(page, "follow-eagle"), true);
  await ui.chooseCamera(page, "overview");
  await page.waitForTimeout(1500);
  assert.equal(await ui.sceneLabelVisible(page, "eagle"), false);

  // Info panel, provenance and scale choice on request (T-019), with both vehicles in bounds.
  const panel = ui.infoPanel(page);
  const expectedStatus = { earth: "Ephemeris", moon: "Ephemeris", columbia: "Reconstructed", eagle: "Reconstructed" };
  const provenanceText = {};
  for (const [id, status] of Object.entries(expectedStatus)) {
    await ui.pickBody(page, id);
    await panel.waitFor();
    assert.equal(await panel.getAttribute("data-info-id"), id);
    assert.ok(await ui.infoMetricCount(page) > 0, `${id} info shows Metric Visuals`);
    const badge = ui.provenanceBadge(page);
    assert.match(await badge.innerText(), new RegExp(`^${status} ⓘ`));
    await ui.openProvenance(page);
    assert.equal(await badge.getAttribute("aria-expanded"), "true");
    provenanceText[id] = await ui.provenanceDetailRaw(page);
    for (const heading of ["Known limitations", "Sources", "Accuracy"]) assert.ok(provenanceText[id].includes(heading), `${id} provenance shows ${heading}`);
  }
  for (const phrase of ["Smoothed joins", "Burn cutoffs", "translunar injection"]) assert.ok(provenanceText.columbia.includes(phrase), phrase);
  for (const phrase of ["Landing site", "Smoothed joins", "Burn cutoffs"]) assert.ok(provenanceText.eagle.includes(phrase), phrase);
  assert.match(provenanceText.moon, /no libration/);
  await ui.closeInfoByKeyboard(page);
  assert.equal(await panel.count(), 0, "Escape closes the info panel");

  // T-080: "Just happened / Up next" now live behind the Events button, so open it first and close it again afterwards.
  await ui.toggleEventList(page);
  await ui.openCurrentEventInfo(page);
  await ui.toggleEventList(page);
  await panel.waitFor();
  assert.equal(await panel.getAttribute("data-info-kind"), "event");
  assert.match(await ui.provenanceBadgeText(page), /^Observed ⓘ/);

  await ui.pickBody(page, "columbia");
  await panel.waitFor();
  const metricsUnderTrue = await ui.infoMetricsText(page);
  // T-085: Apollo 11 offers True scale only, so the top bar shows no scale control and no explanation button, and True stays in force.
  assert.equal(await ui.hasScaleControl(page), false, "Apollo 11 has no scale control (one scale)");
  assert.equal(await ui.hasScaleExplanation(page), false, "Apollo 11 has no scale explanation button");
  assert.equal(await currentScale(page), null);
  await chooseScale(page, "True");
  // T-085 move: the scenario that switched Apollo to Readable (toggle name, readouts identical under both scales, tooltip wording) now runs on the made-up test experience (experience=synthetic: Earth and the Moon, both scales), since Earth–Moon is gone (O-024 T-093).
  {
    const emPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    emPage.on("pageerror", (error) => errors.push(`synthetic pageerror: ${error.message}`));
    emPage.on("console", (message) => { if (message.type() === "error") errors.push(`synthetic console: ${message.text()}`); });
    await emPage.goto(`${url}${url.includes("?") ? "&" : "?"}experience=synthetic`);
    await emPage.waitForSelector("canvas");
    await ui.waitForShell(emPage);
    await ui.pausePlayback(emPage);
    await ui.pickBody(emPage, "moon");
    await ui.infoPanel(emPage).waitFor();
    const emTrue = await ui.infoMetricsText(emPage);
    assert.equal(await currentScale(emPage), "true-scale");
    assert.equal(await ui.scaleToggleName(emPage), "Scale: True. Switch to Readable");
    await chooseScale(emPage, "Readable");
    assert.equal(await currentScale(emPage), "readable-scale");
    assert.equal(await ui.scaleToggleName(emPage), "Scale: Readable. Switch to True");
    await emPage.waitForTimeout(400);
    assert.equal(await ui.infoMetricsText(emPage), emTrue, "readouts are identical under True and Readable");
    assert.match(await ui.scaleToggleTitle(emPage), /closer[\s\S]*true size[\s\S]*drawn on top/);
    // T-085: the explanation is one tap away: the information button beside the toggle, with a stable accessible name.
    assert.equal(await ui.scaleInfoName(emPage), "About the scales");
    assert.equal(await ui.scaleExplanationText(emPage), null, "the explanation starts closed");
    await ui.pressScaleInfo(emPage);
    assert.equal(await ui.scaleInfoOpen(emPage), true);
    const explained = await ui.scaleExplanationText(emPage);
    assert.match(explained, /True\.[\s\S]*real proportion/);
    assert.match(explained, /Readable\.[\s\S]*closer together/);
    assert.match(explained, /Only the picture changes/);
    await ui.pressScaleInfo(emPage);
    assert.equal(await ui.scaleExplanationText(emPage), null, "a second tap closes it");
    await chooseScale(emPage, "True");
    await emPage.close();
  }
  await ui.closeInfoByPanelButton(page);

  await ui.pickBody(page, "columbia");
  await ui.chooseCamera(page, "follow-columbia");
  const timelineEnd = (await ui.seekRange(page)).max;
  await seekTo(timelineEnd);
  await ui.waitForFallbackToOverview(page, "columbia");

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

  await ui.toggleDeveloper(page);
  await ui.developerPanel(page).waitFor();
  assert.equal(await ui.missionPanel(page).count(), 1);
  assert.equal(await ui.toggleVisible(page, "mission-window"), true);
  assert.equal(await ui.utcFieldVisible(page), true);
  assert.equal(await ui.toggleVisible(page, "anchor-labels"), true);
  await ui.instrumentMetrics(page).first().waitFor();
  assert.equal(await ui.instrumentMetrics(page).count(), 4);
  // Metric Visuals: a shape only where a real reference exists, and the same text without it.
  assert.equal(await page.locator('[data-metric="earth-moon-distance"] svg').count(), 0, "Earth–Moon distance has no reference, so it stays numeric-only");
  assert.equal(await page.locator('[data-metric="lunar-illumination"] svg[role="img"]').count(), 1);
  await seekTo(Math.round((eagleStart + eagleEnd) / 2)); // both vehicles in bounds
  await ui.missionMetrics(page, "speed").nth(1).waitFor();
  const speedArc = ui.missionMetricSvg(page, "speed").first();
  const rangeBar = ui.missionMetricSvg(page, "distance").first();
  assert.match(await speedArc.getAttribute("aria-label"), /km\/s.*peak at NASA source anchors/);
  assert.match(await rangeBar.getAttribute("aria-label"), /Moon now [\d,]+ km/);
  for (const kind of ["relative-distance", "altitude", "uncertainty", "coordinates"]) {
    assert.equal(await ui.missionMetrics(page, kind).count(), 2, `each in-bounds vehicle shows a ${kind} metric`);
  }
  assert.match(await page.locator('[data-metric="eagle-altitude"]').innerText(), /(above|below) Moon mean radius/);
  assert.match(await page.locator('[data-metric="journey-progress"]').innerText(), /lift-off → splashdown/);
  assert.equal(await page.locator('[data-metric="moon-position"] .metric-reading').count(), 3);
  assert.equal(await ui.missionRadars(page).count(), 2, "each vehicle position shows the radar view");
  assert.match(await page.locator('[data-metric="columbia-position"] svg.metric-radar').getAttribute("aria-label"), /round: top view x–y · tick: z · rim ±[\d,]+ km · lavender: Moon/);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  const overflow = await ui.overflowingMetrics(page);
  assert.deepEqual(overflow, [], "metric visuals should fit mobile portrait without overflow");
  await page.setViewportSize({ width: 1280, height: 800 });
  await ui.openAdvancedReadouts(page);
  await ui.advancedReadouts(page).list.waitFor();
  assert.equal(await ui.advancedReadouts(page).list.count(), 1);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ url, viewports: ["1280x800", "390x844"], metricVisuals: true, infoProvenance: Object.keys(provenanceText), scaleReadoutsIdentical: true, events: await ui.eventRowCount(page), cameraModes: ["overview", "focus", "follow"], labels: visibleLabels.length, errors }, null, 2));
} finally {
  await browser.close();
}
