// Paced playback (O-047 T-201, I-112): the rate as a pure function of time over a made-up journey with made-up events, its checks, and the clock following it.
import { describe, expect, it } from "vitest";
import { Scene, SceneError, earth } from "astraeus";
import { SimulationClock } from "../src/core/clock";
import { activeEventZones, applyPacing, pacedRate } from "../src/core/pacing";
import { definitionOf } from "../src/api/definitionOf";

const DAY = 86_400_000;
const T0 = Date.UTC(2030, 0, 1);
const at = (days: number) => new Date(T0 + days * DAY).toISOString();
const codeOf = (run: () => unknown): string | undefined => { try { run(); } catch (error) { return error instanceof SceneError ? `${error.code}: ${error.message}` : String(error); } return undefined; };

// A made-up journey: 100 days at 1 day/s cruise, a flyby on day 40 and another on day 80 (made-up type "flyby"), each slowed to 60x within 2 days, easing over 2 days.
const journey = () => new Scene().addBody(earth)
  .addEvents([{ id: "a", label: "First flyby", time: at(40), type: "flyby" }, { id: "b", label: "Second flyby", time: at(80), type: "flyby" }])
  .setTimeline({ start: at(0), end: at(100), rate: 86_400, rates: [60, 3_600, 86_400], pacing: [{ near: { type: "flyby", withinSeconds: 2 * 86_400 }, rate: 60 }] });
const pacingOf = () => definitionOf(journey()).pacing!;

describe("the paced rate", () => {
  it("cruises between encounters, holds the encounter rate near an event, and eases in the ramp", () => {
    const pacing = pacingOf();
    expect(pacedRate(pacing, T0 + 10 * DAY)).toBeCloseTo(86_400, 6);
    expect(pacedRate(pacing, T0 + 40 * DAY)).toBeCloseTo(60, 6);
    expect(pacedRate(pacing, T0 + 41.9 * DAY)).toBeCloseTo(60, 6);
    expect(pacedRate(pacing, T0 + 80 * DAY - 1.5 * DAY)).toBeCloseTo(60, 6);
    expect(pacedRate(pacing, T0 + 44 * DAY)).toBeCloseTo(86_400, 6); // ramp ends 4 days out (within 2 + ramp 2)
    const mid = pacedRate(pacing, T0 + 43 * DAY); // halfway down the ramp
    expect(mid).toBeGreaterThan(60);
    expect(mid).toBeLessThan(86_400);
  });

  it("is smooth: falling monotonically on the way in, rising on the way out, with no jump either way", () => {
    const pacing = pacingOf();
    let previous = pacedRate(pacing, T0 + 36 * DAY);
    for (let hours = 1; hours <= 96; hours += 1) {
      const rate = pacedRate(pacing, T0 + 36 * DAY + hours * 3_600_000);
      expect(rate).toBeLessThanOrEqual(previous + 1e-9);
      expect(Math.abs(Math.log(rate / previous))).toBeLessThan(0.25);
      previous = rate;
    }
    for (let hours = 1; hours <= 96; hours += 1) {
      const rate = pacedRate(pacing, T0 + 42 * DAY + hours * 3_600_000);
      expect(rate).toBeGreaterThanOrEqual(previous - 1e-9);
      expect(Math.abs(Math.log(rate / previous))).toBeLessThan(0.25);
      previous = rate;
    }
  });

  it("lays spans over the base speed, the slower speed winning where an event rule meets a span", () => {
    const definition = definitionOf(new Scene().addBody(earth).addEvents([{ id: "a", label: "Flyby", time: at(10), type: "flyby" }])
      .setTimeline({ start: at(0), end: at(100), rate: 1_000, pacing: [{ start: at(50), end: at(70), rate: 10_000, rampSeconds: 0 }, { near: { type: "flyby", withinSeconds: 86.4 }, rate: 5 }, { start: at(9), end: at(11), rate: 200_000 }] }));
    const pacing = definition.pacing!;
    expect(pacedRate(pacing, T0 + 5 * DAY)).toBeCloseTo(1_000, 6);
    expect(pacedRate(pacing, T0 + 60 * DAY)).toBeCloseTo(10_000, 6);
    expect(pacedRate(pacing, T0 + 50 * DAY - 1)).toBeCloseTo(1_000, 6); // ramp 0: a step, by request
    expect(pacedRate(pacing, T0 + 9.5 * DAY)).toBeCloseTo(200_000, 6);
    expect(pacedRate(pacing, T0 + 10 * DAY)).toBeCloseTo(5, 6); // the event rule is slower than the span, so it wins at the event
  });

  const slowestWins = (pacing: object[], eventDay: number) => {
    const definition = definitionOf(new Scene().addBody(earth).addEvents([{ id: "a", label: "Flyby", time: at(eventDay), type: "flyby" }])
      .setTimeline({ start: at(0), end: at(100), rate: 86_400, pacing: pacing as never }));
    return definition.pacing!;
  };

  it("the slowest piece wins whatever contains what (I-112)", () => {
    const span = { start: at(40), end: at(60), rate: 10 };
    const fast = { near: { type: "flyby", withinSeconds: 86_400 }, rate: 1_000 };
    const slow = { near: { type: "flyby", withinSeconds: 86_400 }, rate: 10 };
    // A slow span with a faster event rule inside it: the span's rate holds at the event, in either listing order.
    expect(pacedRate(slowestWins([span, fast], 50), T0 + 50 * DAY)).toBeCloseTo(10, 6);
    expect(pacedRate(slowestWins([fast, span], 50), T0 + 50 * DAY)).toBeCloseTo(10, 6);
    // The reverse: a faster span with a slower event rule inside it.
    const fastSpan = { start: at(40), end: at(60), rate: 1_000 };
    expect(pacedRate(slowestWins([fastSpan, slow], 50), T0 + 50 * DAY)).toBeCloseTo(10, 6);
    expect(pacedRate(slowestWins([slow, fastSpan], 50), T0 + 50 * DAY)).toBeCloseTo(10, 6);
    // Two event rules on one event: the slower wins, in either order, and the rate stays continuous across the ramp.
    const a = pacedRate(slowestWins([fast, slow], 50), T0 + 50 * DAY);
    const b = pacedRate(slowestWins([slow, fast], 50), T0 + 50 * DAY);
    expect(a).toBeCloseTo(10, 6);
    expect(b).toBeCloseTo(10, 6);
    const pacing = slowestWins([fast, slow], 50);
    let previous = pacedRate(pacing, T0 + 45 * DAY);
    for (let hours = 1; hours <= 240; hours += 1) {
      const rate = pacedRate(pacing, T0 + 45 * DAY + hours * 3_600_000);
      expect(Math.abs(Math.log(rate / previous))).toBeLessThan(0.75);
      previous = rate;
    }
  });
});

describe("overlapping ramps take the slower speed (O-069 T-307, F-15)", () => {
  const HOUR = 3_600_000;
  const zone = (fromUtcMs: number, toUtcMs: number, rate: number, rampMs: number, eventId?: string) => ({ fromUtcMs, toUtcMs, rate, rampMs, eventId });
  const base = 86_400 * 30;
  const solo = (z: ReturnType<typeof zone>, t: number, shown?: ReadonlySet<string>) => pacedRate({ baseRate: base, zones: [z] }, t, shown);

  it("two pieces at 1,200x with 4 h and 1 h ramps give the slower of the two alone, not the product of eases (F-15)", () => {
    const a = zone(T0, T0 + HOUR, 1_200, 4 * HOUR);
    const b = zone(T0 + 6 * HOUR, T0 + 7 * HOUR, 1_200, HOUR);
    const t = T0 + 4.9 * HOUR;
    const slower = Math.min(solo(a, t), solo(b, t));
    expect(solo(a, t)).toBeGreaterThan(1_200);
    expect(solo(b, t)).toBeGreaterThan(solo(a, t)); // b's ramp is steeper, so a alone is the slower here
    expect(pacedRate({ baseRate: base, zones: [a, b] }, t)).toBeCloseTo(slower, 6);
    expect(pacedRate({ baseRate: base, zones: [b, a] }, t)).toBeCloseTo(slower, 6);
    // The old layering (b over a, in log space) gave a rate below both.
    const lw = (z: ReturnType<typeof zone>) => solo(z, t);
    expect(pacedRate({ baseRate: base, zones: [a, b] }, t)).toBeGreaterThanOrEqual(Math.min(lw(a), lw(b)) * (1 - 1e-9));
  });

  it("nested, touching and unordered zones: the minimum of each alone, continuous, exactly the base when untouched", () => {
    const outer = zone(T0, T0 + 10 * HOUR, 5_000, 3 * HOUR);
    const inner = zone(T0 + 4 * HOUR, T0 + 5 * HOUR, 100, 2 * HOUR);
    const touching = zone(T0 + 10 * HOUR, T0 + 12 * HOUR, 800, 3 * HOUR);
    const zones = [outer, inner, touching];
    let previous = pacedRate({ baseRate: base, zones }, T0 - 5 * HOUR);
    for (let minutes = -300; minutes <= 17 * 60; minutes += 1) {
      const t = T0 + minutes * 60_000;
      const touched = zones.filter((z) => t > z.fromUtcMs - z.rampMs && t < z.toUtcMs + z.rampMs);
      const expected = touched.length === 0 ? base : Math.min(...touched.map((z) => solo(z, t)));
      const got = pacedRate({ baseRate: base, zones }, t);
      expect(got).toBeCloseTo(expected, 6);
      expect(pacedRate({ baseRate: base, zones: [...zones].reverse() }, t)).toBeCloseTo(got, 6);
      expect(Math.abs(Math.log(got / previous))).toBeLessThan(0.3);
      previous = got;
    }
    expect(pacedRate({ baseRate: base, zones }, T0 - 4 * DAY)).toBe(base);
    expect(pacedRate({ baseRate: base, zones }, T0 + 5 * HOUR - 1)).toBeCloseTo(100, 0);
  });

  it("a view that does not show an event ignores its zone, ramp included", () => {
    const a = zone(T0, T0 + HOUR, 1_200, 4 * HOUR, "a");
    const b = zone(T0 + 6 * HOUR, T0 + 7 * HOUR, 1_200, HOUR, "b");
    const t = T0 + 4.9 * HOUR;
    expect(pacedRate({ baseRate: base, zones: [a, b] }, t, new Set(["b"]))).toBeCloseTo(solo(b, t), 6);
    expect(pacedRate({ baseRate: base, zones: [a, b] }, t, new Set(["a"]))).toBeCloseTo(solo(a, t), 6);
    expect(pacedRate({ baseRate: base, zones: [a, b] }, t, new Set())).toBe(base);
  });
});

describe("pacing checks (bad-timeline names the field)", () => {
  const timeline = (pacing: unknown) => () => definitionOf(new Scene().addBody(earth).addEvents([{ id: "a", label: "A", time: at(1), type: "flyby" }]).setTimeline({ start: at(0), end: at(10), pacing } as never));
  it("refuses a bad rate, ramp, within, span or shape", () => {
    expect(codeOf(timeline([{ start: at(1), end: at(2), rate: 0 }]))).toMatch(/^bad-timeline: .*pacing\[0\]\.rate/);
    expect(codeOf(timeline([{ start: at(1), end: at(2), rate: 5, rampSeconds: -1 }]))).toMatch(/^bad-timeline: .*pacing\[0\]\.rampSeconds/);
    expect(codeOf(timeline([{ near: { type: "flyby", withinSeconds: 0 }, rate: 5 }]))).toMatch(/^bad-timeline: .*pacing\[0\]\.near\.withinSeconds/);
    expect(codeOf(timeline([{ near: { type: "", withinSeconds: 5 }, rate: 5 }]))).toMatch(/^bad-timeline: .*pacing\[0\]\.near\.type/);
    expect(codeOf(timeline([{ start: at(3), end: at(2), rate: 5 }]))).toMatch(/^bad-timeline: .*pacing\[0\]\.end/);
    expect(codeOf(timeline([{ rate: 5 }]))).toMatch(/^bad-timeline: .*pacing\[0\]/);
    expect(codeOf(timeline("fast"))).toMatch(/^bad-timeline: setTimeline: pacing must be a list/);
  });
  it("refuses overlapping spans (touching is fine) and an event type with no events", () => {
    expect(codeOf(timeline([{ start: at(1), end: at(4), rate: 5 }, { start: at(3), end: at(6), rate: 9 }]))).toMatch(/^bad-timeline: .*pacing\[1\] overlaps pacing\[0\]/);
    expect(codeOf(timeline([{ start: at(1), end: at(3), rate: 5 }, { start: at(3), end: at(6), rate: 9 }]))).toBeUndefined();
    expect(codeOf(timeline([{ near: { type: "landing", withinSeconds: 5 }, rate: 5 }]))).toMatch(/^bad-timeline: .*pacing\[0\]\.near\.type "landing" matches no event/);
  });
});

describe("the clock following the paced rate", () => {
  it("steps through cruise, ramp and encounter as time advances, and loops back to cruise", () => {
    const pacing = pacingOf();
    let now = 0;
    const clock = new SimulationClock(T0 + 30 * DAY, () => now);
    clock.setRate(pacedRate(pacing, clock.now()));
    clock.play();
    const seen: number[] = [];
    for (let i = 0; i < 400; i += 1) { now += 100; applyPacing(clock, pacing); seen.push(clock.rate); }
    expect(seen[0]).toBeCloseTo(86_400, 0);
    expect(Math.min(...seen)).toBeLessThan(5_000); // slowed on the way into the first flyby
    expect(seen.every((rate) => rate >= 60 - 1e-9 && rate <= 86_400 + 1e-9)).toBe(true);
    clock.seek(T0 + 99 * DAY);
    applyPacing(clock, pacing);
    expect(clock.rate).toBeCloseTo(86_400, 6);
    clock.seek(T0); // a loop wrapping to the start returns to cruise at once
    applyPacing(clock, pacing);
    expect(clock.rate).toBeCloseTo(86_400, 6);
  });
});

describe("the event zones active at a time (O-052 T-226)", () => {
  const zones = pacingOf().zones;
  it("lists the events whose zone holds the time, edges included, and none between them", () => {
    expect(activeEventZones(zones, undefined, T0 + 10 * DAY)).toEqual([]);
    expect(activeEventZones(zones, undefined, T0 + 38 * DAY)).toEqual(["a"]);
    expect(activeEventZones(zones, undefined, T0 + 42 * DAY)).toEqual(["a"]);
    expect(activeEventZones(zones, undefined, T0 + 42 * DAY + 1)).toEqual([]);
    expect(activeEventZones(zones, undefined, T0 + 80 * DAY)).toEqual(["b"]);
  });
  it("counts only the showing view's events, and never a span", () => {
    expect(activeEventZones(zones, new Set(["b"]), T0 + 40 * DAY)).toEqual([]);
    expect(activeEventZones(zones, new Set(["a"]), T0 + 40 * DAY)).toEqual(["a"]);
    const withSpan = [{ fromUtcMs: T0, toUtcMs: T0 + 100 * DAY, rate: 1, rampMs: 0 }, ...zones];
    expect(activeEventZones(withSpan, undefined, T0 + 10 * DAY)).toEqual([]);
  });
  it("lists overlapping zones each once, and an event with two rules once", () => {
    const near = (eventId: string, from: number, to: number) => ({ fromUtcMs: T0 + from * DAY, toUtcMs: T0 + to * DAY, rate: 60, rampMs: 0, eventId });
    expect(activeEventZones([near("a", 0, 10), near("b", 5, 15), near("a", 2, 8)], undefined, T0 + 6 * DAY)).toEqual(["a", "b"]);
  });
});
