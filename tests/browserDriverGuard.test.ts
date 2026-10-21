import { describe, expect, it } from "vitest";
import { findViolations, scriptFiles, violationsIn } from "../tools/validate/driver-guard.mjs";

// O-020 T-083: browser scripts reach the interface only through tools/validate/driver.mjs.
describe("browser scripts use the shared interface driver", () => {
  it("no script finds or operates a shell control itself", () => {
    expect(findViolations()).toEqual([]);
  });

  it("covers every script in tools/validate and tools/validate/on-request", () => {
    const names = scriptFiles().map((file) => file.slice(file.lastIndexOf("validate/") + "validate/".length));
    expect(names).toContain("browser-lite.mjs");
    expect(names).toContain("on-request/browser-sun.mjs");
    expect(names).not.toContain("driver.mjs");
    expect(names).not.toContain("harness.mjs");
  });

  it("catches each way of reaching around the driver", () => {
    const bad = [
      'await page.getByRole("button", { name: "Pause playback" }).click();',
      'await page.getByLabel("Select object").selectOption("sun");',
      'await page.getByText("Events").first();',
      'await page.locator(".info-panel-close").count();',
      'await page.locator(selector).boundingBox();',
      'await page.keyboard.press("Escape");',
      'await page.mouse.click(10, 10);',
      'document.querySelector(".timeline-time")',
      'await page.waitForSelector("#info-panel");',
      "await button.evaluate((element) => element.click());",
      'const browser = await chromium.launch({ args: [] });',
      'const page = await browser.newPage({ viewport });',
      'const context = await browser.newContext();',
      'const page = await context.newPage();',
      'import { pw } from "./playwright.mjs";',
      'await page.screenshot({ path: "out.png" });',
      'await page.getByTestId("earth-moon-canvas").screenshot();',
    ];
    for (const line of bad) expect(violationsIn(line), line).not.toHaveLength(0);
  });

  it("allows the scene canvas, test ids, data-attribute readouts and a comment", () => {
    const good = [
      'await page.getByTestId("earth-moon-canvas").boundingBox();',
      'await page.locator("canvas").first().getAttribute("data-sky-stars");',
      'await page.locator(`[data-label-id="${id}"]`).evaluate((el) => el.hidden);',
      'await counter.locator("[data-frame-fps]").innerText();',
      'const a = new Array(3).fill(0);',
      '// page.getByRole("button").click() would be flagged in code, not in a comment',
      'await page.mouse.move(10, 10);',
    ];
    for (const line of good) expect(violationsIn(line), line).toEqual([]);
  });
});
