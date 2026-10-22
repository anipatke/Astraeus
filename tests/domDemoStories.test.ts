// @vitest-environment happy-dom
// Each demo's own story panels on the pretend page (O-038 T-146): the demo parts of browser-story-panels.mjs. A timeline marker per panel, and every panel, asked for by its scene marker, shows its
// title, its badge, its body and its source lines, with its details in the one folded section. How panels open and hold on playback is generic (tests/domStory.test.ts); the wording and order
// of each demo's panels are data (tests/storyStoriesAllDemos.test.ts, tests/storyPanels.test.ts); the scene markers' drawing is the smoke check.
import { afterEach, describe, expect, it } from "vitest";
import { apollo11Experience } from "../src/experiences/apollo11/apollo11";
import { jupiterIoExplorer } from "../src/experiences/jupiter-io/jupiterIo";
import { buildShowerDefinition } from "../src/experiences/showers/showerDefinition";
import { parseShowerSettings } from "../src/experiences/showers/showerSettings";
import type { ExperienceConfig } from "../src/shell/experience";
import geminidsFile from "../data/showers/geminids.json";
import perseidsFile from "../data/showers/perseids.json";
import { $, mountShell, press, type Mounted } from "./domSetup";

const shower = (file: unknown): ExperienceConfig => buildShowerDefinition(parseShowerSettings(file), { kind: "absent" }).experience;
const DEMOS: [string, ExperienceConfig][] = [["Apollo 11", apollo11Experience], ["Perseids", shower(perseidsFile)], ["Geminids", shower(geminidsFile)], ["Jupiter", jupiterIoExplorer.experience]];

let m: Mounted | undefined;
afterEach(() => { m?.unmount(); m = undefined; });

describe.each(DEMOS)("%s story panels", (_name, experience) => {
  const panels = experience.storyPanels!.panels;

  it("has a timeline marker per panel", () => {
    m = mountShell({ experience });
    expect(m.container.querySelectorAll(".timeline-panel-marker")).toHaveLength(panels.length);
  });

  it("shows each panel by its scene marker's request, with its badge, body, source lines and one folded section for the details", () => {
    m = mountShell({ experience });
    for (const panel of panels) {
      m.requestPanel(panel.id);
      const shown = $(m.container, ".story-panel");
      expect(shown.getAttribute("data-panel-id")).toBe(panel.id);
      expect($(shown, ".story-badge").getAttribute("data-badge")).toBe(panel.badge);
      for (const paragraph of panel.body) expect(shown.textContent).toContain(paragraph);
      expect(panel.sources.length).toBeGreaterThan(0);
      const section = $(shown, ".sources-section") as HTMLDetailsElement;
      expect(shown.querySelectorAll(".sources-section")).toHaveLength(1);
      expect(section.open).toBe(false);
      press($(section, "summary"));
      expect(section.open).toBe(true);
      for (const source of panel.sources) expect(shown.textContent).toContain(source);
      for (const detail of panel.details ?? []) expect(shown.textContent).toContain(detail);
      press($(shown, ".story-panel-close"));
      expect(m.container.querySelector(".story-panel")).toBeNull();
    }
  });
});
