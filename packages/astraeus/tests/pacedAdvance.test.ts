// Playback steps through every slow-down whatever the frame length (O-069 T-308): made-up six-year journey, ten event zones (ARCH-03, no story names).
import { describe, expect, it } from "vitest";
import { SimulationClock } from "../src/core/clock";
import { activeEventZones, MAX_PACE_STEPS, pacedAdvance, pacedRate, stepPacing, type PaceView, type Pacing } from "../src/core/pacing";
import { frameTime } from "../src/app/sceneFrame";
import type { SceneRuntime } from "../src/app/AstraeusScene";
import { ViewerZones } from "../src/api/viewerZones";
import type { EventZoneChange } from "../src/api/viewerLink";
import type { ViewerState } from "../src/app/viewerPort";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const START = Date.UTC(2030, 0, 1);
const END = START + 6 * 365 * DAY;
const CRUISE = 26 * DAY / 1000; // about 26 days per real second
const ZONE_RATE = 1_200;
const zones = Array.from({ length: 10 }, (_, i) => {
  const centre = START + (i + 1) * 200 * DAY;
  return { fromUtcMs: centre - 1.5 * HOUR, toUtcMs: centre + 1.5 * HOUR, rate: ZONE_RATE, rampMs: 4 * HOUR, eventId: `z${i}` };
});
const pacing: Pacing = { baseRate: CRUISE, zones };
const FRAMES = [16, 33, 100, 250, 1_000];

/** Runs `advance` frame by frame over the journey; returns the real time taken, the frame ends and what each zone saw. */
function runPass(frameMs: number, advance: (t: number, ms: number) => number) {
  let t = START;
  let real = 0;
  const seen = new Set<string>();
  const framesIn = new Map<string, number>();
  while (t < END && real < 600_000) {
    t = advance(t, frameMs);
    real += frameMs;
    for (const id of activeEventZones(zones, undefined, t)) { seen.add(id); framesIn.set(id, (framesIn.get(id) ?? 0) + 1); }
  }
  return { real, seen, framesIn };
}

describe("pacedAdvance", () => {
  const stepped = (t: number, ms: number) => pacedAdvance(pacing, t, ms);
  const reference = runPass(1, stepped);

  it("enters every zone at every frame length, and activeEventZones sees each at least once", () => {
    for (const frameMs of FRAMES) {
      const { seen } = runPass(frameMs, stepped);
      expect([...seen].sort()).toEqual(zones.map((zone) => zone.eventId).sort());
    }
  });

  it("spends about the same real time crossing each zone, and the whole journey, whatever the frame length", () => {
    // In-zone real time is 3 h / 1,200 = 9 s: the frames ending inside it count it to within two frames; the whole pass to within 1% and a frame.
    for (const frameMs of FRAMES) {
      const { real, framesIn } = runPass(frameMs, stepped);
      expect(Math.abs(real - reference.real)).toBeLessThanOrEqual(reference.real * 0.01 + frameMs);
      for (const zone of zones) expect(Math.abs((framesIn.get(zone.eventId) ?? 0) * frameMs - 9_000)).toBeLessThanOrEqual(2 * frameMs);
    }
  });

  it("regression: one rate per frame (the old advance) skips zones at these frame lengths", () => {
    const oneRate = (t: number, ms: number) => t + Math.round(pacedRate(pacing, t) * ms);
    for (const frameMs of FRAMES) {
      const { seen, real } = runPass(frameMs, oneRate);
      expect(seen.size < zones.length || Math.abs(real - reference.real) > reference.real * 0.01 + frameMs).toBe(true);
    }
    for (const frameMs of [100, 250, 1_000]) expect(runPass(frameMs, oneRate).seen.size).toBeLessThan(zones.length);
  });

  it("returns a whole millisecond, the same time when no real time passes, and the plain product away from every zone", () => {
    expect(pacedAdvance(pacing, START + 5, 0)).toBe(START + 5);
    expect(Number.isInteger(pacedAdvance(pacing, START + 1_234_567, 33.3))).toBe(true);
    expect(pacedAdvance(pacing, START, 500)).toBe(START + Math.round(CRUISE * 500));
  });

  it("runs backward at the same speeds, entering every zone on the way back", () => {
    let t = END;
    const seen = new Set<string>();
    for (let i = 0; i < 5_000 && t > START; i += 1) {
      t = pacedAdvance(pacing, t, 250, undefined, -1);
      for (const id of activeEventZones(zones, undefined, t)) seen.add(id);
    }
    expect(seen.size).toBe(zones.length);
    const there = pacedAdvance(pacing, zones[3]!.fromUtcMs - 12 * HOUR, 40_000);
    const back = pacedAdvance(pacing, there, 40_000, undefined, -1);
    expect(Math.abs(back - (zones[3]!.fromUtcMs - 12 * HOUR))).toBeLessThan(0.02 * DAY);
  });

  it("slows in the zone however long the frame, and a frame starting inside a zone does not leave it early", () => {
    const centre = zones[0]!.fromUtcMs + 1.5 * HOUR;
    expect(pacedAdvance(pacing, centre, 1_000)).toBeGreaterThan(centre);
    expect(pacedAdvance(pacing, centre, 1)).toBe(centre + ZONE_RATE);
    // Five real seconds at 1,200x is 1.67 h: past the 1.5 h half-width, into the ramp, so well short of what cruise would cover.
    expect(pacedAdvance(pacing, centre, 5_000) - centre).toBeLessThan(5_000 * 10 * ZONE_RATE);
  });

  it("honours the view filter: zones of events not shown do not slow it", () => {
    const shown = new Set(["z9"]);
    const t = zones[0]!.fromUtcMs - HOUR;
    expect(pacedAdvance(pacing, t, 1_000, shown)).toBe(t + Math.round(CRUISE * 1_000));
  });

  it("is bounded: a frame longer than the step budget drops the rest instead of looping or skipping", () => {
    const start = Date.now();
    const to = pacedAdvance(pacing, START, 10 * 365 * DAY);
    expect(Date.now() - start).toBeLessThan(2_000);
    expect(Number.isFinite(to) && to > START).toBe(true);
    expect(MAX_PACE_STEPS).toBeGreaterThan(0);
  });

  it("copes with a pacing without zones and with zero-width ramps", () => {
    expect(pacedAdvance({ baseRate: 10, zones: [] }, 1_000, 100)).toBe(2_000);
    const hard: Pacing = { baseRate: 1_000, zones: [{ fromUtcMs: 10_000, toUtcMs: 20_000, rate: 10, rampMs: 0, eventId: "h" }] };
    expect(pacedAdvance(hard, 0, 100)).toBe(10_000 + 10 * 90); // 10 s of sim at 1,000x is 10 ms real; the other 90 ms are inside at 10x
    expect(pacedAdvance(hard, 0, 110)).toBe(10_000 + 10 * 100); // 110 ms: 10 ms to the edge, 100 ms inside
  });
});

describe("the clock follows the steps (stepPacing, frameTime)", () => {
  function playing() {
    let monotonic = 0;
    const clock = new SimulationClock(START, () => monotonic);
    const view: PaceView = {};
    clock.setRate(pacedRate(pacing, START));
    clock.play();
    return { clock, view, tick: (ms: number) => { monotonic += ms; return monotonic; } };
  }

  it("moves a long frame through the slow-down it crosses, and reports each zone enter and leave with cause playback", () => {
    const { clock, view, tick } = playing();
    const state = { events: zones.map((zone) => ({ id: zone.eventId })) };
    const link = new ViewerZones({ control: () => state } as never);
    const heard: string[] = [];
    link.onEventZone((change: EventZoneChange) => heard.push(`${change.entered ? "enter" : "leave"} ${change.event} ${change.cause}`));
    const runtime = { clock, pacing } as SceneRuntime;
    for (let frame = 0; frame < 120 && clock.now() < zones[2]!.toUtcMs + 6 * HOUR; frame += 1) {
      const nowMs = tick(1_000);
      const t = frameTime(runtime, { paceAuto: true, pace: view }, nowMs);
      link.publish({ timeUtcMs: t, zones: activeEventZones(zones, undefined, t) } as ViewerState, "playback");
    }
    expect(heard).toEqual(["enter z0 playback", "leave z0 playback", "enter z1 playback", "leave z1 playback", "enter z2 playback", "leave z2 playback"]);
  });

  it("does not step through a seek, a pause or a changed rate: the move is the visitor's", () => {
    const { clock, view, tick } = playing();
    stepPacing(clock, pacing, view, tick(100));
    stepPacing(clock, pacing, view, tick(100));
    delete view.last; // what a seek does in App
    clock.seek(zones[4]!.fromUtcMs - 10 * DAY);
    const before = clock.now();
    stepPacing(clock, pacing, view, tick(100));
    expect(clock.now()).toBeGreaterThanOrEqual(before);
    expect(clock.now() - before).toBeLessThan(CRUISE * 100 * 1.01); // from the seek, not from before it
    clock.pause();
    stepPacing(clock, pacing, view, tick(100));
    expect(view.last).toBeUndefined();
    const paused = clock.now();
    tick(5_000);
    clock.play();
    stepPacing(clock, pacing, view, tick(100));
    expect(clock.now() - paused).toBeLessThan(CRUISE * 100 * 1.01); // the paused 5 s did not advance it
  });

  it("falls back to one rate for the frame while a view-switch ease runs", () => {
    const { clock, view, tick } = playing();
    stepPacing(clock, pacing, view, tick(16));
    view.ease = { fromRate: 5, startMs: 16 };
    const before = clock.now();
    stepPacing(clock, pacing, view, tick(16));
    expect(clock.now() - before).toBeLessThan(CRUISE * 16 * 1.01);
    expect(clock.rate).toBeLessThan(CRUISE);
  });
});
