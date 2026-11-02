// The browser driver finds viewer parts without ids (O-055 T-254; moved here by T-258 so the engine-alone copy, which has no site, still runs its own tests).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("the browser driver finds parts without ids", () => {
  const driver = readFileSync(join(__dirname, "..", "tools", "validate", "driver.mjs"), "utf8");
  it("holds no #id selector for a viewer part (#boot goes with T-255; #curve-fits is the site's own page)", () => {
    expect((driver.match(/["'`]#[a-z][\w-]*/g) ?? []).map((found) => found.slice(1)).filter((id) => id !== "#boot" && id !== "#curve-fits")).toEqual([]);
    expect(driver).not.toMatch(/aria-controls="[a-z-]+"/);
  });
  it.each([".info-panel", ".info-panel .info-panel-close", "button.moons-toggle", ".moons-sheet", ".controls-drawer", ".timeline-drawer", ".developer-tools"])("the driver's selector %s is the one the viewer draws", (selector) => {
    expect(driver).toContain(selector);
  });
});
