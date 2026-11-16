import { Scene, earth, sun } from "astraeus";
import { describe, expect, it } from "vitest";
import { buildMatcher } from "../src/finder.js";
import { constellationFinder, constellations, loadBoundaries, loadNames } from "../src/index.js";

// O-076 T-320: which constellation holds a J2000 direction (Zodiac review F-10), and outline labels (F-15).
const reason = (run: () => unknown): string => {
  try { run(); } catch (error) { return `${(error as Error).name}: ${(error as Error).message}`; }
  return "";
};

// Known directions, J2000 degrees. Stars: SIMBAD/Hipparcos positions of the named stars; Serpens: alpha Ser (Unukalhai) in Caput and eta Ser in Cauda.
const known: readonly (readonly [string, number, number, string])[] = [
  ["Betelgeuse", 88.79, 7.41, "Ori"],
  ["Polaris", 37.95, 89.26, "UMi"],
  ["Sirius", 101.29, -16.72, "CMa"],
  ["Spica", 201.298, -11.161, "Vir"],
  ["Antares", 247.352, -26.432, "Sco"],
  ["Vega", 279.234, 38.784, "Lyr"],
  ["Arcturus", 213.915, 19.182, "Boo"],
  ["Rigil Kentaurus", 219.9, -60.834, "Cen"],
  ["north celestial pole", 0, 90, "UMi"],
  ["north celestial pole, any right ascension", 211, 90, "UMi"],
  ["south celestial pole", 0, -90, "Oct"],
  ["south celestial pole, any right ascension", 123, -90, "Oct"],
  ["seam, RA 0, dec +60", 0, 60, "Cas"],
  ["seam, RA 359.99, dec +60", 359.99, 60, "Cas"],
  ["seam, RA 0, dec +40", 0, 40, "And"],
  ["seam, RA 359.99, dec +40", 359.99, 40, "And"],
  ["seam, RA 0, dec 0", 0, 0, "Psc"],
  ["seam, RA 359.99, dec 0", 359.99, 0, "Psc"],
  ["seam, RA 0, dec -30", 0, -30, "Scl"],
  ["seam, RA 359.99, dec -30", 359.99, -30, "Scl"],
  ["RA taken modulo 360 (+360)", 88.79 + 360, 7.41, "Ori"],
  ["RA taken modulo 360 (-360)", 88.79 - 360, 7.41, "Ori"],
  ["Serpens Caput (alpha Ser)", 236.067, 6.426, "Ser"],
  ["Serpens Cauda (eta Ser)", 275.32, -2.88, "Ser"],
];

// The Sun's geocentric J2000 direction from the engine's public stateOf: Earth's state about the Sun, reversed. The expected constellation is the one the Sun is in on that date
// (the IAU boundaries: Cap to Jan 19, Aqr Feb 16-Mar 11, Psc Mar 12-Apr 18, Ari Apr 19-May 13, Tau May 14-Jun 21, Gem Jun 22-Jul 20, Cnc Jul 21-Aug 9, Leo Aug 10-Sep 15,
// Vir Sep 16-Oct 30, Lib Oct 31-Nov 22, Oph Nov 30-Dec 17, Sgr Dec 18-Jan 18; dates move by a day between years), so each date sits well inside its stretch.
const sunDates: readonly (readonly [string, string])[] = [
  ["2026-01-10", "Sgr"], ["2026-01-25", "Cap"], ["2026-03-01", "Aqr"], ["2026-03-25", "Psc"], ["2026-05-01", "Ari"], ["2026-06-05", "Tau"],
  ["2026-07-10", "Gem"], ["2026-08-01", "Cnc"], ["2026-08-25", "Leo"], ["2026-10-05", "Vir"], ["2026-11-10", "Lib"], ["2026-12-05", "Oph"], ["2026-12-25", "Sgr"],
];

describe("constellationFinder()", () => {
  it("answers the constellation of known directions: stars, poles, the 0/360 seam, both Serpens parts and the Sun's path through Ophiuchus", async () => {
    const which = await constellationFinder();
    const scene = new Scene();
    scene.addBody(earth);
    scene.addBody(sun);
    await scene.load();
    const sunCases = sunDates.map(([date, abbr]) => {
      const [x, y, z] = [...scene.stateOf("earth", date).positionKm].map((v) => -v) as [number, number, number];
      return [`Sun on ${date}`, (Math.atan2(y, x) * 180) / Math.PI, (Math.asin(z / Math.hypot(x, y, z)) * 180) / Math.PI, abbr] as const;
    });
    for (const [what, raDeg, decDeg, abbr] of [...known, ...sunCases]) expect(which({ raDeg, decDeg }), what).toBe(abbr);
    expect(new Set(sunCases.map((row) => row[3])).has("Oph")).toBe(true);
  });

  it("loads the outlines once and answers the same function's results on every call", async () => {
    const first = constellationFinder();
    expect(constellationFinder()).toBe(first);
    expect((await first)({ raDeg: 88.79, decDeg: 7.41 })).toBe((await constellationFinder())({ raDeg: 88.79, decDeg: 7.41 }));
  });

  it("gives every direction of a whole-sky grid exactly one constellation, and every one of the 88 at least one", async () => {
    const boundaries = await loadBoundaries();
    const { find, enclosing } = buildMatcher(boundaries);
    const hit = new Set<string>();
    let count = 0;
    // Dec rows 1.5 degrees apart (offset off the round numbers the outlines run along), right ascension steps scaled by cos(dec) so the grid is even on the sphere.
    for (let dec = -89.25; dec <= 89.25; dec += 1.5) {
      const step = 1.5 / Math.max(Math.cos((dec * Math.PI) / 180), 0.02);
      for (let ra = 0.3; ra < 360; ra += step) {
        const inside = enclosing({ raDeg: ra, decDeg: dec });
        const abbrs = new Set(inside);
        expect(inside.length === 1 || (inside.length === 2 && abbrs.size === 1), `${ra}/${dec} enclosed by ${inside.join(",")}`).toBe(true);
        const answer = find({ raDeg: ra, decDeg: dec });
        expect(answer, `${ra}/${dec}`).toBe(inside[0]);
        hit.add(answer);
        count++;
      }
    }
    expect(count).toBeGreaterThan(15000);
    expect([...hit].sort()).toEqual(Object.keys(await loadNames()).sort());
  }, 120_000);

  it("resolves a direction on a shared edge deterministically: the first abbreviation, alphabetically, of the constellations the point lies on", async () => {
    const boundaries = await loadBoundaries();
    const which = await constellationFinder();
    // A vertex held by several constellations' outlines (the corner where they meet): the answer is the alphabetically first of those.
    const owners = new Map<string, Set<string>>();
    for (const [abbr, loops] of Object.entries(boundaries)) for (const flat of loops) for (let i = 0; i + 1 < flat.length; i += 2) {
      const key = `${flat[i]},${flat[i + 1]}`;
      owners.set(key, (owners.get(key) ?? new Set()).add(abbr));
    }
    const corners = [...owners].filter(([, set]) => set.size >= 3).slice(0, 12);
    expect(corners.length).toBeGreaterThan(3);
    for (const [key, set] of corners) {
      const [raDeg, decDeg] = key.split(",").map(Number) as [number, number];
      expect(which({ raDeg, decDeg }), key).toBe([...set].sort()[0]);
      expect(which({ raDeg: raDeg + 360, decDeg }), key).toBe([...set].sort()[0]);
    }
  });

  it("throws a RangeError naming the field for a bad direction", async () => {
    const which = await constellationFinder();
    const bad: readonly (readonly [string, unknown, string])[] = [
      ["decDeg above 90", { raDeg: 0, decDeg: 90.01 }, "decDeg"],
      ["decDeg below -90", { raDeg: 0, decDeg: -91 }, "decDeg"],
      ["decDeg NaN", { raDeg: 0, decDeg: Number.NaN }, "decDeg"],
      ["decDeg text", { raDeg: 0, decDeg: "7" }, "decDeg"],
      ["raDeg Infinity", { raDeg: Infinity, decDeg: 0 }, "raDeg"],
      ["raDeg NaN", { raDeg: Number.NaN, decDeg: 0 }, "raDeg"],
      ["raDeg missing", { decDeg: 0 }, "raDeg"],
      ["not an object", 5, "direction"],
      ["null", null, "direction"],
    ];
    for (const [what, input, field] of bad) {
      const text = reason(() => which(input as never));
      expect(text, what).toMatch(/^RangeError: /);
      expect(text, what).toContain(field);
    }
  });
});

describe("constellations() outlineLabel", () => {
  it("renames each outline's label, Serpens parts included, and leaves figures and the other fields alone", async () => {
    const plain = await constellations(["Ori", "Ser"], { outlines: true });
    const named = await constellations(["Ori", "Ser"], { outlines: true, outlineLabel: (name) => `${name} (border)` });
    expect(named.map((f) => f.label)).toEqual(["Orion", "Orion (border)", "Serpens", "Serpens Caput (border)", "Serpens Cauda (border)"]);
    expect(named.map((f) => ({ ...f, label: "" }))).toEqual(plain.map((f) => ({ ...f, label: "" })));
    // Without the option the labels are as they were in 0.9.1.
    expect(plain.map((f) => f.label)).toEqual(["Orion", "Orion", "Serpens", "Serpens Caput", "Serpens Cauda"]);
  });

  it("throws a RangeError for a non-function or a function that returns a non-string or empty text", async () => {
    const bad: readonly (readonly [string, unknown])[] = [
      ["a string", "x"], ["a number", 3], ["null", null], ["empty text", () => ""], ["a number result", () => 7], ["undefined result", () => undefined],
    ];
    for (const [what, outlineLabel] of bad) {
      let text = "";
      try { await constellations(["Ori"], { outlines: true, outlineLabel: outlineLabel as never }); } catch (error) { text = `${(error as Error).name}: ${(error as Error).message}`; }
      expect(text, what).toMatch(/^RangeError: .*outlineLabel/);
    }
  });
});
