// The time look (O-074 T-316): one formatter reads every visitor-facing time in a zone and to a precision; UTC keeps today's ISO text.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Scene, earth } from "astraeus";
import { definitionOf } from "../src/api/definitionOf";
import { applyLook, lookReadOf } from "../src/app/liveLook";
import { resolveLook } from "../src/app/look";
import { DEFAULT_TIME_LOOK, timeLookOf } from "../src/app/timeLook";
import type { SceneControls } from "../src/app/AstraeusScene";
import type { ExperienceConfig } from "../src/shell/experience";
import { infoView } from "../src/shell/infoModel";
import { TimelineBar } from "../src/shell/TimelineBar";
import { formatTime, formatUtcTimestamp, type TimeLook } from "../src/shell/timelineModel";

const MOMENT = Date.UTC(2026, 10, 15, 2, 37, 12); // 2026-11-15T02:37:12Z: still the 14th in New York
const RealFormat = Intl.DateTimeFormat;
const realZone = process.env.TZ;

// The language is pinned (en-US) and the visitor's zone is pinned (Asia/Kolkata, UTC+5:30), so the table does not depend on the machine.
beforeAll(() => {
  process.env.TZ = "Asia/Kolkata";
  Intl.DateTimeFormat = function pinned(locale?: Intl.LocalesArgument, options?: Intl.DateTimeFormatOptions) { return new RealFormat(locale ?? "en-US", options); } as unknown as typeof Intl.DateTimeFormat;
});
afterAll(() => {
  Intl.DateTimeFormat = RealFormat;
  if (realZone === undefined) delete process.env.TZ; else process.env.TZ = realZone;
});

const TABLE: readonly (readonly [zone: string, day: string, minute: string, second: string])[] = [
  ["UTC", "2026-11-15", "2026-11-15T02:37Z", "2026-11-15T02:37:12Z"],
  ["local", "Nov 15, 2026", "Nov 15, 2026, 8:07 AM GMT+5:30", "Nov 15, 2026, 8:07:12 AM GMT+5:30"],
  ["Australia/Sydney", "Nov 15, 2026", "Nov 15, 2026, 1:37 PM GMT+11", "Nov 15, 2026, 1:37:12 PM GMT+11"],
  ["America/New_York", "Nov 14, 2026", "Nov 14, 2026, 9:37 PM EST", "Nov 14, 2026, 9:37:12 PM EST"],
];

describe("formatTime", () => {
  it.each(TABLE.flatMap(([zone, day, minute, second]) => [[zone, "day", day], [zone, "minute", minute], [zone, "second", second]] as const))("%s to the %s", (zone, precision, expected) => {
    expect(formatTime(MOMENT, { zone, precision }).replace(/\u202f/g, " ")).toBe(expected); // newer ICU puts a narrow no-break space before AM/PM
  });

  it("UTC to the second is byte-identical to formatUtcTimestamp, and a whole second drops no digit", () => {
    for (const ms of [MOMENT, Date.UTC(2030, 0, 1), 0]) expect(formatTime(ms, DEFAULT_TIME_LOOK)).toBe(formatUtcTimestamp(ms));
  });
});

const experience = {
  window: { startUtcMs: MOMENT - 86_400_000, endUtcMs: MOMENT + 86_400_000 },
  rates: [60],
  events: [{ id: "e1", label: "Peak night", timeUtcMs: MOMENT }],
  windows: [{ id: "w1", label: "Shower", startUtcMs: MOMENT - 3_600_000, endUtcMs: MOMENT + 3_600_000, peakUtcMs: MOMENT }],
  objects: [],
} as unknown as ExperienceConfig;
const snapshot = { timeUtcMs: MOMENT, rate: 60, playing: false } as never;
const noop = () => undefined;
const barText = (timeLook?: TimeLook) => renderToStaticMarkup(createElement(TimelineBar, {
  experience, snapshot, onTogglePlayback: noop, onRateChange: noop, onSeek: noop, onEventSeek: noop, onEventInfo: noop, onWindowSeek: noop, onWindowInfo: noop, infoPanelId: "info", ...(timeLook === undefined ? {} : { timeLook }),
}));

describe("every visitor-facing time reads the look", () => {
  it("the default and an explicit UTC/second look render today's exact strings in the bar, the slider text, the bounds and the cards", () => {
    for (const html of [barText(), barText({ zone: "UTC", precision: "second" })]) {
      expect(html).toContain('aria-valuetext="2026-11-15T02:37:12Z"');
      expect(html).toContain('<time class="timeline-time" dateTime="2026-11-15T02:37:12Z" aria-label="2026-11-15T02:37:12Z">');
      expect(html).toContain('<time dateTime="2026-11-14T02:37:12Z">2026-11-14</time>');
    }
    expect(infoView(experience, { kind: "event", id: "e1" })?.subtitle).toBe("2026-11-15T02:37:12Z");
    expect(infoView(experience, { kind: "window", id: "w1" }, MOMENT)?.facts?.slice(0, 3).map((fact) => fact.value)).toEqual(["2026-11-15T01:37:12Z", "2026-11-15T03:37:12Z", "2026-11-15T02:37:12Z"]);
  });

  it("a named zone and precision change the bar, the slider text, the bounds and the cards, while dateTime stays ISO UTC", () => {
    const look: TimeLook = { zone: "America/New_York", precision: "minute" };
    const html = barText(look);
    expect(html).toContain(`aria-valuetext="${formatTime(MOMENT, look)}"`);
    expect(html).toContain(`dateTime="2026-11-15T02:37:12Z" aria-label="${formatTime(MOMENT, look)}"`);
    expect(html).toContain(`<time dateTime="2026-11-14T02:37:12Z">${formatTime(MOMENT - 86_400_000, { ...look, precision: "day" })}</time>`);
    expect(infoView(experience, { kind: "event", id: "e1" }, undefined, look)?.subtitle).toBe(formatTime(MOMENT, look));
    expect(infoView(experience, { kind: "window", id: "w1" }, MOMENT, look)?.facts?.slice(0, 3).map((fact) => fact.value)).toEqual([MOMENT - 3_600_000, MOMENT + 3_600_000, MOMENT].map((ms) => formatTime(ms, look)));
  });
});

describe("the time look", () => {
  it("defaults to UTC to the second and reads back through the look", () => {
    expect(timeLookOf({})).toEqual({ zone: "UTC", precision: "second" });
    expect(timeLookOf({ time: { precision: "day" } })).toEqual({ zone: "UTC", precision: "day" });
    expect(timeLookOf(resolveLook({ time: { zone: "Australia/Sydney" } }, ""))).toEqual({ zone: "Australia/Sydney", precision: "second" });
  });

  it("Scene.setLook keeps a good time look and ignores the address", () => {
    const scene = new Scene().addBody(earth).setLook({ time: { zone: "local", precision: "minute" } });
    expect(definitionOf(scene).look).toEqual({ time: { zone: "local", precision: "minute" } });
    expect(resolveLook(definitionOf(scene).look, "?zone=UTC&time=UTC&precision=day").time).toEqual({ zone: "local", precision: "minute" });
  });

  it.each([
    ["an unknown zone", { time: { zone: "Mars/Olympus" } }],
    ["an empty zone", { time: { zone: "" } }],
    ["a zone that is not text", { time: { zone: 5 } }],
    ["an unknown precision", { time: { precision: "hour" } }],
    ["an unknown time look", { time: { format: "iso" } }],
    ["time that is not an object", { time: "UTC" }],
  ])("%s throws bad-look", (_name, look) => {
    expect(() => new Scene().setLook(look as never)).toThrow(expect.objectContaining({ code: "bad-look", name: "SceneError" }));
  });

  it("applyLook changes the live time look, reads it back, and setLook(read) round-trips", () => {
    const controls = { labelStyle: { fontFamily: "inherit", sizePx: 12 }, skyColours: {}, bodyMarker: { minSpherePx: 3 }, timeLook: DEFAULT_TIME_LOOK } as unknown as SceneControls;
    const definition = definitionOf(new Scene().addBody(earth));
    const read = applyLook(controls, definition, null, { time: { zone: "Australia/Sydney", precision: "day" } });
    expect(read.time).toEqual({ zone: "Australia/Sydney", precision: "day" });
    expect(controls.timeLook).toEqual({ zone: "Australia/Sydney", precision: "day" });
    expect(applyLook(controls, definition, null, { time: read.time }).time).toEqual(read.time);
    expect(applyLook(controls, definition, null, {}).time).toEqual({ zone: "UTC", precision: "second" });
    expect(lookReadOf(controls).time).toEqual({ zone: "UTC", precision: "second" });
  });
});
