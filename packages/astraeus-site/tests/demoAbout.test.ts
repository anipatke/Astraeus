// O-079 T-327: every demo the site mounts carries an About (the bar's title) with at least one credit, built from the records that already hold its name and credits:
// the label the page heading reads, the demo package's `credits/CREDITS.md` lines and the licence records of the pictures the viewer draws. Each demo is built here with the
// builders the site's entry uses, then given the About the entry gives it (`demoAbout`).
import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import type { AboutInput, Scene } from "astraeus";
import { dataSource as pictureData } from "astraeus-data";
import { APOLLO11_LABEL, buildApollo11Scene } from "astraeus-demo-apollo11/experiences/apollo11/apollo11Scene";
import { buildPlanetScene } from "astraeus-demo-planets/experiences/planets/planetScene";
import { parsePlanetSettings } from "astraeus-demo-planets/experiences/planets/planetSettings";
import { PLANET_SYSTEMS } from "astraeus-demo-planets/experiences/planets/planetSystems";
import noPanels from "astraeus-demo-planets/data/stories/no-panels/panels.json";
import { buildShowerScene } from "astraeus-demo-showers/experiences/showers/showerScene";
import { parseShowerSettings } from "astraeus-demo-showers/experiences/showers/showerSettings";
import { madeUpOrbits } from "astraeus-demo-showers/tests/helpers/measuredOrbits";
import apolloCredits from "astraeus-demo-apollo11/credits/CREDITS.md?raw";
import planetsCredits from "astraeus-demo-planets/credits/CREDITS.md?raw";
import showersCredits from "astraeus-demo-showers/credits/CREDITS.md?raw";
import { creditLines, demoAbout, type DemoAboutSource } from "../src/demoAbout";
import { buildSyntheticScene } from "../src/synthetic/syntheticScene";
import { buildSyntheticRingScene } from "../src/synthetic/syntheticRingScene";
import { buildSyntheticBeltScene } from "../src/synthetic/syntheticBeltScene";
import { buildSyntheticListedScene } from "../src/synthetic/syntheticListedScene";
import { buildSyntheticEccentricScene } from "../src/synthetic/syntheticEccentricScene";
import { buildSyntheticProbeScene } from "../src/synthetic/syntheticProbeScene";
import { buildSyntheticViewsScene } from "../src/synthetic/syntheticViewsScene";
import { buildSyntheticLookOutScene, loadLookOutPlanets } from "../src/synthetic/syntheticLookOutScene";

const PLANET_FILES = import.meta.glob<unknown>("../../astraeus-demo-planets/data/planets/*.json", { eager: true, import: "default" });
const SHOWER_FILES = import.meta.glob<unknown>("../../astraeus-demo-showers/data/showers/*.json", { eager: true, import: "default" });
const MAIN = readFileSync(new URL("../src/main.tsx", import.meta.url), "utf8");

async function demos(): Promise<[string, DemoAboutSource][]> {
  const found: [string, DemoAboutSource][] = [["Apollo 11", { scene: buildApollo11Scene(), data: [pictureData], label: APOLLO11_LABEL, credits: apolloCredits }]];
  for (const file of Object.values(PLANET_FILES)) {
    const settings = parsePlanetSettings(file);
    const system = (await PLANET_SYSTEMS[settings.system]!())[`${settings.system}System`]!;
    found.push([settings.label, { scene: buildPlanetScene(settings, system, noPanels), data: [pictureData, ...system.data], label: settings.experienceLabel, shortLabel: settings.label, credits: planetsCredits }]);
  }
  for (const file of Object.values(SHOWER_FILES)) {
    const settings = parseShowerSettings(file);
    found.push([settings.label, { scene: buildShowerScene(settings, { kind: "loaded", orbits: madeUpOrbits(4, 20) }), data: [pictureData], label: settings.label, credits: showersCredits }]);
  }
  await loadLookOutPlanets();
  const madeUp: [string, () => Scene][] = [["synthetic", buildSyntheticScene], ["synthetic-ring", buildSyntheticRingScene], ["synthetic-belt", buildSyntheticBeltScene], ["synthetic-listed", buildSyntheticListedScene],
    ["synthetic-eccentric", buildSyntheticEccentricScene], ["synthetic-probe", buildSyntheticProbeScene], ["synthetic-views", buildSyntheticViewsScene], ["synthetic-lookout", buildSyntheticLookOutScene]];
  for (const [name, build] of madeUp) found.push([name, { scene: build(), data: [pictureData] }]);
  return found;
}

describe("every demo's About (O-079 T-327)", () => {
  let all: [string, DemoAboutSource][] = [];
  beforeAll(async () => { all = await demos(); }, 60_000);

  it("is set by the site's entry on every scene it mounts, from the scene's own record", () => {
    expect(MAIN).toContain("built.scene.setAbout(demoAbout(built));");
    for (const name of ["astraeus-demo-apollo11", "astraeus-demo-planets", "astraeus-demo-showers"]) expect(MAIN).toContain(`import("${name}/credits/CREDITS.md?raw")`);
    expect(MAIN.match(/credits: credits\.default/g)).toHaveLength(3);
  });

  it("names each demo and lists at least one credit, every link an http(s) address, and the scene accepts it", () => {
    expect(all.length).toBeGreaterThan(10);
    for (const [name, source] of all) {
      const about = demoAbout(source);
      expect(about.title, name).toBe(source.label ?? "Astraeus");
      expect(about.credits?.length, name).toBeGreaterThan(0);
      for (const credit of about.credits ?? []) if (credit.url !== undefined) expect(credit.url, name).toMatch(/^https?:\/\//);
      const read: AboutInput | undefined = source.scene.setAbout(about).about;
      expect(read?.credits, name).toEqual(about.credits);
    }
  });

  it("gives a planet its planet's name as the short title, and none where the name is the title", () => {
    const jupiter = demoAbout(all.find(([name]) => name === "Jupiter")![1]);
    expect([jupiter.title, jupiter.shortTitle]).toEqual(["Jupiter and Io", "Jupiter"]);
    expect(demoAbout(all.find(([name]) => name === "Mercury")![1]).shortTitle).toBeUndefined();
  });

  it("lists the demo package's credit lines first, word for word, each with its source link", () => {
    const apollo = demoAbout(all[0]![1]);
    const lines = creditLines(apolloCredits);
    expect(lines.length).toBeGreaterThan(0);
    expect(apollo.credits?.slice(0, lines.length)).toEqual(lines);
    for (const file of [apolloCredits, planetsCredits, showersCredits]) for (const line of creditLines(file)) expect(line.url, line.text).toMatch(/^https:\/\//);
  });

  it("credits every picture the viewer draws with the credit line its licence record asks for, linking to its source", () => {
    const apollo = all[0]![1];
    const earth = apollo.scene.bodies.find((body) => body.id === "earth")!.texture!.licence!;
    expect(demoAbout(apollo).credits).toContainEqual({ text: earth.attribution ?? `${earth.source}, ${earth.licence}`, url: earth.url });
  });
});
