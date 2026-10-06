// Anchor-consistency audit for the Apollo 11 coasts (I-006). Diagnostic only: reads the normalised
// anchors, never writes data/. Run: node tools/validate/anchor-consistency.mjs
// Writes docs/evidence/anchor-consistency.json.
//
// Dynamics: geocentric RK4, 10 s step; Earth point mass + J2, Moon and Sun third-body terms from the
// Astraeus adapter. Not part of the reconstruction; it only tests whether neighbouring anchors agree.
//
// Since T-013 (2026-10-06) the tool itself takes Moon-referenced FPA/heading against EQJ north, so "tool"
// results here now equal the EQJ-north reading; the committed evidence JSON predates that change.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runnerImport } from "vite";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const load = (file) => runnerImport(path.join(root, file)).then((result) => result.module);
const [{ createOrbAstronomyAdapter }, { nativeState }, { toEarthCentred, moonFromEarth }, frames, { CONSTANTS }] =
  await Promise.all([
    load("src/core/astronomyAdapter.ts"),
    load("tools/apollo11/anchors.ts"),
    load("tools/apollo11/ephemeris.ts"),
    load("tools/apollo11/frames.ts"),
    load("tools/apollo11/conventions.ts"),
  ]);
const adapter = createOrbAstronomyAdapter();
const normalised = JSON.parse(readFileSync(path.join(root, "data/apollo11/normalised/anchors.json"), "utf8"));
const A = Object.fromEntries(normalised.anchors.map((a) => [a.id, a]));

const MU_E = CONSTANTS.earth.muKm3S2;
const MU_M = CONSTANTS.moon.muKm3S2;
const MU_S = 1.32712440018e11;
const J2 = 1.08263e-3;
const RE_J2 = 6378.137;
const FT = CONSTANTS.footKm;
const STEP_S = 10;

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a) => Math.hypot(a[0], a[1], a[2]);
const unit = (a) => { const n = norm(a); return [a[0] / n, a[1] / n, a[2] / n]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const transposeTimes = (m, x) => [
  m[0] * x[0] + m[3] * x[1] + m[6] * x[2], m[1] * x[0] + m[4] * x[1] + m[7] * x[2], m[2] * x[0] + m[5] * x[1] + m[8] * x[2],
];
const deg = (radians) => (radians * 180) / Math.PI;
const getOf = (t) => {
  const s = (t - CONSTANTS.rangeZeroUtcMs) / 1000;
  return `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${(s % 60).toFixed(1).padStart(4, "0")}`;
};

function thirdBody(r, body, mu) {
  const d = sub(body, r);
  const dn = norm(d) ** 3;
  const bn = norm(body) ** 3;
  return [mu * (d[0] / dn - body[0] / bn), mu * (d[1] / dn - body[1] / bn), mu * (d[2] / dn - body[2] / bn)];
}

function acceleration(t, r) {
  const rn = norm(r);
  const z2 = (r[2] / rn) ** 2;
  const j = (1.5 * J2 * MU_E * RE_J2 * RE_J2) / rn ** 5;
  const k = -MU_E / rn ** 3;
  const moon = thirdBody(r, Array.from(adapter.moonPositionKm(Math.round(t))), MU_M);
  const sun = thirdBody(r, Array.from(adapter.sunPositionFromEarthKm(Math.round(t))), MU_S);
  return [
    k * r[0] + j * r[0] * (5 * z2 - 1) + moon[0] + sun[0],
    k * r[1] + j * r[1] * (5 * z2 - 1) + moon[1] + sun[1],
    k * r[2] + j * r[2] * (5 * z2 - 3) + moon[2] + sun[2],
  ];
}

/** One RK4 step of dtS seconds (signed). */
function step(t, y, dtS) {
  const f = (tt, yy) => [yy[3], yy[4], yy[5], ...acceleration(tt, yy.slice(0, 3))];
  const k1 = f(t, y);
  const k2 = f(t + dtS * 500, y.map((x, i) => x + (dtS / 2) * k1[i]));
  const k3 = f(t + dtS * 500, y.map((x, i) => x + (dtS / 2) * k2[i]));
  const k4 = f(t + dtS * 1000, y.map((x, i) => x + dtS * k3[i]));
  return y.map((x, i) => x + (dtS / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}

/** Propagates to t1; optionally tracks the closest approach to a target position. */
function propagate(s, t1, target) {
  let y = [...s.r, ...s.v];
  let t = s.t;
  const dir = Math.sign(t1 - t);
  let closest = { km: Infinity, t };
  while (dir * (t1 - t) > 0) {
    const dtS = dir * Math.min(STEP_S, Math.abs(t1 - t) / 1000);
    y = step(t, y, dtS);
    t += dtS * 1000;
    if (target) {
      const km = norm(sub(y.slice(0, 3), target));
      if (km < closest.km) closest = { km, t };
    }
  }
  return { r: y.slice(0, 3), v: y.slice(3), t, closest };
}

function rebuilt(a, inputs) {
  const native = nativeState(adapter, a.refBody, a.surfaceFixed, inputs, a.timeUtcMs);
  const e = toEarthCentred(adapter, native, a.timeUtcMs);
  return { r: e.r, v: e.v, t: a.timeUtcMs };
}

/** Conversion inputs as transcribed: the normalised inputs with any inferred override undone. */
const printedInputs = (a) =>
  a.inferredOverride === undefined ? a.inputs : { ...a.inputs, [a.inferredOverride.field]: a.inferredOverride.printedValue };
/** State from the values as transcribed, ignoring any inferred override. */
const printedState = (a) => rebuilt(a, printedInputs(a));
/** State the reconstruction uses (inferred overrides applied). */
const reconstructedState = (a) => ({ r: a.earthCentred.positionKm, v: a.earthCentred.velocityKmS, t: a.timeUtcMs });

/** Moon-referenced state with FPA/heading taken against Earth's (EQJ) north instead of lunar north. */
function earthNorthMoonState(a) {
  const native = nativeState(adapter, "moon", false, a.inputs, a.timeUtcMs);
  const up = unit(native.r);
  const east = unit(cross([0, 0, 1], up));
  const north = cross(up, east);
  const { inertialSpeedKmS: s, flightPathAngleDeg: g, headingDeg: h } = a.inputs;
  const gr = (g * Math.PI) / 180;
  const hr = (h * Math.PI) / 180;
  const [e, n, u] = [s * Math.cos(gr) * Math.sin(hr), s * Math.cos(gr) * Math.cos(hr), s * Math.sin(gr)];
  const v = [0, 1, 2].map((k) => e * east[k] + n * north[k] + u * up[k]);
  const earth = toEarthCentred(adapter, { center: "moon", r: native.r, v }, a.timeUtcMs);
  return { r: earth.r, v: earth.v, t: a.timeUtcMs };
}

function miss(from, to) {
  const p = propagate(from, to.t, to.r);
  return {
    positionKm: +norm(sub(p.r, to.r)).toFixed(1),
    velocityMs: +(1000 * norm(sub(p.v, to.v))).toFixed(1),
    closestKm: +p.closest.km.toFixed(1),
    closestMinutesBeforeTarget: +((to.t - p.closest.t) / 60000).toFixed(1),
  };
}

/** Propagates until 400,000 ft geodetic altitude (or 60 h) and reports entry-interface conditions. */
function entryInterface(s) {
  const geodetic = (r, t) =>
    frames.fixedToGeodetic(
      transposeTimes(Array.from(adapter.earthFixedToEqjMatrix(Math.round(t))), r),
      CONSTANTS.earth.equatorialRadiusKm,
      CONSTANTS.earth.inverseFlattening,
    );
  let y = [...s.r, ...s.v];
  let t = s.t;
  let lowest = { km: Infinity, t };
  while (t - s.t < 60 * 3600e3) {
    y = step(t, y, STEP_S);
    t += STEP_S * 1000;
    const r = y.slice(0, 3);
    const v = y.slice(3);
    const g = geodetic(r, t);
    if (g.heightKm < lowest.km) lowest = { km: g.heightKm, t };
    if (g.heightKm <= CONSTANTS.entryInterfaceAltitudeKm) {
      return {
        get: getOf(t),
        latitudeDeg: +g.latitudeDeg.toFixed(2),
        longitudeDeg: +g.longitudeDeg.toFixed(2),
        flightPathAngleDeg: +deg(Math.asin(dot(r, v) / norm(r) / norm(v))).toFixed(2),
        speedFtS: Math.round(norm(v) / FT),
      };
    }
  }
  return { entry: false, perigeeAltitudeKm: Math.round(lowest.km), perigeeGet: getOf(lowest.t) };
}

/** Arrival velocity at a Moon-referenced anchor, expressed in the tool's selenographic local frame. */
function lunarArrival(fromId, toId, toInputs = A[toId].inputs) {
  const to = A[toId];
  const p = propagate(printedState(A[fromId]), to.timeUtcMs);
  const moon = moonFromEarth(adapter, to.timeUtcMs);
  const m = frames.lunarFixedToEqj(to.timeUtcMs);
  const rf = transposeTimes(m, sub(p.r, moon.r));
  const vf = transposeTimes(m, sub(p.v, moon.v));
  const lat = deg(Math.asin(rf[2] / norm(rf)));
  const lon = deg(Math.atan2(rf[1], rf[0]));
  const axes = frames.localAxes(lat, lon);
  const [e, n, u] = [dot(vf, axes.east), dot(vf, axes.north), dot(vf, axes.up)];
  const i = toInputs;
  return {
    propagated: {
      latitudeDeg: +lat.toFixed(2), longitudeDeg: +lon.toFixed(2),
      altitudeNmi: +((norm(rf) - CONSTANTS.moon.referenceRadiusKm) / CONSTANTS.nauticalMileKm).toFixed(1),
      speedFtS: +(norm(vf) / FT).toFixed(1), flightPathAngleDeg: +deg(Math.asin(u / norm(vf))).toFixed(2),
      headingDeg: +deg(Math.atan2(e, n)).toFixed(2),
    },
    printed: {
      latitudeDeg: i.latitudeDeg, longitudeDeg: i.longitudeDeg,
      altitudeNmi: +(i.altitudeKm / CONSTANTS.nauticalMileKm).toFixed(1),
      speedFtS: +(i.inertialSpeedKmS / FT).toFixed(1), flightPathAngleDeg: i.flightPathAngleDeg, headingDeg: i.headingDeg,
    },
  };
}

const a13OldWest = nativeState(
  adapter,
  A["A-13"].refBody,
  A["A-13"].surfaceFixed,
  { ...printedInputs(A["A-13"]), longitudeDeg: -170.09 },
  A["A-13"].timeUtcMs,
);

const withSpeed = (id, ftS) => rebuilt(A[id], { ...printedInputs(A[id]), inertialSpeedKmS: ftS * FT });
const segments = [["A-10", "A-11"], ["A-30", "A-31"], ["A-32", "A-33"], ["A-34", "A-35"], ["A-35", "A-36"]];

const result = {
  description:
    "Anchor-consistency audit (I-006). 'printed' rows convert the values as transcribed (no inferred override); " +
    "'reconstructed' rows use the normalised states the reconstruction uses (A-05, A-33, A-34 overrides applied). " +
    "'hypothesis' rows are diagnostic what-ifs and are not applied anywhere.",
  dynamics: `Geocentric RK4 ${STEP_S} s; Earth mu ${MU_E} + J2 ${J2}; Moon and Sun third-body from the Astraeus adapter`,
  printed: Object.fromEntries(segments.map(([f, t]) => [`${f}>${t}`, miss(printedState(A[f]), printedState(A[t]))])),
  reconstructed: Object.fromEntries(
    segments.map(([f, t]) => [`${f}>${t}`, miss(reconstructedState(A[f]), reconstructedState(A[t]))]),
  ),
  conversionRoundTripKm: Object.fromEntries(
    ["A-32", "A-33", "A-34", "A-35", "A-36"].map((id) => [id, norm(sub(rebuilt(A[id], A[id].inputs).r, reconstructedState(A[id]).r))]),
  ),
  lunarArrival: {
    "A-10>A-11": lunarArrival("A-10", "A-11"),
    "A-30>A-31": lunarArrival("A-30", "A-31"),
    "A-12>A-13": lunarArrival("A-12", "A-13"),
    "A-14>A-13": lunarArrival("A-14", "A-13"),
  },
  lunarAnchorSeparationKm: {
    "A-13>A-14 corrected source longitude": +norm(
      sub(A["A-13"].native.positionKm, A["A-14"].native.positionKm),
    ).toFixed(3),
    "A-13>A-14 old 170.09W transcription": +norm(
      sub(a13OldWest.r, A["A-14"].native.positionKm),
    ).toFixed(3),
  },
  entryInterface: {
    published: {
      "Table 7-VI after TEI": { get: "195:05:57", latitudeDeg: 4.29, longitudeDeg: 180.15, flightPathAngleDeg: -0.70, speedFtS: 36195 },
      "Table 7-VI after MCC-5": { get: "195:03:08", latitudeDeg: -3.17, longitudeDeg: 171.99, flightPathAngleDeg: -6.46, speedFtS: 36194 },
      "Table 7-VII (A-36)": { get: "195:03:05.7", latitudeDeg: -3.19, longitudeDeg: 171.96, flightPathAngleDeg: -6.48, speedFtS: 36194 },
    },
    fromPrinted: Object.fromEntries(["A-32", "A-33", "A-34", "A-35"].map((id) => [id, entryInterface(printedState(A[id]))])),
  },
  hypotheses: {
    "A-13 longitude retained as the old 170.09W transcription": {
      "A-12>A-13": lunarArrival("A-12", "A-13", { ...A["A-13"].inputs, longitudeDeg: -170.09 }),
      "A-14>A-13": lunarArrival("A-14", "A-13", { ...A["A-13"].inputs, longitudeDeg: -170.09 }),
    },
    "A-34 speed read as 4 074.0 ft/s (printed 4 374.0; adopted as an inferred override in T-010)": {
      "A-34>A-35": miss(withSpeed("A-34", 4074.0), printedState(A["A-35"])),
      entryInterface: entryInterface(withSpeed("A-34", 4074.0)),
    },
    "A-33 speed read as 4 075.0 ft/s (printed 4 375.0; adopted as an inferred override in T-010)": {
      entryInterface: entryInterface(withSpeed("A-33", 4075.0)),
    },
    "Moon-referenced FPA/heading measured against Earth (EQJ) north": {
      "A-10>A-11": miss(printedState(A["A-10"]), earthNorthMoonState(A["A-11"])),
      "A-30>A-31": miss(earthNorthMoonState(A["A-30"]), earthNorthMoonState(A["A-31"])),
      "A-32>A-33": miss(earthNorthMoonState(A["A-32"]), printedState(A["A-33"])),
      "A-32 entryInterface": entryInterface(earthNorthMoonState(A["A-32"])),
    },
  },
};

mkdirSync(path.join(root, "docs/evidence"), { recursive: true });
writeFileSync(path.join(root, "docs/evidence/anchor-consistency.json"), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
process.exit(0);
