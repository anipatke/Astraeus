import { describe, expect, it } from "vitest";
import { DEFAULT_BODY_SET_LOOK, familyGainOf } from "../src/app/bodySet";
import { JUPITER_MOON_CATALOGUE } from "../src/assets/bodies/jupiterMoonCatalogue";
import { moonFacts } from "../src/assets/moonCatalogue";
import { jupiterIoExplorer } from "../src/experiences/jupiter-io/jupiterIo";
import { infoView } from "../src/shell/infoModel";
import { moonCountText, moonFamilyListSummary, moonListDateText, searchMoons, splitNamed } from "../src/shell/moonFamilies";

// O-025 T-099: the moon panel's model (families, counts, named first, search), the moon facts, the highlight and the panel's links to the scene.
const list = jupiterIoExplorer.experience.moonFamilies!;

describe("moon panel model", () => {
  it("lists every catalogued moon once, under its family, with counts from the data", () => {
    expect(list.families.map((family) => family.id)).toEqual(JUPITER_MOON_CATALOGUE.families.map((family) => family.id));
    expect(list.families.flatMap((family) => family.moons.map((moon) => moon.id)).sort()).toEqual(JUPITER_MOON_CATALOGUE.moons.map((moon) => moon.id).sort());
    expect(list.featuredFamilyId).toBe("galilean");
    expect(list.families[0].moons.every((moon) => moon.pictureUrl !== undefined)).toBe(true);
    expect(moonCountText(1)).toBe("1 moon");
    expect(moonCountText(41)).toBe("41 moons");
  });

  it("states the total and the Horizons list date from the data, in the panel, Jupiter's information and a small moon's sources (I-045)", () => {
    const total = JUPITER_MOON_CATALOGUE.moons.length;
    const date = moonListDateText(JUPITER_MOON_CATALOGUE.asOf);
    expect(date).toMatch(/^\d{1,2} [A-Z][a-z]+ \d{4}$/);
    expect(list.listDate).toBe(JUPITER_MOON_CATALOGUE.asOf);
    const summary = moonFamilyListSummary(list);
    expect(summary).toContain(`${total} moons`);
    expect(summary).toContain(date);
    const jupiter = jupiterIoExplorer.experience.objects.find((object) => object.id === "jupiter")!;
    const fact = jupiter.facts!.find((entry) => entry.label === "Known moons")!;
    expect(fact.value).toContain(`${total} moons`);
    expect(fact.value).toContain(date);
    const small = jupiterIoExplorer.experience.objects.find((object) => object.id === "himalia")!;
    expect(small.provenance!.sources.join(" ")).toContain(date);
    expect(small.facts!.find((entry) => entry.label === "Moon list fetched")!.value).toContain(date);
    expect(moonListDateText("not a date")).toBe("not a date");
  });

  it("puts named moons first and folds provisional designations apart", () => {
    const carme = list.families.find((family) => family.id === "carme")!;
    const { named, unnamed } = splitNamed(carme.moons);
    expect(named.length).toBe(14);
    expect(unnamed.length).toBe(27);
    expect(named.every((moon) => moon.named) && unnamed.every((moon) => !moon.named)).toBe(true);
  });

  it("searches by name or designation as the viewer types, ignoring case and punctuation", () => {
    expect(searchMoons(list, "himalia").map((match) => match.moon.id)).toContain("himalia");
    expect(searchMoons(list, "HIMAL")[0].familyLabel).toMatch(/Himalia/);
    expect(searchMoons(list, "s2003 j19").map((match) => match.moon.id)).toEqual(["s2003-j19"]);
    expect(searchMoons(list, "  ")).toEqual([]);
    expect(searchMoons(list, "zzzz")).toEqual([]);
  });

  it("makes every listed moon an object the shell can select, with family, size, discovery and sources in its information", () => {
    const objects = jupiterIoExplorer.experience.objects;
    for (const family of list.families) for (const moon of family.moons) expect(objects.some((object) => object.id === moon.id), moon.id).toBe(true);
    const view = infoView(jupiterIoExplorer.experience, { kind: "object", id: "himalia" })!;
    const labels = view.facts!.map((fact) => fact.label);
    expect(labels).toEqual(["Family", "Size", "Found", "Sources", "Moon list fetched"]);
    expect(view.facts![0].value).toMatch(/Himalia group/);
    expect(view.provenance).not.toBeNull();
    const io = infoView(jupiterIoExplorer.experience, { kind: "object", id: "io" })!;
    expect(io.facts![0].value).toMatch(/big four/);
  });

  it("states a moon's facts from the data", () => {
    const himalia = JUPITER_MOON_CATALOGUE.moons.find((moon) => moon.id === "himalia")!;
    const facts = moonFacts(JUPITER_MOON_CATALOGUE, himalia);
    expect(facts.find((fact) => fact.label === "Found")!.value).toBe(String(himalia.discoveryYear));
    expect(facts.find((fact) => fact.label === "Sources")!.value).toMatch(/JPL/);
  });
});

describe("family highlight", () => {
  it("brightens only the lit family's orbit lines, by a live setting, unless a family gain is set", () => {
    const lit = { ...DEFAULT_BODY_SET_LOOK, highlightFamily: "carme" };
    expect(familyGainOf(DEFAULT_BODY_SET_LOOK, "carme")).toBe(1);
    expect(familyGainOf(lit, "carme")).toBe(DEFAULT_BODY_SET_LOOK.highlightOrbitGain);
    expect(familyGainOf(lit, "ananke")).toBe(1);
    expect(familyGainOf({ ...lit, highlightOrbitGain: 7 }, "carme")).toBe(7);
    expect(familyGainOf({ ...lit, familyGains: { carme: 2 } }, "carme")).toBe(2);
  });
});
