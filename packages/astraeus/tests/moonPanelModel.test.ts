import { describe, expect, it } from "vitest";
import { DEFAULT_BODY_SET_LOOK, familyGainOf } from "../src/app/bodySet";
import { moonCountText, moonFamilyListSummary, moonListDateText, searchMoons, splitNamed } from "../src/shell/moonFamilies";
import { jupiterMoonPanel, jupiterRawList } from "./helpers/jupiterMoonPanel";

// O-025 T-099: the moon panel's model (families, counts, named first, search) and the family highlight, on Jupiter's real moon list (astraeus-data-jupiter).
// Moved from the planets demo (O-059 T-270), which keeps the moon facts and the objects the list becomes (tests/moonList.test.ts, tests/demoPlanets.test.ts).
const list = jupiterMoonPanel();
const data = jupiterRawList();

describe("moon panel model", () => {
  it("lists every catalogued moon once, under its family, with counts from the data", () => {
    expect(list.families.map((family) => family.id)).toEqual(data.families.map((family) => family.id));
    expect(list.families.flatMap((family) => family.moons.map((moon) => moon.id)).sort()).toEqual(data.moons.map((moon) => moon.id).sort());
    expect(list.featuredFamilyId).toBe("galilean");
    expect(list.families[0].moons.every((moon) => moon.pictureUrl !== undefined)).toBe(true);
    expect(moonCountText(1)).toBe("1 moon");
    expect(moonCountText(41)).toBe("41 moons");
  });

  it("states the total and the Horizons list date from the data in the panel's summary", () => {
    const total = data.moons.length;
    const date = moonListDateText(data.asOf);
    expect(date).toMatch(/^\d{1,2} [A-Z][a-z]+ \d{4}$/);
    expect(list.listDate).toBe(data.asOf);
    const summary = moonFamilyListSummary(list);
    expect(summary).toContain(`${total} moons`);
    expect(summary).toContain(date);
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
