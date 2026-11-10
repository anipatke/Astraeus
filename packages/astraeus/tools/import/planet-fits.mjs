#!/usr/bin/env node
// Fits the planet position series as piecewise Chebyshev curve fits (O-025 T-101, Decision 11), in the same chunk format as the Jupiter moons
// (src/core/chebyshevSeries.ts), and measures size and accuracy. One rule for every planet (O-063 T-290): the series is the planet's system
// barycentre about the Sun as JPL Horizons reports the planet, so that the planet's own offset from its barycentre, added at run time from its moon
// package (planetTrajectory.ts), puts it on Horizons' planet centre. For a planet with a moon system that barycentre is Horizons' planet centre
// about the Sun (499 ... 999, through the satellite ephemeris on DE441) minus the same centre about its barycentre (CENTER=500@4 ... 500@9, what the
// moon package is fitted to), at the same instants; Mercury and Venus have no moons, so their barycentre (1, 2, DE441) is the planet. Horizons'
// satellite ephemerides carry their own path of the barycentre, which is not DE441's barycentre 7 or 8 (up to about 3,441 km for Uranus, 742 km for
// Neptune, T-290), so fitting DE441's 7 or 8 would miss Horizons' planet. 6-hourly states, ICRF turned into Orb's ecliptic J2000 by Orb's own frame
// transform so the adapter's inverse returns the Horizons vector; TDB read as TT, under 2 ms.
//
//   node tools/import/planet-fits.mjs [--write] [--report <file>] [--from 1950-01-01] [--only <ids>]
//   --from sets the span's start (O-047 T-195: 1950-01-01 for a 1977 probe); Horizons samples are fetched from there.
//
// The fitted quantity is exactly what `PlanetModel.xyz(date)` returns: heliocentric ecliptic-J2000 x, y, z, here in kilometres, as a function of
// TT seconds (see Time below).
// Per planet it searches segment length and degree for the fewest bytes per day whose worst error at independent dates is within TARGET_KM, then
// fits the whole span, quantises, encodes, and measures. With --write it stores data/ephemerides/planets/planets.json (all four, base64 chunks).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { register } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { makeState, transform } from "@lizard-isana/orb/frames";
import { AstroInstant } from "@lizard-isana/orb/time";
import { gridSamples, horizonsText, labelOfSeconds, MAX_ROWS, vectorParams } from "./horizons-client.mjs";
import { Time } from "@lizard-isana/orb/src/orb-time.js";

register("./ts-resolve-hook.mjs", import.meta.url);
const { encodeChunk } = await import("./chebyshevFit.ts");
const { chebyshevValue } = await import("../../src/core/chebyshev.ts");
const { ttMinusUtcSeconds } = await import("../../src/core/timeScale.ts");

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0);
/** The span: the validated range of the planet definitions (1969-07-21 to 2030-06-01) with margin either side, whole years. */
const fromArg = process.argv.includes("--from") ? process.argv[process.argv.indexOf("--from") + 1] : "1950-01-01";
const FROM_MS = Date.parse(`${fromArg}T00:00:00Z`);
if (!Number.isFinite(FROM_MS) || FROM_MS >= Date.UTC(1971, 0, 1)) throw new Error(`--from must be a date before 1971 (the table's drifting piece runs to the first leap second): ${fromArg}`);
const TO_MS = Date.UTC(2045, 0, 1);
/** Largest fit error allowed against the Horizons barycentre, kilometres, at independent dates. */
const TARGET_KM = 1;
const QUANTUM_KM = 0.1;
const DAY_S = 86_400;

/** Each planet's Horizons body: the planet centre and its system barycentre (no `body` for Mercury and Venus: their barycentre is the planet). */
const SOURCES = {
  mercury: { system: "1" }, venus: { system: "2" }, mars: { body: "499", system: "4" }, jupiter: { body: "599", system: "5" },
  saturn: { body: "699", system: "6" }, uranus: { body: "799", system: "7" }, neptune: { body: "899", system: "8" }, pluto: { body: "999", system: "9" },
};

// Time. Orb turns the UTC date it is given into TT by adding leap seconds (a step at each one) and, before 1972, a polynomial; a fit of that
// directly would have to fit every step. So the fitted argument is TT seconds from J2000 (smooth): the series' value at TT, with TT - UTC from
// the small table stored beside the fits (leap seconds from 1972, a drifting piece before; the table is what the runtime uses to go UTC -> TT).
// The workspace hoists dependencies, so Orb's source sits in the repository root's node_modules, not the package's.
const orbTimePath = [join(REPO, "node_modules"), join(REPO, "..", "..", "node_modules")].map((root) => join(root, "@lizard-isana", "orb", "src", "orb-time.js")).find((path) => existsSync(path));
const orbText = readFileSync(orbTimePath, "utf8");
const LEAPS = [...orbText.matchAll(/\[Date\.UTC\((\d+), (\d+), (\d+)\), (\d+)\]/g)].map((m) => [Date.UTC(+m[1], +m[2], +m[3]), +m[4]]);
const orbDelta = (ms) => new Time(new Date(ms)).tt_minus_utc();
const PRE_FROM = FROM_MS;
// Before the first leap second Orb's TT - UTC is a smooth polynomial; one straight line over 1950 to 1972 is seconds off at its middle (O-047 T-200),
// so the table holds a piece per month, each joining Orb's values at its two ends (monthly pieces follow the polynomial to a microsecond or so).
const preEnd = LEAPS[0][0];
const prePieces = [];
for (let from = PRE_FROM; from < preEnd; ) {
  const d = new Date(from);
  const next = Math.min(preEnd, Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
  prePieces.push({ fromUtcMs: from, ttMinusUtcS: Math.round(orbDelta(from) * 1e6) / 1e6, driftSPerDay: Math.round(((orbDelta(next) - orbDelta(from)) / ((next - from) / 86_400_000)) * 1e9) / 1e9 });
  from = next;
}
const TIME_TABLE = {
  pieces: [...prePieces,
    ...LEAPS.map(([fromUtcMs, tai]) => ({ fromUtcMs, ttMinusUtcS: 32.184 + tai, driftSPerDay: 0 }))],
  validToUtcMs: Date.UTC(2045, 0, 1),
};
const ttSecondsOf = (utcMs) => (utcMs - J2000_MS) / 1000 + ttMinusUtcSeconds(TIME_TABLE, utcMs);
const truth = (model, tt) => model.at(tt);

/** Chebyshev coefficients (x then y then z blocks) of one segment, from the function at the degree + 1 Chebyshev nodes. */
function fitSegment(model, startS, lengthS, count) {
  const values = [[], [], []];
  const nodes = [];
  for (let j = 0; j < count; j += 1) nodes.push(Math.cos((Math.PI * (j + 0.5)) / count));
  for (const node of nodes) {
    const v = truth(model, startS + ((node + 1) / 2) * lengthS);
    for (let axis = 0; axis < 3; axis += 1) values[axis].push(v[axis]);
  }
  const out = new Float64Array(3 * count);
  for (let axis = 0; axis < 3; axis += 1) {
    for (let k = 0; k < count; k += 1) {
      let sum = 0;
      for (let j = 0; j < count; j += 1) sum += values[axis][j] * Math.cos((Math.PI * k * (j + 0.5)) / count);
      out[axis * count + k] = ((k === 0 ? 1 : 2) / count) * sum;
    }
  }
  return out;
}

const quantise = (coefficients) => coefficients.map((c) => Math.round(c / QUANTUM_KM) * QUANTUM_KM);

function evaluate(coefficients, startS, lengthS, count, s) {
  const segment = Math.min(Math.floor((s - startS) / lengthS), coefficients.length / (3 * count) - 1);
  const x = 2 * ((s - startS) / lengthS - segment) - 1;
  const offset = segment * 3 * count;
  return [0, 1, 2].map((axis) => chebyshevValue(coefficients, offset + axis * count, count, x));
}

function worstError(model, coefficients, startS, lengthS, count, dates) {
  let worst = 0;
  for (const s of dates) {
    const a = evaluate(coefficients, startS, lengthS, count, s);
    const b = truth(model, s);
    worst = Math.max(worst, Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]));
  }
  return worst;
}

const START_S = ttSecondsOf(FROM_MS);
const SPAN_S = ttSecondsOf(TO_MS - 1) - START_S;
// The segment grid is anchored at 1969-01-01 (O-047 T-200): an earlier --from only prepends whole segments, so moving the start never shifts the
// grid of the years after 1969, and the fit choice is made over 1969 on.
const ANCHOR_S = ttSecondsOf(Date.UTC(1969, 0, 1));
const ANCHOR_SPAN_S = ttSecondsOf(TO_MS - 1) - ANCHOR_S;

const cacheDir = join(dirname(fileURLToPath(import.meta.url)), ".horizons-cache");
/** Horizons states of `command` about `center` on the 6-hour grid from `firstS`, `count` rows, in as many requests as the row limit needs. */
async function horizonsGrid(command, center, firstS, stepS, count) {
  const perRequest = MAX_ROWS - 1;
  const samples = [];
  for (let i = 0; i < count; i += perRequest) {
    const rows = Math.min(perRequest, count - i);
    const start = firstS + i * stepS;
    const text = await horizonsText(vectorParams({ command, center, start: labelOfSeconds(start), stop: labelOfSeconds(start + (rows - 1) * stepS), step: "360m" }), { cacheDir });
    samples.push(...gridSamples(text, start, stepS, rows));
  }
  return samples;
}

/**
 * A planet's system barycentre as heliocentric ecliptic-J2000 km every 6 hours over the span plus margin, as a function of TT seconds by 12-point
 * Lagrange interpolation: Horizons' barycentre body for Mercury and Venus, else Horizons' planet centre about the Sun minus the same centre about its
 * barycentre at each instant (the planet's short wobble about the barycentre cancels there, so what is interpolated is smooth). The wobble itself
 * (up to about 2,100 km for Pluto, a few hundred km for the giants) is left out on purpose: it is the centre series of the planet's moon package,
 * added at run time (fitting the centre directly needs short segments: Pluto's body 999 grew this file by 300 KB, T-116). The fit is therefore
 * against Horizons itself, with the cache the moon importer uses.
 */
async function barycentreFromHorizons({ body, system }) {
  const stepS = 21_600;
  const firstS = Math.floor((START_S - 400 * DAY_S) / stepS) * stepS - 10 * stepS;
  // The last segment of a fit reaches past the span by up to its length (365 days at most): sample that far too, never extrapolate.
  const count = Math.ceil((START_S + SPAN_S + 400 * DAY_S - firstS) / stepS) + 12;
  let samples;
  if (body === undefined) samples = await horizonsGrid(system, "500@10", firstS, stepS, count);
  else {
    const aboutSun = await horizonsGrid(body, "500@10", firstS, stepS, count);
    const aboutBarycentre = await horizonsGrid(body, `500@${system}`, firstS, stepS, count);
    samples = aboutSun.map((sample, i) => ({ tdbS: sample.tdbS, positionKm: sample.positionKm.map((v, axis) => v - aboutBarycentre[i].positionKm[axis]) }));
  }
  // ICRF (Horizons) -> ecliptic J2000 with Orb's own transform; the frame is fixed, so one state gives the rotation.
  const instant = AstroInstant.fromUnixMs(J2000_MS);
  const toEcliptic = (r) => transform(makeState({ t: instant, frame: "equatorial-j2000", center: "sun", r }), { frame: "ecliptic-j2000" }).r;
  const ecliptic = samples.map((sample) => Array.from(toEcliptic(sample.positionKm)));
  const POINTS = 12;
  return {
    horizons: true,
    sampleCount: samples.length,
    at(tt) {
      const centre = Math.floor((tt - firstS) / stepS);
      const from = Math.min(Math.max(centre - POINTS / 2 + 1, 0), samples.length - POINTS);
      const out = [0, 0, 0];
      for (let j = from; j < from + POINTS; j += 1) {
        let weight = 1;
        for (let m = from; m < from + POINTS; m += 1) if (m !== j) weight *= (tt - samples[m].tdbS) / (samples[j].tdbS - samples[m].tdbS);
        for (let axis = 0; axis < 3; axis += 1) out[axis] += weight * ecliptic[j][axis];
      }
      return out;
    },
  };
}
/** Independent dates: every 7.31 days plus a slightly irrational offset, never a segment node. */
function testDates(startS, endS, step) {
  const dates = [];
  for (let s = startS + 12_345.678; s < endS; s += step) dates.push(s);
  return dates;
}

function fitWhole(model, lengthDays, count) {
  const lengthS = lengthDays * DAY_S;
  const before = Math.ceil(Math.max(0, ANCHOR_S - START_S) / lengthS);
  const startS = ANCHOR_S - before * lengthS;
  const segments = before + Math.ceil(ANCHOR_SPAN_S / lengthS);
  const coefficients = new Float64Array(segments * 3 * count);
  for (let i = 0; i < segments; i += 1) coefficients.set(fitSegment(model, startS + i * lengthS, lengthS, count), i * 3 * count);
  return { lengthS, segments, startS, coefficients: quantise(coefficients) };
}

/** Cheap search on a few probe segments spread over the span: fewest bytes per day within half the target. */
function choose(model) {
  let best;
  for (const lengthDays of [2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192, 256, 365.25]) {
    const lengthS = lengthDays * DAY_S;
    for (let count = 5; count <= 30; count += 1) {
      let worst = 0;
      let bytes = 0;
      const probes = 12;
      for (let p = 0; p < probes; p += 1) {
        const startS = ANCHOR_S + Math.floor(((ANCHOR_SPAN_S - lengthS) / probes) * p);
        const coefficients = quantise(fitSegment(model, startS, lengthS, count));
        worst = Math.max(worst, worstError(model, coefficients, startS, lengthS, count, testDates(startS, startS + lengthS, lengthS / 40)));
        bytes += encodeChunk({ startTdbS: 0, segmentCount: 1, coefficientCount: count, quantumKm: QUANTUM_KM, coefficients }).length - 20;
      }
      if (worst > TARGET_KM * 0.6) continue;
      const perDay = bytes / probes / lengthDays;
      if (best === undefined || perDay < best.perDay) best = { lengthDays, count, perDay };
      break;
    }
  }
  return best;
}

const report = { span: [new Date(FROM_MS).toISOString(), new Date(TO_MS).toISOString()], targetKm: TARGET_KM, quantumKm: QUANTUM_KM, planets: {} };
const out = { format: "astraeus.planet-fits/1", frame: "ecliptic J2000, heliocentric", unit: "km", argument: "TT seconds from J2000.0 (2000-01-01T12:00Z UTC-scale origin); TT = UTC + the table", timeScale: TIME_TABLE, planets: {} };
let totalBytes = 0;
let totalGzip = 0;
const onlyIds = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1].split(",") : null;
for (const [id, source] of Object.entries(SOURCES)) {
  if (onlyIds !== null && !onlyIds.includes(id)) continue;
  const model = await barycentreFromHorizons(source);
  const pick = choose(model);
  let attempt = pick;
  let fit;
  let worst;
  // The whole-span check is independent of the fit nodes; if it exceeds the target, raise the degree.
  for (;;) {
    fit = fitWhole(model, attempt.lengthDays, attempt.count);
    worst = worstError(model, fit.coefficients, fit.startS, fit.lengthS, attempt.count, testDates(START_S, START_S + SPAN_S, 3.0137 * DAY_S));
    if (worst <= TARGET_KM) break;
    if (attempt.count > 60) throw new Error(`${id}: no degree up to 60 reaches ${TARGET_KM} km (segment ${attempt.lengthDays} d, worst ${worst} km)`);
    attempt = { ...attempt, count: attempt.count + 1 };
  }
  const bytes = encodeChunk({ startTdbS: fit.startS, segmentCount: fit.segments, coefficientCount: attempt.count, quantumKm: QUANTUM_KM, coefficients: fit.coefficients });
  totalBytes += bytes.length;
  totalGzip += gzipSync(bytes).length;
  report.planets[id] = { segmentDays: attempt.lengthDays, coefficientsPerAxis: attempt.count, segments: fit.segments, bytes: bytes.length, base64Bytes: Math.ceil(bytes.length / 3) * 4, worstErrorKm: Number(worst.toFixed(4)) };
  out.planets[id] = { startS: fit.startS, segmentSeconds: fit.lengthS, segmentCount: fit.segments, coefficientCount: attempt.count, quantumKm: QUANTUM_KM, worstErrorKm: Number(worst.toFixed(3)), data: Buffer.from(bytes).toString("base64") };
  console.log(id, JSON.stringify(report.planets[id]));
}
report.totalBytes = totalBytes;
report.totalGzipBytes = totalGzip;
console.log(`total raw ${totalBytes} bytes, gzip ${totalGzip}, as base64 ${Math.ceil(totalBytes / 3) * 4}`);

const args = process.argv.slice(2);
if (args.includes("--write") && onlyIds !== null) throw new Error("--only is for trials; it cannot be combined with --write (planets.json holds all eight)");
if (args.includes("--write")) {
  const dir = join(REPO, "data", "ephemerides", "planets");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "planets.json"), `${JSON.stringify(out)}\n`);
  console.log("wrote", join(dir, "planets.json"));
}
if (args.includes("--report")) writeFileSync(args[args.indexOf("--report") + 1], `${JSON.stringify(report, null, 2)}\n`);
