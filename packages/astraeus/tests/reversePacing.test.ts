// T-352 (O-083, AH-07): can a negative playback rate reach pacing? Yes: `setTimeline({ rate: -3600, pacing })` makes the base rate negative
// (api/story.ts timelineOf accepts it; api/planTimeline.ts:75 passes it as `baseRate`), the frame stage's first step applies pacing (app/sceneFrame.ts frameTime),
// and a view switch eases from `clock.rate` (App.tsx chooseView). Made-up scene (ARCH-03).
import { describe, expect, it } from "vitest";
import { Scene, earth } from "astraeus";
import { SimulationClock } from "../src/core/clock";
import { applyPacing, easeShift, pacedRate, startPaceEase, stepPacing, type PaceView } from "../src/presentation/pacing";
import { definitionOf } from "../src/api/definitionOf";

const DAY = 86_400_000;
const T0 = Date.UTC(2030, 0, 1);
const at = (days: number) => new Date(T0 + days * DAY).toISOString();
const samples = [0, 1].map((i) => ({ time: T0 + i * 100 * DAY, positionKm: [10_000 + i, 0, 0], velocityKmS: [1, 0, 0] }));
const scene = (rate: number) => new Scene().addBody(earth)
  .addTrajectory({ id: "pa", label: "Probe A", center: "earth", samples })
  .addEvents([{ id: "ea", label: "Flyby", time: at(50), type: "flyby" }])
  .setTimeline({ start: at(0), end: at(100), rate, rates: [60, 3600], pacing: [{ near: { type: "flyby", withinSeconds: 5 * 86_400 }, rate: 60 }] });
const pacingOf = (rate: number) => definitionOf(scene(rate)).pacing!;
const clockAt = (rate: number, day: number, mono: { now: number }) => { const clock = new SimulationClock(T0 + day * DAY, () => mono.now); clock.setRate(rate); clock.play(); return clock; };

describe("reverse playback and pacing (AH-07)", () => {
  it("the scene opens with a negative base rate that pacing receives", () => {
    expect(pacingOf(-3600).baseRate).toBe(-3600);
  });
  it("away from zones a negative base rate is the paced rate, sign kept", () => {
    expect(pacedRate(pacingOf(-3600), T0 + 10 * DAY)).toBe(-3600);
  });
  it("applyPacing at a negative rate never throws and keeps the clock running backward", () => {
    const mono = { now: 0 };
    const clock = clockAt(-3600, 10, mono);
    const view: PaceView = {};
    expect(() => applyPacing(clock, pacingOf(-3600), view, 0)).not.toThrow();
    expect(clock.rate).toBe(-3600);
  });
  it("a view-switch ease at a negative rate never throws and keeps the clock running backward", () => {
    const mono = { now: 0 };
    const clock = clockAt(-3600, 10, mono);
    const view: PaceView = {};
    startPaceEase(view, clock.rate, 0);
    expect(Number.isFinite(easeShift(view, clock.now(), pacingOf(-3600)))).toBe(true);
    expect(() => applyPacing(clock, pacingOf(-3600), view, 500)).not.toThrow();
    expect(clock.rate).toBeLessThan(0);
  });
  it("a backward step through a zone slows as the forward step does", () => {
    const run = (rate: number, startDay: number) => {
      const mono = { now: 0 };
      const clock = clockAt(rate, startDay, mono);
      const view: PaceView = {};
      const pacing = pacingOf(rate);
      stepPacing(clock, pacing, view, 0);
      let nowMs = 0;
      const times: number[] = [];
      for (let i = 0; i < 40; i += 1) { nowMs += 1000; mono.now = nowMs; stepPacing(clock, pacing, view, nowMs); times.push(clock.now()); }
      return times.map((time, i) => Math.abs(time - (i === 0 ? T0 + startDay * DAY : times[i - 1]!)));
    };
    const forward = run(3600, 47);
    const backward = run(-3600, 53);
    expect(Math.min(...forward)).toBeLessThan(3600 * 1000 * 0.5);
    expect(Math.min(...backward)).toBeLessThan(3600 * 1000 * 0.5);
    for (let i = 0; i < forward.length; i += 1) expect(Math.abs(backward[i]! - forward[i]!)).toBeLessThan(0.1 * forward[i]! + 5000);
  });
});
