import { describe, expect, it } from "vitest";
import { catalogue } from "../src/assets/catalogue";
import assets from "../assets.html?raw";
import index from "../index.html?raw";
import { MOON_PLANETS, generatedBlocks, markers } from "../tools/site/assets-sections.mjs";
import { exists, readJson } from "../tools/import/test-io.mjs";

/**
 * T-120: the planet moon sections and the tagged-places section of assets.html are generated from the data by tools/site/assets-sections.mjs
 * (run `node tools/site/assets-sections.mjs` after a data change); the home shelf and the demo card are hand-written and checked here against the same data and records.
 */
const ROOT = new URL("../", import.meta.url).pathname;
interface Moon { id: string; bodyPackage: string | null }
const moonList = (planet: string): readonly Moon[] => (readJson(`${ROOT}data/moons/${planet}.json`) as { moons: Moon[] }).moons;
const bodies = (readJson(`${ROOT}data/bodies/catalogue.json`) as { bodies: { body: string; parent: string | null; featureCount: number }[] }).bodies;

describe("assets page sections follow the data (T-120)", () => {
  for (const [name, block] of Object.entries(generatedBlocks() as Record<string, string>)) {
    it(`the ${name} block is exactly what the generator writes`, () => {
      const { start, end } = markers(name) as { start: string; end: string };
      const found = assets.slice(assets.indexOf(start) + start.length, assets.indexOf(end));
      expect(assets.includes(start) && assets.includes(end)).toBe(true);
      expect(found === block).toBe(true);
    });
  }

  it("lists every moon of Mars, Saturn, Uranus, Neptune and Pluto once, and every tagged place of every body", () => {
    for (const planet of MOON_PLANETS as string[]) {
      const listed = [...assets.matchAll(new RegExp(`data-planet-moon="${planet}/([^"]+)"`, "g"))].map((m) => m[1]);
      expect(listed.sort(), planet).toEqual(moonList(planet).map((moon) => moon.id).sort());
    }
    for (const entry of bodies) {
      const features = (readJson(`${ROOT}data/bodies/${entry.body}/features.json`) as { features: { id: string }[] }).features;
      expect(features.length, entry.body).toBe(entry.featureCount);
      const listed = [...assets.matchAll(new RegExp(`data-place="${entry.body}/([^"]+)"`, "g"))].map((m) => m[1]);
      expect(listed, entry.body).toEqual(features.map((feature) => feature.id));
      expect(assets).toContain(`data-places-body="${entry.body}" data-count="${entry.featureCount}"`);
    }
  });

  it("marks a body shown only when some planet's settings list it, with the count the app draws (I-049)", () => {
    const listed = new Map<string, number>();
    for (const file of ["mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"]) {
      for (const body of (readJson(`${ROOT}data/planets/${file}.json`) as { bodyFeatures: string[] }).bodyFeatures) {
        const list = (readJson(`${ROOT}data/bodies/${body}/features.json`) as { features: { latitude?: number; ringRadius?: number; moonRadius?: number }[] }).features;
        listed.set(body, list.filter((f) => f.latitude !== undefined && f.ringRadius === undefined && f.moonRadius === undefined).length);
      }
    }
    for (const entry of bodies) {
      const tag = new RegExp(`data-places-body="${entry.body}"[^>]*data-shown="(yes|no)"(?: data-shown-count="(\\d+)")?`).exec(assets)!;
      expect(tag[1], entry.body).toBe(listed.has(entry.body) ? "yes" : "no");
      if (listed.has(entry.body)) expect(Number(tag[2]), entry.body).toBe(listed.get(entry.body));
    }
    expect(assets).toMatch(/data-places-body="jupiter"[^>]*data-shown="no"/);
    expect(listed.get("pluto")).toBe(12);
  });
});

describe("home shelf and demo card (T-120)", () => {
  const shelf = index.slice(index.indexOf('<div class="globes"'), index.indexOf('<div class="shelf2"'));
  const PLANETS = ["sun", "mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];
  const globes = [...shelf.matchAll(/<div class="globe">(.*?)<\/div>(?=\s*<div class="globe">|\s*<\/div>)/gs)].map((m) => m[0]);

  it("is one row of the Sun and the nine planets, in order, each with a thumbnail that exists", () => {
    expect(globes.map((g) => /<b>(.*?)<\/b>/.exec(g)?.[1].toLowerCase())).toEqual(PLANETS);
    for (const g of globes) {
      const file = /url\((site\/[^)]+)\)/.exec(g)?.[1];
      expect(file !== undefined && exists(`${ROOT}${file}`), g).toBe(true);
    }
  });

  it("shows each planet's licence from its record and a moon count from the data, linked to a section that exists", () => {
    for (const g of globes) {
      const id = /<b>(.*?)<\/b>/.exec(g)?.[1].toLowerCase() ?? "";
      const chip = /<\/b><span>(.*?)<\/span>/.exec(g)?.[1] ?? "";
      const licence = catalogue.get(id).visual.texture?.licence?.licence;
      if (licence === undefined) throw new Error(`${id} has no texture licence`);
      const expected = licence === "public domain" ? "NASA Earth Observatory" : licence.startsWith("NASA/JPL") ? "NASA/JPL" : licence;
      expect(chip, id).toBe(expected);
      const count = id === "earth" ? bodies.filter((b) => b.parent === "earth").length : MOON_PLANETS.concat("jupiter").includes(id) ? moonList(id).length : 0;
      const link = /<a class="moons" href="assets\.html#([^"]+)">\+(\d+) (moons?)<\/a>/.exec(g);
      if (count === 0) { expect(link, id).toBeNull(); continue; }
      expect(link, id).not.toBeNull();
      expect(Number(link?.[2]), id).toBe(count);
      expect(link?.[3]).toBe(count === 1 ? "moon" : "moons");
      expect(assets, id).toContain(`id="${link?.[1]}"`);
    }
  });

  it("points the demo card at the planets demo and counts the mapped moons from the records", () => {
    expect(index).toContain('<a class="demo" href="app.html?experience=planets">');
    expect(index).not.toContain("experience=jupiter-io");
    const mapped = [...MOON_PLANETS, "jupiter"].flatMap((planet) => moonList(planet as string)).filter((moon) => moon.bodyPackage !== null).length + bodies.filter((b) => b.parent === "earth").length;
    expect(index).toContain(`${mapped} as mapped globes`);
  });
});
