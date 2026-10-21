// Layout of the shell at laptop, tablet and phone sizes on the made-up scene (?experience=synthetic): every shell part fits the viewport, primary controls are 44 px high,
// the information sheet clears the timeline on a phone, the developer panel receives taps across its panel (information open or not) and scrolls to its end,
// and keyboard focus is visible. Moved from the Apollo-hosted browser-spike03.mjs by O-034 T-111; its Apollo camera, seek and scale cases live in browser-shell.mjs (generic) or
// browser-apollo-shell.mjs (Apollo only).
//   ASTRAEUS_URL=<app.html url> node tools/validate/browser-layout.mjs
import assert from "node:assert/strict";
import * as ui from "./driver.mjs";
import { launchBrowser, openPage, watchErrors } from "./harness.mjs";

const url = `${process.env.ASTRAEUS_URL ?? "http://localhost:5199/app.html"}?experience=synthetic`;

const browser = await launchBrowser();
const page = await openPage(browser, { viewport: { width: 1440, height: 900 } });
const errors = [];
watchErrors(page, errors);

const setViewport = async (width, height) => {
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(250);
};
const pause = () => ui.ensurePaused(page);
const closeInfo = async () => {
  await ui.closeInfo(page);
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
  assert.ok(targets.length > 8, `${label}: primary controls are present`);
  for (const target of targets) assert.ok(target.height >= 43, `${label}: ${target.selector} ${target.label} is at least 44px high`);
  return targets;
};

try {
  await page.goto(url);
  await page.waitForSelector("canvas");
  await ui.waitForShell(page);
  assert.equal(await ui.developerOpen(page), false);
  await pause();

  const panel = ui.infoPanel(page);
  await ui.pickBody(page, "survey-marker");
  await panel.waitFor();
  assert.ok(await ui.infoMetricCount(page) > 0, "the marker's information includes Metric Visuals");
  await closeInfo();

  for (const [name, width, height] of [["laptop", 1280, 800], ["tablet", 768, 1024], ["mobile", 390, 844]]) {
    await setViewport(width, height);
    await ui.chooseCamera(page, "overview");
    await page.waitForTimeout(500);
    await assertFitsViewport(`${name} ${width}x${height}`);
    if (name !== "laptop") await assertTouchTargets(`${name} ${width}x${height}`);
  }

  await ui.pickBody(page, "survey-marker");
  await panel.waitFor();
  await assertFitsViewport("mobile info sheet 390x844", { sheetAboveTimeline: true });
  await assertTouchTargets("mobile info sheet 390x844");

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
  console.log(JSON.stringify({ viewports: ["1440x900", "1280x800", "768x1024", "390x844"], developerPanels: developerPanels.length, keyboardFocus: focusStyle, errors }, null, 2));
} finally {
  await browser.close();
}
