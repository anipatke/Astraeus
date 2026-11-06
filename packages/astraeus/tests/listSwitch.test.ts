import { describe, expect, it } from "vitest";
import { pickerSwitch } from "../src/app/listSwitch";
import { switchAddress } from "../src/shell/SwitchControl";

describe("list switch (T-171)", () => {
  it("makes the control of a host picker, with the pressed option active and no address work", () => {
    const choose = () => undefined;
    const control = pickerSwitch({ id: "kind", label: "Kind", options: [{ value: "a", label: "A" }, { value: "b", label: "B" }] }, "b", choose);
    expect(control).toEqual({ label: "Kind", param: "kind", choose, options: [{ label: "A", value: "a", active: false }, { label: "B", value: "b", active: true }] });
  });

  it("builds the switch address keeping other settings but dropping the old view and time", () => {
    const next = switchAddress("http://x/app.html?experience=x&kind=a&view=sun,1,2,3&t=2027-01-01T00:00:00Z&scale=true-scale", "kind", "b");
    expect(new URL(next).searchParams.get("kind")).toBe("b");
    expect(new URL(next).searchParams.get("experience")).toBe("x");
    expect(new URL(next).searchParams.get("scale")).toBe("true-scale");
    expect(new URL(next).searchParams.has("view")).toBe(false);
    expect(new URL(next).searchParams.has("t")).toBe(false);
  });

  // Moved from the planets demo (O-059 T-270): a switch that shares one timeline keeps the clock time (`t`) and drops the camera view.
  it("keeps the clock time for a switch that names it, and the camera view is the new version's own", () => {
    const from = "http://x/app.html?experience=planets&planet=jupiter&view=jupiter,1,2,3&t=2016-11-10T12:00:00Z";
    const next = new URL(switchAddress(from, "planet", "saturn", ["t"]));
    expect(next.searchParams.get("planet")).toBe("saturn");
    expect(next.searchParams.get("t")).toBe("2016-11-10T12:00:00Z");
    expect(next.searchParams.has("view")).toBe(false);
  });

  it("carries the clock's time now, not the time the address was opened with (I-051)", () => {
    const opened = "http://x/app.html?experience=planets&planet=jupiter&t=2016-11-10T12:00:00Z";
    const later = Date.UTC(2016, 10, 12, 3, 4, 5, 600);
    expect(new URL(switchAddress(opened, "planet", "saturn", ["t"], later)).searchParams.get("t")).toBe("2016-11-12T03:04:06.000Z");
    expect(new URL(switchAddress("http://x/app.html?experience=planets&planet=jupiter", "planet", "saturn", ["t"], later)).searchParams.get("t")).toBe("2016-11-12T03:04:06.000Z");
    // A switch that does not keep the time (the showers') drops it whatever the clock says.
    expect(new URL(switchAddress(opened, "shower", "b", [], later)).searchParams.has("t")).toBe(false);
  });
});
