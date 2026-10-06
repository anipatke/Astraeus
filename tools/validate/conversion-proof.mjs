// Conversion proof for the Apollo 11 A-32 and A-33 anchors (T-011, I-006). Diagnostic only: reads the
// normalised and raw anchors, never writes data/. Run: node tools/validate/conversion-proof.mjs
// Writes docs/evidence/conversion-proof.json. Second ephemeris source: docs/evidence/conversion-proof-horizons.json
// (JPL Horizons, DE441, retrieved 2026-10-06).
//
// Each conversion is proven on its own, with implementations written here and not shared with
// tools/apollo11/frames.ts or src/core/astronomyAdapter.ts, before any propagation is run.
//
// Since T-013 (2026-10-06) the tool itself takes Moon-referenced FPA/heading against EQJ north, so "tool"
// results here now equal the EQJ-north reading; the committed evidence JSON predates that change.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runnerImport } from "vite";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const load = (file) => runnerImport(path.join(root, file)).then((result) => result.module);
const [{ createOrbAstronomyAdapter }, { nativeState }, { toEarthCentred, moonFromEarth }, frames, { CONSTANTS, NUMERICS }] =
  await Promise.all([
    load("src/core/astronomyAdapter.ts"),
    load("tools/apollo11/anchors.ts"),
    load("tools/apollo11/ephemeris.ts"),
    load("tools/apollo11/frames.ts"),
    load("tools/apollo11/conventions.ts"),
  ]);
const adapter = createOrbAstronomyAdapter();
const readJson = (file) => JSON.parse(readFileSync(path.join(root, file), "utf8"));
const normalised = readJson("data/apollo11/normalised/anchors.json");
const A = Object.fromEntries(normalised.anchors.map((a) => [a.id, a]));
const horizons = readJson("docs/evidence/conversion-proof-horizons.json");

const FT = CONSTANTS.footKm;
const RAD = Math.PI / 180;
const ARCSEC = RAD / 3600;
const MU_E = CONSTANTS.earth.muKm3S2;
const MU_M = CONSTANTS.moon.muKm3S2;
const MU_S = 1.32712440018e11;
const J2 = 1.08263e-3;
const RE_J2 = 6378.137;
const STEP_S = 10;

// ---------- small vector algebra (own copy) ----------
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scale = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a) => Math.hypot(a[0], a[1], a[2]);
const unit = (a) => scale(a, 1 / norm(a));
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const angleDeg = (a, b) => Math.atan2(norm(cross(a, b)), dot(a, b)) / RAD;
/** Matrices are arrays of three row vectors. */
const mv = (m, v) => [dot(m[0], v), dot(m[1], v), dot(m[2], v)];
const mm = (a, b) => a.map((row) => [0, 1, 2].map((j) => row[0] * b[0][j] + row[1] * b[1][j] + row[2] * b[2][j]));
const tr = (m) => [0, 1, 2].map((j) => [m[0][j], m[1][j], m[2][j]]);
const fromFlat = (f) => [[f[0], f[1], f[2]], [f[3], f[4], f[5]], [f[6], f[7], f[8]]];
/** Passive rotations about an axis (frame rotation): R1, R2, R3 as in SOFA/Vallado. */
const R1 = (a) => [[1, 0, 0], [0, Math.cos(a), Math.sin(a)], [0, -Math.sin(a), Math.cos(a)]];
const R2 = (a) => [[Math.cos(a), 0, -Math.sin(a)], [0, 1, 0], [Math.sin(a), 0, Math.cos(a)]];
const R3 = (a) => [[Math.cos(a), Math.sin(a), 0], [-Math.sin(a), Math.cos(a), 0], [0, 0, 1]];
const r = (x, digits = 3) => +x.toFixed(digits);
const rv = (v, digits = 3) => v.map((x) => r(x, digits));

// ---------- time ----------
const jdUtc = (utcMs) => utcMs / 86400000 + 2440587.5;
const jdTt = (utcMs) => jdUtc(utcMs) + CONSTANTS.ttMinusUtcSeconds / 86400;
const getOf = (t) => {
  const s = (t - CONSTANTS.rangeZeroUtcMs) / 1000;
  return `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${(s % 60).toFixed(1).padStart(4, "0")}`;
};

// ============================================================================================
// 1. A-33 standalone: Fischer geodetic position, Earth-fixed to EQJ, space-fixed velocity, round trip
// ============================================================================================

/** Position on a biaxial ellipsoid by the meridian-ellipse form (semi-minor axis b), independent of frames.ts. */
function ellipsoidToEcef(latDeg, lonDeg, heightKm, a, invF) {
  const b = a * (1 - 1 / invF);
  const lat = latDeg * RAD;
  const lon = lonDeg * RAD;
  const denom = Math.hypot(a * Math.cos(lat), b * Math.sin(lat));
  const rho = (a * a * Math.cos(lat)) / denom + heightKm * Math.cos(lat);
  const z = (b * b * Math.sin(lat)) / denom + heightKm * Math.sin(lat);
  return [rho * Math.cos(lon), rho * Math.sin(lon), z];
}

/** Inverse by Bowring's method with one refinement (different algorithm from frames.fixedToGeodetic). */
function ecefToEllipsoid(p, a, invF) {
  const f = 1 / invF;
  const b = a * (1 - f);
  const e2 = 2 * f - f * f;
  const ep2 = (a * a - b * b) / (b * b);
  const rho = Math.hypot(p[0], p[1]);
  let beta = Math.atan2(p[2] * a, rho * b);
  let lat = 0;
  for (let i = 0; i < 4; i += 1) {
    lat = Math.atan2(p[2] + ep2 * b * Math.sin(beta) ** 3, rho - e2 * a * Math.cos(beta) ** 3);
    beta = Math.atan2((1 - f) * Math.sin(lat), Math.cos(lat));
  }
  const n = a / Math.sqrt(1 - e2 * Math.sin(lat) ** 2);
  return { latDeg: lat / RAD, lonDeg: Math.atan2(p[1], p[0]) / RAD, heightKm: rho / Math.cos(lat) - n };
}

/** IAU 1982 GMST (seconds of time converted to radians), from UT1 ~ UTC. */
function gmst82(utcMs) {
  const jd = jdUtc(utcMs);
  const t = (jd - 2451545.0) / 36525;
  const seconds = 67310.54841 + (876600 * 3600 + 8640184.812866) * t + 0.093104 * t * t - 6.2e-6 * t ** 3;
  return ((((seconds % 86400) + 86400) % 86400) / 240) * RAD;
}

/** IAU 1976 precession (mean of date to J2000: P^T), Lieske. */
function precessionToJ2000(jdTT) {
  const t = (jdTT - 2451545.0) / 36525;
  const zeta = (2306.2181 * t + 0.30188 * t * t + 0.017998 * t ** 3) * ARCSEC;
  const theta = (2004.3109 * t - 0.42665 * t * t - 0.041833 * t ** 3) * ARCSEC;
  const z = (2306.2181 * t + 1.09468 * t * t + 0.018203 * t ** 3) * ARCSEC;
  const toDate = mm(mm(R3(-z), R2(theta)), R3(-zeta));
  return tr(toDate);
}

/** Leading IAU 1980 nutation terms (the four largest), good to about 0.1 arcsec. */
function nutation80(jdTT) {
  const t = (jdTT - 2451545.0) / 36525;
  const omega = (125.04452 - 1934.136261 * t) * RAD;
  const lSun = (280.4665 + 36000.7698 * t) * RAD;
  const lMoon = (218.3165 + 481267.8813 * t) * RAD;
  const dpsi = (-17.20 * Math.sin(omega) - 1.32 * Math.sin(2 * lSun) - 0.23 * Math.sin(2 * lMoon) + 0.21 * Math.sin(2 * omega)) * ARCSEC;
  const deps = (9.20 * Math.cos(omega) + 0.57 * Math.cos(2 * lSun) + 0.10 * Math.cos(2 * lMoon) - 0.09 * Math.cos(2 * omega)) * ARCSEC;
  const eps0 = (84381.448 - 46.8150 * t - 0.00059 * t * t + 0.001813 * t ** 3) * ARCSEC;
  return { dpsi, deps, eps0 };
}

/** ECEF -> EQJ: Rz(GAST) then nutation then precession (polar motion neglected, < 0.3 arcsec). */
function independentEcefToEqj(utcMs) {
  const jdT = jdTt(utcMs);
  const { dpsi, deps, eps0 } = nutation80(jdT);
  const gast = gmst82(utcMs) + dpsi * Math.cos(eps0 + deps);
  const nutToMean = tr(mm(mm(R1(-(eps0 + deps)), R3(-dpsi)), R1(eps0)));
  return mm(mm(precessionToJ2000(jdT), nutToMean), tr(R3(gast)));
}

/** Local east/north/up from the ellipsoid normal, built with cross products only. */
function localEnu(latDeg, lonDeg) {
  const lat = latDeg * RAD;
  const lon = lonDeg * RAD;
  const up = [Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)];
  const east = unit(cross([0, 0, 1], up));
  return { east, north: cross(up, east), up };
}

const velocityEnu = (speed, fpaDeg, headingDeg, { east, north, up }) => {
  const g = fpaDeg * RAD;
  const h = headingDeg * RAD;
  return add(add(scale(east, speed * Math.cos(g) * Math.sin(h)), scale(north, speed * Math.cos(g) * Math.cos(h))), scale(up, speed * Math.sin(g)));
};

function earthAnchorIndependent(inputs, utcMs) {
  const { equatorialRadiusKm: a, inverseFlattening: invF } = CONSTANTS.earth;
  const fixed = ellipsoidToEcef(inputs.latitudeDeg, inputs.longitudeDeg, inputs.altitudeKm, a, invF);
  const enu = localEnu(inputs.latitudeDeg, inputs.longitudeDeg);
  const velFixed = velocityEnu(inputs.inertialSpeedKmS, inputs.flightPathAngleDeg, inputs.headingDeg, enu);
  const m = independentEcefToEqj(utcMs);
  return { fixed, enu, r: mv(m, fixed), v: mv(m, velFixed), matrix: m };
}

/** Back to the printed parameters from an EQJ state. */
function earthAnchorRoundTrip(state, utcMs) {
  const { equatorialRadiusKm: a, inverseFlattening: invF } = CONSTANTS.earth;
  const m = independentEcefToEqj(utcMs);
  const fixed = mv(tr(m), state.r);
  const velFixed = mv(tr(m), state.v);
  const g = ecefToEllipsoid(fixed, a, invF);
  const enu = localEnu(g.latDeg, g.lonDeg);
  const speed = norm(velFixed);
  return {
    latitudeDeg: g.latDeg,
    longitudeDeg: g.lonDeg,
    altitudeNmi: g.heightKm / CONSTANTS.nauticalMileKm,
    speedFtS: speed / FT,
    flightPathAngleDeg: Math.asin(dot(velFixed, enu.up) / speed) / RAD,
    headingDeg: Math.atan2(dot(velFixed, enu.east), dot(velFixed, enu.north)) / RAD,
  };
}

function proveEarthAnchor(id) {
  const a = A[id];
  const mine = earthAnchorIndependent(a.inputs, a.timeUtcMs);
  const tool = a.earthCentred;
  const orb = fromFlat(Array.from(adapter.earthFixedToEqjMatrix(a.timeUtcMs)));
  const rotationDiff = angleDeg(mv(orb, [1, 0, 0]), mv(mine.matrix, [1, 0, 0]));
  const toolRound = { r: tool.positionKm, v: tool.velocityKmS };
  const back = earthAnchorRoundTrip(toolRound, a.timeUtcMs);
  const i = a.inputs;
  return {
    id,
    independentVsTool: {
      positionKm: r(norm(sub(mine.r, tool.positionKm)), 4),
      velocityMs: r(1000 * norm(sub(mine.v, tool.velocityKmS)), 4),
      earthFixedToEqjMatrixDifferenceArcsec: r((rotationDiff * 3600), 3),
      radiusKm: r(norm(mine.r), 1),
      onePrintedArcsecAtThisRadiusKm: r(norm(mine.r) * ARCSEC, 3),
    },
    roundTripAgainstUsedInputs: {
      latitudeDeg: [r(back.latitudeDeg, 6), i.latitudeDeg],
      longitudeDeg: [r(back.longitudeDeg, 6), i.longitudeDeg],
      altitudeNmi: [r(back.altitudeNmi, 4), r(i.altitudeKm / CONSTANTS.nauticalMileKm, 4)],
      speedFtS: [r(back.speedFtS, 4), r(i.inertialSpeedKmS / FT, 4)],
      flightPathAngleDeg: [r(back.flightPathAngleDeg, 6), i.flightPathAngleDeg],
      headingDeg: [r(back.headingDeg, 6), i.headingDeg],
    },
    maxRoundTripResidual: {
      angleDeg: r(Math.max(
        Math.abs(back.latitudeDeg - i.latitudeDeg), Math.abs(back.longitudeDeg - i.longitudeDeg),
        Math.abs(back.flightPathAngleDeg - i.flightPathAngleDeg), Math.abs(back.headingDeg - i.headingDeg)), 9),
      altitudeKm: r(Math.abs(back.altitudeNmi * CONSTANTS.nauticalMileKm - i.altitudeKm), 9),
      speedFtS: r(Math.abs(back.speedFtS - i.inertialSpeedKmS / FT), 9),
    },
  };
}

// ============================================================================================
// 2. A-32 standalone: lunar frame, radius, local basis, Moon ephemeris
// ============================================================================================

/** Moon-fixed (ME axes) to EQJ built from pole and prime-meridian angles with basis vectors only. */
function lunarMatrixFromPole(raDeg, decDeg, wDeg) {
  const ra = raDeg * RAD;
  const dec = decDeg * RAD;
  const w = wDeg * RAD;
  const pole = [Math.cos(dec) * Math.cos(ra), Math.cos(dec) * Math.sin(ra), Math.sin(dec)];
  const node = [-Math.sin(ra), Math.cos(ra), 0];
  const x = add(scale(node, Math.cos(w)), scale(cross(pole, node), Math.sin(w)));
  const y = cross(pole, x);
  return [[x[0], y[0], pole[0]], [x[1], y[1], pole[1]], [x[2], y[2], pole[2]]];
}

const codeLunar = (utcMs) => {
  const p = frames.lunarOrientation(utcMs);
  return { raDeg: p.rightAscensionDeg, decDeg: p.declinationDeg, wDeg: p.primeMeridianDeg };
};

/** Selenographic latitude/longitude of the sub-Earth point given a lunar rotation matrix. */
function subEarthPoint(matrix, moonFromEarthKm) {
  const f = mv(tr(matrix), scale(moonFromEarthKm, -1));
  return { latDeg: Math.asin(f[2] / norm(f)) / RAD, lonDeg: Math.atan2(f[1], f[0]) / RAD };
}

/** Constant rotation from principal-axis to mean-Earth axes, Folkner et al. 2014 (DE430), applied as a frame offset. */
const PA_TO_ME = mm(mm(R3(0.1462 * ARCSEC), R2(-79.0768 * ARCSEC)), R1(-63.8986 * ARCSEC));

function lunarVariantMatrix(name, utcMs) {
  const c = codeLunar(utcMs);
  const d = frames.daysSinceJ2000(utcMs);
  if (name === "code") return fromFlat(Array.from(frames.lunarFixedToEqj(utcMs)));
  if (name === "independent-basis") return lunarMatrixFromPole(c.raDeg, c.decDeg, c.wDeg);
  if (name === "mean-no-libration") {
    return lunarMatrixFromPole(269.9949 + 0.0031 * (d / 36525), 66.5392 + 0.013 * (d / 36525), 38.3213 + 13.17635815 * d - 1.4e-12 * d * d);
  }
  if (name === "principal-axes") return mm(lunarMatrixFromPole(c.raDeg, c.decDeg, c.wDeg), tr(PA_TO_ME));
  throw new RangeError(name);
}

/** Moon-centred state of an anchor with chosen lunar frame, radius, and heading reference ('lunar' or a pole vector). */
function moonAnchorState(a, { frame = "code", radiusKm = CONSTANTS.moon.referenceRadiusKm, northRef = "lunar", velocityKind = "inertial" } = {}) {
  const i = a.inputs;
  const lat = i.latitudeDeg * RAD;
  const lon = i.longitudeDeg * RAD;
  const rad = radiusKm + i.altitudeKm;
  const fixed = [rad * Math.cos(lat) * Math.cos(lon), rad * Math.cos(lat) * Math.sin(lon), rad * Math.sin(lat)];
  const m = lunarVariantMatrix(frame, a.timeUtcMs);
  const rEqj = mv(m, fixed);
  const upFixed = unit(fixed);
  const enuFixed = localEnu(i.latitudeDeg, i.longitudeDeg);
  let v;
  if (northRef === "lunar") {
    v = mv(m, velocityEnu(i.inertialSpeedKmS, i.flightPathAngleDeg, i.headingDeg, enuFixed));
  } else {
    const up = unit(rEqj);
    const east = unit(cross(northRef, up));
    v = velocityEnu(i.inertialSpeedKmS, i.flightPathAngleDeg, i.headingDeg, { east, north: cross(up, east), up });
  }
  if (velocityKind === "moon-fixed") {
    // Treat the printed velocity as relative to the rotating Moon: add omega x r in the Moon-centred inertial frame.
    const rate = lunarSpinVector(a.timeUtcMs);
    v = add(v, cross(rate, rEqj));
  }
  void upFixed;
  return { r: rEqj, v };
}

/** Lunar spin vector (km/s per km; rad/s) in EQJ from the pole and the rotation rate. */
function lunarSpinVector(utcMs) {
  const c = codeLunar(utcMs);
  const pole = lunarMatrixFromPole(c.raDeg, c.decDeg, c.wDeg).map((row) => row[2]);
  return scale(pole, (13.17635815 * RAD) / 86400);
}

const poleOfDate = (jdTT) => {
  const m = precessionToJ2000(jdTT);
  return mv(m, [0, 0, 1]);
};
const poleB1950 = () => {
  // Precession from B1950.0 (JD 2433282.4235) to J2000 applied to the equatorial pole.
  const t = (2433282.4235 - 2451545.0) / 36525;
  const zeta = (2306.2181 * t + 0.30188 * t * t + 0.017998 * t ** 3) * ARCSEC;
  const theta = (2004.3109 * t - 0.42665 * t * t - 0.041833 * t ** 3) * ARCSEC;
  const z = (2306.2181 * t + 1.09468 * t * t + 0.018203 * t ** 3) * ARCSEC;
  return mv(tr(mm(mm(R3(-z), R2(theta)), R3(-zeta))), [0, 0, 1]);
};

const moonEarthState = (utcMs) => moonFromEarth(adapter, utcMs);
const toEarth = (moonState, utcMs) => {
  const m = moonEarthState(utcMs);
  return { r: add(moonState.r, m.r), v: add(moonState.v, m.v) };
};
const effect = (variant, base) => ({
  positionKm: r(norm(sub(variant.r, base.r)), 3),
  velocityMs: r(1000 * norm(sub(variant.v, base.v)), 3),
});

function proveMoonAnchor(id) {
  const a = A[id];
  const utc = a.timeUtcMs;
  const base = toEarth(moonAnchorState(a), utc);
  const toolEarth = { r: a.earthCentred.positionKm, v: a.earthCentred.velocityKmS };
  const h = horizons.samples[id];
  const hMoon = h === undefined ? undefined : { r: h.positionKm, v: h.velocityKmS };
  const code = codeLunar(utc);
  const codeMatrix = lunarVariantMatrix("code", utc);
  const moon = moonEarthState(utc);
  const sub1 = subEarthPoint(codeMatrix, moon.r);
  const sub2 = hMoon === undefined ? undefined : subEarthPoint(codeMatrix, hMoon.r);
  const variantEffects = (variants) => Object.fromEntries(
    Object.entries(variants).map(([name, options]) => [name, effect(toEarth(moonAnchorState(a, options), utc), base)]),
  );
  const pole1969 = poleOfDate(jdTt(utc));
  const horizonsSwap = hMoon === undefined ? undefined : effect(
    { r: add(moonAnchorState(a).r, hMoon.r), v: add(moonAnchorState(a).v, hMoon.v) }, base);
  return {
    id,
    toolReproduced: effect(base, toolEarth),
    lunarOrientationDeg: { rightAscension: r(code.raDeg, 4), declination: r(code.decDeg, 4), primeMeridian: r(code.wDeg % 360, 4) },
    stepA_lunarFrame: {
      independentBasisMatrixAgreesWithCode: r(
        Math.max(...[0, 1, 2].map((k) => angleDeg(mv(lunarVariantMatrix("independent-basis", utc), [+(k === 0), +(k === 1), +(k === 2)]),
          mv(codeMatrix, [+(k === 0), +(k === 1), +(k === 2)])))) * 3600, 6),
      subEarthPointSelenographic: {
        astraeusMoon: { latDeg: r(sub1.latDeg, 3), lonDeg: r(sub1.lonDeg, 3) },
        horizonsMoon: sub2 === undefined ? null : { latDeg: r(sub2.latDeg, 3), lonDeg: r(sub2.lonDeg, 3) },
        horizonsPublished: horizons.subEarth[id] === undefined ? null : {
          latDeg: horizons.subEarth[id].latitudeDeg,
          lonDeg: r(((horizons.subEarth[id].longitudeDeg + 180) % 360) - 180, 6),
        },
      },
      effectOnEarthCentredState: variantEffects({
        "mean axes without libration series": { frame: "mean-no-libration" },
        "principal axes instead of mean-Earth axes (PA->ME about 0.1 deg)": { frame: "principal-axes" },
      }),
    },
    stepB_radiusAndLatitude: {
      effectOnEarthCentredState: variantEffects({
        "radius 1737.4 km (IAU mean) instead of 1738.09": { radiusKm: 1737.4 },
        "radius 1738.0 km (gravity)": { radiusKm: 1738.0 },
      }),
      note: "The printed latitude is selenocentric on a sphere in the tool; a +/-0.2 deg geodetic-versus-geocentric ambiguity would move position by under 0.7 km on this body.",
    },
    stepC_localBasis: {
      headingReferenceAngleBetweenPolesDeg: {
        lunarPoleVsEqjNorth: r(angleDeg(lunarMatrixFromPole(code.raDeg, code.decDeg, code.wDeg).map((row) => row[2]), [0, 0, 1]), 3),
        eqjNorthVsMeanPoleOf1969: r(angleDeg([0, 0, 1], pole1969), 4),
        eqjNorthVsB1950Pole: r(angleDeg([0, 0, 1], poleB1950()), 4),
      },
      effectOnEarthCentredState: variantEffects({
        "FPA/heading against EQJ (J2000) north": { northRef: [0, 0, 1] },
        "FPA/heading against mean equatorial pole of date (1969)": { northRef: pole1969 },
        "FPA/heading against B1950 equatorial pole": { northRef: poleB1950() },
        "printed velocity read as Moon-fixed (relative) speed": { velocityKind: "moon-fixed" },
      }),
    },
    stepD_moonEphemeris: hMoon === undefined ? null : {
      astraeusVsHorizons: {
        positionKm: r(norm(sub(moon.r, hMoon.r)), 3),
        velocityMs: r(1000 * norm(sub(moon.v, hMoon.v)), 3),
        positionAngleArcsec: r(angleDeg(moon.r, hMoon.r) * 3600, 2),
      },
      effectOnEarthCentredStateOfUsingHorizons: horizonsSwap,
    },
    baselineEarthCentred: { rKm: rv(base.r, 3), vKmS: rv(base.v, 6) },
  };
}

// ============================================================================================
// 3. Heading-reference fit: which north reproduces a constant orbit plane across lunar-orbit anchors
// ============================================================================================

const lunarOrbitIds = Object.keys(A).filter((id) => A[id].phase === "lunar_orbit" && A[id].refBody === "moon");
const coastGroups = {
  "LOI-1 coast (A-12, A-13)": ["A-12", "A-13"],
  "docked 60 nmi orbit (A-14..A-17)": ["A-14", "A-15", "A-16", "A-17"],
  "Columbia ascent-phase orbit (A-27..A-30)": ["A-27", "A-28", "A-29", "A-30"],
};

const orbitNormal = (state) => unit(cross(state.r, state.v));
const spreadDeg = (normals) => {
  const mean = unit(normals.reduce((s, n) => add(s, n), [0, 0, 0]));
  return Math.max(...normals.map((n) => angleDeg(n, mean)));
};
const meanDirection = (normals) => unit(normals.reduce((s, n) => add(s, n), [0, 0, 0]));

function planeSpread(northFor) {
  return Object.fromEntries(Object.entries(coastGroups).map(([name, ids]) => [
    name,
    r(spreadDeg(ids.map((id) => orbitNormal(moonAnchorState(A[id], { northRef: northFor(A[id]) })))), 3),
  ]));
}

/** Inclination of the orbit to the lunar equator (deg), for the physical-plausibility check. */
function inclinationToLunarEquator(id, northRef) {
  const a = A[id];
  const state = moonAnchorState(a, { northRef });
  const pole = lunarMatrixFromPole(...Object.values(codeLunar(a.timeUtcMs))).map((row) => row[2]);
  return angleDeg(orbitNormal(state), pole);
}

/**
 * Heading each lunar-orbit anchor would need for its velocity to lie in a reference orbit plane, with the printed speed and
 * FPA and the EQJ pole as north. The reference plane is the mean normal of the anchors that agree with one another.
 */
function planeImpliedHeadings(referenceIds) {
  const normal = meanDirection(referenceIds.map((id) => orbitNormal(moonAnchorState(A[id], { northRef: eqjNorth() }))));
  return Object.fromEntries(lunarOrbitIds.map((id) => {
    const a = A[id];
    const i = a.inputs;
    const rEqj = moonAnchorState(a, { northRef: eqjNorth() }).r;
    const up = unit(rEqj);
    const east = unit(cross([0, 0, 1], up));
    const north = cross(up, east);
    const g = i.flightPathAngleDeg * RAD;
    // cos(g) (sin(h) e.n0 + cos(h) n.n0) + sin(g) u.n0 = 0 is p sin(h) + q cos(h) = c, solved for the heading h.
    const p = Math.cos(g) * dot(east, normal);
    const q = Math.cos(g) * dot(north, normal);
    const c = -Math.sin(g) * dot(up, normal);
    const amplitude = Math.hypot(p, q);
    const phase = Math.atan2(q, p);
    const arcsine = Math.asin(Math.max(-1, Math.min(1, c / amplitude)));
    const candidates = [arcsine - phase, Math.PI - arcsine - phase].map((x) => Math.atan2(Math.sin(x), Math.cos(x)) / RAD);
    const best = candidates.reduce((x, y) => (Math.abs(x - i.headingDeg) < Math.abs(y - i.headingDeg) ? x : y));
    return [id, { printedHeadingDeg: i.headingDeg, planeImpliedHeadingDeg: r(best, 2), differenceDeg: r(i.headingDeg - best, 2) }];
  }));
}

// ============================================================================================
// 4. Propagation (only after both conversions are proven): same dynamics as anchor-consistency.mjs
// ============================================================================================

function thirdBody(position, body, mu) {
  const d = sub(body, position);
  const dn = norm(d) ** 3;
  const bn = norm(body) ** 3;
  return scale(sub(scale(d, 1 / dn), scale(body, 1 / bn)), mu);
}

function acceleration(t, p) {
  const rn = norm(p);
  const z2 = (p[2] / rn) ** 2;
  const j = (1.5 * J2 * MU_E * RE_J2 * RE_J2) / rn ** 5;
  const k = -MU_E / rn ** 3;
  const moon = thirdBody(p, Array.from(adapter.moonPositionKm(Math.round(t))), MU_M);
  const sun = thirdBody(p, Array.from(adapter.sunPositionFromEarthKm(Math.round(t))), MU_S);
  return [
    k * p[0] + j * p[0] * (5 * z2 - 1) + moon[0] + sun[0],
    k * p[1] + j * p[1] * (5 * z2 - 1) + moon[1] + sun[1],
    k * p[2] + j * p[2] * (5 * z2 - 3) + moon[2] + sun[2],
  ];
}

function step(t, y, dtS) {
  const f = (tt, yy) => [yy[3], yy[4], yy[5], ...acceleration(tt, yy.slice(0, 3))];
  const k1 = f(t, y);
  const k2 = f(t + dtS * 500, y.map((x, i) => x + (dtS / 2) * k1[i]));
  const k3 = f(t + dtS * 500, y.map((x, i) => x + (dtS / 2) * k2[i]));
  const k4 = f(t + dtS * 1000, y.map((x, i) => x + dtS * k3[i]));
  return y.map((x, i) => x + (dtS / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}

function propagate(from, t0, t1, target) {
  let y = [...from.r, ...from.v];
  let t = t0;
  let closest = { km: Infinity, t };
  while (t1 - t > 0) {
    const dtS = Math.min(STEP_S, (t1 - t) / 1000);
    y = step(t, y, dtS);
    t += dtS * 1000;
    if (target) {
      const km = norm(sub(y.slice(0, 3), target));
      if (km < closest.km) closest = { km, t };
    }
  }
  return { r: y.slice(0, 3), v: y.slice(3), closest };
}

function miss(from, fromUtc, to, toUtc) {
  const p = propagate(from, fromUtc, toUtc, to.r);
  return {
    positionKm: r(norm(sub(p.r, to.r)), 1),
    velocityMs: r(1000 * norm(sub(p.v, to.v)), 1),
    closestKm: r(p.closest.km, 1),
    closestMinutesBeforeTarget: r((toUtc - p.closest.t) / 60000, 1),
  };
}

const earthState = (id, options) => {
  const a = A[id];
  return a.refBody === "moon"
    ? toEarth(moonAnchorState(a, options), a.timeUtcMs)
    : { r: a.earthCentred.positionKm, v: a.earthCentred.velocityKmS };
};

/** Entry-interface conditions by propagating until 400,000 ft geodetic altitude (or 60 h). */
function entryInterface(from, fromUtc) {
  const geodetic = (p, t) => ecefToEllipsoid(mv(tr(independentEcefToEqj(Math.round(t))), p), CONSTANTS.earth.equatorialRadiusKm, CONSTANTS.earth.inverseFlattening);
  let y = [...from.r, ...from.v];
  let t = fromUtc;
  let lowest = { km: Infinity, t };
  while (t - fromUtc < 60 * 3600e3) {
    y = step(t, y, STEP_S);
    t += STEP_S * 1000;
    const g = geodetic(y.slice(0, 3), t);
    if (g.heightKm < lowest.km) lowest = { km: g.heightKm, t };
    if (g.heightKm <= CONSTANTS.entryInterfaceAltitudeKm) {
      const p = y.slice(0, 3);
      const v = y.slice(3);
      return {
        get: getOf(t), latitudeDeg: r(g.latDeg, 2), longitudeDeg: r(g.lonDeg, 2),
        flightPathAngleDeg: r(Math.asin(dot(p, v) / norm(p) / norm(v)) / RAD, 2), speedFtS: Math.round(norm(v) / FT),
      };
    }
  }
  return { entry: false, perigeeAltitudeKm: Math.round(lowest.km), perigeeGet: getOf(lowest.t) };
}

// ============================================================================================
// run
// ============================================================================================

const eqjNorth = () => [0, 0, 1];
const refIds = ["A-12", "A-13", "A-14", "A-16", "A-17", "A-18", "A-19", "A-20", "A-21", "A-22", "A-23", "A-24", "A-25", "A-26"];
const result = {
  description: "Conversion proof for A-32 and A-33 (T-011, I-006). Independent implementations; diagnostic only; nothing here is applied to the reconstruction.",
  generatedFrom: "data/apollo11/normalised/anchors.json (A-33 with its T-010 speed override), docs/evidence/conversion-proof-horizons.json",
  a33Standalone: proveEarthAnchor("A-33"),
  a34Control: proveEarthAnchor("A-34"),
  a32Standalone: proveMoonAnchor("A-32"),
  controls: { "A-11": proveMoonAnchor("A-11"), "A-31": proveMoonAnchor("A-31") },
  headingReferenceFit: {
    method: "Within one coast the orbit plane is fixed in inertial space, so r x v from each anchor must point the same way. Spread = largest angle (deg) from the mean orbit normal.",
    planeSpreadDeg: {
      "north = lunar pole (as in the tool)": planeSpread(() => "lunar"),
      "north = EQJ (J2000) pole": planeSpread(eqjNorth),
      "north = mean pole of date": planeSpread((a) => poleOfDate(jdTt(a.timeUtcMs))),
      "north = B1950 pole": planeSpread(() => poleB1950()),
    },
    referencePlane: "mean orbit normal of A-12..A-14 and A-16..A-26 (Earth-north reading), RA/Dec below",
    referencePlaneNormalRaDecDeg: (() => {
      const n = meanDirection(refIds.map((id) => orbitNormal(moonAnchorState(A[id], { northRef: eqjNorth() }))));
      return [r(((Math.atan2(n[1], n[0]) / RAD) + 360) % 360, 2), r(Math.asin(n[2]) / RAD, 2)];
    })(),
    planeImpliedHeadings: planeImpliedHeadings(refIds),
    inclinationToLunarEquatorDeg: Object.fromEntries(lunarOrbitIds.map((id) => [id, {
      printedHeadingDeg: A[id].inputs.headingDeg,
      northIsLunarPole: r(inclinationToLunarEquator(id, "lunar"), 2),
      northIsEqjPole: r(inclinationToLunarEquator(id, eqjNorth()), 2),
    }])),
  },
};

// Propagation only after both conversions have been checked above.
const t32 = A["A-32"].timeUtcMs;
const t33 = A["A-33"].timeUtcMs;
const propagate32to33 = (options) => miss(earthState("A-32", options), t32, earthState("A-33"), t33);
result.propagation = {
  dynamics: `Geocentric RK4 ${STEP_S} s; Earth mu ${MU_E} + J2 ${J2}; Moon and Sun third-body from the Astraeus adapter`,
  "A-32>A-33 under the proven conversions (north = lunar pole)": propagate32to33({}),
  "A-32>A-33 with the lunar-frame variants": {
    "mean axes without libration": propagate32to33({ frame: "mean-no-libration" }),
    "principal axes": propagate32to33({ frame: "principal-axes" }),
    "radius 1737.4 km": propagate32to33({ radiusKm: 1737.4 }),
    "printed velocity read as Moon-fixed": propagate32to33({ velocityKind: "moon-fixed" }),
  },
  "A-32>A-33 with the heading reference changed (PROPOSED, not applied)": {
    "north = EQJ (J2000) pole": propagate32to33({ northRef: eqjNorth() }),
    "north = mean pole of date (1969)": propagate32to33({ northRef: poleOfDate(jdTt(t32)) }),
    "north = B1950 pole": propagate32to33({ northRef: poleB1950() }),
  },
  controlsUnderEachReference: Object.fromEntries([["north = lunar pole", "lunar"], ["north = EQJ (J2000) pole", eqjNorth()]].map(([name, northRef]) => [
    name,
    {
      "A-10>A-11": miss(earthState("A-10"), A["A-10"].timeUtcMs, earthState("A-11", { northRef }), A["A-11"].timeUtcMs),
      "A-30>A-31": miss(earthState("A-30", { northRef }), A["A-30"].timeUtcMs, earthState("A-31", { northRef }), A["A-31"].timeUtcMs),
    },
  ])),
  entryInterface: {
    published: {
      "Table 7-VI after TEI": { get: "195:05:57", latitudeDeg: 4.29, longitudeDeg: 180.15, flightPathAngleDeg: -0.70, speedFtS: 36195 },
      "Table 7-VI after MCC-5": { get: "195:03:08", latitudeDeg: -3.17, longitudeDeg: 171.99, flightPathAngleDeg: -6.46, speedFtS: 36194 },
    },
    "from A-32, north = lunar pole": entryInterface(earthState("A-32"), t32),
    "from A-32, north = EQJ (J2000) pole": entryInterface(earthState("A-32", { northRef: eqjNorth() }), t32),
    "from A-33 (override applied)": entryInterface(earthState("A-33"), t33),
  },
};

mkdirSync(path.join(root, "docs/evidence"), { recursive: true });
writeFileSync(path.join(root, "docs/evidence/conversion-proof.json"), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
void NUMERICS;
void nativeState;
void toEarthCentred;
process.exit(0);
