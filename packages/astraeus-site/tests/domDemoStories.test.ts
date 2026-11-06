// Each demo's own story panels (O-038 T-146; O-059 T-272): the demo parts of browser-story-panels.mjs, read from each demo's scene the way a host reads them (`Scene.panels`), not drawn on a pretend page.
// How the shell draws a panel, its badge, its source lines and its one folded section for the details, and how a scene marker opens it, are generic and held for any made-up story in the engine (packages/astraeus/tests/domStory.test.ts).
// What belongs to a demo is that its panels exist, one marker per panel, each with the words the shell needs (title, badge, body, sources); the wording and order are data (storyStoriesAllDemos.test.ts, storyPanels.test.ts).
import { describe, expect, it } from "vitest";
import type { Scene } from "astraeus";
import { buildApollo11Scene } from "astraeus-demo-apollo11/experiences/apollo11/apollo11Scene";
import { jupiterIoScene } from "astraeus-demo-planets/experiences/jupiter-io/jupiterIo";
import { buildShowerScene } from "astraeus-demo-showers/experiences/showers/showerScene";
import { parseShowerSettings } from "astraeus-demo-showers/experiences/showers/showerSettings";
import { shippedPanelsOf } from "astraeus-demo-showers/tests/helpers/shippedPanels";
import geminidsFile from "astraeus-demo-showers/data/showers/geminids.json";
import perseidsFile from "astraeus-demo-showers/data/showers/perseids.json";

const shower = (file: unknown): Scene => { const settings = parseShowerSettings(file); return buildShowerScene(settings, { kind: "absent" }, shippedPanelsOf(settings)); };
const DEMOS: [string, Scene][] = [["Apollo 11", buildApollo11Scene()], ["Perseids", shower(perseidsFile)], ["Geminids", shower(geminidsFile)], ["Jupiter", jupiterIoScene]];

describe.each(DEMOS)("%s story panels", (_name, scene) => {
  it("has panels, each with a title, a badge, a body, source lines, and a moment of its own in time order", () => {
    const panels = scene.panels;
    expect(panels.length).toBeGreaterThan(0);
    expect(new Set(panels.map((panel) => panel.id)).size).toBe(panels.length);
    for (const panel of panels) {
      expect(panel.title, panel.id).not.toBe("");
      expect(["observed", "modelled", "illustrative"], panel.id).toContain(panel.badge);
      expect(panel.body.length, panel.id).toBeGreaterThan(0);
      expect(panel.sources.length, panel.id).toBeGreaterThan(0);
    }
    expect(panels.map((panel) => panel.timeUtcMs)).toEqual([...panels.map((panel) => panel.timeUtcMs)].sort((a, b) => a - b));
  });
});
