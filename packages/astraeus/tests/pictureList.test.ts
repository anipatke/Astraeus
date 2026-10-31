import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { listedMoons } from "astraeus";
import { PICTURES } from "astraeus-data";

// O-050 T-215 (I-127): both READMEs name the moons the picture pack has pictures for, and say the other listed moons (Uranus's five named among
// them) draw flat-coloured. The list is read from the pack's registered names, so a new picture fails here until the READMEs say so.
const NOT_MOONS = new Set(["milky-way", "venus-8k", "pluto"]); // the sky, Venus's wide-screen file and a planet
const READMES = ["packages/astraeus-data/README.md", "packages/astraeus/README.md"];
const name = (id: string): string => id[0].toUpperCase() + id.slice(1);
const joined = (names: readonly string[]): string => `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

const pictured = Object.keys(PICTURES).filter((id) => !NOT_MOONS.has(id)).map(name);
const MAIN_URANUS = ["Miranda", "Ariel", "Umbriel", "Titania", "Oberon"]; // the five Uranus moons with names a reader knows
const flat = listedMoons().map((moon) => moon.id).filter((id) => !(id in PICTURES)).map(name);

describe("the READMEs say which moons have pictures", () => {
  it("has the pictured moons and the flat ones to compare", () => {
    expect(pictured.length).toBeGreaterThan(10);
    expect(flat).toEqual(expect.arrayContaining(MAIN_URANUS));
    expect(flat.some((moon) => pictured.includes(moon))).toBe(false);
  });

  for (const path of READMES) {
    it(`${path} lists them`, () => {
      const text = readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8");
      expect(text).toContain(`Moons with pictures: ${joined(pictured)}.`);
      expect(text).toContain(`Every other listed moon, among them Uranus's ${joined(MAIN_URANUS)}, draws flat-coloured`);
    });
  }
});
