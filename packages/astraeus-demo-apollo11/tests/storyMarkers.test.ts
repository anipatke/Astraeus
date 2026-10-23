import { describe, expect, it } from "vitest";
import { groupStoryMarkers, panelForMarkerPress, type StoryMarkerSpec } from "../../astraeus/src/app/StoryMarkers";
import { parseStoryPanels } from "../../astraeus/src/shell/storyPanels";

/**
 * I-031: a synthetic story (no mission, no real dataset) with three panels on one made-up object and one on another.
 * Built the way the app builds scene-marker specs from a story's panels.
 */
const START = Date.UTC(2100, 0, 1);
const MIN = 60_000;
const story = parseStoryPanels({
  panels: [
    { id: "dock", at: { utc: "2100-01-01T01:30:00Z" }, object: "lander", title: "Docking", body: "D.", badge: "observed", sources: ["Made-up source D"] },
    { id: "descend", at: { utc: "2100-01-01T00:10:00Z" }, object: "lander", title: "Descent", body: "A.", badge: "observed", sources: ["Made-up source A"] },
    { id: "orbit", at: { utc: "2100-01-01T00:20:00Z" }, object: "mothership", title: "Orbit", body: "O.", badge: "modelled", sources: ["Made-up source O"] },
    { id: "land", at: { utc: "2100-01-01T00:25:00Z" }, object: "lander", title: "Landing", body: "B.", badge: "observed", sources: ["Made-up source B"] },
    { id: "loose", at: { utc: "2100-01-01T00:40:00Z" }, title: "No object", body: "N.", badge: "illustrative", sources: ["Made-up source N"] },
  ],
}, { events: [] });
const specs: StoryMarkerSpec[] = story.panels.flatMap((panel) => (panel.objectId === undefined ? [] : [{ panelId: panel.id, objectId: panel.objectId, title: panel.title, timeUtcMs: panel.timeUtcMs }]));

describe("stacked story markers on one object (I-031)", () => {
  const groups = groupStoryMarkers(specs);
  const lander = groups.find((group) => group.objectId === "lander")!;

  it("draws one marker per object, carrying every panel that names it in time order", () => {
    expect(groups.map((group) => group.objectId)).toEqual(["lander", "mothership"]);
    expect(lander.panels.map((panel) => panel.panelId)).toEqual(["descend", "land", "dock"]);
    expect(groups.find((group) => group.objectId === "mothership")!.panels.map((panel) => panel.panelId)).toEqual(["orbit"]);
  });

  it("opens the panel the clock has reached, or the first before them all", () => {
    expect(panelForMarkerPress(lander, START, null)).toBe("descend");
    expect(panelForMarkerPress(lander, START + 10 * MIN, null)).toBe("descend");
    expect(panelForMarkerPress(lander, START + 26 * MIN, null)).toBe("land");
    expect(panelForMarkerPress(lander, START + 200 * MIN, null)).toBe("dock");
    expect(panelForMarkerPress(lander, START + 26 * MIN, "orbit"), "a panel on another object is open").toBe("land");
  });

  it("reaches every panel on the object from the scene: each press moves to the next, wrapping round", () => {
    const reached = new Set<string>();
    let open: string | null = null;
    for (let press = 0; press < lander.panels.length; press += 1) {
      open = panelForMarkerPress(lander, START + 26 * MIN, open);
      reached.add(open);
    }
    expect([...reached].sort()).toEqual(["descend", "dock", "land"]);
    expect(panelForMarkerPress(lander, START, "dock")).toBe("descend");
  });

  it("a single-panel marker always opens its one panel", () => {
    const single = groups.find((group) => group.objectId === "mothership")!;
    expect(panelForMarkerPress(single, START, null)).toBe("orbit");
    expect(panelForMarkerPress(single, START, "orbit")).toBe("orbit");
  });
});

describe("the demo stories' scene markers (T-088 Done When 5)", () => {
  it("never stack two markers on one object, and every Apollo 11 panel has a scene marker", async () => {
    const { apollo11Experience } = await import("../src/experiences/apollo11/apollo11");
    const panels = apollo11Experience.storyPanels?.panels ?? [];
    const apolloSpecs = panels.flatMap((panel) => (panel.objectId === undefined ? [] : [{ panelId: panel.id, objectId: panel.objectId, title: panel.title, timeUtcMs: panel.timeUtcMs }]));
    expect(apolloSpecs.map((spec) => spec.panelId)).toEqual(panels.map((panel) => panel.id));
    const groups = groupStoryMarkers(apolloSpecs);
    expect(new Set(groups.map((group) => group.objectId)).size).toBe(groups.length);
    expect(groups.flatMap((group) => group.panels.map((panel) => panel.panelId)).sort()).toEqual(panels.map((panel) => panel.id).sort());
    expect(groups.find((group) => group.objectId === "eagle")!.panels.map((panel) => panel.panelId)).toEqual(["powered-descent", "touchdown", "ascent-docking"]);
  });
});
