// O-097 T-449: a long word wraps inside a panel. The rules are read from the shipped stylesheet (happy-dom has no layout); the real layout is proved in the browser catalogue step.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "packages/astraeus/src/shell/parts/parts.css"), "utf8");
const body = (selector: string): string => {
  const at = css.indexOf(`${selector} {`);
  expect(at, `rule for ${selector}`).toBeGreaterThan(-1);
  return css.slice(at, css.indexOf("}", at));
};

describe("panel surfaces wrap long words", () => {
  it("lets the text of the info and story panels break anywhere", () => {
    expect(body(".astraeus-shell :is(.info-panel, .story-panel)")).toContain("overflow-wrap: anywhere");
  });
  it("lets the panels' direct children shrink below their longest word", () => {
    expect(body(".astraeus-shell :is(.info-panel, .story-panel) > *")).toContain("min-width: 0");
  });
  it("lets the header titles shrink", () => {
    expect(body(".astraeus-shell .info-panel-header h2")).toContain("min-width: 0");
    expect(body(".astraeus-shell .story-panel h2")).toContain("min-width: 0");
  });
  it("keeps the Close buttons from shrinking", () => {
    expect(body(".astraeus-shell .info-panel-header .info-panel-close")).toContain("flex: none");
    expect(body(".astraeus-shell :where(.story-panel-close)")).toContain("flex: none");
  });
});
