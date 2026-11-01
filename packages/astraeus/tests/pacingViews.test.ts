// Pacing follows views (O-052 T-224): event zones carry their event id and only the showing view's events pace the clock; spans apply in every view.
// Made-up two-probe scene (ARCH-03): event "ea" belongs to view A, "eb" to view B, "es" to no view (so to every view).
import { describe, expect, it } from "vitest";
import { Scene, SceneError, earth, type PacingInput } from "astraeus";
import { SimulationClock } from "../src/core/clock";
import { PACE_EASE_MS, applyPacing, pacedRate, startPaceEase, zoneInView, zonesInView, type PaceView } from "../src/core/pacing";

const DAY = 86_400_000;
const T0 = Date.UTC(2030, 0, 1);
const at = (days: number) => new Date(T0 + days * DAY).toISOString();
const samples = (x: number) => [0, 1].map((i) => ({ time: T0 + i * 100 * DAY, positionKm: [x + i, 0, 0], velocityKmS: [1, 0, 0] }));
const scene = (pacing: PacingInput[]) => new Scene().addBody(earth)
  .addTrajectory({ id: "pa", label: "Probe A", center: "earth", samples: samples(10_000) })
  .addTrajectory({ id: "pb", label: "Probe B", center: "earth", samples: samples(20_000) })
  .addEvents([{ id: "ea", label: "A flyby", time: at(20), type: "flyby" }, { id: "eb", label: "B flyby", time: at(50), type: "flyby" }, { id: "es", label: "Shared", time: at(80), type: "flyby" }])
  .setViews([{ id: "a", label: "A", paths: ["pa"], events: ["ea"] }, { id: "b", label: "B", paths: ["pb"], events: ["eb"] }, { id: "both", label: "Both", paths: ["pa", "pb"], events: ["ea", "eb"] }], { place: "top-bar" })
  .setTimeline({ start: at(0), end: at(100), rate: 86_400, rates: [60, 86_400], pacing });
const FLYBY = [{ near: { type: "flyby", within: 86_400 }, rate: 60 }];
const definition = () => scene(FLYBY).toDefinition();
const eventsOf = (id: string) => definition().views!.views.find((view) => view.id === id)!.events;
const rate = (view: string, day: number) => pacedRate(definition().pacing!, T0 + day * DAY, eventsOf(view));

describe("pacing zones carry their event", () => {
  it("tags each event rule's zone with the event it came from and leaves spans untagged", () => {
    const zones = scene([...FLYBY, { from: at(60), to: at(70), rate: 1_000 }]).toDefinition().pacing!.zones;
    expect(zones.filter((zone) => zone.eventId !== undefined).map((zone) => zone.eventId).sort()).toEqual(["ea", "eb", "es"]);
    expect(zones.filter((zone) => zone.eventId === undefined)).toHaveLength(1);
  });
  it("zoneInView / zonesInView keep spans and the zones of shown events; no set keeps every zone", () => {
    const zones = definition().pacing!.zones;
    const shown = new Set(["ea"]);
    expect(zonesInView(zones, shown).map((zone) => zone.eventId)).toEqual(["ea"]);
    expect(zonesInView(zones, undefined)).toBe(zones);
    expect(zoneInView({ fromUtcMs: 0, toUtcMs: 1, rate: 5, rampMs: 0 }, new Set())).toBe(true);
  });
});

describe("a two-probe scene paces by the showing view", () => {
  it("view A slows at A's event and the shared one only", () => {
    expect(rate("a", 20)).toBeCloseTo(60, 6);
    expect(rate("a", 50)).toBeCloseTo(86_400, 6);
    expect(rate("a", 80)).toBeCloseTo(60, 6);
  });
  it("view B slows at B's event and the shared one only", () => {
    expect(rate("b", 20)).toBeCloseTo(86_400, 6);
    expect(rate("b", 50)).toBeCloseTo(60, 6);
    expect(rate("b", 80)).toBeCloseTo(60, 6);
  });
  it("Both slows at every event", () => {
    for (const day of [20, 50, 80]) expect(rate("both", day)).toBeCloseTo(60, 6);
  });
  it("a span applies in every view", () => {
    const pacing = scene([...FLYBY, { from: at(30), to: at(40), rate: 1_000, ramp: 0 }]).toDefinition().pacing!;
    for (const view of ["a", "b", "both"]) expect(pacedRate(pacing, T0 + 35 * DAY, eventsOf(view))).toBeCloseTo(1_000, 6);
  });
  it("a scene without views (no event set) gives the 0.7.0 rates: every zone applies", () => {
    const pacing = definition().pacing!;
    for (const day of [20, 50, 80]) expect(pacedRate(pacing, T0 + day * DAY)).toBeCloseTo(60, 6);
    expect(pacedRate(pacing, T0 + 5 * DAY)).toBeCloseTo(86_400, 6);
  });
});

describe("the switch ease", () => {
  const clockAt = (day: number, from: number) => { const clock = new SimulationClock(T0 + day * DAY); clock.setRate(from); return clock; };
  it("blends in log space from the old rate to the paced one over about a second, then clears", () => {
    const pacing = definition().pacing!;
    const view: PaceView = { shown: eventsOf("b") }; // day 20 is not paced in B: target 86 400
    const clock = clockAt(20, 60);
    startPaceEase(view, 60, 5_000);
    applyPacing(clock, pacing, view, 5_000);
    expect(clock.rate).toBeCloseTo(60, 6);
    applyPacing(clock, pacing, view, 5_000 + PACE_EASE_MS / 2);
    expect(clock.rate).toBeCloseTo(Math.sqrt(60 * 86_400), 3); // smoothstep(0.5) = 0.5: the log-space midpoint
    applyPacing(clock, pacing, view, 5_000 + PACE_EASE_MS);
    expect(clock.rate).toBeCloseTo(86_400, 6);
    expect(view.ease).toBeUndefined();
  });
  it("without an ease the paced rate lands at once (a seek, or a scene without a switch)", () => {
    const clock = clockAt(20, 86_400);
    applyPacing(clock, definition().pacing!, { shown: eventsOf("a") });
    expect(clock.rate).toBeCloseTo(60, 6);
  });
});

describe("loading", () => {
  it("a near rule whose events belong to different views still loads", () => {
    expect(() => scene([{ near: { type: "flyby", within: 86_400 }, rate: 60 }]).toDefinition()).not.toThrow();
  });
  it("a near rule whose type matches no event still throws bad-timeline", () => {
    try { scene([{ near: { type: "nothing", within: 86_400 }, rate: 60 }]).toDefinition(); expect.unreachable(); } catch (error) { expect((error as SceneError).code).toBe("bad-timeline"); }
  });
});
