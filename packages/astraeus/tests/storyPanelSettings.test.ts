import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StoryPanelView } from "../src/shell/StoryPanelView";
import { checkPanelPlayback, checkStoryPanel, CrossingTracker, panelsCrossed, resolveStoryPanels, StoryPanelError, type PanelLookup, type StoryPanel } from "../src/shell/storyPanels";

// Moved from the site's tests (O-059 T-272): the story panel parser, the opening rule and the view are the engine's, held on a made-up story.
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
    { id: "late", at: { anchor: "K-1" }, object: "station", title: "Third", body: ["C."], provenance: { sourceType: "illustrative" as const, sources: ["Made-up source C"], accuracy: "None claimed.", notes: "Made up." } },
    { id: "first", at: { event: "ev-burn" }, title: "First", body: "A.", provenance: { sourceType: "observed" as const, sources: ["Made-up source A"], accuracy: "None claimed.", notes: "Made up." } },
    { id: "second", at: { time: "2100-01-01T00:45:00Z" }, object: "probe", title: "Second", body: ["B1.", "B2."], provenance: { sourceType: "modelled" as const, sources: ["Made-up source B", "Made-up source B2"], accuracy: "None claimed.", notes: "Made up." } },
  ],
};
/** A panels file through both halves of the check, shape then links, as `addStoryPanels`, `setStoryPanelPlayback` and the build run them. */
const parse = ({ panels, ...playback }: { readonly panels: readonly unknown[] }, against: PanelLookup) => resolveStoryPanels(panels.map(checkStoryPanel), checkPanelPlayback(playback), against);
const set = parse(settingsFile, lookup);

describe("story panel settings (T-059 Done When 1)", () => {
  it("resolves event, anchor and UTC times, sorts by time and carries the two settings", () => {
    expect(set.panels.map((panel) => [panel.id, panel.timeUtcMs - START])).toEqual([["first", 30 * MIN], ["second", 45 * MIN], ["late", 60 * MIN]]);
    expect(set.pauseSeconds).toBe(4);
    expect(set.autoOpen).toBe(true);
    expect(set.panels[1]).toMatchObject({ body: ["B1.", "B2."], provenance: { sourceType: "modelled", sources: ["Made-up source B", "Made-up source B2"] }, objectId: "probe" });
    expect(set.panels[0]!.body).toEqual(["A."]);
  });

  it("defaults the settings when the file omits them", () => {
    const bare = parse({ panels: [] }, lookup);
    expect(bare).toEqual({ panels: [], pauseSeconds: 6, autoOpen: true });
  });

  const entry = settingsFile.panels[2]!;
  const bad = (change: object, settings: object = {}) => () => parse({ ...settings, panels: [{ ...entry, ...change }] }, lookup);

  it.each([
    ["a missing title", { title: "" }, /second: title must be non-empty text/],
    ["an unknown source type", { provenance: { ...entry.provenance, sourceType: "measured" } }, /second: provenance\.sourceType must be one of ephemeris, observed, reconstructed, modelled, illustrative/],
    ["no sources", { provenance: { ...entry.provenance, sources: [] } }, /second: provenance\.sources must be one or more non-empty lines/],
    ["an empty source line", { provenance: { ...entry.provenance, sources: [" "] } }, /second: provenance\.sources\[0\] must be non-empty text/],
    ["an empty body", { body: [] }, /second: body must be one or more/],
    ["a time that is not one", { at: { time: "not a time" } }, /second: at\.time must be a valid moment/],
    ["two times at once", { at: { time: "2100-01-01T00:45:00Z", event: "ev-burn" } }, /second: at must give exactly one of time, event or anchor/],
    ["an unknown event", { at: { event: "nope" } }, /second: at\.event names "nope"/],
    ["an unknown anchor", { at: { anchor: "nope" } }, /second: at\.anchor names "nope"/],
    ["an unknown object", { object: "ghost" }, /second: object names "ghost"/],
    ["a time outside the window", { at: { time: "2101-01-01T00:00:00Z" } }, /second: at falls outside the timeline window/],
  ])("names the panel and field for %s", (_what, change, message) => {
    expect(bad(change)).toThrow(StoryPanelError);
    expect(bad(change)).toThrow(message);
  });

  it("rejects out-of-range settings (a repeated id is `addStoryPanels`' duplicate-id, in publicApiStory.test.ts)", () => {
    expect(bad({}, { pauseSeconds: -1 })).toThrow(/settings: pauseSeconds must be between 0 and 20/);
    expect(bad({}, { autoOpen: "yes" })).toThrow(/settings: autoOpen must be true or false/);
    expect(() => checkPanelPlayback(null)).toThrow(/settings: playback must be an object/);
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

describe("details in the folded section (T-087 Done When 1-3)", () => {
  const withDetails = parse({ panels: [{ ...settingsFile.panels[2]!, details: ["Exact figure one.", "Reconstructed note two."] }] }, lookup).panels[0]!;
  const view = (panel: StoryPanel) => renderToStaticMarkup(createElement(StoryPanelView, { panel, holding: false, onClose: () => undefined, onContinue: () => undefined }));

  it("parses an optional details list, a single line or several, and defaults to none", () => {
    expect(withDetails.details).toEqual(["Exact figure one.", "Reconstructed note two."]);
    expect(set.panels[1]!.details).toEqual([]);
    const single = parse({ panels: [{ ...settingsFile.panels[2]!, details: "Only one." }] }, lookup).panels[0]!;
    expect(single.details).toEqual(["Only one."]);
  });

  it.each([
    ["an empty list", { details: [] }, /second: details must be one or more non-empty lines/],
    ["an empty line", { details: ["ok", " "] }, /second: details\[1\] must be non-empty text/],
    ["a non-text line", { details: [3] }, /second: details\[0\] must be non-empty text/],
  ])("names the panel and field for %s", (_what, change, message) => {
    expect(() => parse({ panels: [{ ...settingsFile.panels[2]!, ...change }] }, lookup)).toThrow(message);
  });

  it.each([["ephemeris", "Ephemeris"], ["observed", "Observed"], ["reconstructed", "Reconstructed"], ["modelled", "Modelled"], ["illustrative", "Illustrative"]])("the badge shows the word for %s (O-057 T-278)", (sourceType, word) => {
    const panel = parse({ panels: [{ ...settingsFile.panels[2]!, provenance: { ...settingsFile.panels[2]!.provenance, sourceType } }] }, lookup).panels[0]!;
    expect(view(panel)).toContain(`<span class="story-badge" data-badge="${sourceType}">${word}</span>`);
  });

  it("states the accuracy always and leaves out a Notes heading when the notes are empty (O-057 T-278)", () => {
    const panel = parse({ panels: [{ ...settingsFile.panels[2]!, provenance: { ...settingsFile.panels[2]!.provenance, accuracy: "Not stated by the source.", notes: "" } }] }, lookup).panels[0]!;
    expect(view(panel)).toContain("<dt>Accuracy</dt><dd>Not stated by the source.</dd>");
    expect(view(panel)).not.toContain("<dt>Notes</dt>");
  });

  it("shows one closed section, details above sources, labelled by whether details exist", () => {
    const markup = view(withDetails);
    expect(markup.match(/<details/g)).toHaveLength(1);
    expect(markup).not.toContain(" open");
    expect(markup).toContain("The details and sources");
    expect(markup.indexOf("Exact figure one.")).toBeLessThan(markup.indexOf("Made-up source B"));
    const plain = view(set.panels[1]!);
    expect(plain.match(/<details/g)).toHaveLength(1);
    expect(plain).not.toContain("The details and sources");
    expect(plain).toContain("Sources");
  });
});
