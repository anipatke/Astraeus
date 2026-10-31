import { describe, expect, it } from "vitest";
import { listedMoon, listedMoons } from "../src/core/bodies/listedMoons";
import { recordPeriodDays, type PeriodRecord } from "../src/core/siderealPeriod";
import { parseMoonCatalogue } from "../src/assets/moonCatalogue";
import { PLANETS, renderListedMoons } from "../tools/import/moon-lookup.mjs";
import { readJson, readText } from "../tools/import/test-io.mjs";

// O-049 T-210: every listed moon has an orbit period from JPL SSD mean elements, and the slim lookup (src/core/bodies/listedMoons.ts, generated) agrees with the lists.
const ROOT = new URL("../", import.meta.url).pathname;
interface RawMoon { id: string; name: string; naifId: number; meanRadiusKm: number; orbitPeriodDays: number | null; ephemeris: { set: string; body: string }; sources: Record<string, string> }
interface RawList { parent: string; sources: Record<string, { title: string; url: string }>; periods: { source: string; fetched: string; missing: string[] }; moons: RawMoon[] }
interface PeriodsFile { fetched: string; periods: Record<string, { id: string; naifId: number; jplName: string; periodDays: number }[]> }

const lists = PLANETS.map((planet) => ({ planet, raw: readJson(`${ROOT}data/moons/${planet}.json`) as RawList }));
const periods = readJson(`${ROOT}tools/import/planet-moon-periods.json`) as PeriodsFile;

describe("orbit periods in the moon lists", () => {
  it.each(lists)("$planet: every moon has a positive period from the cited JPL table, or null and is named as missing", ({ planet, raw }) => {
    const missing = raw.moons.filter((moon) => moon.orbitPeriodDays === null).map((moon) => moon.id);
    expect(raw.periods.missing).toEqual(missing);
    expect(raw.periods.source).toBe("jpl-sat-elem");
    expect(raw.periods.fetched).toBe(periods.fetched);
    expect(raw.sources["jpl-sat-elem"]?.url).toBe("https://ssd.jpl.nasa.gov/sats/elem/");
    for (const moon of raw.moons) {
      if (moon.orbitPeriodDays === null) { expect(moon.sources.period, moon.id).toBeUndefined(); continue; }
      expect(moon.orbitPeriodDays, moon.id).toBeGreaterThan(0);
      expect(moon.sources.period, moon.id).toBe("jpl-sat-elem");
    }
    const fromTable = new Map(periods.periods[planet]!.map((row) => [row.naifId, row.periodDays]));
    for (const moon of raw.moons) expect(moon.orbitPeriodDays, moon.id).toBe(fromTable.get(moon.naifId) ?? null);
    expect(parseMoonCatalogue(raw).moons.filter((moon) => moon.orbitPeriodDays !== undefined)).toHaveLength(raw.moons.length - missing.length);
  });

  it("agrees with the period in each moon record of data/orbits within 0.5 percent, and with its rotation-rate period within 1 percent", () => {
    // The 14th record, pluto, is a heliocentric dwarf-planet orbit, not a listed moon. The records' `elements.periodDays` is the same JPL table figure;
    // their rotation-rate period (the rule moon definitions use) is the real cross-check: Io and Europa differ most (0.36 and 0.73 percent) because
    // JPL's Jovian P is not corrected for the moving apsis (see siderealPeriod.ts, "apsis-corrected").
    const ids = ["callisto", "charon", "dione", "enceladus", "europa", "ganymede", "iapetus", "io", "mimas", "rhea", "tethys", "titan", "triton"];
    for (const id of ids) {
      const record = readJson(`${ROOT}data/orbits/${id}.json`) as PeriodRecord & { model: { periodRule: string }; kind: string };
      expect(record.kind).toBe("moon");
      const listed = listedMoon(id)?.orbitPeriodDays;
      expect(listed, id).toBeTypeOf("number");
      expect(Math.abs(listed! - record.elements.periodDays) / record.elements.periodDays, id).toBeLessThan(0.005);
      expect(Math.abs(listed! - recordPeriodDays(record)) / recordPeriodDays(record), id).toBeLessThan(0.01);
    }
  });
});

describe("the slim lookup", () => {
  it("lists every moon with an ephemeris pointer, with the fields addBody needs", () => {
    const expected = lists.flatMap(({ planet, raw }) => raw.moons.filter((moon) => moon.ephemeris !== undefined).map((moon) => ({
      id: moon.id, label: moon.name, meanRadiusKm: moon.meanRadiusKm, parent: planet, orbitPeriodDays: moon.orbitPeriodDays,
      dataPackage: `astraeus-data-${planet}`, fitSet: moon.ephemeris.set, fitBody: moon.ephemeris.body,
    })));
    expect(expected).toHaveLength(458);
    expect(listedMoons()).toEqual(expected.map((moon) => ({ ...moon, early: expect.any(Boolean) })));
  });

  it("is the committed output of its generator", () => {
    expect(readText(`${ROOT}src/core/bodies/listedMoons.ts`)).toBe(renderListedMoons());
  });
});
