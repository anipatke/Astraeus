import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StoryPanelView } from "../src/shell/StoryPanelView";
import { CrossingTracker, panelsCrossed, parseStoryPanels, StoryPanelError, type PanelLookup, type StoryPanel } from "../src/shell/storyPanels";

/**
 * A synthetic story that names no mission and no real dataset (ARCH-03): a made-up "orbiter" with three events and
 * two anchors, and a panels file written the way any story's settings would write it.
 */
const START = Date.UTC(2100, 0, 1, 0, 0, 0);
const MIN = 60_000;
const lookup: PanelLookup = {
  events: [{ id: "ev-launch", timeUtcMs: START }, { id: "ev-burn", timeUtcMs: START + 30 * MIN }],
  anchors: new Map([["K-1", START + 60 * MIN]]),
  objectIds: ["probe", "station"],
  window: { startUtcMs: START, endUtcMs: START + 120 * MIN },
};
const settingsFile = {
  pauseSeconds: 4,
  autoOpen: true,
  panels: [
    { id: "late", at: { anchor: "K-1" }, object: "station", title: "Third", body: ["C."], badge: "illustrative", sources: ["Made-up source C"] },
    { id: "first", at: { event: "ev-burn" }, title: "First", body: "A.", badge: "observed", sources: ["Made-up source A"] },
    { id: "second", at: { utc: "2100-01-01T00:45:00Z" }, object: "probe", title: "Second", body: ["B1.", "B2."], badge: "modelled", sources: ["Made-up source B", "Made-up source B2"] },
  ],
};
const set = parseStoryPanels(settingsFile, lookup);

describe("story panel settings (T-059 Done When 1)", () => {
  it("resolves event, anchor and UTC times, sorts by time and carries the two settings", () => {
    expect(set.panels.map((panel) => [panel.id, panel.timeUtcMs - START])).toEqual([["first", 30 * MIN], ["second", 45 * MIN], ["late", 60 * MIN]]);
    expect(set.pauseSeconds).toBe(4);
    expect(set.autoOpen).toBe(true);
    expect(set.panels[1]).toMatchObject({ body: ["B1.", "B2."], badge: "modelled", objectId: "probe" });
    expect(set.panels[0]!.body).toEqual(["A."]);
  });

  it("defaults the settings when the file omits them", () => {
    const bare = parseStoryPanels({ panels: [] }, lookup);
    expect(bare).toEqual({ panels: [], pauseSeconds: 6, autoOpen: true });
  });

  const entry = settingsFile.panels[2]!;
  const bad = (change: object, settings: object = {}) => () => parseStoryPanels({ ...settings, panels: [{ ...entry, ...change }] }, lookup);

  it.each([
    ["a missing title", { title: "" }, /second: title must be non-empty text/],
    ["an unknown badge", { badge: "measured" }, /second: badge must be one of observed, modelled, illustrative/],
    ["no sources", { sources: [] }, /second: sources must be one or more non-empty lines/],
    ["an empty source line", { sources: [" "] }, /second: sources\[0\] must be non-empty text/],
    ["an empty body", { body: [] }, /second: body must be one or more/],
    ["a time with no zone", { at: { utc: "2100-01-01T00:45:00" } }, /second: at\.utc must be an ISO-8601 UTC time ending in Z/],
    ["two times at once", { at: { utc: "2100-01-01T00:45:00Z", event: "ev-burn" } }, /second: at must give exactly one of utc, event or anchor/],
    ["an unknown event", { at: { event: "nope" } }, /second: at\.event names "nope"/],
    ["an unknown anchor", { at: { anchor: "nope" } }, /second: at\.anchor names "nope"/],
    ["an unknown object", { object: "ghost" }, /second: object names "ghost"/],
    ["a time outside the window", { at: { utc: "2101-01-01T00:00:00Z" } }, /second: at falls outside the timeline window/],
  ])("names the panel and field for %s", (_what, change, message) => {
    expect(bad(change)).toThrow(StoryPanelError);
    expect(bad(change)).toThrow(message);
  });

  it("rejects a repeated id and out-of-range settings", () => {
    expect(() => parseStoryPanels({ panels: [entry, entry] }, lookup)).toThrow(/second: id is used twice/);
    expect(bad({}, { pauseSeconds: -1 })).toThrow(/settings: pauseSeconds must be between 0 and 20/);
    expect(bad({}, { autoOpen: "yes" })).toThrow(/settings: autoOpen must be true or false/);
    expect(() => parseStoryPanels(null, lookup)).toThrow(/settings: panels must be an object/);
  });
});

describe("opening as playback reaches a panel (T-059 Done When 2)", () => {
  const at = (minutes: number) => START + minutes * MIN;
  const ids = (panels: readonly StoryPanel[]) => panels.map((panel) => panel.id);

  it("finds the panels a forward step passes, in time order, and none when the clock stands or runs backward", () => {
    expect(ids(panelsCrossed(set.panels, at(0), at(50)))).toEqual(["first", "second"]);
    expect(ids(panelsCrossed(set.panels, at(30), at(31)))).toEqual([]);
    expect(ids(panelsCrossed(set.panels, at(29), at(30)))).toEqual(["first"]);
    expect(panelsCrossed(set.panels, at(90), at(0))).toEqual([]);
    expect(panelsCrossed(set.panels, at(40), at(40))).toEqual([]);
  });

  it("opens a panel when playing time crosses it", () => {
    const tracker = new CrossingTracker(at(29));
    expect(tracker.advance(set.panels, at(29.5), true, true)).toBeNull();
    expect(tracker.advance(set.panels, at(30.5), true, true)?.id).toBe("first");
    expect(tracker.advance(set.panels, at(31), true, true)).toBeNull();
  });

  it("opens only the newest when one step crosses several, so panels never stack", () => {
    expect(new CrossingTracker(at(0)).advance(set.panels, at(100), true, true)?.id).toBe("late");
  });

  it("never opens on a seek, even a seek forward past panels, and measures later playback from the seek", () => {
    const tracker = new CrossingTracker(at(0));
    tracker.rebase(at(100));
    expect(tracker.advance(set.panels, at(100), true, true)).toBeNull();
    tracker.rebase(at(44));
    expect(tracker.advance(set.panels, at(44.2), true, true)).toBeNull();
    expect(tracker.advance(set.panels, at(45.1), true, true)?.id).toBe("second");
  });

  it("scrubbing back and forth past the markers opens nothing", () => {
    const tracker = new CrossingTracker(at(0));
    for (const minute of [20, 70, 10, 100, 5, 59, 61, 0]) {
      tracker.rebase(at(minute));
      expect(tracker.advance(set.panels, at(minute), false, true)).toBeNull();
    }
  });

  it("does not open while paused or with auto-open off, but still keeps its place", () => {
    const tracker = new CrossingTracker(at(0));
    expect(tracker.advance(set.panels, at(40), false, true)).toBeNull();
    expect(tracker.advance(set.panels, at(50), true, false)).toBeNull();
    expect(tracker.advance(set.panels, at(55), true, true)).toBeNull();
    expect(tracker.advance(set.panels, at(65), true, true)?.id).toBe("late");
  });

  it("does not open when looping wraps the clock back to the start", () => {
    const tracker = new CrossingTracker(at(119));
    expect(tracker.advance(set.panels, at(1), true, true)).toBeNull();
  });
});

describe("panel view (T-059 Done When 4)", () => {
  const html = (holding: boolean) => renderToStaticMarkup(createElement(StoryPanelView, { panel: set.panels[1]!, holding, onClose: () => undefined, onContinue: () => undefined }));

  it("shows the title, every paragraph, the badge and each source line", () => {
    const markup = html(false);
    expect(markup).toContain("Second");
    expect(markup).toContain("B1.");
    expect(markup).toContain("B2.");
    expect(markup).toContain('data-badge="modelled"');
    expect(markup).toContain(">Modelled<");
    expect(markup).toContain("Made-up source B2");
  });

  it("offers Continue playback only while playback is held", () => {
    expect(html(false)).not.toContain("Continue playback");
    expect(html(true)).toContain("Continue playback");
  });
});

describe("the demo wiring (T-059 Done When 5)", () => {
  it("gives the first demo story seven sourced panels, in mission order, that sit on its own anchors and objects", async () => {
    const { apollo11Experience } = await import("../src/experiences/apollo11/apollo11");
    const panels = apollo11Experience.storyPanels?.panels ?? [];
    expect(panels.map((panel) => panel.id)).toEqual(["tli-cutoff", "loi", "powered-descent", "touchdown", "ascent-docking", "tei", "splashdown"]);
    for (const panel of panels) {
      expect(panel.sources.length).toBeGreaterThan(0);
      expect(panel.sources.some((line) => /Mission Report \(MSC-00171\), Table \d-[IVX]+, p\. \d-\d+/.test(line))).toBe(true);
      expect(panel.badge).toBe("observed");
      expect(panel.body.length).toBeGreaterThanOrEqual(1);
      if (panel.objectId !== undefined) expect(apollo11Experience.objects.some((object) => object.id === panel.objectId)).toBe(true);
      expect(panel.timeUtcMs).toBeGreaterThanOrEqual(apollo11Experience.window.startUtcMs);
      expect(panel.timeUtcMs).toBeLessThanOrEqual(apollo11Experience.window.endUtcMs);
    }
    expect(panels[0]!.timeUtcMs).toBe(-14542676800);
    expect(panels[3]!.timeUtcMs).toBe(-14182940100);
    expect(panels.map((panel) => panel.timeUtcMs)).toEqual([...panels.map((panel) => panel.timeUtcMs)].sort((a, b) => a - b));
  });
});
