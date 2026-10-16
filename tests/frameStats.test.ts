import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FrameStats, FRAME_BUDGET_MS, fpsTone, frameTone } from "../src/app/frameStats";
import { FrameRateSection, fpsAxisTop, fpsGraphPoints, fpsY } from "../src/app/FrameRateSection";

const feed = (stats: FrameStats, durations: readonly number[], start = 0): number => {
  let now = start;
  stats.tick(now);
  for (const d of durations) {
    now += d;
    stats.tick(now);
  }
  return now;
};

describe("FrameStats", () => {
  it("reports nothing for an empty window", () => {
    const stats = new FrameStats();
    expect(stats.snapshot()).toEqual({ frames: 0, fps: 0, longestMs: 0, overBudget: 0 });
    stats.tick(100);
    expect(stats.snapshot().frames).toBe(0);
  });

  it("reads steady 60 fps", () => {
    const stats = new FrameStats();
    feed(stats, Array(90).fill(1000 / 60));
    const s = stats.snapshot();
    expect(s.fps).toBeCloseTo(60, 0);
    expect(s.longestMs).toBeCloseTo(1000 / 60, 6);
    expect(s.overBudget).toBe(0);
  });

  it("shows one long frame as the longest and over budget", () => {
    const stats = new FrameStats();
    feed(stats, [...Array(30).fill(16), 120, ...Array(30).fill(16)]);
    const s = stats.snapshot();
    expect(s.longestMs).toBe(120);
    expect(s.overBudget).toBe(1);
    expect(120).toBeGreaterThan(FRAME_BUDGET_MS);
  });

  it("keeps only the newest frames when the window wraps", () => {
    const stats = new FrameStats(10);
    feed(stats, [200, ...Array(25).fill(10)]);
    const s = stats.snapshot();
    expect(s.frames).toBe(10);
    expect(s.longestMs).toBe(10);
    expect(s.fps).toBeCloseTo(100, 6);
  });

  it("does not count a long pause as a frame and restarts the window", () => {
    const stats = new FrameStats();
    const end = feed(stats, Array(20).fill(16));
    stats.tick(end + 30_000);
    expect(stats.snapshot().frames).toBe(0);
    stats.tick(end + 30_016);
    const s = stats.snapshot();
    expect(s.frames).toBe(1);
    expect(s.longestMs).toBe(16);
  });

  it("reset clears everything", () => {
    const stats = new FrameStats();
    feed(stats, Array(10).fill(16));
    stats.reset();
    expect(stats.snapshot().frames).toBe(0);
  });

  it("costs little per frame", () => {
    const stats = new FrameStats();
    const n = 200_000;
    const started = performance.now();
    for (let i = 0; i < n; i += 1) stats.tick(i * 16.6);
    const tickUs = ((performance.now() - started) / n) * 1000;
    const readStarted = performance.now();
    for (let i = 0; i < 2_000; i += 1) stats.snapshot();
    const snapUs = ((performance.now() - readStarted) / 2_000) * 1000;
    console.log(`frameStats cost: tick ${tickUs.toFixed(3)} us/frame, snapshot ${snapUs.toFixed(3)} us/read (window 120)`);
    expect(tickUs).toBeLessThan(50);
  });
});

describe("FrameRateSection", () => {
  it("shows the figures with the machine note, and a placeholder before any frame", () => {
    const stats = new FrameStats();
    feed(stats, Array(30).fill(20));
    const html = renderToStaticMarkup(createElement(FrameRateSection, { frames: stats.snapshot(), fills: [{ id: "debris-ring", count: 4 }] }));
    expect(html).toContain("Frames per second");
    expect(html).toContain("50.0");
    expect(html).toContain("Position fills: debris-ring");
    expect(html).toContain("this browser and machine");
    expect(renderToStaticMarkup(createElement(FrameRateSection, { frames: null, fills: [] }))).toContain("Measuring");
  });
});

describe("fps graph geometry", () => {
  it("keeps the axis at 60 or more and every reading inside the plot", () => {
    expect(fpsAxisTop([20, 40])).toBe(60);
    expect(fpsAxisTop([144.2])).toBe(150);
    expect(fpsAxisTop([])).toBe(60);
    expect(fpsY(60, 60)).toBeLessThan(fpsY(30, 60));
    expect(fpsY(0, 60)).toBeGreaterThan(fpsY(30, 60));
  });

  it("draws oldest on the left and newest on the right", () => {
    const [first, , last] = fpsGraphPoints([60, 30, 0]).split(" ").map((point) => point.split(",").map(Number));
    expect(first[0]).toBeLessThan(last[0]);
    expect(first[1]).toBeLessThan(last[1]);
    expect(fpsGraphPoints([])).toBe("");
  });

  it("labels the axes", () => {
    const html = renderToStaticMarkup(createElement(FrameRateSection, { frames: { frames: 3, fps: 50, longestMs: 20, overBudget: 0 }, fills: [], fpsHistory: Array(41).fill(50) }));
    for (const label of ["frames per second", ">10 s ago<", "now (50 fps)", ">30<", ">60<", ">0<"]) expect(html).toContain(label);
  });
});

describe("tones", () => {
  it("bands fps and frame time", () => {
    expect([fpsTone(60), fpsTone(40), fpsTone(12)]).toEqual(["good", "warn", "bad"]);
    expect([frameTone(16), frameTone(30), frameTone(60)]).toEqual(["good", "warn", "bad"]);
  });
});
