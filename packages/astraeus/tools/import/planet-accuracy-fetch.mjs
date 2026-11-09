#!/usr/bin/env node
// O-063 T-289: fetches the JPL Horizons vectors the planet accuracy measurement compares the engine against, and writes them as a small
// test fixture (tests/fixtures/planet-accuracy-o063-horizons.json, PROV-01: source, settings and retrieval date inside).
//
//   node tools/import/planet-accuracy-fetch.mjs
//
// 1. Closest approach of each Voyager flyby: the probe about the planet's body centre (500@599 and so on), 1-minute steps over the
//    flyby day given in the probe's own Horizons header timeline, then 1-second steps over 4 minutes about the minimum.
// 2. Each planet's body centre (599...) and system barycentre (5...) about the Sun's centre (500@10) and about the solar-system
//    barycentre (500@0), and the Sun about the barycentre, at the closest approaches and at one made-up date per planet; geometric,
//    ICRF, ecliptic of J2000 (and the body about the Sun once more in the ICRF equator, for the frame check); times UT, with TDB-UT.
// 3. The planets' body centres (and the outer four's barycentres) about the Sun every 2 January 1950 to 2044 (UT), for the span-wide figure.
//
// Positions are kept to 1 m. Raw responses go to the git-ignored .horizons-cache, so a rerun asks Horizons nothing.
import { writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { horizonsText, rowsOf, headerOf, requestsMade } from "./horizons-client.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, "..", "..", "tests", "fixtures", "planet-accuracy-o063-horizons.json");
const cacheDir = join(HERE, ".horizons-cache");
const DAY_MS = 86_400_000;
const jdUtOf = (ms) => ms / DAY_MS + 2_440_587.5;
const msOfJdUt = (jd) => Math.round((jd - 2_440_587.5) * DAY_MS);
const iso = (ms) => new Date(ms).toISOString();

/** Flyby day from each probe's Horizons header timeline ("1979-Mar-05 Jupiter closest approach" and so on); the search spans that UTC day. */
const FLYBYS = [
  { id: "v1-jupiter", probe: "-31", planet: "jupiter", body: "599", day: "1979-03-05" },
  { id: "v1-saturn", probe: "-31", planet: "saturn", body: "699", day: "1980-11-12" },
  { id: "v2-jupiter", probe: "-32", planet: "jupiter", body: "599", day: "1979-07-09" },
  { id: "v2-saturn", probe: "-32", planet: "saturn", body: "699", day: "1981-08-26" },
  { id: "v2-uranus", probe: "-32", planet: "uranus", body: "799", day: "1986-01-24" },
  { id: "v2-neptune", probe: "-32", planet: "neptune", body: "899", day: "1989-08-25" },
];
/** One made-up date per planet away from any flyby (O-063 Done When). */
const MADE_UP = [
  { id: "made-up-jupiter", planet: "jupiter", utc: "2035-03-01T00:00:00Z" },
  { id: "made-up-saturn", planet: "saturn", utc: "1962-05-01T00:00:00Z" },
  { id: "made-up-uranus", planet: "uranus", utc: "2020-01-01T00:00:00Z" },
  { id: "made-up-neptune", planet: "neptune", utc: "1955-09-01T00:00:00Z" },
];
const PLANETS = {
  mercury: { body: "199", bary: "1" }, venus: { body: "299", bary: "2" }, mars: { body: "499", bary: "4" },
  jupiter: { body: "599", bary: "5" }, saturn: { body: "699", bary: "6" }, uranus: { body: "799", bary: "7" }, neptune: { body: "899", bary: "8" },
};

function params({ command, center, plane = "ECLIPTIC", list, start, stop, step, deltaT = true }) {
  return {
    COMMAND: `'${command}'`, CENTER: `'${center}'`, EPHEM_TYPE: "VECTORS", VEC_TABLE: "1", VEC_CORR: "NONE", OUT_UNITS: "KM-S",
    REF_SYSTEM: "ICRF", REF_PLANE: plane, TIME_TYPE: "UT", CSV_FORMAT: "YES", ...(deltaT ? { VEC_DELTA_T: "YES" } : {}),
    ...(list ? { TLIST_TYPE: "JD", TLIST: list.map((ms) => `'${jdUtOf(ms).toFixed(9)}'`).join(",") }
      : { START_TIME: `'${start}'`, STOP_TIME: `'${stop}'`, STEP_SIZE: `'${step}'` }),
  };
}

/** Rows [utcMs, tdbMinusUtS, x, y, z] (km, rounded to 1 m). */
async function rows(p) {
  const text = await horizonsText(p, { cacheDir });
  return { text, rows: rowsOf(text).map(([jd, dt, x, y, z]) => [msOfJdUt(jd), dt, ...[x, y, z].map((v) => Math.round(v * 1000) / 1000)]) };
}

const label = (ms) => iso(ms).replace("T", " ").replace("Z", "").slice(0, 19);

async function closestApproach(flyby) {
  const dayMs = Date.parse(`${flyby.day}T00:00:00Z`);
  const coarse = await rows(params({ command: flyby.probe, center: `500@${flyby.body}`, start: label(dayMs), stop: label(dayMs + DAY_MS), step: "1m" }));
  const range = (r) => Math.hypot(r[2], r[3], r[4]);
  const best = coarse.rows.reduce((a, b) => (range(b) < range(a) ? b : a));
  const fine = await rows(params({ command: flyby.probe, center: `500@${flyby.body}`, start: label(best[0] - 120_000), stop: label(best[0] + 120_000), step: "240" }));
  const min = fine.rows.reduce((a, b) => (range(b) < range(a) ? b : a));
  const header = headerOf(coarse.text);
  const planetName = flyby.planet[0].toUpperCase() + flyby.planet.slice(1);
  const timeline = header.notes.find((line) => line.includes(planetName) && /closest|encounter|flyby/i.test(line)) ?? null;
  return { ...flyby, closestUtc: iso(min[0]), closestRangeKm: Math.round(range(min)), probeFromPlanetKm: min.slice(2), source: header.targetSource, timeline };
}

const flybys = [];
for (const flyby of FLYBYS) flybys.push(await closestApproach(flyby));

const epochs = [
  ...flybys.map((f) => ({ id: f.id, planet: f.planet, utcMs: Date.parse(f.closestUtc) })),
  ...MADE_UP.map((m) => ({ id: m.id, planet: m.planet, utcMs: Date.parse(m.utc) })),
];
const epochTimes = epochs.map((e) => e.utcMs);
const series = {};
const put = async (key, p) => { series[key] = (await rows(p)).rows; };
for (const planet of ["jupiter", "saturn", "uranus", "neptune"]) {
  const { body, bary } = PLANETS[planet];
  await put(`${planet}/body@sun/ecliptic`, params({ command: body, center: "500@10", list: epochTimes }));
  await put(`${planet}/bary@sun/ecliptic`, params({ command: bary, center: "500@10", list: epochTimes }));
  await put(`${planet}/body@ssb/ecliptic`, params({ command: body, center: "500@0", list: epochTimes }));
  await put(`${planet}/body@sun/equator`, params({ command: body, center: "500@10", plane: "FRAME", list: epochTimes }));
}
await put("sun/sun@ssb/ecliptic", params({ command: "10", center: "500@0", list: epochTimes }));

const yearly = { start: "1950-01-02", stop: "2044-01-02", step: "1y" };
for (const [planet, { body, bary }] of Object.entries(PLANETS)) {
  await put(`${planet}/body@sun/ecliptic/yearly`, params({ command: body, center: "500@10", ...yearly }));
  if (["jupiter", "saturn", "uranus", "neptune"].includes(planet)) await put(`${planet}/bary@sun/ecliptic/yearly`, params({ command: bary, center: "500@10", ...yearly }));
}

const fixture = {
  source: "JPL Horizons API (https://ssd.jpl.nasa.gov/api/horizons.api), DE441 planets; Voyager 1 and 2 trajectories Voyager_1_ST+refit2022_m / Voyager_2_ST+refit2022_m. US Government work, credit NASA/JPL-Caltech Solar System Dynamics.",
  retrieved: new Date().toISOString().slice(0, 10),
  tool: "packages/astraeus/tools/import/planet-accuracy-fetch.mjs (O-063 T-289)",
  settings: "EPHEM_TYPE=VECTORS, VEC_TABLE=1 (position), VEC_CORR=NONE (geometric, no light time, no aberration), OUT_UNITS=KM-S, REF_SYSTEM=ICRF, REF_PLANE=ECLIPTIC (ecliptic of J2000, obliquity 84381.448 arcsec) unless the key says equator (REF_PLANE=FRAME, ICRF equator), TIME_TYPE=UT (UTC from 1962, UT1 before), TLIST of Julian dates, VEC_DELTA_T=YES. Keys: <planet>/<body|bary>@<sun|ssb>/<plane>[/yearly]; body = the planet's centre (599, 699, 799, 899, 199, 299, 499), bary = its system barycentre (5, 6, 7, 8); sun = 500@10, ssb = 500@0.",
  rowFormat: "[utcMs, tdbMinusUtS, xKm, yKm, zKm]",
  flybys,
  epochs: epochs.map((e) => ({ id: e.id, planet: e.planet, utc: iso(e.utcMs) })),
  series,
};
writeFileSync(OUT, `${JSON.stringify(fixture)}\n`);
process.stdout.write(`wrote ${OUT} (${requestsMade()} Horizons requests)\n`);
for (const f of flybys) process.stdout.write(`${f.id}: ${f.closestUtc} ${f.closestRangeKm} km | ${f.timeline}\n`);
