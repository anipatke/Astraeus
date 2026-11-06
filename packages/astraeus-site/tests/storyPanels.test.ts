import { describe, expect, it } from "vitest";
import { buildApollo11Scene } from "astraeus-demo-apollo11/experiences/apollo11/apollo11Scene";
import apolloPanelsFile from "astraeus-demo-apollo11/data/stories/apollo11/panels.json";
import perseidsPanelsFile from "astraeus-demo-showers/data/stories/perseids/panels.json";
import bodiesBeforeT088 from "./fixtures/storyPanelBodiesBeforeT088.json";

// The story panel parser, opening rule and view are held in the engine on a made-up story (packages/astraeus/tests/storyPanelSettings.test.ts, O-059 T-272); what stays here is the demos' own panels.

describe("the demo wiring (T-059 Done When 5)", () => {
  it("gives the first demo story seven sourced panels, in mission order, that sit on its own anchors and objects", () => {
    const scene = buildApollo11Scene();
    const panels = scene.panels;
    const objects = [...scene.bodies.map(({ id }) => id), ...scene.paths.map(({ id }) => id), ...scene.groups.map(({ id }) => id)];
    const { windowStartUtcMs, windowEndUtcMs } = scene.timeline;
    expect(panels.map((panel) => panel.id)).toEqual(["tli-cutoff", "loi", "powered-descent", "touchdown", "ascent-docking", "tei", "splashdown"]);
    for (const panel of panels) {
      expect(panel.sources.length).toBeGreaterThan(0);
      expect(panel.sources.some((line) => /Mission Report \(MSC-00171\), Table \d-[IVX]+, p\. \d-\d+/.test(line))).toBe(true);
      expect(panel.badge).toBe("observed");
      expect(panel.body.length).toBeGreaterThanOrEqual(1);
      if (panel.object !== undefined) expect(objects).toContain(panel.object);
      expect(panel.timeUtcMs).toBeGreaterThanOrEqual(windowStartUtcMs);
      expect(panel.timeUtcMs).toBeLessThanOrEqual(windowEndUtcMs);
    }
    expect(panels[0]!.timeUtcMs).toBe(-14542676800);
    expect(panels[3]!.timeUtcMs).toBe(-14182940100);
    expect(panels.map((panel) => panel.timeUtcMs)).toEqual([...panels.map((panel) => panel.timeUtcMs)].sort((a, b) => a - b));
  });
});

describe("warm, plain words with every figure kept in details (T-088 Done When 2-4)", () => {
  type RawPanel = { readonly id: string; readonly title: string; readonly body: readonly string[]; readonly details?: readonly string[]; readonly badge: string; readonly sources: readonly string[] };
  const stories: Readonly<Record<string, readonly RawPanel[]>> = {
    apollo11: (apolloPanelsFile as { panels: RawPanel[] }).panels,
    perseids: (perseidsPanelsFile as { panels: RawPanel[] }).panels,
  };
  /** The bodies before T-088, frozen, so the test can prove nothing they said was lost. */
  const before = bodiesBeforeT088 as unknown as Readonly<Record<string, Readonly<Record<string, readonly string[]>>>>;
  /** Old sentences whose wording T-088 made more precise in details instead of copying: the more precise text must be there. */
  const madeMorePrecise: Readonly<Record<string, string>> = {
    "Eagle touched down at ground elapsed time 102:45:39.9 (20:17:40 UTC, 20 July 1969), at 0.674° N, 23.473° E on the Moon.":
      "Eagle touched down at ground elapsed time 102:45:39.9 (20:17:40 UTC, 20 July 1969), at 0.674° N, 23.473° E on the Moon (Landing Site 2).",
    "The Perseids are active from mid-July to late August and peak on the night of 12–13 August, at about 100 meteors an hour at best.":
      "The Perseids are active from mid-July to late August (17 July to 24 August) and peak on the night of 12–13 August, at about 100 meteors an hour at best",
    "At the far end of its orbit the comet is about 51 AU from the Sun, well beyond Neptune.":
      "At the far end of its orbit the comet is about 51 AU from the Sun (51 times Earth's distance from the Sun), well beyond Neptune.",
  };
  const sentences = (paragraphs: readonly string[]): string[] => paragraphs.flatMap((paragraph) => paragraph.split(/(?<=[.!?])\s+(?=[A-Z])/)).map((sentence) => sentence.trim()).filter(Boolean);
  const numbers = (text: string): string[] => text.match(/\d[\d,.:]*\d|\d/g) ?? [];
  const panels = Object.entries(stories).flatMap(([story, list]) => list.map((panel) => ({ story, panel })));

  it.each(panels.map(({ story, panel }) => [`${story}/${panel.id}`, story, panel] as const))("%s: no fact lost from the old body", (_name, story, panel) => {
    const old = before[story]?.[panel.id];
    expect(old, "a frozen old body for every panel").toBeDefined();
    const details = (panel.details ?? []).join(" ");
    for (const figure of numbers(old!.join(" "))) expect(details, `figure ${figure}`).toContain(figure);
    for (const sentence of sentences(old!)) expect(details, `old sentence: ${sentence}`).toContain(madeMorePrecise[sentence] ?? sentence);
  });

  it.each(panels.map(({ story, panel }) => [`${story}/${panel.id}`, panel] as const))("%s: the body reads like a museum label", (_name, panel) => {
    const body = panel.body.join(" ");
    const count = sentences(panel.body).length;
    expect(count, "two to four short sentences").toBeGreaterThanOrEqual(2);
    expect(count).toBeLessThanOrEqual(4);
    for (const sentence of sentences(panel.body)) expect(sentence.split(/\s+/).length, `short sentence: ${sentence}`).toBeLessThanOrEqual(26);
    expect(body, "no acronyms").not.toMatch(/\b[A-Z]{2,}\b|S-IVB/);
    expect(body, "no jargon").not.toMatch(/\b(anchor|interpolation|ground elapsed|radiant|perihelion|aphelion|zenithal)\b/i);
    expect(body, "no decimals").not.toMatch(/\d\.\d/);
    expect(body, "no coordinates").not.toMatch(/°/);
    expect(body, "no timestamps").not.toMatch(/\d:\d\d/);
    expect(numbers(body).length, "at most one everyday number").toBeLessThanOrEqual(1);
    for (const figure of numbers(body)) expect((panel.details ?? []).join(" "), `the working for ${figure} is in details`).toContain(figure);
    expect(panel.title, "a plain title").not.toMatch(/\d|\b[A-Z]{2,}\b/);
    expect(panel.title.split(/\s+/).length).toBeLessThanOrEqual(6);
  });

  it("keeps every panel's badge, with at least one source line", () => {
    const badges = Object.fromEntries(panels.map(({ panel }) => [panel.id, panel.badge]));
    expect(badges).toEqual({
      "tli-cutoff": "observed", loi: "observed", "powered-descent": "observed", touchdown: "observed", "ascent-docking": "observed", tei: "observed", splashdown: "observed",
      "stream-shape": "illustrative", "earth-crossing": "observed", "swift-tuttle": "modelled",
    });
    for (const { panel } of panels) expect(panel.sources.length).toBeGreaterThanOrEqual(1);
  });
});
