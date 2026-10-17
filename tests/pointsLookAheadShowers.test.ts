import { describe, expect, it } from "vitest";
import { groupsOf } from "../src/app/experienceDefinition";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { PointsView } from "../src/app/PointsView";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { trueScale } from "../src/core/scalePolicy";
import { buildShowerDefinition } from "../src/experiences/showers/showerDefinition";
import { parseShowerSettings } from "../src/experiences/showers/showerSettings";
import perseidsFile from "../data/showers/perseids.json";
import geminidsFile from "../data/showers/geminids.json";
import { readShippedOrbits } from "./helpers/measuredOrbits";
import { placementAbout } from "./scenePlacement";

// T-073 (I-034), after the made-up group in pointsLookAhead.test.ts: the shipped showers, with their own refill interval, draw the
// same positions with the fill spread over frames as with whole fills, forward, backward and across a seek.

const HOUR = 3_600_000;
const placement = placementAbout("sun", createOrbAstronomyAdapter());

describe.each([
  { name: "Perseids", story: "perseids", iau: 7, file: perseidsFile },
  { name: "Geminids", story: "geminids", iau: 4, file: geminidsFile },
])("$name fill look-ahead", ({ story, iau, file }) => {
  it("draws the same positions as whole fills and makes the later fills ahead of time", () => {
    const settings = parseShowerSettings(file);
    const base = groupsOf(buildShowerDefinition(settings, { kind: "loaded", orbits: readShippedOrbits(story, iau) }, "all"))[0];
    let whole = 0;
    const counted = { ...base.group, fillPositionsKm: (t: number, out: Float64Array) => { whole += 1; base.group.fillPositionsKm(t, out); } };
    const layerOf = (extra: object) => ({ ...base, ...extra });
    let now = 0;
    const look = new PointsView(layerOf({ group: counted }), () => (now += 0.25)); // a quarter millisecond a chunk: a fill takes a few frames
    const plain = new PointsView(layerOf({ refillSliceMs: 0 }));
    const { group } = look.layer;
    expect(look.layer.refillSliceMs).toBe(story === "geminids" ? 12 : undefined); // the Geminids file sets its own slice; the Perseids take the default
    const origin = new FloatingOrigin();
    const check = (t: number): void => {
      for (const view of [look, plain]) { view.sync(t, placement, trueScale); view.place(origin); }
      expect(look.absolute()).toEqual(plain.absolute());
      for (let i = 0; i < group.count; i += 997) expect(look.memberLocalPosition(i)).toEqual(plain.memberLocalPosition(i));
    };
    const peak = Date.parse(settings.activity.peakUtc);
    const step = 6 * HOUR;
    for (let k = 0; k <= 16; k += 1) check(peak + k * step); // two refill intervals and more, forward
    for (let k = 16; k >= 0; k -= 1) check(peak + k * step); // and back again
    check(peak + 40 * 24 * HOUR); // a seek
    check(peak + 40 * 24 * HOUR + step);
    expect(look.fillCount).toBe(plain.fillCount);
    expect(whole).toBeLessThan(look.fillCount); // most fills were made a slice at a time
  }, 120_000);
});

describe("the look-ahead setting in a shower file", () => {
  const withSlice = (value: unknown) => parseShowerSettings({ ...perseidsFile, look: { ...perseidsFile.look, refillSliceMs: value } });
  it("is optional, read from look.refillSliceMs and carried to the stream layer", () => {
    expect(parseShowerSettings(perseidsFile).look.refillSliceMs).toBeUndefined();
    const settings = withSlice(5);
    expect(settings.look.refillSliceMs).toBe(5);
    expect(withSlice(0).look.refillSliceMs).toBe(0);
  });
  it("rejects a negative or non-numeric value", () => {
    expect(() => withSlice(-1)).toThrow(/refillSliceMs/);
    expect(() => withSlice("fast")).toThrow(/refillSliceMs/);
  });
});
