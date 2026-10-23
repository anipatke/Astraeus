import { describe, expect, it } from "vitest";
import { chooseShower, SHOWER_PARAM } from "../src/experiences/showers/showerChoice";
import { switchAddress } from "../src/shell/SwitchControl";

const entries = [
  { name: "second", label: "Second", order: 2 },
  { name: "first", label: "First", order: 1 },
];

describe("shower choice (T-091)", () => {
  it("opens the lowest order by default and lists every shower in order", () => {
    const choice = chooseShower(entries, null)!;
    expect(choice.name).toBe("first");
    expect(choice.switcher.param).toBe(SHOWER_PARAM);
    expect(choice.switcher.options).toEqual([
      { label: "First", value: "first", active: true },
      { label: "Second", value: "second", active: false },
    ]);
  });

  it("opens the requested shower, and the default for an unknown one", () => {
    expect(chooseShower(entries, "second")!.switcher.options.map((option) => option.active)).toEqual([false, true]);
    expect(chooseShower(entries, "nope")!.name).toBe("first");
  });

  it("has no choice without showers", () => {
    expect(chooseShower([], "first")).toBeUndefined();
  });

  it("builds the switch address keeping other settings but dropping the old view and time", () => {
    const next = switchAddress("http://x/app.html?experience=showers&shower=a&view=sun,1,2,3&t=2027-01-01T00:00:00Z&scale=true-scale", "shower", "b");
    expect(new URL(next).searchParams.get("shower")).toBe("b");
    expect(new URL(next).searchParams.get("experience")).toBe("showers");
    expect(new URL(next).searchParams.get("scale")).toBe("true-scale");
    expect(new URL(next).searchParams.has("view")).toBe(false);
    expect(new URL(next).searchParams.has("t")).toBe(false);
  });
});
