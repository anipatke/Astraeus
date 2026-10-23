import { describe, expect, it } from "vitest";
import { chooseSwitch } from "../src/app/listSwitch";
import { switchAddress } from "../src/shell/SwitchControl";

const SWITCH = { label: "Kind", param: "kind" };
const entries = [
  { name: "second", label: "Second", order: 2 },
  { name: "first", label: "First", order: 1 },
];

describe("list switch (T-171)", () => {
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

  it("builds the switch address keeping other settings but dropping the old view and time", () => {
    const next = switchAddress("http://x/app.html?experience=x&kind=a&view=sun,1,2,3&t=2027-01-01T00:00:00Z&scale=true-scale", "kind", "b");
    expect(new URL(next).searchParams.get("kind")).toBe("b");
    expect(new URL(next).searchParams.get("experience")).toBe("x");
    expect(new URL(next).searchParams.get("scale")).toBe("true-scale");
    expect(new URL(next).searchParams.has("view")).toBe(false);
    expect(new URL(next).searchParams.has("t")).toBe(false);
  });
});
