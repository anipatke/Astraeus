import { beforeAll, describe, expect, it } from "vitest";
import { Jupiter, Neptune, Saturn, Uranus } from "@lizard-isana/orb/src/orb-planet.js";
import { registerVSOP87A } from "@lizard-isana/orb/src/orb-vsop87a-registry.js";
import { JUPITER_FULL_COEF } from "@lizard-isana/orb/vsop87a/jupiter";
import { NEPTUNE_FULL_COEF } from "@lizard-isana/orb/vsop87a/neptune";
import { SATURN_FULL_COEF } from "@lizard-isana/orb/vsop87a/saturn";
import { URANUS_FULL_COEF } from "@lizard-isana/orb/vsop87a/uranus";
import { transformationMatrix } from "@lizard-isana/orb/frames";
import { AstroInstant } from "@lizard-isana/orb/time";
import { Scene, jupiter, neptune, saturn, sun, uranus } from "astraeus";
import fits from "../data/ephemerides/planets/planets.json";
import { loadPlanetSeries, planetModels, type PlanetId } from "../src/core/planetSeries";
import { ttMinusUtcSeconds, type TimeScaleTable } from "../src/core/timeScale";
import fixture from "./fixtures/planet-accuracy-o063-horizons.json";

// O-063 T-289: today's planet positions against JPL Horizons at the Voyager flybys and at one made-up date per planet, with each cause
// measured on its own (docs/architecture/planet-accuracy-o063.md). The figures below are what the engine measures today: a fix that changes
// the planet series changes them, and its diff shows the gain. Set PLANET_ACCURACY_PRINT=1 to print the measured table.

type Vec = [number, number, number];
type Row = [number, number, number, number, number];
const AU_KM = 149_597_870.7;
const OUTER = ["jupiter", "saturn", "uranus", "neptune"] as const;
type Outer = (typeof OUTER)[number];
/** 1-bar equatorial radii (km) as the engine's catalogue prints them (Horizons headers). */
const RADIUS_KM: Record<Outer, number> = { jupiter: 71_492, saturn: 60_268, uranus: 25_559, neptune: 24_766 };
const series = fixture.series as unknown as Record<string, Row[]>;

const sub = (a: ArrayLike<number>, b: ArrayLike<number>): Vec => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const norm = (a: ArrayLike<number>) => Math.hypot(a[0], a[1], a[2]);
const cross = (a: Vec, b: Vec): Vec => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const mul = (m: ArrayLike<number>, v: ArrayLike<number>): Vec => [
  m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
];
const xyz = (row: Row): Vec => [row[2], row[3], row[4]];
const rowAt = (key: string, utcMs: number): Row => {
  const row = series[key].find((r) => Math.abs(r[0] - utcMs) < 1);
  if (row === undefined) throw new Error(`${key} has no row at ${new Date(utcMs).toISOString()}`);
  return row;
};
const ARCSEC = Math.PI / 180 / 3600;

registerVSOP87A("Jupiter", JUPITER_FULL_COEF);
registerVSOP87A("Saturn", SATURN_FULL_COEF);
registerVSOP87A("Uranus", URANUS_FULL_COEF);
registerVSOP87A("Neptune", NEPTUNE_FULL_COEF);
const full = { vsop87a: "full" } as const;
const VSOP = { jupiter: new Jupiter(full), saturn: new Saturn(full), uranus: new Uranus(full), neptune: new Neptune(full) };

/** The engine's heliocentric ecliptic-J2000 position, km (the planet series as the adapter reads it). */
function engineEcliptic(planet: PlanetId, utcMs: number): Vec {
  const p = planetModels()[planet].xyz(new Date(utcMs));
  return [p.x * AU_KM, p.y * AU_KM, p.z * AU_KM];
}

interface Measured {
  readonly id: string;
  readonly planet: Outer;
  readonly utc: string;
  /** Engine minus Horizons body centre about the Sun, ecliptic J2000 (what a Sun-centred probe sample meets). */
  readonly bodyKm: number;
  readonly radii: number;
  /** As an angle seen from the probe at closest approach (flybys only), degrees. */
  readonly fromProbeDeg: number | null;
  /** How much the error changes the probe's distance from the planet at closest approach (its part along the probe's line), km. */
  readonly alongRangeKm: number | null;
  /** Engine minus Horizons system barycentre about the Sun. */
  readonly baryKm: number;
  /** Horizons body centre minus its system barycentre. */
  readonly bodyMinusBaryKm: number;
  /** Engine curve fit minus the full VSOP87A series it was fitted to. */
  readonly refitKm: number;
  /** Engine (TT - UTC) minus Horizons (TDB - UT), seconds, and that shift times the planet's speed, km. */
  readonly timeS: number;
  readonly timeKm: number;
  /** Engine in a Sun-first scene (stateOf, EQJ) minus Horizons ICRF equator about the Sun. */
  readonly sceneKm: number;
  /** Horizons body about the Sun vs about the solar-system barycentre: the Sun's offset a host would add by mixing the two centres. */
  readonly sunVsSsbKm: number;
}

let measured: Measured[] = [];
interface RotationFit { omegaMas: Vec; rmsBeforeArcsec: number; rmsAfterArcsec: number; maxBeforeKm: Partial<Record<Outer, number>>; maxAfterKm: Partial<Record<Outer, number>> }
let rotation: { all: RotationFit; jupiterSaturn: RotationFit; maxVsBodyKm: Record<Outer, number> };
let eclipticToEqjKm = 0;

beforeAll(async () => {
  await loadPlanetSeries();
  const scene = new Scene().addBody(sun).addBody(jupiter).addBody(saturn).addBody(uranus).addBody(neptune);
  await scene.load();
  const table = fits.timeScale as TimeScaleTable;
  const ranges = new Map(fixture.flybys.map((f) => [f.id, f.closestRangeKm]));
  const probes = new Map(fixture.flybys.map((f) => [f.id, f.probeFromPlanetKm as Vec]));
  const m = Float64Array.from(transformationMatrix("ecliptic-j2000", "equatorial-j2000", AstroInstant.fromUnixMs(0)));

  measured = fixture.epochs.map(({ id, planet: p, utc }) => {
    const planet = p as Outer;
    const t = Date.parse(utc);
    const body = rowAt(`${planet}/body@sun/ecliptic`, t);
    const bary = rowAt(`${planet}/bary@sun/ecliptic`, t);
    const engine = engineEcliptic(planet, t);
    const bodyKm = norm(sub(engine, xyz(body)));
    const v = VSOP[planet].xyz(new Date(t));
    const speed = norm(sub(engineEcliptic(planet, t + 30_000), engineEcliptic(planet, t - 30_000))) / 60;
    const timeS = ttMinusUtcSeconds(table, t) - body[1];
    const scene_ = scene.stateOf(planet, t).positionKm;
    const range = ranges.get(id);
    const probe = probes.get(id);
    const error = sub(engine, xyz(body));
    eclipticToEqjKm = Math.max(eclipticToEqjKm, norm(sub(mul(m, xyz(body)), xyz(rowAt(`${planet}/body@sun/equator`, t)))));
    return {
      id, planet, utc,
      bodyKm, radii: bodyKm / RADIUS_KM[planet],
      fromProbeDeg: range === undefined ? null : (Math.atan2(bodyKm, range) * 180) / Math.PI,
      alongRangeKm: probe === undefined ? null : Math.abs(norm(sub(probe, error)) - norm(probe)),
      baryKm: norm(sub(engine, xyz(bary))),
      bodyMinusBaryKm: norm(sub(xyz(body), xyz(bary))),
      refitKm: norm(sub(engine, [v.x * AU_KM, v.y * AU_KM, v.z * AU_KM])),
      timeS, timeKm: Math.abs(timeS) * speed,
      sceneKm: norm(sub(scene_, xyz(rowAt(`${planet}/body@sun/equator`, t)))),
      sunVsSsbKm: norm(sub(xyz(rowAt(`${planet}/body@ssb/ecliptic`, t)), xyz(body))),
    };
  });

  // Frame: one small fixed rotation (omega, radians) that best explains engine minus Horizons barycentre over the yearly grid (directions only,
  // so Neptune does not outweigh Jupiter): err/|r| ~ omega x r/|r|. A frame offset would be common to every planet; what is left is the series' own error.
  const pairs = (planets: readonly Outer[]) => planets.flatMap((planet) => series[`${planet}/bary@sun/ecliptic/yearly`].map((row) => ({ r: xyz(row), e: sub(engineEcliptic(planet, row[0]), xyz(row)), planet })));
  const maxVsBodyKm = { jupiter: 0, saturn: 0, uranus: 0, neptune: 0 };
  for (const planet of OUTER) {
    for (const row of series[`${planet}/body@sun/ecliptic/yearly`]) maxVsBodyKm[planet] = Math.max(maxVsBodyKm[planet], norm(sub(engineEcliptic(planet, row[0]), xyz(row))));
  }
  rotation = { all: fitRotation(pairs(OUTER)), jupiterSaturn: fitRotation(pairs(["jupiter", "saturn"])), maxVsBodyKm };

  if (process.env.PLANET_ACCURACY_PRINT === "1") {
    const r = (x: number, d = 0) => x.toFixed(d);
    const fit = (f: RotationFit) => `omega mas ${f.omegaMas.map((w) => r(w, 1)).join(", ")}; rms ${r(f.rmsBeforeArcsec, 3)}" -> ${r(f.rmsAfterArcsec, 3)}"; max vs bary ${JSON.stringify(f.maxBeforeKm)} -> ${JSON.stringify(f.maxAfterKm)}`;
    console.log(["id utc bodyKm radii probeDeg alongRange baryKm body-bary refit timeS timeKm sceneKm sunVsSsb",
      ...measured.map((x) => [x.id, x.utc, r(x.bodyKm), r(x.radii, 3), x.fromProbeDeg === null ? "-" : r(x.fromProbeDeg, 3), x.alongRangeKm === null ? "-" : r(x.alongRangeKm), r(x.baryKm), r(x.bodyMinusBaryKm), r(x.refitKm, 2), r(x.timeS, 3), r(x.timeKm, 1), r(x.sceneKm), r(x.sunVsSsbKm)].join(" ")),
      `rotation, outer four: ${fit(rotation.all)}`,
      `rotation, Jupiter and Saturn: ${fit(rotation.jupiterSaturn)}`,
      `yearly 1950-2044 max vs body ${JSON.stringify(rotation.maxVsBodyKm)}; inner ${JSON.stringify(Object.fromEntries((["mercury", "venus", "mars"] as const).map((p) => [p, Math.round(Math.max(...series[`${p}/body@sun/ecliptic/yearly`].map((row) => norm(sub(engineEcliptic(p, row[0]), xyz(row))))))])))}`,
      `ecliptic->EQJ (Orb vs Horizons) max ${r(eclipticToEqjKm, 3)} km`].join("\n"));
  }
}, 60_000);

function fitRotation(pairs: readonly { r: Vec; e: Vec; planet: Outer }[]): RotationFit {
  const ata = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const atb = [0, 0, 0];
  for (const { r, e } of pairs) {
    const n = norm(r);
    const u: Vec = [r[0] / n, r[1] / n, r[2] / n];
    const d: Vec = [e[0] / n, e[1] / n, e[2] / n];
    // omega x u = A omega with A = -[u]x
    const a = [[0, u[2], -u[1]], [-u[2], 0, u[0]], [u[1], -u[0], 0]];
    for (let i = 0; i < 3; i += 1) {
      for (let j = 0; j < 3; j += 1) for (let k = 0; k < 3; k += 1) ata[i * 3 + j] += a[k][i] * a[k][j];
      for (let k = 0; k < 3; k += 1) atb[i] += a[k][i] * d[k];
    }
  }
  const omega = solve3(ata, atb);
  const maxBeforeKm: Partial<Record<Outer, number>> = {};
  const maxAfterKm: Partial<Record<Outer, number>> = {};
  let sumBefore = 0;
  let sumAfter = 0;
  for (const { r, e, planet } of pairs) {
    const after = sub(e, cross(omega, r));
    maxBeforeKm[planet] = Math.max(maxBeforeKm[planet] ?? 0, Math.round(norm(e)));
    maxAfterKm[planet] = Math.max(maxAfterKm[planet] ?? 0, Math.round(norm(after)));
    sumBefore += (norm(e) / norm(r)) ** 2;
    sumAfter += (norm(after) / norm(r)) ** 2;
  }
  return {
    omegaMas: omega.map((w) => (w / ARCSEC) * 1000) as Vec,
    rmsBeforeArcsec: Math.sqrt(sumBefore / pairs.length) / ARCSEC,
    rmsAfterArcsec: Math.sqrt(sumAfter / pairs.length) / ARCSEC,
    maxBeforeKm, maxAfterKm,
  };
}

function solve3(a: number[], b: number[]): Vec {
  const det = (m: number[]) => m[0] * (m[4] * m[8] - m[5] * m[7]) - m[1] * (m[3] * m[8] - m[5] * m[6]) + m[2] * (m[3] * m[7] - m[4] * m[6]);
  const d = det(a);
  const col = (i: number) => a.map((v, k) => (k % 3 === i ? b[Math.floor(k / 3)] : v));
  return [det(col(0)) / d, det(col(1)) / d, det(col(2)) / d];
}

/** Today's measured engine-minus-Horizons body-centre distance (km) at each epoch; a fix that moves the planets updates these. */
const TODAY_KM: Record<string, number> = {
  "v1-jupiter": 755, "v1-saturn": 1629, "v2-jupiter": 629, "v2-saturn": 1790, "v2-uranus": 6314, "v2-neptune": 13338,
  "made-up-jupiter": 795, "made-up-saturn": 1090, "made-up-uranus": 12738, "made-up-neptune": 4833,
};
/** Today's largest engine-minus-Horizons body-centre distance (km) on 2 January of each year 1950 to 2044. */
const TODAY_SPAN_KM: Record<Outer, number> = { jupiter: 1456, saturn: 2805, uranus: 20023, neptune: 43747 };

describe("planet accuracy at the Voyager flybys (O-063 T-289)", () => {
  it("keeps the fixture's source, settings and Horizons closest approaches (PROV-01)", () => {
    expect(fixture.source).toContain("JPL Horizons");
    expect(fixture.settings).toContain("VEC_CORR=NONE");
    expect(fixture.retrieved).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(fixture.flybys.map((f) => f.closestUtc)).toEqual([
      "1979-03-05T12:04:35.000Z", "1980-11-12T23:45:38.000Z", "1979-07-09T22:29:01.000Z", "1981-08-26T03:24:04.000Z", "1986-01-24T17:58:51.000Z", "1989-08-25T03:55:40.000Z",
    ]);
    expect(fixture.epochs).toHaveLength(10);
  });

  it("measures today's error against the Horizons body centre at each epoch (within 5 km of the recorded figure)", () => {
    for (const x of measured) expect(Math.abs(x.bodyKm - TODAY_KM[x.id]), x.id).toBeLessThan(5);
  });

  it("measures today's largest error over 1950 to 2044", () => {
    for (const planet of OUTER) expect(Math.abs(rotation.maxVsBodyKm[planet] - TODAY_SPAN_KM[planet]), planet).toBeLessThan(5);
  });

  it("rules out the curve fit, the time scale and the scene's own rotation as causes", () => {
    for (const x of measured) {
      expect(x.refitKm, `${x.id} refit`).toBeLessThan(1);
      expect(x.timeKm, `${x.id} time scale`).toBeLessThan(5);
      // The Sun-first scene (EQJ) misses Horizons' ICRF equator by about what the ecliptic comparison does; the rest is Orb's ecliptic-to-equator turn.
      expect(Math.abs(x.sceneKm - x.bodyKm), `${x.id} scene`).toBeLessThan(eclipticToEqjKm + 1);
    }
    expect(eclipticToEqjKm).toBeLessThan(1000);
  });

  it("shows the planet's wobble about its barycentre is small beside the series' error at Uranus and Neptune", () => {
    for (const x of measured) expect(x.bodyMinusBaryKm, x.id).toBeLessThan(800);
    const neptune = measured.find((x) => x.id === "v2-neptune")!;
    expect(neptune.baryKm).toBeGreaterThan(100 * neptune.bodyMinusBaryKm);
  });

  it("shows a fixed frame rotation explains most of Jupiter's and Saturn's error but not Uranus's or Neptune's", () => {
    expect(rotation.jupiterSaturn.rmsAfterArcsec).toBeLessThan(0.5 * rotation.jupiterSaturn.rmsBeforeArcsec);
    expect(rotation.all.rmsAfterArcsec).toBeGreaterThan(0.85 * rotation.all.rmsBeforeArcsec);
  });

  it("shows mixing Sun-centred and barycentre-centred Horizons vectors would cost about a million km, not hundreds", () => {
    for (const x of measured) expect(x.sunVsSsbKm, x.id).toBeGreaterThan(200_000);
  });
});
