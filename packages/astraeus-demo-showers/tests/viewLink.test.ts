import { describe, expect, it } from "vitest";
import { formatView, parseView, scaleFromSearch, timeFromSearch, validateStartView, viewFromAngles, viewFromSearch, viewLinkSearch } from "../../astraeus/src/app/viewLink";

describe("view link", () => {
  it("round-trips the captured view through the address", () => {
    const captured = viewFromAngles("some-focus", 3.7699111843, 0.3490658504, 12.3456789);
    const search = viewLinkSearch("?experience=x", { view: captured, scaleId: "readable-scale", up: "ecliptic", timeUtcMs: Date.UTC(1969, 6, 20, 20, 17, 40) });
    expect(search).toBe(`?experience=x&view=some-focus,216,20,12.346&scale=readable-scale&up=ecliptic&t=1969-07-20T20:17:40.000Z`);
    expect(viewFromSearch(search)).toEqual(captured);
    expect(timeFromSearch(search)).toBe(Date.UTC(1969, 6, 20, 20, 17, 40));
    expect(scaleFromSearch(search)).toBe("readable-scale");
    expect(parseView(formatView(captured))).toEqual(captured);
  });

  it("wraps azimuth into 0 to 360 and clamps elevation", () => {
    expect(viewFromAngles("a", -Math.PI / 2, 2, 5).azimuthDeg).toBe(270);
    expect(viewFromAngles("a", 0, 2, 5).elevationDeg).toBe(89);
    expect(validateStartView({ focus: "a", azimuthDeg: -90, elevationDeg: 0, distance: 1 }).azimuthDeg).toBe(270);
  });

  it("names the offending field", () => {
    expect(() => parseView("a,1,2")).toThrow(/4 parts/);
    expect(() => parseView("a,x,2,3")).toThrow(/view\.azimuthDeg/);
    expect(() => parseView("a,1,95,3")).toThrow(/view\.elevationDeg/);
    expect(() => parseView("a,1,2,0")).toThrow(/view\.distance/);
    expect(() => validateStartView({ focus: "", azimuthDeg: 0, elevationDeg: 0, distance: 1 }, "look.startView")).toThrow(/look\.startView\.focus/);
    expect(() => validateStartView({ focus: "a", azimuthDeg: 0, elevationDeg: 0, distance: 1, roll: 2 }, "look.startView")).toThrow(/look\.startView\.roll/);
    expect(() => validateStartView(5, "look.startView")).toThrow(/look\.startView must be an object/);
  });

  it("ignores a malformed link and leaves the view alone", () => {
    expect(viewFromSearch("?view=bad")).toBeUndefined();
    expect(viewFromSearch("")).toBeUndefined();
    expect(timeFromSearch("?t=nope")).toBeUndefined();
  });
});

import perseidsFile from "../data/showers/perseids.json";
import { buildShowerDefinition } from "../src/experiences/showers/showerDefinition";
import { parseShowerSettings } from "../src/experiences/showers/showerSettings";

describe("start view in a shower settings file", () => {
  const withView = (view: unknown) => {
    const copy = JSON.parse(JSON.stringify(perseidsFile));
    copy.look.startView = view;
    return copy;
  };

  it("passes a valid start view to the definition, and omits it when absent", () => {
    const view = { focus: "sun", azimuthDeg: 200, elevationDeg: 35, distance: 40 };
    expect(buildShowerDefinition(parseShowerSettings(withView(view)), { kind: "absent" }).startView).toEqual(view);
    const none = JSON.parse(JSON.stringify(perseidsFile));
    delete none.look.startView;
    expect(buildShowerDefinition(parseShowerSettings(none), { kind: "absent" }).startView).toBeUndefined();
  });

  it("names the field of an invalid start view", () => {
    expect(() => parseShowerSettings(withView({ focus: "sun", azimuthDeg: 0, elevationDeg: 120, distance: 1 }))).toThrow(/look\.startView.*elevationDeg/);
    expect(() => parseShowerSettings(withView("nope"))).toThrow(/look\.startView/);
  });
});
