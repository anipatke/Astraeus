// A rate that crosses the whole timeline in under a real second warns, naming the unit (I-163; T-293's `rate: DAY_MS` over a 120-day window). It never throws.
import { afterEach, describe, expect, it, vi } from "vitest";
import { Scene, earth } from "astraeus";
import { buildSyntheticJourneyScene } from "../src/synthetic/syntheticJourneyScene";

const DAY_MS = 86_400_000;
const T0 = Date.UTC(2030, 0, 1);
const window = { start: T0, end: T0 + 120 * DAY_MS };
const warnings = () => vi.spyOn(console, "warn").mockImplementation(() => undefined);

afterEach(() => vi.restoreAllMocks());

describe("setTimeline rate unit warning", () => {
  it("warns on the T-293 shape (rate DAY_MS over 120 days), naming the unit and the value", () => {
    const warn = warnings();
    expect(() => new Scene().addBody(earth).setTimeline({ ...window, rates: [DAY_MS, 7 * DAY_MS], rate: DAY_MS })).not.toThrow();
    expect(warn).toHaveBeenCalledTimes(1);
    const message = String(warn.mock.calls[0]![0]);
    expect(message).toContain("simulated seconds per real second");
    expect(message).toContain("86400000");
    expect(message).toContain("604800000");
    expect(message).toContain("milliseconds");
  });
  it("warns on one fast offered rate even when the opening rate is sane", () => {
    const warn = warnings();
    new Scene().addBody(earth).setTimeline({ ...window, rates: [3_600, DAY_MS], rate: 3_600 });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]![0])).toContain("86400000");
  });
  it("does not warn for the right units, for a short window at a fast rate that still takes a second, or for no timeline bar", () => {
    const warn = warnings();
    new Scene().addBody(earth).setTimeline({ ...window, rates: [3_600, 86_400, 7 * 86_400], rate: 3_600 });
    new Scene().addBody(earth).setTimeline({ start: T0, end: T0 + 2 * 3_600_000, rates: [60, 600, 7_200], rate: 600 }); // 7,200 s span at 7,200 s/s: exactly one second
    new Scene().addBody(earth).setTimeline({ none: true, rate: 60 });
    expect(warn).not.toHaveBeenCalled();
  });
  it("does not warn for the repo's journey scene (its rates are DAY_MS / 1000 and up)", () => {
    const warn = warnings();
    buildSyntheticJourneyScene();
    expect(warn).not.toHaveBeenCalled();
  });
});
