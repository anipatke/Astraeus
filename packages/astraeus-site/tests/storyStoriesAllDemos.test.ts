import { describe, expect, it } from "vitest";
import type { ScenePanelRead, Scene } from "astraeus";
import { jupiterIoScene } from "astraeus-demo-planets/experiences/jupiter-io/jupiterIo";
import { buildShowerScene } from "astraeus-demo-showers/experiences/showers/showerScene";
import { parseShowerSettings } from "astraeus-demo-showers/experiences/showers/showerSettings";
import { shippedPanelsOf } from "astraeus-demo-showers/tests/helpers/shippedPanels";
import { madeUpOrbits } from "astraeus-demo-showers/tests/helpers/measuredOrbits";
import geminidsFile from "astraeus-demo-showers/data/showers/geminids.json";

/** O-015 / T-089: stories on every demo. Each demo's panels are story data, read from its scene the way a host reads them (`Scene.panels`, `Scene.timeline`; O-059 T-272). */
const geminids = (): Scene => {
  const settings = parseShowerSettings(geminidsFile);
  return buildShowerScene(settings, { kind: "loaded", orbits: madeUpOrbits(4, 20) }, shippedPanelsOf(settings));
};
/** Every object a panel may mark: the scene's bodies, paths and groups, and the shower's stream. */
const objectIdsOf = (scene: Scene): readonly string[] => [...scene.bodies.map(({ id }) => id), ...scene.paths.map(({ id }) => id), ...scene.groups.map(({ id }) => id), "geminids-stream"];

const stories: readonly [string, Scene, readonly (readonly [string, string, string | undefined])[]][] = [
  ["Geminids", geminids(), [["phaethon", "modelled", "phaethon"], ["best-shower", "observed", "geminids-stream"], ["earth-crossing", "observed", "earth"]]],
  ["Jupiter–Io", jupiterIoScene, [["volcanoes", "observed", "io"], ["squeezed", "modelled", "jupiter"], ["rhythm", "observed", undefined]]],
];

const sentences = (panel: ScenePanelRead): number => panel.body.join(" ").split(/(?<=[.!?])\s+/).filter((part) => part.trim() !== "").length;

describe("short stories for the three demos without one (T-089)", () => {
  it.each(stories)("%s carries three sourced panels, in time order, on its own objects and inside its own timeline", (_name, scene, expected) => {
    const panels = scene.panels;
    expect(panels.map((panel) => [panel.id, panel.provenance.sourceType, panel.object])).toEqual(expected);
    const { windowStartUtcMs, windowEndUtcMs } = scene.timeline;
    for (const panel of panels) {
      expect(panel.timeUtcMs).toBeGreaterThan(windowStartUtcMs);
      expect(panel.timeUtcMs).toBeLessThan(windowEndUtcMs);
      if (panel.object !== undefined) expect(objectIdsOf(scene)).toContain(panel.object);
      expect(panel.provenance.sources.length).toBeGreaterThan(0);
      expect(panel.details.length).toBeGreaterThan(0);
    }
  });

  it.each(stories)("%s reads in the plain voice: two to four sentences, no acronyms, decimals, times or coordinates in the body", (_name, scene) => {
    for (const panel of scene.panels) {
      const body = panel.body.join(" ");
      expect(sentences(panel), panel.id).toBeGreaterThanOrEqual(2);
      expect(sentences(panel), panel.id).toBeLessThanOrEqual(4);
      expect(body, panel.id).not.toMatch(/\b[A-Z]{2,}\b/);
      expect(body, panel.id).not.toMatch(/\d[.,]\d/);
      expect(body, panel.id).not.toMatch(/\d{1,2}:\d{2}/);
      expect(body, panel.id).not.toMatch(/°|\bUTC\b|\bAU\b/);
    }
  });

  it("opens the Geminids Earth panel at the shower's peak", () => {
    // The narrowed (activity) span, which dropped the panels outside it, went with the ?span= option (O-042 Decision 1).
    expect(geminids().panels.find((panel) => panel.id === "earth-crossing")!.timeUtcMs).toBe(Date.parse(geminidsFile.activity.peakUtc));
  });
});
