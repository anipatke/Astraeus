import { describe, expect, it } from "vitest";
import { pickerSwitch } from "../src/app/listSwitch";

describe("list switch (T-171)", () => {
  it("makes the control of a host picker, with the pressed option active and no address work", () => {
    const choose = () => undefined;
    const control = pickerSwitch({ id: "kind", label: "Kind", options: [{ value: "a", label: "A" }, { value: "b", label: "B" }] }, "b", choose);
    expect(control).toEqual({ label: "Kind", param: "kind", choose, options: [{ label: "A", value: "a", active: false }, { label: "B", value: "b", active: true }] });
  });
});
