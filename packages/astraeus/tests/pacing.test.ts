// Paced playback (O-047 T-201, I-112): the rate as a pure function of time over a made-up journey with made-up events, its checks, and the clock following it.
import { describe, expect, it } from "vitest";
import { Scene, SceneError, earth } from "astraeus";
import { SimulationClock } from "../src/core/clock";
import { applyPacing, pacedRate } from "../src/core/pacing";

const DAY = 86_400_000;
const T0 = Date.UTC(2030, 0, 1);
const at = (days: number) => new Date(T0 + days * DAY).toISOString();
const codeOf = (run: () => unknown): string | undefined => { try { run(); } catch (error) { return error instanceof SceneError ? `${error.code}: ${error.message}` : String(error); } return undefined; };

// A made-up journey: 100 days at 1 day/s cruise, a flyby on day 40 and another on day 80 (made-up type "flyby"), each slowed to 60x within 2 days, easing over 2 days.
const journey = () => new Scene().addBody(earth)
  .addEvents([{ id: "a", label: "First flyby", time: at(40), type: "flyby" }, { id: "b", label: "Second flyby", time: at(80), type: "flyby" }])
  .setTimeline({ start: at(0), end: at(100), rate: 86_400, rates: [60, 3_600, 86_400], pacing: [{ near: { type: "flyby", within: 2 * 86_400 }, rate: 60 }] });
const pacingOf = () => journey().toDefinition().pacing!;

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
    const definition = new Scene().addBody(earth).addEvents([{ id: "a", label: "Flyby", time: at(10), type: "flyby" }])
      .setTimeline({ start: at(0), end: at(100), rate: 1_000, pacing: [{ from: at(50), to: at(70), rate: 10_000, ramp: 0 }, { near: { type: "flyby", within: 86.4 }, rate: 5 }, { from: at(9), to: at(11), rate: 200_000 }] }).toDefinition();
    const pacing = definition.pacing!;
    expect(pacedRate(pacing, T0 + 5 * DAY)).toBeCloseTo(1_000, 6);
    expect(pacedRate(pacing, T0 + 60 * DAY)).toBeCloseTo(10_000, 6);
    expect(pacedRate(pacing, T0 + 50 * DAY - 1)).toBeCloseTo(1_000, 6); // ramp 0: a step, by request
    expect(pacedRate(pacing, T0 + 9.5 * DAY)).toBeCloseTo(200_000, 6);
    expect(pacedRate(pacing, T0 + 10 * DAY)).toBeCloseTo(5, 6); // the event rule is slower than the span, so it wins at the event
  });

  const slowestWins = (pacing: object[], eventDay: number) => {
    const definition = new Scene().addBody(earth).addEvents([{ id: "a", label: "Flyby", time: at(eventDay), type: "flyby" }])
      .setTimeline({ start: at(0), end: at(100), rate: 86_400, pacing: pacing as never }).toDefinition();
    return definition.pacing!;
  };

  it("the slowest piece wins whatever contains what (I-112)", () => {
    const span = { from: at(40), to: at(60), rate: 10 };
    const fast = { near: { type: "flyby", within: 86_400 }, rate: 1_000 };
    const slow = { near: { type: "flyby", within: 86_400 }, rate: 10 };
    // A slow span with a faster event rule inside it: the span's rate holds at the event, in either listing order.
    expect(pacedRate(slowestWins([span, fast], 50), T0 + 50 * DAY)).toBeCloseTo(10, 6);
    expect(pacedRate(slowestWins([fast, span], 50), T0 + 50 * DAY)).toBeCloseTo(10, 6);
    // The reverse: a faster span with a slower event rule inside it.
    const fastSpan = { from: at(40), to: at(60), rate: 1_000 };
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

describe("pacing checks (bad-timeline names the field)", () => {
  const timeline = (pacing: unknown) => () => new Scene().addBody(earth).addEvents([{ id: "a", label: "A", time: at(1), type: "flyby" }]).setTimeline({ start: at(0), end: at(10), pacing } as never).toDefinition();
  it("refuses a bad rate, ramp, within, span or shape", () => {
    expect(codeOf(timeline([{ from: at(1), to: at(2), rate: 0 }]))).toMatch(/^bad-timeline: .*pacing\[0\]\.rate/);
    expect(codeOf(timeline([{ from: at(1), to: at(2), rate: 5, ramp: -1 }]))).toMatch(/^bad-timeline: .*pacing\[0\]\.ramp/);
    expect(codeOf(timeline([{ near: { type: "flyby", within: 0 }, rate: 5 }]))).toMatch(/^bad-timeline: .*pacing\[0\]\.near\.within/);
    expect(codeOf(timeline([{ near: { type: "", within: 5 }, rate: 5 }]))).toMatch(/^bad-timeline: .*pacing\[0\]\.near\.type/);
    expect(codeOf(timeline([{ from: at(3), to: at(2), rate: 5 }]))).toMatch(/^bad-timeline: .*pacing\[0\]\.to/);
    expect(codeOf(timeline([{ rate: 5 }]))).toMatch(/^bad-timeline: .*pacing\[0\]/);
    expect(codeOf(timeline("fast"))).toMatch(/^bad-timeline: setTimeline: pacing must be a list/);
  });
  it("refuses overlapping spans (touching is fine) and an event type with no events", () => {
    expect(codeOf(timeline([{ from: at(1), to: at(4), rate: 5 }, { from: at(3), to: at(6), rate: 9 }]))).toMatch(/^bad-timeline: .*pacing\[1\] overlaps pacing\[0\]/);
    expect(codeOf(timeline([{ from: at(1), to: at(3), rate: 5 }, { from: at(3), to: at(6), rate: 9 }]))).toBeUndefined();
    expect(codeOf(timeline([{ near: { type: "landing", within: 5 }, rate: 5 }]))).toMatch(/^bad-timeline: .*pacing\[0\]\.near\.type "landing" matches no event/);
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
