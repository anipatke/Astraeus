import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { ConstellationBoundaries, ConstellationFigures, ConstellationName, ConstellationProvenance } from "../src/index.js";

// O-067 T-304: the shipped data are the importer's output (tools/import/constellations.mjs), so these tests state what must hold of it.
const here = dirname(fileURLToPath(import.meta.url));
const data = <T>(name: string): T => JSON.parse(readFileSync(join(here, "..", "data", name), "utf8")) as T;
const figures = data<ConstellationFigures>("figures.json");
const boundaries = data<ConstellationBoundaries>("boundaries.json");
const names = data<Record<string, ConstellationName>>("names.json");
const provenance = data<ConstellationProvenance & { counts: Record<string, number>; crossCheck: Record<string, number> }>("provenance.json");
const stars = (JSON.parse(readFileSync(join(here, "..", "..", "astraeus", "src", "assets", "stars", "hyg-v42-naked-eye.json"), "utf8")) as { stars: number[][] }).stars;
const hips = new Set(stars.map((row) => row[4]).filter((hip): hip is number => hip !== undefined && hip > 0));
const abbrs = Object.keys(names).sort();
const separation = (ra1: number, dec1: number, ra2: number, dec2: number): number => {
  const r = Math.PI / 180;
  const cos = Math.sin(dec1 * r) * Math.sin(dec2 * r) + Math.cos(dec1 * r) * Math.cos(dec2 * r) * Math.cos((ra1 - ra2) * r);
  return Math.acos(Math.min(1, cos)) / r;
};

describe("astraeus-data-constellations", () => {
  it("holds the same 88 constellations in figures, boundaries and names, with unique names", () => {
    expect(abbrs).toHaveLength(88);
    expect(Object.keys(figures).sort()).toEqual(abbrs);
    expect(Object.keys(boundaries).sort()).toEqual(abbrs);
    expect(new Set(abbrs.map((abbr) => names[abbr]?.name)).size).toBe(88);
    for (const abbr of abbrs) {
      expect(abbr).toMatch(/^[A-Z][A-Za-z]{2}$/);
      const name = names[abbr];
      expect([name?.name, name?.english, name?.genitive].every((text) => typeof text === "string" && text.length > 0 && !/[<>&]/.test(text))).toBe(true);
    }
    expect(names["Ori"]).toEqual({ name: "Orion", english: "the Hunter", genitive: "Orionis" });
  });

  it("gives every figure end as a Hipparcos number the engine's star list holds, or one recorded position", () => {
    const positions: unknown[] = [];
    for (const abbr of abbrs) {
      expect(figures[abbr]?.length, abbr).toBeGreaterThan(0);
      for (const [a, b] of figures[abbr] ?? []) {
        for (const end of [a, b]) {
          if (typeof end === "number") expect(hips.has(end), `${abbr} HIP ${end}`).toBe(true);
          else positions.push(end);
        }
        expect(a).not.toEqual(b);
      }
    }
    // HIP 55203 (xi Ursae Majoris, Alula Australis): the engine's list holds the star without a Hipparcos number, so the end is its position there.
    expect(positions).toEqual([[169.54677, 31.52878]]);
    expect(stars.some((row) => row[0] === 169.54677 && row[1] === 31.52878)).toBe(true);
    expect(provenance.counts["figureEndsAsPosition"]).toBe(1);
  });

  it("drops repeated lines and counts what it holds", () => {
    let lines = 0;
    for (const abbr of abbrs) {
      const keys = (figures[abbr] ?? []).map(([a, b]) => JSON.stringify(a < b ? [a, b] : [b, a]));
      expect(new Set(keys).size, abbr).toBe(keys.length);
      lines += keys.length;
    }
    expect(lines).toBe(752);
    expect(provenance.counts["figureLines"]).toBe(lines);
    expect(provenance.counts["figureStepsZeroLengthDropped"]).toBe(4);
    expect(provenance.counts["figureStepsRepeatedDropped"]).toBe(87);
  });

  it("matches the source for Orion: Betelgeuse to Bellatrix to Rigel to Saiph, the belt, the shield and the club", () => {
    const ori = (figures["Ori"] ?? []).map(([a, b]) => `${String(a)}-${String(b)}`);
    expect(ori).toHaveLength(23);
    for (const line of ["27989-26727", "26727-26311", "26311-25930", "25930-25336", "25281-24436", "26727-27366"]) expect(ori).toContain(line);
  });

  it("gives every constellation closed J2000 outlines of nearby points (Serpens has two)", () => {
    let points = 0;
    for (const abbr of abbrs) {
      const outlines = boundaries[abbr] ?? [];
      expect(outlines, abbr).toHaveLength(abbr === "Ser" ? 2 : 1);
      for (const flat of outlines) {
        expect(flat.length % 2).toBe(0);
        const n = flat.length / 2;
        expect(n, abbr).toBeGreaterThanOrEqual(8);
        points += n;
        for (let i = 0; i < n; i += 1) {
          const [ra, dec] = [flat[2 * i] ?? NaN, flat[2 * i + 1] ?? NaN];
          expect(ra >= 0 && ra < 360 && dec >= -90 && dec <= 90, `${abbr} point ${i}`).toBe(true);
          const next = (i + 1) % n; // the last point joins the first, which is not repeated
          expect(separation(ra, dec, flat[2 * next] ?? NaN, flat[2 * next + 1] ?? NaN), `${abbr} step ${i}`).toBeLessThan(1.1);
        }
        expect(flat.slice(0, 2)).not.toEqual(flat.slice(-2));
      }
    }
    expect(points).toBe(provenance.counts["boundaryPoints"]);
  });

  it("records a boundary cross-check against VI/49 inside its tolerance, and the sources it came from", () => {
    const check = provenance.crossCheck;
    expect(check["toleranceDegrees"]).toBe(0.01);
    for (const key of ["maxPointToOutlineDegrees", "maxCornerToCornerDegrees", "maxOurCornerToVizierPointDegrees", "maxShippedChordDriftDegrees"]) {
      expect(check[key], key).toBeLessThanOrEqual(0.01);
    }
    const sources = provenance.sources as Record<string, Record<string, string>>;
    expect(sources["figures"]?.["licence"]).toBe("CC BY-SA 4.0");
    expect(sources["boundaries"]?.["licence"]).toBe("CC BY-SA 4.0");
    expect(sources["names"]?.["licence"]).toBe("CC BY 4.0");
    expect(sources["names"]?.["credit"]).toBe("IAU");
    expect(sources["figures"]?.["from"]).toContain("dc5679c9723685585196c4d6ecd7ffd33da59ecd");
  });
});
