import { CONSTANTS } from "./conventions";
import { cross, mulMat, norm, radians, scale, type Mat3, type Vec3 } from "./vec";

const J2000_JD = 2451545.0;
const UNIX_EPOCH_JD = 2440587.5;
const MS_PER_DAY = 86_400_000;

/** Geodetic latitude/longitude/height to body-fixed Cartesian km on a biaxial ellipsoid. */
export function geodeticToFixedKm(
  latitudeDeg: number,
  longitudeDeg: number,
  heightKm: number,
  equatorialRadiusKm: number,
  inverseFlattening: number,
): Vec3 {
  const f = 1 / inverseFlattening;
  const e2 = 2 * f - f * f;
  const lat = radians(latitudeDeg);
  const lon = radians(longitudeDeg);
  const n = equatorialRadiusKm / Math.sqrt(1 - e2 * Math.sin(lat) ** 2);
  return [
    (n + heightKm) * Math.cos(lat) * Math.cos(lon),
    (n + heightKm) * Math.cos(lat) * Math.sin(lon),
    (n * (1 - e2) + heightKm) * Math.sin(lat),
  ];
}

/** Spherical latitude/longitude/radius to body-fixed Cartesian km. */
export function sphericalToFixedKm(latitudeDeg: number, longitudeDeg: number, radiusKm: number): Vec3 {
  const lat = radians(latitudeDeg);
  const lon = radians(longitudeDeg);
  return [radiusKm * Math.cos(lat) * Math.cos(lon), radiusKm * Math.cos(lat) * Math.sin(lon), radiusKm * Math.sin(lat)];
}

/** Local east, north, up axes (up along the latitude's surface normal) in body-fixed coordinates. */
export function localAxes(latitudeDeg: number, longitudeDeg: number): { east: Vec3; north: Vec3; up: Vec3 } {
  const lat = radians(latitudeDeg);
  const lon = radians(longitudeDeg);
  return {
    east: [-Math.sin(lon), Math.cos(lon), 0],
    north: [-Math.sin(lat) * Math.cos(lon), -Math.sin(lat) * Math.sin(lon), Math.cos(lat)],
    up: [Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)],
  };
}

/**
 * Local east, north, up axes at an inertial position, with north toward the EQJ (J2000) pole.
 * Used for Moon-referenced flight-path angle and heading, which the data fits against Earth-equatorial
 * north rather than lunar north (docs/ASTRAEUS_SPIKE_02.md 7.2; owner decision 2026-10-06).
 */
export function inertialNorthAxes(position: Vec3): { east: Vec3; north: Vec3; up: Vec3 } {
  const up = scale(position, 1 / norm(position));
  const pole = cross([0, 0, 1], up);
  const east = scale(pole, 1 / norm(pole));
  return { east, north: cross(up, east), up };
}

/** Velocity direction from inertial speed, flight-path angle (up from horizontal), heading (east of north). */
export function velocityFromFlightGeometry(
  axes: { east: Vec3; north: Vec3; up: Vec3 },
  speed: number,
  flightPathAngleDeg: number,
  headingDeg: number,
): Vec3 {
  const gamma = radians(flightPathAngleDeg);
  const psi = radians(headingDeg);
  const east = speed * Math.cos(gamma) * Math.sin(psi);
  const north = speed * Math.cos(gamma) * Math.cos(psi);
  const up = speed * Math.sin(gamma);
  return [
    east * axes.east[0] + north * axes.north[0] + up * axes.up[0],
    east * axes.east[1] + north * axes.north[1] + up * axes.up[1],
    east * axes.east[2] + north * axes.north[2] + up * axes.up[2],
  ];
}

const rotateZ = (angle: number): Mat3 => {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [c, -s, 0, s, c, 0, 0, 0, 1];
};

const rotateX = (angle: number): Mat3 => {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [1, 0, 0, 0, c, -s, 0, s, c];
};

// IAU WGCCRE lunar rotation (Archinal et al. 2018): [constant, rate per day] for E1..E13 in degrees.
const LIBRATION_ANGLES: readonly (readonly [number, number])[] = [
  [125.045, -0.0529921], [250.089, -0.1059842], [260.008, 13.0120009], [176.625, 13.3407154],
  [357.529, 0.9856003], [311.589, 26.4057084], [134.963, 13.0649930], [276.617, 0.3287146],
  [34.226, 1.7484877], [15.134, -0.1589763], [119.743, 0.0036096], [239.961, 0.1643573],
  [25.053, 12.9590088],
];

// [E number, amplitude in degrees] series terms.
const RIGHT_ASCENSION_TERMS: readonly (readonly [number, number])[] = [
  [1, -3.8787], [2, -0.1204], [3, 0.0700], [4, -0.0172], [6, 0.0072], [10, -0.0052], [13, 0.0043],
];
const DECLINATION_TERMS: readonly (readonly [number, number])[] = [
  [1, 1.5419], [2, 0.0239], [3, -0.0278], [4, 0.0068], [6, -0.0029], [7, 0.0009], [10, 0.0008], [13, -0.0009],
];
const PRIME_MERIDIAN_TERMS: readonly (readonly [number, number])[] = [
  [1, 3.5610], [2, 0.1208], [3, -0.0642], [4, 0.0158], [5, 0.0252], [6, -0.0066], [7, -0.0047], [8, -0.0046],
  [9, 0.0028], [10, 0.0052], [11, 0.0040], [12, 0.0019], [13, -0.0044],
];

export interface LunarPole {
  readonly rightAscensionDeg: number;
  readonly declinationDeg: number;
  readonly primeMeridianDeg: number;
}

/** Days from J2000.0 on the dynamical time scale for a UTC Unix-millisecond instant. */
export function daysSinceJ2000(timeUtcMs: number): number {
  return timeUtcMs / MS_PER_DAY + UNIX_EPOCH_JD - J2000_JD + CONSTANTS.ttMinusUtcSeconds / 86400;
}

export function lunarOrientation(timeUtcMs: number): LunarPole {
  const d = daysSinceJ2000(timeUtcMs);
  const t = d / 36525;
  const sinE = (index: number): number => {
    const [offset, rate] = LIBRATION_ANGLES[index - 1];
    return Math.sin(radians(offset + rate * d));
  };
  const cosE = (index: number): number => {
    const [offset, rate] = LIBRATION_ANGLES[index - 1];
    return Math.cos(radians(offset + rate * d));
  };
  return {
    rightAscensionDeg: 269.9949 + 0.0031 * t + RIGHT_ASCENSION_TERMS.reduce((sum, [n, a]) => sum + a * sinE(n), 0),
    declinationDeg: 66.5392 + 0.013 * t + DECLINATION_TERMS.reduce((sum, [n, a]) => sum + a * cosE(n), 0),
    primeMeridianDeg: 38.3213 + 13.17635815 * d - 1.4e-12 * d * d
      + PRIME_MERIDIAN_TERMS.reduce((sum, [n, a]) => sum + a * sinE(n), 0),
  };
}

/** Moon-fixed (selenographic) to Moon-centred EQJ rotation. */
export function lunarFixedToEqj(timeUtcMs: number): Mat3 {
  const pole = lunarOrientation(timeUtcMs);
  return mulMat(
    mulMat(rotateZ(radians(pole.rightAscensionDeg + 90)), rotateX(radians(90 - pole.declinationDeg))),
    rotateZ(radians(pole.primeMeridianDeg)),
  );
}

/** Time derivative of the rotation, by central difference, in 1/s. */
export function lunarRotationRate(timeUtcMs: number, halfStepMs: number): Mat3 {
  const later = lunarFixedToEqj(timeUtcMs + halfStepMs);
  const earlier = lunarFixedToEqj(timeUtcMs - halfStepMs);
  const seconds = (2 * halfStepMs) / 1000;
  return later.map((value, index) => (value - earlier[index]) / seconds) as unknown as Mat3;
}

/** Velocity (km/s) of a Moon-fixed point in the Moon-centred inertial frame. */
export function surfacePointVelocity(timeUtcMs: number, fixedKm: Vec3, halfStepMs: number): Vec3 {
  const rate = lunarRotationRate(timeUtcMs, halfStepMs);
  return [
    rate[0] * fixedKm[0] + rate[1] * fixedKm[1] + rate[2] * fixedKm[2],
    rate[3] * fixedKm[0] + rate[4] * fixedKm[1] + rate[5] * fixedKm[2],
    rate[6] * fixedKm[0] + rate[7] * fixedKm[1] + rate[8] * fixedKm[2],
  ];
}


/** Geodetic latitude/longitude (deg) and height (km) of a body-fixed point, by fixed-point iteration. */
export function fixedToGeodetic(
  fixedKm: Vec3,
  equatorialRadiusKm: number,
  inverseFlattening: number,
): { latitudeDeg: number; longitudeDeg: number; heightKm: number } {
  const f = 1 / inverseFlattening;
  const e2 = 2 * f - f * f;
  const p = Math.hypot(fixedKm[0], fixedKm[1]);
  let lat = Math.atan2(fixedKm[2], p * (1 - e2));
  let height = 0;
  for (let i = 0; i < 20; i += 1) {
    const n = equatorialRadiusKm / Math.sqrt(1 - e2 * Math.sin(lat) ** 2);
    height = p / Math.cos(lat) - n;
    lat = Math.atan2(fixedKm[2], p * (1 - (e2 * n) / (n + height)));
  }
  return { latitudeDeg: lat / (Math.PI / 180), longitudeDeg: Math.atan2(fixedKm[1], fixedKm[0]) / (Math.PI / 180), heightKm: height };
}
