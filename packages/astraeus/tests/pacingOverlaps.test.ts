// O-069 I-172: how pieces combine in `pacedRate`. Faster spans set the cruise (the faster wins where they meet); slower spans and event rules ease down from it (the slowest wins where they meet). Made-up zones (ARCH-03).
import { describe, expect, it } from "vitest";
import { pacedRate, type PaceZone } from "../src/core/pacing";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const T0 = Date.UTC(2030, 0, 1);
const base = 86_400 * 30;
const span = (from: number, to: number, rate: number, ramp: number): PaceZone => ({ fromUtcMs: T0 + from * HOUR, toUtcMs: T0 + to * HOUR, rate, rampMs: ramp * HOUR });
const rule = (from: number, to: number, rate: number, ramp: number, eventId: string): PaceZone => ({ ...span(from, to, rate, ramp), eventId });
const alone = (zone: PaceZone, t: number): number => pacedRate({ baseRate: base, zones: [zone] }, t);
const at = (zones: readonly PaceZone[], t: number): number => pacedRate({ baseRate: base, zones }, T0 + t * HOUR);
/** The smoothstep weight of a point `distance` hours outside a zone whose ramp is `ramp` hours. */
const weight = (distance: number, ramp: number): number => { const x = 1 - distance / ramp; return x * x * (3 - 2 * x); };
/** The log-space blend of `from` toward `to` by `w`. */
const blend = (from: number, to: number, w: number): number => Math.exp(Math.log(from) + (Math.log(to) - Math.log(from)) * w);
const shuffled = <T,>(list: readonly T[]): T[] => list.map((item, index) => ({ item, key: Math.sin(index * 12.9898 + 4.1) })).sort((a, b) => a.key - b.key).map((entry) => entry.item);

interface Case {
  readonly name: string;
  readonly zones: readonly PaceZone[];
  /** Named probe times (hours from T0) and the rate the rule gives there. */
  readonly probes: readonly (readonly [number, number])[];
  /** Hours from T0 over which the rate must be continuous. */
  readonly sweep: readonly [number, number];
}

const fast = span(0, 10, 5_000_000, 3);
const fastNext = span(10, 12, 20_000_000, 3);
const slow = span(0, 10, 5_000, 3);
const slowNext = span(10, 12, 800, 3);
const cases: readonly Case[] = [
  { name: "a fast span alone", zones: [fast], probes: [[5, 5_000_000], [11.5, blend(base, 5_000_000, weight(1.5, 3))]], sweep: [-4, 14] },
  { name: "a slow span alone", zones: [slow], probes: [[5, 5_000], [11.5, blend(base, 5_000, weight(1.5, 3))]], sweep: [-4, 14] },
  { name: "an event rule alone", zones: [rule(0, 10, 5_000, 3, "r")], probes: [[5, 5_000], [-1, blend(base, 5_000, weight(1, 3))]], sweep: [-4, 14] },
  // each alone at +9 h: the first 5,000x, the second about 6,500x (the larger of the two for fast spans)
  { name: "two fast spans meeting", zones: [fast, fastNext], probes: [[5, 5_000_000], [11, 20_000_000], [9, Math.max(alone(fast, T0 + 9 * HOUR), alone(fastNext, T0 + 9 * HOUR))]], sweep: [-4, 16] },
  { name: "two slow spans meeting (the T-307 example)", zones: [slow, slowNext], probes: [[5, 5_000], [11, 800], [9, 5_000]], sweep: [-4, 16] },
  { name: "two slow spans whose ramps meet across a gap", zones: [span(0, 10, 1_000, 20), span(40, 50, 100, 20)], probes: [[25, Math.min(blend(base, 1_000, weight(15, 20)), blend(base, 100, weight(15, 20)))], [15, blend(base, 1_000, weight(5, 20))], [5, 1_000]], sweep: [-22, 72] },
  { name: "a fast span and a slow span meeting", zones: [fast, slowNext], probes: [[5, 5_000_000], [11, 800], [9, blend(5_000_000, 800, weight(1, 3))]], sweep: [-4, 16] },
  { name: "a rule inside a fast span eases from the span's speed", zones: [fast, rule(4, 5, 1_200, 2, "r")], probes: [[4.5, 1_200], [2, 5_000_000], [3, blend(5_000_000, 1_200, weight(1, 2))]], sweep: [-4, 14] },
  { name: "a rule touching a fast span", zones: [fast, rule(10, 11, 1_200, 4, "r")], probes: [[10.5, 1_200], [5, 5_000_000], [9, blend(5_000_000, 1_200, weight(1, 4))]], sweep: [-4, 18] },
  { name: "a rule straddling a fast span's edge", zones: [fast, rule(9, 11, 1_200, 3, "r")], probes: [[10, 1_200], [5, 5_000_000], [7.5, blend(5_000_000, 1_200, weight(1.5, 3))]], sweep: [-4, 16] },
  { name: "a rule inside a slow span", zones: [slow, rule(4, 5, 100, 2, "r")], probes: [[4.5, 100], [2, 5_000], [3, Math.min(5_000, blend(base, 100, weight(1, 2)))]], sweep: [-4, 14] },
  { name: "a rule faster than the slow span it sits in changes nothing", zones: [slow, rule(4, 5, 20_000, 2, "r")], probes: [[4.5, 5_000], [3, 5_000]], sweep: [-4, 14] },
  { name: "two rules meeting (F-15)", zones: [rule(0, 1, 1_200, 4, "a"), rule(6, 7, 1_200, 1, "b")], probes: [[4.9, Math.min(alone(rule(0, 1, 1_200, 4, "a"), T0 + 4.9 * HOUR), alone(rule(6, 7, 1_200, 1, "b"), T0 + 4.9 * HOUR))], [0.5, 1_200], [6.5, 1_200]], sweep: [-6, 12] },
];

describe("pacedRate over every way pieces meet (I-172)", () => {
  for (const { name, zones, probes, sweep } of cases) {
    it(`${name}: the rule's value at each probe, continuous across every ramp edge, independent of order, the base where untouched`, () => {
      for (const [hours, expected] of probes) expect(at(zones, hours)).toBeCloseTo(expected, 4);
      const orders = [zones, [...zones].reverse(), shuffled(zones)];
      let worst = 0;
      let previous = at(zones, sweep[0]);
      for (let t = sweep[0] * HOUR + 1; t <= sweep[1] * HOUR; t += 1_000) {
        const rate = pacedRate({ baseRate: base, zones }, T0 + t);
        worst = Math.max(worst, Math.abs(Math.log(rate / previous)));
        previous = rate;
        if (t % 60_000 < 1_000) for (const order of orders) expect(pacedRate({ baseRate: base, zones: order }, T0 + t)).toBeCloseTo(rate, 6);
      }
      expect(worst).toBeLessThan(0.01); // per second; a jump anywhere would be far larger
      // 1 ms either side of every ramp edge
      for (const zone of zones) for (const edge of [zone.fromUtcMs - zone.rampMs, zone.fromUtcMs, zone.toUtcMs, zone.toUtcMs + zone.rampMs]) {
        expect(Math.abs(Math.log(pacedRate({ baseRate: base, zones }, edge + 1) / pacedRate({ baseRate: base, zones }, edge - 1)))).toBeLessThan(1e-4);
      }
      expect(pacedRate({ baseRate: base, zones }, T0 - 5 * DAY)).toBe(base);
      expect(pacedRate({ baseRate: base, zones }, T0 + 5 * DAY)).toBe(base);
    });
  }
});
