import { describe, expect, it } from "vitest";
import { chooseSwitch, pickerOf } from "../src/listChoice";

// Lifted from the engine's list switch tests (O-059 T-270): the choice of an entry of a list is the site's.
const SWITCH = { label: "Kind", param: "kind" };
const entries = [
  { name: "second", label: "Second", order: 2 },
  { name: "first", label: "First", order: 1 },
];

describe("list choice (T-171)", () => {
  it("opens the lowest order by default and lists every entry in order", () => {
    const choice = chooseSwitch(entries, null, SWITCH)!;
    expect(choice.name).toBe("first");
    expect(choice.switcher.param).toBe("kind");
    expect(choice.switcher.options).toEqual([
      { label: "First", value: "first", active: true },
      { label: "Second", value: "second", active: false },
    ]);
  });

  it("opens the requested entry, and the default for an unknown one", () => {
    expect(chooseSwitch(entries, "second", SWITCH)!.switcher.options.map((option) => option.active)).toEqual([false, true]);
    expect(chooseSwitch(entries, "nope", SWITCH)!.name).toBe("first");
  });

  it("has no choice without entries", () => {
    expect(chooseSwitch([], "first", SWITCH)).toBeUndefined();
  });
});

describe("the picker a scene offers (O-059 T-272)", () => {
  it("lists the entries as options, presses the one opened, and names the choice by its address parameter", () => {
    const choice = chooseSwitch(entries, "second", SWITCH)!;
    expect(pickerOf(choice.switcher)).toEqual({ id: "kind", label: "Kind", options: [{ value: "first", label: "First" }, { value: "second", label: "Second" }], value: "second" });
  });
});
