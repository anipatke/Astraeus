import { describe, expect, it } from "vitest";
import { apollo11Experience } from "../src/mission/apollo11";
import { eventContextAt, eventNavigationTargets, eventPositionPercent, mergeSpeeds, DEFAULT_PLAYBACK_SPEEDS } from "../src/shell/timelineModel";
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

describe("generic shell boundary", () => {
  it("contains no experience-specific names", () => {
    const source = Object.values(import.meta.glob("../src/shell/**/*.{ts,tsx,css}", { eager: true, query: "?raw", import: "default" })).join("\n");
    expect(source).not.toMatch(/apollo|columbia|eagle/i);
  });
});
