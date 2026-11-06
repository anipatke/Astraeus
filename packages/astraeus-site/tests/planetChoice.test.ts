import { describe, expect, it } from "vitest";
import { choosePlanet, PLANET_PARAM, PLANET_SWITCH_KEEPS, type PlanetEntry } from "../src/planetChoice";

const jupiter: PlanetEntry = { name: "jupiter", label: "Jupiter", order: 5, isDefault: true };
const mars: PlanetEntry = { name: "mars", label: "Mars", order: 4, isDefault: false };

describe("planet choice (T-136)", () => {
  it("lists every planet and opens the requested one in a local build", () => {
    const choice = choosePlanet([jupiter, mars], "mars")!;
    expect(choice.name).toBe("mars");
    expect(choice.switcher.param).toBe(PLANET_PARAM);
    expect(choice.switcher.options.map((option) => option.value)).toEqual(["mars", "jupiter"]);
  });

  it("with Jupiter alone (the public build) opens Jupiter for any requested planet and offers a one-option switch the top bar hides", () => {
    for (const requested of [null, "jupiter", "mars", "nope"]) {
      const choice = choosePlanet([jupiter], requested)!;
      expect(choice.name).toBe("jupiter");
      expect(choice.switcher.options).toEqual([{ label: "Jupiter", value: "jupiter", active: true }]);
    }
  });

  it("keeps the clock time across planets (they share one window), and the camera view is the new planet's own", () => {
    const chosen = choosePlanet([jupiter, mars], "jupiter")!;
    expect(chosen.switcher.keep).toEqual(["t"]);
    expect(PLANET_SWITCH_KEEPS).toEqual(["t"]);
  });

  it("opens the default planet unless the address names another, and lists planets in order", () => {
    const opened = choosePlanet([jupiter, mars], null)!;
    expect(opened.name).toBe("jupiter");
    expect(opened.switcher.options.map((option) => [option.value, option.active])).toEqual([["mars", false], ["jupiter", true]]);
    expect(choosePlanet([jupiter, mars], "nope")!.name).toBe("jupiter");
  });

  it("has no choice without planets", () => {
    expect(choosePlanet([], "jupiter")).toBeUndefined();
  });
});
