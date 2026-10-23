import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { formatRateCompact } from "../src/shell/timelineModel";
import { Sources } from "../src/shell/Sources";
import { DEFAULT_PHONE_LAYOUT, PHONE_LAYOUT_LIMITS, PHONE_QUERY, phoneLayoutStyle, type PhoneLayoutSettings } from "../src/shell/phoneLayout";

describe("phone layout settings (T-081 Done When 5)", () => {
  it("keeps every default inside the range its live control offers", () => {
    for (const key of Object.keys(DEFAULT_PHONE_LAYOUT) as (keyof PhoneLayoutSettings)[]) {
      const { min, max } = PHONE_LAYOUT_LIMITS[key];
      expect(DEFAULT_PHONE_LAYOUT[key], key).toBeGreaterThanOrEqual(min);
      expect(DEFAULT_PHONE_LAYOUT[key], key).toBeLessThanOrEqual(max);
    }
  });

  it("hands the numbers to the stylesheet as custom properties", () => {
    const style = phoneLayoutStyle({ animationMs: 100, timelineDrawerMaxPercent: 40, controlsDrawerMaxPercent: 50, sheetMaxPercent: 70, swipeThresholdPx: 25 }) as Record<string, string>;
    expect(style["--drawer-ms"]).toBe("100ms");
    expect(style["--timeline-drawer-max"]).toBe("40dvh");
    expect(style["--controls-drawer-max"]).toBe("50dvh");
    expect(style["--sheet-max"]).toBe("70dvh");
  });

  it("calls a narrow screen, or a short touch screen, a phone", () => {
    expect(PHONE_QUERY).toContain("max-width: 700px");
    expect(PHONE_QUERY).toContain("pointer: coarse");
  });
});

describe("Sources section (T-081 Done When 3, O-020 Decision 4)", () => {
  const markup = renderToStaticMarkup(createElement(Sources, { sources: ["First source", "Second source"] }));

  it("is closed by default, counts its lines and keeps every one in the page", () => {
    expect(markup).toContain("<details");
    expect(markup).not.toMatch(/<details[^>]* open/);
    expect(markup).toContain("Sources");
    expect(markup).toContain("· 2");
    expect(markup).toContain("First source");
    expect(markup).toContain("Second source");
  });
});

describe("compact playback rate for the phone's picker", () => {
  it("names simulated time per real second in the largest whole unit", () => {
    expect([1, 60, 3_600, 43_200, 86_400, 259_200, 604_800, 1_209_600].map(formatRateCompact)).toEqual(["1 s/s", "1 min/s", "1 h/s", "12 h/s", "1 d/s", "3 d/s", "1 wk/s", "2 wk/s"]);
  });

  it("falls back to the plain rate when no whole unit fits", () => {
    expect(formatRateCompact(5_000)).toBe("5,000×");
    expect(formatRateCompact(0.5)).toBe("0.5×");
  });
});
