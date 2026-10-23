import { describe, expect, it } from "vitest";
import { choosePlanet, PLANET_PARAM, type PlanetEntry } from "../src/experiences/planets/planetChoice";

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

  it("has no choice without planets", () => {
    expect(choosePlanet([], "jupiter")).toBeUndefined();
  });
});
