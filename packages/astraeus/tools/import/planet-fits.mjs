#!/usr/bin/env node
// Refits the planet position series (Orb's full VSOP87A: Mercury, Venus, Mars, Jupiter, and from O-033 T-114 Saturn, Uranus, Neptune) as piecewise
// Chebyshev curve fits (O-025 T-101, Decision 11), in the same chunk format as the Jupiter moons (src/core/chebyshevSeries.ts), and measures size
// and accuracy. Pluto has no VSOP87 series: the Pluto system barycentre's heliocentric position is fitted to JPL Horizons states (body 9 about the Sun, 6-hourly, ICRF
// turned into Orb's ecliptic J2000 by Orb's own frame transform so the adapter's inverse returns the Horizons vector; TDB read as TT, under 2 ms).
//
//   node tools/import/planet-fits.mjs [--write] [--report <file>]
//
// The fitted quantity is exactly what `PlanetModel.xyz(date)` returns: heliocentric ecliptic-J2000 x, y, z, here in kilometres, as a function of
// TT seconds (see Time below).
// Per planet it searches segment length and degree for the fewest bytes per day whose worst error at independent dates is within TARGET_KM, then
// fits the whole span, quantises, encodes, and measures. With --write it stores data/ephemerides/planets/planets.json (all four, base64 chunks).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { register } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { makeState, transform } from "@lizard-isana/orb/frames";
import { AstroInstant } from "@lizard-isana/orb/time";
import { gridSamples, horizonsText, labelOfSeconds, MAX_ROWS, vectorParams } from "./horizons-client.mjs";
import { Time } from "@lizard-isana/orb/src/orb-time.js";
import { Jupiter, Mars, Mercury, Neptune, Saturn, Uranus, Venus } from "@lizard-isana/orb/src/orb-planet.js";
import { registerVSOP87A } from "@lizard-isana/orb/src/orb-vsop87a-registry.js";
import { JUPITER_FULL_COEF } from "@lizard-isana/orb/vsop87a/jupiter";
import { MARS_FULL_COEF } from "@lizard-isana/orb/vsop87a/mars";
import { NEPTUNE_FULL_COEF } from "@lizard-isana/orb/vsop87a/neptune";
import { SATURN_FULL_COEF } from "@lizard-isana/orb/vsop87a/saturn";
import { URANUS_FULL_COEF } from "@lizard-isana/orb/vsop87a/uranus";
import { MERCURY_FULL_COEF } from "@lizard-isana/orb/vsop87a/mercury";
import { VENUS_FULL_COEF } from "@lizard-isana/orb/vsop87a/venus";

register("./ts-resolve-hook.mjs", import.meta.url);
const { encodeChunk } = await import("./chebyshevFit.ts");
const { chebyshevValue } = await import("../../src/core/chebyshev.ts");
const { ttMinusUtcSeconds } = await import("../../src/core/timeScale.ts");

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0);
const AU_KM = 149_597_870.7;
/** The span: the validated range of the planet definitions (1969-07-21 to 2030-06-01) with margin either side, whole years. */
const FROM_MS = Date.UTC(1969, 0, 1);
const TO_MS = Date.UTC(2045, 0, 1);
/** Largest fit error allowed against the VSOP87A series being replaced, kilometres: under 1 km against model errors of tens to thousands of km. */
const TARGET_KM = 1;
const QUANTUM_KM = 0.1;
const DAY_S = 86_400;

registerVSOP87A("Mercury", MERCURY_FULL_COEF);
registerVSOP87A("Venus", VENUS_FULL_COEF);
registerVSOP87A("Mars", MARS_FULL_COEF);
registerVSOP87A("Jupiter", JUPITER_FULL_COEF);
registerVSOP87A("Saturn", SATURN_FULL_COEF);
registerVSOP87A("Uranus", URANUS_FULL_COEF);
registerVSOP87A("Neptune", NEPTUNE_FULL_COEF);
const full = { vsop87a: "full" };
const MODELS = {
  mercury: new Mercury(full), venus: new Venus(full), mars: new Mars(full), jupiter: new Jupiter(full),
  saturn: new Saturn(full), uranus: new Uranus(full), neptune: new Neptune(full),
  pluto: { horizons: true },
};

// Time. Orb turns the UTC date it is given into TT by adding leap seconds (a step at each one) and, before 1972, a polynomial; a fit of that
// directly would have to fit every step. So the fitted argument is TT seconds from J2000 (smooth): the series' value at TT, with TT - UTC from
// the small table stored beside the fits (leap seconds from 1972, a drifting piece before; the table is what the runtime uses to go UTC -> TT).
const orbText = readFileSync(join(REPO, "node_modules", "@lizard-isana", "orb", "src", "orb-time.js"), "utf8");
const LEAPS = [...orbText.matchAll(/\[Date\.UTC\((\d+), (\d+), (\d+)\), (\d+)\]/g)].map((m) => [Date.UTC(+m[1], +m[2], +m[3]), +m[4]]);
const orbDelta = (ms) => new Time(new Date(ms)).tt_minus_utc();
const PRE_FROM = Date.UTC(1969, 0, 1);
const preSlope = (orbDelta(LEAPS[0][0] - 86_400_000) - orbDelta(PRE_FROM)) / ((LEAPS[0][0] - 86_400_000 - PRE_FROM) / 86_400_000);
const TIME_TABLE = {
  pieces: [{ fromUtcMs: PRE_FROM, ttMinusUtcS: Math.round(orbDelta(PRE_FROM) * 1e6) / 1e6, driftSPerDay: Math.round(preSlope * 1e9) / 1e9 },
    ...LEAPS.map(([fromUtcMs, tai]) => ({ fromUtcMs, ttMinusUtcS: 32.184 + tai, driftSPerDay: 0 }))],
  validToUtcMs: Date.UTC(2045, 0, 1),
};
const ttSecondsOf = (utcMs) => (utcMs - J2000_MS) / 1000 + ttMinusUtcSeconds(TIME_TABLE, utcMs);
/** The UTC date Orb must be given so that its own TT equals `tt` (fixed point on Orb's TT - UTC). */
function orbDateForTt(tt) {
  let ms = J2000_MS + tt * 1000 - 64_000;
  for (let i = 0; i < 4; i += 1) ms = J2000_MS + tt * 1000 - orbDelta(ms) * 1000;
  return new Date(Math.round(ms));
}
function truth(model, tt) {
  if (model.horizons) return model.at(tt);
  const v = model.xyz(orbDateForTt(tt));
  return [v.x * AU_KM, v.y * AU_KM, v.z * AU_KM];
}

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

/**
 * The Pluto system barycentre's heliocentric ecliptic-J2000 km from Horizons (body 9 about the Sun) every 6 hours over the span plus margin, as a
 * function of TT seconds by 12-point Lagrange interpolation. The barycentre moves smoothly (Pluto's own 6.4-day wobble about it, up to about 2,100 km,
 * is left out on purpose: it is the centre series of data/ephemerides/pluto-moons, added at run time; fitting body 999 grew this file by 300 KB, T-116). The fit is therefore against Horizons itself, with the cache the moon importer uses.
 */
async function plutoFromHorizons() {
  const cacheDir = join(dirname(fileURLToPath(import.meta.url)), ".horizons-cache");
  const stepS = 21_600;
  const firstS = Math.floor(START_S / stepS) * stepS - 10 * stepS;
  // The last segment of a fit reaches past the span by up to its length (365 days at most): sample that far too, never extrapolate.
  const count = Math.ceil((START_S + SPAN_S + 400 * DAY_S - firstS) / stepS) + 12;
  const perRequest = MAX_ROWS - 1;
  const samples = [];
  for (let i = 0; i < count; i += perRequest) {
    const rows = Math.min(perRequest, count - i);
    const start = firstS + i * stepS;
    const text = await horizonsText(vectorParams({ command: "9", center: "500@10", start: labelOfSeconds(start), stop: labelOfSeconds(start + (rows - 1) * stepS), step: "360m" }), { cacheDir });
    samples.push(...gridSamples(text, start, stepS, rows));
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
MODELS.pluto = await plutoFromHorizons();
/** Independent dates: every 7.31 days plus a slightly irrational offset, never a segment node. */
function testDates(startS, endS, step) {
  const dates = [];
  for (let s = startS + 12_345.678; s < endS; s += step) dates.push(s);
  return dates;
}

function fitWhole(model, lengthDays, count) {
  const lengthS = lengthDays * DAY_S;
  const segments = Math.ceil(SPAN_S / lengthS);
  const coefficients = new Float64Array(segments * 3 * count);
  for (let i = 0; i < segments; i += 1) coefficients.set(fitSegment(model, START_S + i * lengthS, lengthS, count), i * 3 * count);
  return { lengthS, segments, coefficients: quantise(coefficients) };
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
        const startS = START_S + Math.floor(((SPAN_S - lengthS) / probes) * p);
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
for (const id of Object.keys(MODELS)) {
  if (onlyIds !== null && !onlyIds.includes(id)) continue;
  const model = MODELS[id];
  const pick = choose(model);
  let attempt = pick;
  let fit;
  let worst;
  // The whole-span check is independent of the fit nodes; if it exceeds the target, raise the degree.
  for (;;) {
    fit = fitWhole(model, attempt.lengthDays, attempt.count);
    worst = worstError(model, fit.coefficients, START_S, fit.lengthS, attempt.count, testDates(START_S, START_S + SPAN_S, 3.0137 * DAY_S));
    if (worst <= TARGET_KM) break;
    if (attempt.count > 60) throw new Error(`${id}: no degree up to 60 reaches ${TARGET_KM} km (segment ${attempt.lengthDays} d, worst ${worst} km)`);
    attempt = { ...attempt, count: attempt.count + 1 };
  }
  const bytes = encodeChunk({ startTdbS: START_S, segmentCount: fit.segments, coefficientCount: attempt.count, quantumKm: QUANTUM_KM, coefficients: fit.coefficients });
  totalBytes += bytes.length;
  totalGzip += gzipSync(bytes).length;
  report.planets[id] = { segmentDays: attempt.lengthDays, coefficientsPerAxis: attempt.count, segments: fit.segments, bytes: bytes.length, base64Bytes: Math.ceil(bytes.length / 3) * 4, worstErrorKm: Number(worst.toFixed(4)) };
  out.planets[id] = { startS: START_S, segmentSeconds: fit.lengthS, segmentCount: fit.segments, coefficientCount: attempt.count, quantumKm: QUANTUM_KM, worstErrorKm: Number(worst.toFixed(3)), data: Buffer.from(bytes).toString("base64") };
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
