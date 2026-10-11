import { describe, expect, it } from "vitest";
import { apollo11Experience } from "../src/mission/apollo11";
import {
  eventContextAt, eventNavigationTargets, eventPositionPercent, formatWindowRate, mergeSpeeds, navigationStops,
  windowAreaPath, windowContextAt, windowCurvePath, windowPeakHeightPercent, windowPositionPercent, windowTimeAtFraction, DEFAULT_PLAYBACK_SPEEDS,
} from "../src/shell/timelineModel";
import { createWindows } from "../src/core/timeWindow";
import type { TimelineEvent } from "../src/core/events";

const sampleEvents: readonly TimelineEvent[] = [
  { id: "first", label: "First event", timeUtcMs: 10 },
  { id: "middle", label: "Middle event", timeUtcMs: 20 },
  { id: "last", label: "Last event", timeUtcMs: 30 },
];

describe("timeline event context", () => {
  it("shows the first event as next before the event window begins", () => {
    expect(eventContextAt(sampleEvents, 9)).toEqual({ current: null, next: sampleEvents[0] });
    expect(eventNavigationTargets(sampleEvents, 9)).toEqual({ previous: null, next: sampleEvents[0] });
  });

  it("shows the event at the current time and navigates to its neighbours", () => {
    expect(eventContextAt(sampleEvents, 20)).toEqual({ current: sampleEvents[1], next: sampleEvents[2] });
    expect(eventNavigationTargets(sampleEvents, 20)).toEqual({ previous: sampleEvents[0], next: sampleEvents[2] });
  });

  it("keeps the last event as the current story point after the event window", () => {
    expect(eventContextAt(sampleEvents, 31)).toEqual({ current: sampleEvents[2], next: null });
    expect(eventNavigationTargets(sampleEvents, 31)).toEqual({ previous: sampleEvents[2], next: null });
  });

  it("uses the most recent event and the next event between event timestamps", () => {
    expect(eventContextAt(sampleEvents, 15)).toEqual({ current: sampleEvents[0], next: sampleEvents[1] });
    expect(eventNavigationTargets(sampleEvents, 15)).toEqual({ previous: sampleEvents[0], next: sampleEvents[1] });
  });

  it("supports tied event times without changing the core event model", () => {
    const tied = [sampleEvents[0], { id: "also-first", label: "Also first", timeUtcMs: 10 }, sampleEvents[1]];
    expect(eventContextAt(tied, 10)).toEqual({ current: tied[1], next: tied[2] });
    expect(eventNavigationTargets(tied, 10)).toEqual({ previous: null, next: tied[2] });
  });

  it("positions markers within the configured window", () => {
    const bounds = { startUtcMs: 10, endUtcMs: 30 };
    expect(eventPositionPercent(sampleEvents[0], bounds)).toBe(0);
    expect(eventPositionPercent(sampleEvents[1], bounds)).toBe(50);
    expect(eventPositionPercent(sampleEvents[2], bounds)).toBe(100);
  });
});

describe("experience timeline data", () => {
  it("moves through all 30 configured events in chronological order", () => {
    let timeUtcMs = apollo11Experience.window.startUtcMs - 1;
    const visited: string[] = [];
    while (true) {
      const next = eventNavigationTargets(apollo11Experience.events, timeUtcMs).next;
      if (next === null) break;
      visited.push(next.id);
      timeUtcMs = next.timeUtcMs;
    }
    expect(visited).toHaveLength(30);
    expect(visited).toEqual(apollo11Experience.events.map((event) => event.id));
  });

  it("merges experience rates with the shared playback speeds", () => {
    expect(mergeSpeeds(DEFAULT_PLAYBACK_SPEEDS, apollo11Experience.rates).map((speed) => speed.rate))
      .toEqual([1, 100, 1_000, 3_600, 10_000, 86_400, 604_800]);
  });
});

const windows = createWindows([
  {
    id: "wide", label: "Wide period", startUtcMs: 12, endUtcMs: 28, peakUtcMs: 20,
    rate: { unit: "things per hour", samples: [{ timeUtcMs: 12, value: 0 }, { timeUtcMs: 20, value: 40 }, { timeUtcMs: 28, value: 10 }] },
  },
  { id: "plain", label: "Plain period", startUtcMs: 22, endUtcMs: 26 },
]);
const bounds = { startUtcMs: 10, endUtcMs: 30 };

describe("timeline windows", () => {
  it("positions a window and clamps it to the timeline", () => {
    expect(windowPositionPercent(windows[0], bounds)).toEqual({ startPercent: 10, endPercent: 90 });
    expect(windowPositionPercent({ ...windows[0], startUtcMs: 0, endUtcMs: 99 }, bounds)).toEqual({ startPercent: 0, endPercent: 100 });
  });

  it("draws the rate curve against the window's own maximum, only from its samples", () => {
    expect(windowCurvePath(windows[0], bounds)).toBe("M10 100 L50 0 L90 75");
    expect(windowCurvePath(windows[1], bounds)).toBeNull();
    expect(windowCurvePath(windows[0], { startUtcMs: 12, endUtcMs: 20 })).toBe("M0 100 L100 0");
    expect(windowCurvePath(windows[0], { startUtcMs: 21, endUtcMs: 30 })).toBeNull();
  });

  it("closes the curve down to the baseline so the rate reads as one filled shape", () => {
    expect(windowAreaPath(windows[0], bounds)).toBe("M10 100 L50 0 L90 75 L90 100 L10 100 Z");
    expect(windowAreaPath(windows[1], bounds)).toBeNull();
  });

  it("puts the peak at its height on the curve, and omits it without a peak or rate", () => {
    expect(windowPeakHeightPercent(windows[0])).toBe(100);
    expect(windowPeakHeightPercent({ ...windows[0], peakUtcMs: 28 })).toBe(25);
    expect(windowPeakHeightPercent(windows[1])).toBeNull();
  });

  it("turns a click along the band into a time inside the window", () => {
    expect(windowTimeAtFraction(windows[0], 0)).toBe(12);
    expect(windowTimeAtFraction(windows[0], 0.5)).toBe(20);
    expect(windowTimeAtFraction(windows[0], 2)).toBe(28);
    expect(windowTimeAtFraction(windows[0], -1)).toBe(12);
  });

  it("reports the windows the clock is inside, with their rate, boundaries included", () => {
    expect(windowContextAt(windows, 11)).toEqual([]);
    expect(windowContextAt(windows, 12)).toEqual([{ window: windows[0], rate: 0 }]);
    expect(windowContextAt(windows, 24).map((c) => [c.window.id, c.rate])).toEqual([["wide", 25], ["plain", null]]);
    expect(windowContextAt(windows, 28)).toEqual([{ window: windows[0], rate: 10 }]);
    expect(windowContextAt(windows, 29)).toEqual([]);
    expect(formatWindowRate(25.04, "things per hour")).toBe("25 things per hour");
  });

  it("stops Previous/Next at event times and each window's start, peak and end", () => {
    const visited: string[] = [];
    let time = 0;
    for (;;) {
      const next = navigationStops(sampleEvents, windows, time).next;
      if (next === null) break;
      visited.push(`${next.timeUtcMs} ${next.label}`);
      time = next.timeUtcMs;
    }
    expect(visited).toEqual([
      "10 First event", "12 Wide period opens", "20 Middle event", "22 Plain period opens",
      "26 Plain period closes", "28 Wide period closes", "30 Last event",
    ]);
    expect(navigationStops(sampleEvents, windows, 21).previous?.label).toBe("Middle event");
    expect(navigationStops(sampleEvents, windows, 12).previous?.label).toBe("First event");
  });

  it("lets an event win where it shares a time with a window point, and skips a missing peak", () => {
    const stop = navigationStops(sampleEvents, windows, 19).next;
    expect(stop?.event?.id).toBe("middle");
    expect(stop?.window).toBeUndefined();
    expect(navigationStops([], [windows[1]], 0).next?.label).toBe("Plain period opens");
    expect(navigationStops([], [windows[1]], 22).next?.label).toBe("Plain period closes");
  });

  it("behaves exactly as before without windows", () => {
    for (const time of [9, 10, 15, 20, 30, 31]) {
      const before = eventNavigationTargets(sampleEvents, time);
      const now = navigationStops(sampleEvents, [], time);
      expect(now.previous?.event ?? null).toBe(before.previous);
      expect(now.next?.event ?? null).toBe(before.next);
    }
    const tied = [sampleEvents[0], { id: "also-first", label: "Also first", timeUtcMs: 10 }, sampleEvents[1]];
    expect(navigationStops(tied, [], 10).next?.event).toBe(tied[2]);
    expect(navigationStops(tied, [], 11).previous?.event).toBe(tied[1]);
  });
});

describe("generic shell boundary", () => {
  it("contains no experience-specific names", () => {
    const source = Object.values(import.meta.glob("../src/shell/**/*.{ts,tsx,css}", { eager: true, query: "?raw", import: "default" })).join("\n");
    expect(source).not.toMatch(/apollo|columbia|eagle/i);
    expect(source).not.toMatch(/meteor|shower|perseid/i);
  });
});
