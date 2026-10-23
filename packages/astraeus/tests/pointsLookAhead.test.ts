import { describe, expect, it } from "vitest";
import type { GroupLayer } from "../src/app/experienceDefinition";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { PointsView, SLICE_CHUNK_MEMBERS } from "../src/app/PointsView";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { createProvenance } from "../src/core/provenance";
import { memberState, type PointGroup } from "../src/core/pointGroup";
import { readableScale, trueScale } from "../src/core/scalePolicy";
import { placementAbout } from "./scenePlacement";

// T-073 (I-034): a big group's next fill is computed a few milliseconds per frame ahead of time. Proven on a made-up
// group of 3,000 members first (ARCH-03); the drawn positions must equal a view that fills whole in one frame.

const adapter = createOrbAstronomyAdapter();
const placement = placementAbout("earth", adapter);
const START = Date.UTC(2030, 0, 1);
const END = START + 6 * 3_600_000;
const COUNT = 3 * SLICE_CHUNK_MEMBERS;
const SPAN = 600_000;

const provenance = createProvenance({
  sourceType: "illustrative",
  sources: ["Made up inside the look-ahead tests; not a real population"],
  accuracy: "None claimed. A rotating ring invented for this fixture.",
  notes: "Exists to prove the points layer's fill look-ahead.",
});

interface Calls { whole: number; range: number }

function bigGroup(calls: Calls, withRange = true): PointGroup {
  const position = (index: number, t: number): number[] => {
    const angle = (2 * Math.PI * index) / COUNT + (2 * Math.PI * (t - START)) / (END - START);
    const radius = 20_000 + (index % 7) * 500;
    return [radius * Math.cos(angle), radius * Math.sin(angle), 3_000 * Math.sin(2 * angle)];
  };
  const bounds = { startUtcMs: START, endUtcMs: END };
  const range = (t: number, out: Float64Array, start: number, end: number): void => {
    for (let i = start; i < end; i += 1) out.set(position(i, t), 3 * i);
  };
  return {
    id: "big", count: COUNT, center: "earth", frame: "EQJ", bounds, provenance,
    fillPositionsKm(t, out) { calls.whole += 1; range(t, out, 0, COUNT); },
    ...(withRange ? { fillPositionsRangeKm(t: number, out: Float64Array, start: number, end: number) { calls.range += 1; range(t, out, start, end); } } : {}),
    stateAt: (index, t) => memberState({ id: "big", center: "earth", bounds }, index, t, position(index, t)),
  };
}

/** A fake clock that advances one millisecond each time it is read, so a slice budget means a fixed number of chunks. */
function tickingClock(): () => number {
  let now = 0;
  return () => (now += 1);
}

function layer(calls: Calls, extra: Partial<GroupLayer> = {}, withRange = true): GroupLayer {
  return {
    group: bigGroup(calls, withRange),
    color: "#88ccff",
    object: { id: "big", label: "Big ring", description: "A made-up ring.", knownLimitations: ["Made up."] },
    refillAfterMs: SPAN,
    ...extra,
  };
}

function pair(sliceMs = 4) {
  const lookCalls: Calls = { whole: 0, range: 0 };
  const plainCalls: Calls = { whole: 0, range: 0 };
  const look = new PointsView(layer(lookCalls, { refillSliceMs: sliceMs }), tickingClock());
  const plain = new PointsView(layer(plainCalls, { refillSliceMs: 0 }));
  const origin = new FloatingOrigin();
  const policyOf = { current: trueScale };
  /** Syncs both views to the same moment and expects every member in the same place. */
  const step = (t: number): void => {
    for (const view of [look, plain]) {
      view.sync(t, placement, policyOf.current);
      view.place(origin);
    }
    expect(look.drawn).toBe(plain.drawn);
    const a = new Float32Array(3 * COUNT);
    const b = new Float32Array(3 * COUNT);
    for (let i = 0; i < COUNT; i += 1) {
      a.set(look.memberLocalPosition(i), 3 * i);
      b.set(plain.memberLocalPosition(i), 3 * i);
    }
    expect(a).toEqual(b);
    expect(look.absolute()).toEqual(plain.absolute());
    expect(look.extentUnits(policyOf.current)).toBe(plain.extentUnits(policyOf.current));
  };
  return { look, plain, lookCalls, plainCalls, step, policyOf };
}

// Each case compares every frame against a whole fill of a large group; on a busy machine or a CI runner that takes several seconds, past the 5 s default.
describe("fill look-ahead on a large group", { timeout: 30_000 }, () => {
  it("plays forward with the same positions as whole fills, making only the first two fills whole", () => {
    const { look, plain, lookCalls, step } = pair();
    const start = START + 600_000;
    for (let t = start; t <= start + 5 * SPAN; t += SPAN / 20) step(t);
    expect(lookCalls.whole).toBe(2); // the opening seek and the first slide, when the direction is not yet known; the rest were made ahead
    expect(lookCalls.range).toBeGreaterThan(0);
    expect(look.fillCount).toBe(plain.fillCount);
  });

  it("plays backward with the same positions, making only the first two fills whole", () => {
    const { look, plain, lookCalls, step } = pair();
    const start = START + 4_000_000;
    for (let t = start; t >= start - 5 * SPAN; t -= SPAN / 20) step(t);
    expect(lookCalls.whole).toBe(2); // opening seek and first slide, as above
    expect(look.fillCount).toBe(plain.fillCount);
  });

  it("never draws a half-finished fill: positions at every frame equal whole fills while a slice is mid-way", () => {
    // One chunk per frame: a fill needs six frames, so most frames have unfinished work behind them.
    const { lookCalls, step } = pair(1);
    const start = START + 600_000;
    for (let t = start; t <= start + 3 * SPAN; t += SPAN / 30) step(t);
    expect(lookCalls.whole).toBe(2); // opening seek and first slide, as above
  });

  it("gives whole-fill positions after a seek while a fill is part-way", () => {
    const { step } = pair(1);
    const start = START + 600_000;
    for (let t = start; t < start + SPAN / 2; t += SPAN / 40) step(t);
    step(START + 5_000_000);
    step(START + 5_000_000 + SPAN / 10);
    step(START + 1_000_000);
  });

  it("falls back to a whole fill when the clock outruns an unfinished fill", () => {
    const { lookCalls, step } = pair(1);
    const start = START + 600_000;
    step(start);
    step(start + 1_000);
    step(start + 2_000); // work started, far from finished at one chunk a frame
    const before = lookCalls.whole;
    step(start + SPAN + 5_000); // past the pair before the look-ahead could finish
    expect(lookCalls.whole).toBe(before + 1);
    step(start + SPAN + 5_000 + SPAN / 2);
  });

  it("drops the work and keeps exact positions when the clock turns round", () => {
    const { step } = pair();
    const start = START + 2_000_000;
    for (let t = start; t < start + SPAN / 2; t += SPAN / 40) step(t);
    for (let t = start + SPAN / 2; t > start - 2 * SPAN; t -= SPAN / 40) step(t);
    for (let t = start - 2 * SPAN; t < start; t += SPAN / 40) step(t);
  });

  it("matches whole fills across a scale change mid-fill", () => {
    const { step, policyOf } = pair(1);
    const start = START + 600_000;
    for (let t = start; t < start + SPAN / 2; t += SPAN / 40) step(t);
    policyOf.current = readableScale;
    for (let t = start + SPAN / 2; t < start + 2.5 * SPAN; t += SPAN / 40) step(t);
    policyOf.current = trueScale;
    for (let t = start + 2.5 * SPAN; t < start + 3.5 * SPAN; t += SPAN / 40) step(t);
  });

  it("shows the same positions while paused as when stopped, however many frames pass", () => {
    const { step } = pair(1);
    const t = START + 1_500_000;
    step(t);
    step(t + SPAN / 3);
    for (let i = 0; i < 12; i += 1) step(t + SPAN / 3);
    step(t + SPAN / 3 + 1);
  });

  it("stops at the end of the bounds without a fill past it", () => {
    const { step } = pair();
    for (let t = END - 3 * SPAN; t <= END; t += SPAN / 10) step(t);
    step(END);
    step(END + 1); // outside: nothing drawn, same as whole
  });

  it("does nothing different for a group without range fills, or when switched off", () => {
    const calls: Calls = { whole: 0, range: 0 };
    const view = new PointsView(layer(calls, {}, false), tickingClock());
    for (let t = START + 600_000; t < START + 600_000 + 3 * SPAN; t += SPAN / 10) view.sync(t, placement, trueScale);
    expect(calls.range).toBe(0);
    const off: Calls = { whole: 0, range: 0 };
    const switchedOff = new PointsView(layer(off, { refillSliceMs: 0 }));
    for (let t = START + 600_000; t < START + 600_000 + 3 * SPAN; t += SPAN / 10) switchedOff.sync(t, placement, trueScale);
    expect(off.range).toBe(0);
  });

  it("rejects a negative or non-finite slice budget", () => {
    const calls: Calls = { whole: 0, range: 0 };
    expect(() => new PointsView(layer(calls, { refillSliceMs: -1 }))).toThrow(RangeError);
    expect(() => new PointsView(layer(calls, { refillSliceMs: Number.NaN }))).toThrow(RangeError);
  });
});
