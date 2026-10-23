import { describe, expect, it } from "vitest";
import { jupiterIoExplorer } from "astraeus-demo-planets/experiences/jupiter-io/jupiterIo";
import { buildShowerDefinition } from "astraeus-demo-showers/experiences/showers/showerDefinition";
import { parseShowerSettings } from "astraeus-demo-showers/experiences/showers/showerSettings";
import type { ExperienceConfig } from "astraeus/shell/experience";
import type { StoryPanel } from "astraeus/shell/storyPanels";
import { shippedPanelsOf } from "astraeus-demo-showers/tests/helpers/shippedPanels";
import geminidsFile from "astraeus-demo-showers/data/showers/geminids.json";

/** O-015 / T-089: stories on every demo. Each demo's panels are story data, read through the same generic panel path. */
const geminids = (span?: "activity") => {
  const file = span === undefined ? geminidsFile : { ...geminidsFile, timeline: { ...geminidsFile.timeline, span } };
  const settings = parseShowerSettings(file);
  return buildShowerDefinition(settings, { kind: "absent" }, undefined, shippedPanelsOf(settings)).experience;
};

const stories: readonly [string, ExperienceConfig, readonly (readonly [string, string, string | undefined])[]][] = [
  ["Geminids", geminids(), [["phaethon", "modelled", "phaethon"], ["best-shower", "observed", "geminids-stream"], ["earth-crossing", "observed", "earth"]]],
  ["Jupiter–Io", jupiterIoExplorer.experience, [["volcanoes", "observed", "io"], ["squeezed", "modelled", "jupiter"], ["rhythm", "observed", undefined]]],
];

const sentences = (panel: StoryPanel): number => panel.body.join(" ").split(/(?<=[.!?])\s+/).filter((part) => part.trim() !== "").length;

describe("short stories for the three demos without one (T-089)", () => {
  it.each(stories)("%s carries three sourced panels, in time order, on its own objects and inside its own timeline", (_name, experience, expected) => {
    const panels = experience.storyPanels?.panels ?? [];
    expect(panels.map((panel) => [panel.id, panel.badge, panel.objectId])).toEqual(expected);
    for (const panel of panels) {
      expect(panel.timeUtcMs).toBeGreaterThan(experience.window.startUtcMs);
      expect(panel.timeUtcMs).toBeLessThan(experience.window.endUtcMs);
      if (panel.objectId !== undefined) expect(experience.objects.map((object) => object.id).concat("geminids-stream")).toContain(panel.objectId);
      expect(panel.sources.length).toBeGreaterThan(0);
      expect(panel.details.length).toBeGreaterThan(0);
    }
  });

  it.each(stories)("%s reads in the plain voice: two to four sentences, no acronyms, decimals, times or coordinates in the body", (_name, experience) => {
    for (const panel of experience.storyPanels?.panels ?? []) {
      const body = panel.body.join(" ");
      expect(sentences(panel), panel.id).toBeGreaterThanOrEqual(2);
      expect(sentences(panel), panel.id).toBeLessThanOrEqual(4);
      expect(body, panel.id).not.toMatch(/\b[A-Z]{2,}\b/);
      expect(body, panel.id).not.toMatch(/\d[.,]\d/);
      expect(body, panel.id).not.toMatch(/\d{1,2}:\d{2}/);
      expect(body, panel.id).not.toMatch(/°|\bUTC\b|\bAU\b/);
    }
  });

  it("opens the Geminids Earth panel at the shower's peak, and keeps the two December panels in the narrowed (activity) view", () => {
    const year = geminids().storyPanels!;
    expect(year.panels.find((panel) => panel.id === "earth-crossing")!.timeUtcMs).toBe(Date.parse(geminidsFile.activity.peakUtc));
    const activity = geminids("activity");
    expect(activity.storyPanels!.panels.map((panel) => panel.id)).toEqual(["best-shower", "earth-crossing"]);
    // Strictly after the narrowed start, so forward playback from the start crosses it and opens it.
    expect(activity.storyPanels!.panels[0]!.timeUtcMs).toBeGreaterThan(activity.window.startUtcMs);
  });
});
