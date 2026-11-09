import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vitest";
import { catalogue } from "../src/assets/catalogue";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { HISTORICAL_MOON_FIT_SPAN, MOON_FIT_SPAN } from "../src/core/bodies/moonSystem";
import { JUPITER_MOON_SYSTEM } from "../src/core/bodies/jupiterMoons";
import { MARS_MOON_SYSTEM, NEPTUNE_MOON_SYSTEM, PLUTO_MOON_SYSTEM, SATURN_MOON_SYSTEM, URANUS_MOON_SYSTEM } from "../src/core/bodies/planetMoons";
import type { PlanetId } from "../src/core/planetSeries";
import { readBytes } from "../tools/import/test-io.mjs";
import { moonDataFolder } from "./moonData";
import fixture from "./fixtures/planet-accuracy-o063-horizons.json";

// O-063: the planets against JPL Horizons (DE441) at the Voyager flybys, at one made-up date per planet and on 2 January of each year 1950 to
// 2044 (docs/architecture/planet-accuracy-o063.md). T-289 measured the VSOP87A series (BEFORE_*); T-290 replaced it by a fit of each planet's
// system barycentre as Horizons reports the planet (its centre about the Sun minus its centre about the barycentre), plus the planet's own offset
// from its moon package when that is loaded, so that the planet is Horizons' planet centre. Every comparison is in the ICRF
// equator, where both the engine (EQJ) and Horizons are defined: Horizons' ecliptic rows are turned back by its own obliquity (84381.448"), so
// Orb's slightly different ecliptic (up to about 900 km at Neptune, T-289) does not enter. Set PLANET_ACCURACY_PRINT=1 to print the table.

type Vec = [number, number, number];
type Row = [number, number, number, number, number];
const OUTER = ["jupiter", "saturn", "uranus", "neptune"] as const;
type Outer = (typeof OUTER)[number];
const PLANETS = ["mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune"] as const;
type Measured7 = (typeof PLANETS)[number];
const series = fixture.series as unknown as Record<string, Row[]>;
const adapter = createOrbAstronomyAdapter();

const sub = (a: ArrayLike<number>, b: ArrayLike<number>): Vec => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const norm = (a: ArrayLike<number>) => Math.hypot(a[0], a[1], a[2]);
const OBLIQUITY = (84_381.448 / 3600) * (Math.PI / 180);
/** Horizons' ecliptic of J2000 back to its ICRF equator (REF_PLANE=ECLIPTIC is the ICRF turned by this obliquity about x). */
const icrfOf = (row: Row): Vec => {
  const [x, y, z] = [row[2], row[3], row[4]];
  return [x, y * Math.cos(OBLIQUITY) - z * Math.sin(OBLIQUITY), y * Math.sin(OBLIQUITY) + z * Math.cos(OBLIQUITY)];
};
const rowAt = (key: string, utcMs: number): Row => {
  const row = series[key].find((r) => Math.abs(r[0] - utcMs) < 1);
  if (row === undefined) throw new Error(`${key} has no row at ${new Date(utcMs).toISOString()}`);
  return row;
};
/** The planet series alone: the system barycentre (EQJ km about the Sun). */
const barycentre = (planet: PlanetId, utcMs: number) => adapter.planetPositionFromSunKm(planet, utcMs);
/** The planet as the engine places it: the catalogue binding, which adds the offset from its moon package when that covers the time. */
const placed = (planet: PlanetId, utcMs: number) => catalogue.get(planet).source!.create(adapter).stateAt(utcMs).positionKm;

/** The moon systems with each one's committed centre-series span (Mars and Pluto 2010-2029; the others 1950-2029). */
const SYSTEMS = [
  [MARS_MOON_SYSTEM, "mars", MOON_FIT_SPAN], [JUPITER_MOON_SYSTEM, "jupiter", HISTORICAL_MOON_FIT_SPAN], [SATURN_MOON_SYSTEM, "saturn", HISTORICAL_MOON_FIT_SPAN],
  [URANUS_MOON_SYSTEM, "uranus", HISTORICAL_MOON_FIT_SPAN], [NEPTUNE_MOON_SYSTEM, "neptune", HISTORICAL_MOON_FIT_SPAN], [PLUTO_MOON_SYSTEM, "pluto", MOON_FIT_SPAN],
] as const;
const MOON_SPAN: Record<string, { startUtcMs: number; endUtcMs: number }> = Object.fromEntries(SYSTEMS.map(([, planet, span]) => [planet, span]));
const covered = (planet: string, utcMs: number) => MOON_SPAN[planet] !== undefined && utcMs >= MOON_SPAN[planet].startUtcMs && utcMs <= MOON_SPAN[planet].endUtcMs;

interface Measured {
  readonly id: string;
  readonly planet: Outer;
  /** The series minus Horizons' DE441 system barycentre body (5, 6, 7, 8): zero for Jupiter and Saturn, the satellite-file gap for Uranus and Neptune. */
  readonly baryKm: number;
  /** The planet placed with its moon package minus Horizons' body centre. */
  readonly withMoonsKm: number;
  /** The series (the barycentre) minus Horizons' body centre: where the planet sits without its moon package. */
  readonly withoutMoonsKm: number;
  /** Engine (TT - UTC) minus Horizons (TDB - UT), seconds. */
  readonly timeS: number;
  /** Horizons body about the Sun vs about the solar-system barycentre. */
  readonly sunVsSsbKm: number;
}

let measured: Measured[] = [];
/** Largest error on 2 January of each year 1950 to 2044, per planet: with the moon package (years it covers) and without it. */
const span: Record<Measured7, { withMoonsKm: number | null; withoutMoonsKm: number; baryKm: number | null; pre1972Km: number }> = {} as never;
/** Horizons' UT is UT1 before 1962 and the engine reads Orb's smooth pre-1972 TT - UTC (up to about 0.7 s apart in the 1950s; UTC's rubber seconds to 1972): those years are reported apart. */
const UTC_FROM_MS = Date.UTC(1972, 0, 1);
let earthKm = 0;
let earthYear = "";

beforeAll(async () => {
  // Every committed centre-series year of each moon package, as a host loading the package for that window would have.
  for (const [system, planet, window] of SYSTEMS) {
    const root = moonDataFolder(planet);
    system.provideIndex(async () => JSON.parse(await readFile(`${root}index.json`, "utf8")) as unknown);
    await system.load({ window, bodies: [], chunkUrls: new Proxy({}, { get: (_target, path: string) => `${root}${path}` }) as Record<string, string>, fetchBytes: async (url) => readBytes(url) });
  }

  measured = fixture.epochs.map(({ id, planet: p, utc }) => {
    const planet = p as Outer;
    const t = Date.parse(utc);
    const body = xyzOf(rowAt(`${planet}/body@sun/equator`, t));
    const table = rowAt(`${planet}/body@sun/ecliptic`, t);
    return {
      id, planet,
      baryKm: norm(sub(barycentre(planet, t), icrfOf(rowAt(`${planet}/bary@sun/ecliptic`, t)))),
      withMoonsKm: norm(sub(placed(planet, t), body)),
      withoutMoonsKm: norm(sub(barycentre(planet, t), body)),
      timeS: (adapter.daysSinceJ2000Tt(t) * 86_400 - (t - Date.UTC(2000, 0, 1, 12)) / 1000) - table[1],
      sunVsSsbKm: norm(sub(icrfOf(rowAt(`${planet}/body@ssb/ecliptic`, t)), icrfOf(table))),
    };
  });

  for (const planet of PLANETS) {
    let withMoons: number | null = null;
    let without = 0;
    let bary: number | null = null;
    let pre1972 = 0;
    for (const row of series[`${planet}/body@sun/ecliptic/yearly`]) {
      const body = icrfOf(row);
      if (row[0] < UTC_FROM_MS) {
        pre1972 = Math.max(pre1972, norm(sub(covered(planet, row[0]) ? placed(planet, row[0]) : barycentre(planet, row[0]), body)));
        continue;
      }
      without = Math.max(without, norm(sub(barycentre(planet, row[0]), body)));
      if (covered(planet, row[0])) withMoons = Math.max(withMoons ?? 0, norm(sub(placed(planet, row[0]), body)));
    }
    for (const row of series[`${planet}/bary@sun/ecliptic/yearly`] ?? []) if (row[0] >= UTC_FROM_MS) bary = Math.max(bary ?? 0, norm(sub(barycentre(planet, row[0]), icrfOf(row))));
    span[planet] = { withMoonsKm: withMoons, withoutMoonsKm: without, baryKm: bary, pre1972Km: pre1972 };
  }

  // Earth stays on Orb's EPV00 model (no barycentre series, and the Moon is core, not a moon package): measured the same way, not changed.
  for (const row of series["earth/body@sun/ecliptic/yearly"]) {
    if (row[0] < UTC_FROM_MS) continue;
    const km = norm(sub(adapter.earthPositionFromSunKm(row[0]), icrfOf(row)));
    if (km > earthKm) [earthKm, earthYear] = [km, new Date(row[0]).toISOString().slice(0, 4)];
  }

  if (process.env.PLANET_ACCURACY_PRINT === "1") {
    const r = (x: number | null, d = 1) => (x === null ? "-" : x.toFixed(d));
    console.log(["id baryKm withMoonsKm withoutMoonsKm (before T-290) timeS",
      ...measured.map((x) => [x.id, r(x.baryKm, 3), r(x.withMoonsKm, 3), r(x.withoutMoonsKm), BEFORE_KM[x.id], r(x.timeS, 3)].join(" ")),
      "1972-2044 yearly max: planet withMoons without bary pre1972 (before T-290, 1950-2044)",
      ...PLANETS.map((p) => [p, r(span[p].withMoonsKm, 3), r(span[p].withoutMoonsKm, 3), r(span[p].baryKm, 3), r(span[p].pre1972Km, 1), BEFORE_SPAN_KM[p] ?? "-"].join(" ")),
      `earth EPV00 max ${r(earthKm, 3)} km (${earthYear})`].join("\n"));
  }
}, 120_000);

function xyzOf(row: Row): Vec {
  return [row[2], row[3], row[4]];
}

/** T-289's measured VSOP87A error against the Horizons body centre (km), kept to show the gain. */
const BEFORE_KM: Record<string, number> = {
  "v1-jupiter": 755, "v1-saturn": 1629, "v2-jupiter": 629, "v2-saturn": 1790, "v2-uranus": 6314, "v2-neptune": 13338,
  "made-up-jupiter": 795, "made-up-saturn": 1090, "made-up-uranus": 12738, "made-up-neptune": 4833,
};
/** T-289's largest VSOP87A error on 2 January of each year 1950 to 2044 (km, ecliptic comparison; the inner three were printed, not recorded). */
const BEFORE_SPAN_KM: Partial<Record<Measured7, number>> = { jupiter: 1456, saturn: 2805, uranus: 20023, neptune: 43747 };

/** Measured with T-290's data (2026-11-10): where each planet sits without its moon package, the planet's wobble about its barycentre (km). */
const WITHOUT_MOONS_KM: Record<string, number> = {
  "v1-jupiter": 212.4, "v1-saturn": 275.7, "v2-jupiter": 192.3, "v2-saturn": 295.5, "v2-uranus": 28.4, "v2-neptune": 74.2,
  "made-up-jupiter": 154.0, "made-up-saturn": 294.3, "made-up-uranus": 24.5, "made-up-neptune": 76.7,
};
/** The largest of those over 1972 to 2044 per planet (km). */
const WITHOUT_MOONS_SPAN_KM: Record<Measured7, number> = { mercury: 0.3, venus: 0.6, mars: 0.5, jupiter: 216.4, saturn: 303.9, uranus: 44.7, neptune: 74.4 };
/**
 * Horizons serves Uranus (799) and Neptune (899) about the Sun through their satellite ephemerides (ura184_merged, nep098_merged), whose path of
 * the system barycentre is not DE441's barycentre body (7, 8): they agree near the Voyager encounters and drift apart away from them. The series
 * follows the planet as Horizons reports it (owner, O-063 Decision 1), so it differs from 7 and 8 by this much (km, measured); Jupiter's and
 * Saturn's agree within the fit.
 */
const BARY_GAP_KM: Record<string, number> = { "v2-uranus": 62.0, "made-up-uranus": 700.2, "made-up-neptune": 148.6 };
const BARY_SPAN_GAP_KM: Partial<Record<Measured7, number>> = { uranus: 3440.7, neptune: 742.0 };
/** The fit tolerance the importer holds the series to (km); with the moon package the planet is within it plus the package's own fit (metres). */
const FIT_KM = 1;

describe("planet accuracy against JPL Horizons DE441 (O-063)", () => {
  it("keeps the fixture's source, settings and Horizons closest approaches (PROV-01)", () => {
    expect(fixture.source).toContain("JPL Horizons");
    expect(fixture.settings).toContain("VEC_CORR=NONE");
    expect(fixture.settings).toContain("84381.448");
    expect(fixture.retrieved).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(fixture.flybys.map((f) => f.closestUtc)).toEqual([
      "1979-03-05T12:04:35.000Z", "1980-11-12T23:45:38.000Z", "1979-07-09T22:29:01.000Z", "1981-08-26T03:24:04.000Z", "1986-01-24T17:58:51.000Z", "1989-08-25T03:55:40.000Z",
    ]);
    expect(fixture.epochs).toHaveLength(10);
  });

  it("places each planet within the fit tolerance of its Horizons centre at the flybys and made-up dates, with its moon package loaded", () => {
    for (const x of measured) {
      const t = Date.parse(fixture.epochs.find((e) => e.id === x.id)!.utc);
      if (x.id in BARY_GAP_KM) expect(Math.abs(x.baryKm - BARY_GAP_KM[x.id]), `${x.id} DE441 barycentre gap`).toBeLessThan(5);
      else expect(x.baryKm, `${x.id} barycentre`).toBeLessThan(FIT_KM);
      if (!covered(x.planet, t)) expect(x.withMoonsKm, `${x.id} outside its package's years`).toBe(x.withoutMoonsKm);
      // 1955 (made-up Neptune): Horizons' UT is UT1 there, 0.7 s from the engine's reading of the date (3.8 km at Neptune's speed).
      else expect(x.withMoonsKm, `${x.id} centre`).toBeLessThan(t < UTC_FROM_MS ? 4 : FIT_KM);
      expect(x.withMoonsKm, `${x.id} gain`).toBeLessThan(BEFORE_KM[x.id] / 5);
    }
  });

  it("without the moon package, places each planet at its barycentre: off its centre by the measured wobble (within 5 km of the recorded figure)", () => {
    for (const x of measured) expect(Math.abs(x.withoutMoonsKm - WITHOUT_MOONS_KM[x.id]), x.id).toBeLessThan(5);
  });

  it("holds over 1972 to 2044: within the fit tolerance with the moon package (the years it covers), within the measured wobble without", () => {
    for (const planet of PLANETS) {
      const s = span[planet];
      const gap = BARY_SPAN_GAP_KM[planet];
      if (s.baryKm !== null) {
        if (gap === undefined) expect(s.baryKm, `${planet} barycentre`).toBeLessThan(FIT_KM);
        else expect(Math.abs(s.baryKm - gap), `${planet} DE441 barycentre gap`).toBeLessThan(5);
      }
      if (s.withMoonsKm !== null) expect(s.withMoonsKm, `${planet} with moons`).toBeLessThan(FIT_KM);
      expect(Math.abs(s.withoutMoonsKm - WITHOUT_MOONS_SPAN_KM[planet]), `${planet} without moons`).toBeLessThan(planet === "mercury" || planet === "venus" || planet === "mars" ? 0.5 : 5);
      // 1950 to 1971: Horizons' UT1 (to 1962) and UTC's rubber seconds against the engine's smooth TT - UTC; a time-label difference, not a position one.
      expect(s.pre1972Km, `${planet} before 1972`).toBeLessThan(40);
    }
    expect(span.mars.withMoonsKm).not.toBeNull();
    expect(span.mercury.withMoonsKm).toBeNull();
  });

  it("measures Earth's EPV00 model the same way (not changed by O-063)", () => {
    expect(Math.abs(earthKm - EARTH_KM)).toBeLessThan(0.5);
  });

  it("keeps the time scale small and the Sun-versus-barycentre centre difference large (the causes T-289 ruled out stay ruled out)", () => {
    for (const x of measured) {
      expect(Math.abs(x.timeS), `${x.id} time scale`).toBeLessThan(x.id === "made-up-neptune" ? 0.75 : 0.005);
      expect(x.sunVsSsbKm, x.id).toBeGreaterThan(200_000);
    }
  });
});

/** Earth's EPV00 worst against Horizons' Earth (399) over 1972 to 2044 (km), measured (2003). */
const EARTH_KM = 7.3;
