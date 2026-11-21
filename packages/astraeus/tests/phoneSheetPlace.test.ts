// I-185: the phone sheet place must have a definite height, or the sheet cap is ignored. A phone card or story sheet caps itself with
// `max-height: min(var(--sheet-max), 100%)` (parts/phone.css), a share of the place it sits in. With the place content-sized (`align-self: end`) the 100%
// has nothing to resolve against, the whole cap drops out, and a long card (Saturn's, 514 px of an 844 px phone) covered the scene's middle: the
// synthetic-journey phone smoke found no free point. The place now fills its grid row (`align-self: stretch`) and pushes its sheets to the bottom.
// happy-dom draws no layout, so this reads the two rules that make the cap work; a change that reopens the trap fails here.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SHELL = join(__dirname, "..", "src", "shell");
const read = (path: string) => readFileSync(join(SHELL, path), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

/** The declarations of the first rule whose selector list contains `selector` (comments removed). */
function declarationsOf(css: string, selector: string): Record<string, string> {
  const rule = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(([, selectors]) => selectors.split(",").some((one) => one.trim() === selector));
  if (rule === undefined) throw new Error(`no rule for ${selector}`);
  return Object.fromEntries(rule[2].split(";").map((part) => part.split(":")).filter((pair) => pair.length >= 2).map(([name, ...value]) => [name.trim(), value.join(":").trim()]));
}

describe("the phone sheet place (I-185)", () => {
  const areas = read("areas/areas.css");
  it.each(["left", "right", "developer", "sheet"])("the %s place fills its row on a phone, so a sheet's percent cap resolves", (area) => {
    const place = declarationsOf(areas, `.astraeus-shell[data-phone="true"] [data-area="${area}"]`);
    expect(place["grid-area"]).toBe("sheet");
    expect(place["align-self"]).toBe("stretch");
    expect(place["justify-content"]).toBe("flex-end");
  });
  it("the sheet row is the free row between the bar and the timeline (a definite track for the place to fill)", () => {
    const grid = declarationsOf(areas, '.astraeus-shell[data-phone="true"] .astraeus-areas');
    expect(grid["grid-template-rows"]).toBe("auto minmax(0, 1fr) auto");
  });
  it("each phone sheet caps itself against its place and scrolls inside the cap", () => {
    const phone = read("parts/phone.css");
    for (const sheet of [".info-panel", ".story-panel", ".moons-sheet"]) {
      const rule = declarationsOf(phone, `.astraeus-shell[data-phone="true"] ${sheet}`);
      expect(rule["max-height"]).toMatch(/var\(--sheet-max[^)]*\).*100%/);
      expect(rule["overflow-y"]).toBe("auto");
    }
  });
});
