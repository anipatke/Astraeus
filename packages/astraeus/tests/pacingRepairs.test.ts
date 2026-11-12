// O-069 repairs of C-171: spans set the cruise and an event rule eases down from it (I-170); a view-switch ease still steps through every zone (I-171). Made-up journeys (ARCH-03).
import { describe, expect, it } from "vitest";
import { SimulationClock } from "../src/core/clock";
import { frameTime } from "../src/app/sceneFrame";
import type { SceneRuntime } from "../src/app/AstraeusScene";
import { ViewerZones } from "../src/api/viewerZones";
import type { EventZoneChange } from "../src/api/viewerLink";
import type { ViewerState } from "../src/app/viewerPort";
import { PACE_EASE_MS, activeEventZones, pacedAdvance, pacedRate, stepPacing, type PaceView, type PaceZone, type Pacing } from "../src/core/pacing";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const T0 = Date.UTC(2030, 0, 1);

describe("I-170: spans set the cruise, an event rule eases down from it", () => {
  const span: PaceZone = { fromUtcMs: T0, toUtcMs: T0 + 100 * DAY, rate: 2_592_000, rampMs: 10 * DAY };
  const rule: PaceZone = { fromUtcMs: T0 + 50 * DAY - 1.5 * HOUR, toUtcMs: T0 + 50 * DAY + 1.5 * HOUR, rate: 1_200, rampMs: 4 * HOUR, eventId: "e" };
  const touching: PaceZone = { fromUtcMs: T0 + 90 * DAY, toUtcMs: T0 + 90 * DAY + HOUR, rate: 500, rampMs: 4 * HOUR, eventId: "t" }; // its ramp starts inside the span's body, its far side in the span's ramp
  const slowOnly: PaceZone = { fromUtcMs: T0 + 300 * DAY, toUtcMs: T0 + 301 * DAY, rate: 10, rampMs: 2 * HOUR, eventId: "s" };
  const pacing = (zones: PaceZone[]): Pacing => ({ baseRate: 86_400, zones });

  it("is continuous across every ramp edge: a small time step moves the log rate only a little", () => {
    const p = pacing([span, rule, touching]);
    let worst = 0;
    // fine steps over the rule (its ramps and edges), the touching rule, and the span's two ramps
    for (const [from, to, step] of [[T0 + 50 * DAY - 6 * HOUR, T0 + 50 * DAY + 6 * HOUR, 1_000], [T0 + 90 * DAY - 6 * HOUR, T0 + 90 * DAY + 6 * HOUR, 1_000], [T0 - 11 * DAY, T0 + 1 * DAY, 60_000], [T0 + 99 * DAY, T0 + 111 * DAY, 60_000]] as const) {
      let previous = pacedRate(p, from);
      for (let t = from + step; t <= to; t += step) {
        const rate = pacedRate(p, t);
        worst = Math.max(worst, Math.abs(Math.log(rate / previous)));
        previous = rate;
      }
    }
    expect(worst).toBeLessThan(0.01);
    // the case C-171 probed: the cruise to 1 ms either side of the rule's outer ramp edge
    const edge = rule.fromUtcMs - rule.rampMs;
    expect(Math.abs(Math.log(pacedRate(p, edge + 1) / pacedRate(p, edge - 1)))).toBeLessThan(1e-6);
    expect(pacedRate(p, edge - 1)).toBeCloseTo(span.rate, 0);
    expect(pacedRate(p, rule.fromUtcMs)).toBeCloseTo(1_200, 6);
  });

  it("does not depend on the order the zones are listed in", () => {
    const zones = [span, rule, touching, slowOnly];
    const reversed = pacing([...zones].reverse());
    const forward = pacing(zones);
    for (let t = T0 - 12 * DAY; t < T0 + 320 * DAY; t += 7 * HOUR + 123) expect(pacedRate(reversed, t)).toBe(pacedRate(forward, t));
  });

  it("is still the slower of two event rules where their ramps meet (no span)", () => {
    const a: PaceZone = { fromUtcMs: 0, toUtcMs: DAY, rate: 100, rampMs: 6 * HOUR, eventId: "a" };
    const b: PaceZone = { fromUtcMs: DAY + 8 * HOUR, toUtcMs: 2 * DAY, rate: 400, rampMs: 6 * HOUR, eventId: "b" };
    const both = pacing([a, b]);
    for (let t = DAY; t <= DAY + 8 * HOUR; t += 15 * 60_000) {
      expect(pacedRate(both, t)).toBeCloseTo(Math.min(pacedRate(pacing([a]), t), pacedRate(pacing([b]), t)), 9);
    }
  });

  it("is exactly the base where nothing touches, and a rule faster than the cruise changes nothing", () => {
    const p = pacing([span, rule]);
    expect(pacedRate(p, T0 + 200 * DAY)).toBe(86_400);
    expect(pacedRate(p, T0 - 20 * DAY)).toBe(86_400);
    const fast: PaceZone = { fromUtcMs: T0 + 20 * DAY, toUtcMs: T0 + 21 * DAY, rate: 99_999_999, rampMs: DAY, eventId: "f" };
    for (let t = T0 + 18 * DAY; t < T0 + 23 * DAY; t += 3 * HOUR) expect(pacedRate(pacing([span, fast]), t)).toBe(pacedRate(pacing([span]), t));
  });
});

describe("I-171: a view-switch ease still steps through every zone", () => {
  const CRUISE = 26 * DAY / 1000;
  const centre = T0 + 3 * DAY;
  const zone: PaceZone = { fromUtcMs: centre - 1.5 * HOUR, toUtcMs: centre + 1.5 * HOUR, rate: 1_200, rampMs: 4 * HOUR, eventId: "z" };
  const pacing: Pacing = { baseRate: CRUISE, zones: [zone] };

  function run(frameMs: number, offsetHours: number, easeFrom: number | undefined) {
    let monotonic = 0;
    const clock = new SimulationClock(zone.fromUtcMs - offsetHours * HOUR, () => monotonic);
    const view: PaceView = {};
    clock.setRate(pacedRate(pacing, clock.now()));
    clock.play();
    stepPacing(clock, pacing, view, monotonic);
    if (easeFrom !== undefined) view.ease = { fromRate: easeFrom, startMs: monotonic };
    let entered = false;
    for (let frames = 0; frames < 2_000 && clock.now() < zone.toUtcMs + HOUR; frames += 1) {
      monotonic += frameMs;
      stepPacing(clock, pacing, view, monotonic);
      if (activeEventZones([zone], undefined, clock.now()).length > 0) entered = true;
    }
    return entered;
  }

  it("enters the zone at 16 ms to 1,000 ms frames, whatever the start offset, with an ease from any rate running from the first frame", () => {
    const bad: string[] = [];
    for (const frameMs of [16, 100, 250, 1_000]) {
      for (let offset = 12; offset <= 40; offset += 4) {
        expect(run(frameMs, offset, undefined), `no ease ${frameMs} ms +${offset} h`).toBe(true);
        for (const from of [5, 1_000, CRUISE, CRUISE / 2, CRUISE / 4, CRUISE * 1.01, CRUISE * 4]) if (!run(frameMs, offset, from)) bad.push(`${frameMs}/${offset}/${from}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("integrates the eased rate: the advance over the ease is the area under the log-space blend", () => {
    const from = 5; // the paced rate away from zones is CRUISE
    const t0 = zone.fromUtcMs - 40 * DAY;
    const eased = (ms: number) => Math.exp(Math.log(from) + (Math.log(CRUISE) - Math.log(from)) * ((ms / PACE_EASE_MS) ** 2 * (3 - 2 * (ms / PACE_EASE_MS))));
    let expected = 0;
    for (let ms = 0; ms < PACE_EASE_MS; ms += 0.05) expected += eased(ms + 0.025) * 0.05;
    const moved = pacedAdvance(pacing, t0, PACE_EASE_MS, undefined, 1, { k0: Math.log(from) - Math.log(CRUISE), elapsedMs: 0 }) - t0;
    expect(Math.abs(moved - expected)).toBeLessThan(expected * 0.01);
    // one rate per frame (the old fallback) would have been far off for a frame this long
    expect(Math.abs(moved - from * PACE_EASE_MS)).toBeGreaterThan(expected * 0.2);
  });

  it("reports the zone with cause playback when entered during an ease from a cruise-scale rate", () => {
    for (const frameMs of [16, 250, 1_000]) {
      let monotonic = 0;
      const clock = new SimulationClock(zone.fromUtcMs - 20 * HOUR, () => monotonic);
      const view: PaceView = {};
      clock.setRate(CRUISE);
      clock.play();
      stepPacing(clock, pacing, view, monotonic);
      view.ease = { fromRate: CRUISE * 1.01, startMs: monotonic };
      const link = new ViewerZones({ control: () => ({ events: [{ id: "z" }] }) } as never);
      const heard: string[] = [];
      link.onEventZone((change: EventZoneChange) => heard.push(`${change.entered ? "enter" : "leave"} ${change.event} ${change.cause}`));
      const runtime = { clock, pacing } as SceneRuntime;
      for (let frame = 0; frame < 2_000 && clock.now() < zone.toUtcMs + HOUR; frame += 1) {
        monotonic += frameMs;
        const t = frameTime(runtime, { paceAuto: true, pace: view }, monotonic);
        link.publish({ timeUtcMs: t, zones: activeEventZones([zone], undefined, t) } as ViewerState, "playback");
      }
      expect(heard, `${frameMs} ms`).toEqual(["enter z playback", "leave z playback"]);
    }
  });
});
