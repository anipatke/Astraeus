// The desktop speed menu's short rate phrase (owner, 2026-11-21: "3600x - 1hr/sec on desktop"; the long wording ran too wide).
import { describe, expect, it } from "vitest";
import { describePlaybackRate, formatRateShort } from "../src/shell/timelineModel";

describe("formatRateShort", () => {
  it.each([
    [1, "1× – real time"],
    [60, "60× – 1 min/sec"],
    [600, "600× – 10 min/sec"],
    [3_600, "3,600× – 1 hr/sec"],
    [86_400, "86,400× – 1 day/sec"],
    [172_800, "172,800× – 2 days/sec"],
    [604_800, "604,800× – 1 wk/sec"],
    [1_209_600, "1,209,600× – 2 wks/sec"],
    [30, "30× – 30 sec/sec"],
  ])("rate %d reads %s", (rate, label) => {
    expect(formatRateShort(rate)).toBe(label);
  });

  it.each([
    [100, "100× – 1.7 min/sec"],
    [1_000, "1,000× – 17 min/sec"],
    [10_000, "10,000× – 2.8 hr/sec"],
    [1.5, "1.5× – 1.5 sec/sec"],
    [0.5, "0.5× – 0.5 sec/sec"],
  ])("rate %d rounds to %s", (rate, label) => {
    expect(formatRateShort(rate)).toBe(label);
  });

  it("keeps the full wording for a rate that is not a positive number", () => {
    expect(formatRateShort(0)).toBe(describePlaybackRate(0));
  });
});
