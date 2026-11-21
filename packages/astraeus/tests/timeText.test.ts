// T-348 (CQ-7): date-time text must say its time zone. One table of texts runs through every entry point that reads time text, under two process zones, and gives the same instant in each.
import { afterEach, describe, expect, it } from "vitest";
import { Scene, SceneError, earth } from "astraeus";
import { toUtcMs } from "../src/api/time";
import { timeFromSearch } from "../src/app/viewLink";

const MIDNIGHT = Date.UTC(2026, 7, 12);
const EVENING = Date.UTC(2026, 7, 12, 21);
/** Text and what it means: a number of UTC milliseconds, or "refused". */
const texts: readonly (readonly [string, string, number | "refused"])[] = [
  ["date only", "2026-08-12", MIDNIGHT],
  ["Z", "2026-08-12T21:00:00Z", EVENING],
  ["Z, no seconds", "2026-08-12T21:00Z", EVENING],
  ["+offset", "2026-08-13T07:00:00+10:00", EVENING],
  ["-offset", "2026-08-12T16:00:00-05:00", EVENING],
  ["fractional seconds with Z", "2026-08-12T21:00:00.250Z", EVENING + 250],
  ["fractional seconds with offset", "2026-08-12T22:00:00.5+01:00", EVENING + 500],
  ["zone-less date-time", "2026-08-12T21:00:00", "refused"],
  ["zone-less, no seconds", "2026-08-12T21:00", "refused"],
  ["zone-less fractional seconds", "2026-08-12T21:00:00.250", "refused"],
  ["free form", "Aug 12 2026", "refused"],
  ["free form with zone", "Wed, 12 Aug 2026 21:00:00 GMT", "refused"],
  ["slashes", "2026/08/12", "refused"],
  ["space instead of T", "2026-08-12 21:00:00Z", "refused"],
  ["impossible date", "2026-13-45", "refused"],
];

const panel = (time: string) => ({ id: "p", at: { time }, title: "T", body: "B", provenance: { sourceType: "illustrative" as const, sources: ["s"], accuracy: "a", notes: "n" } });
const base = () => new Scene().addBody(earth);
/** Each entry point: the moment it read (a number), or the error it threw. */
const entries: readonly (readonly [string, (text: string) => number, string])[] = [
  ["toUtcMs", (t) => toUtcMs(t), "bad-time"],
  ["setTime", (t) => base().setTime(t).timeline.openUtcMs, "bad-time"],
  ["setTimeline start", (t) => base().setTimeline({ start: t, end: "2030-01-01T00:00:00Z" }).timeline.windowStartUtcMs, "bad-time"],
  ["setTimeline end", (t) => base().setTimeline({ start: "2000-01-01T00:00:00Z", end: t }).timeline.windowEndUtcMs, "bad-time"],
  ["story panel at.time", (t) => base().setTimeline({ start: "2000-01-01T00:00:00Z", end: "2030-01-01T00:00:00Z" }).addStoryPanels([panel(t)]).panels[0]!.timeUtcMs!, "bad-panels"],
  ["page address t", (t) => timeFromSearch(`?t=${encodeURIComponent(t)}`) ?? Number.NaN, "ignored"],
];

const zone = process.env.TZ;
afterEach(() => { if (zone === undefined) delete process.env.TZ; else process.env.TZ = zone; });

describe.each(["UTC", "Australia/Sydney", "America/Los_Angeles"])("time text in process zone %s", (tz) => {
  describe.each(entries)("%s", (_entry, read, code) => {
    it.each(texts)("%s: %s", (_name, text, want) => {
      process.env.TZ = tz;
      if (want !== "refused") { expect(read(text)).toBe(want); return; }
      if (code === "ignored") { expect(read(text)).toBeNaN(); return; }
      expect(() => read(text)).toThrow(expect.objectContaining({ code }));
    });
  });
});

describe("the message for zone-less date-time text names the fix", () => {
  it("says to add Z or an offset", () => {
    let failure: unknown;
    try { toUtcMs("2026-08-12T21:00:00"); } catch (error) { failure = error; }
    expect(failure).toBeInstanceOf(SceneError);
    expect((failure as SceneError).message).toMatch(/time zone.*Z.*offset|Z.*offset.*time zone/i);
  });
  it("keeps the generic message for other bad text", () => {
    expect(() => toUtcMs("Aug 12 2026")).toThrow(/not a valid moment/);
  });
});
