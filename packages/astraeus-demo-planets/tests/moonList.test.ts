import { describe, expect, it } from "vitest";
import { MOON_CATALOGUE_FORMAT, MoonCatalogueError, moonFacts, moonSourceTitles, parseMoonCatalogue } from "../src/experiences/planets/moonList";
import { readJson } from "./helpers/testIo.mjs";

// The moon lists (astraeus-data-<planet>/data/<planet>-moons/list.json) as the planets demo reads them: the reader moved here from the engine with the lists (O-059 T-270);
// the engine's tests keep the lists against the fits (planetMoonCatalogues.test.ts, listedMoons.test.ts).
const DATA = new URL("../../", import.meta.url).pathname;
const PLANETS = ["jupiter", "mars", "saturn", "uranus", "neptune", "pluto"] as const;
const list = (planet: string) => parseMoonCatalogue(readJson(`${DATA}astraeus-data-${planet}/data/${planet}-moons/list.json`));

describe("the moon list reader", () => {
  it.each(PLANETS)("reads %s's list, naming its planet, with every moon in a declared family and every cited source known", (planet) => {
    const catalogue = list(planet);
    expect(catalogue.parent).toBe(planet);
    expect(catalogue.moons.length).toBeGreaterThan(0);
    for (const moon of catalogue.moons) expect(catalogue.families.some((family) => family.id === moon.family), moon.id).toBe(true);
  });

  it("states a moon's facts from the data: family, size and discovery year, with the brightness-based sizes marked", () => {
    const jupiter = list("jupiter");
    const himalia = jupiter.moons.find((moon) => moon.id === "himalia")!;
    const facts = moonFacts(jupiter, himalia);
    expect(facts.map((fact) => fact.label)).toEqual(["Family", "Size", "Found"]);
    expect(facts[0]!.value).toMatch(/Himalia group/);
    expect(facts.find((fact) => fact.label === "Found")!.value).toBe(String(himalia.discoveryYear));
    expect(facts.some((fact) => fact.label === "Sources")).toBe(false);
    const saturn = list("saturn");
    expect(moonFacts(saturn, saturn.moons.find((moon) => moon.id === "s2023-s01")!).find((fact) => fact.label === "Size")!.value).toMatch(/estimated from brightness/);
    expect(moonFacts(jupiter, jupiter.moons.find((moon) => moon.id === "io")!)[0]!.value).toMatch(/big four/);
  });

  it("names the sources of a moon's family, size and discovery, with no task or data-path words", () => {
    const jupiter = list("jupiter");
    const titles = moonSourceTitles(jupiter, jupiter.moons.find((moon) => moon.id === "himalia")!);
    expect(titles.join(" ")).toMatch(/JPL/);
    expect(titles.join(" ")).not.toMatch(/data\/moons|T-09/);
  });

  it("refuses a list in another format, a moon in no family and a moon citing an unknown source", () => {
    const raw = readJson(`${DATA}astraeus-data-mars/data/mars-moons/list.json`) as { moons: Record<string, unknown>[] };
    expect(() => parseMoonCatalogue({ ...raw, format: "other" })).toThrow(MoonCatalogueError);
    expect(() => parseMoonCatalogue({ ...raw, format: "other" })).toThrow(MOON_CATALOGUE_FORMAT);
    expect(() => parseMoonCatalogue({ ...raw, moons: [{ ...raw.moons[0], family: "nowhere" }] })).toThrow(/nowhere/);
    expect(() => parseMoonCatalogue({ ...raw, moons: [{ ...raw.moons[0], sources: { list: "nowhere" } }] })).toThrow(/unknown source/);
  });
});
