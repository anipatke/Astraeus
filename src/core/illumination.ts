import type { CenteredPosition } from "./state";

function unit(vector: ArrayLike<number>, label: string): Float64Array {
  if (vector.length !== 3 || Array.from(vector).some((value) => !Number.isFinite(value))) {
    throw new TypeError(`${label} must be a finite 3-vector`);
  }
  const length = Math.hypot(vector[0], vector[1], vector[2]);
  if (length < 1e-12) throw new RangeError(`${label} has no direction`);
  return Float64Array.of(vector[0] / length, vector[1] / length, vector[2] / length);
}

function validateSameCenter(a: CenteredPosition, b: CenteredPosition): void {
  if (a.timeUtcMs !== b.timeUtcMs) throw new RangeError("illumination geometry requires identical timestamps");
  if (a.frame !== b.frame) throw new RangeError("illumination geometry requires identical frames");
  if (a.center !== b.center) throw new RangeError("illumination geometry requires positions with the same center");
}

export function directionToSun(body: CenteredPosition, sun: CenteredPosition): Float64Array {
  validateSameCenter(body, sun);
  if (sun.body !== "sun") throw new RangeError("light source must be the Sun");
  return unit([
    sun.positionKm[0] - body.positionKm[0],
    sun.positionKm[1] - body.positionKm[1],
    sun.positionKm[2] - body.positionKm[2],
  ], "body-to-Sun vector");
}

export function directionFromCenterToSun(sun: CenteredPosition): Float64Array {
  if (sun.body !== "sun") throw new RangeError("light source must be the Sun");
  return unit(sun.positionKm, "center-to-Sun vector");
}

export function lunarIlluminatedFraction(moonFromEarth: CenteredPosition, sunFromEarth: CenteredPosition): number {
  validateSameCenter(moonFromEarth, sunFromEarth);
  if (moonFromEarth.body !== "moon" || moonFromEarth.center !== "earth" || sunFromEarth.body !== "sun") {
    throw new RangeError("lunar phase requires Moon/Earth and Sun/Earth positions");
  }
  const moonToSun = directionToSun(moonFromEarth, sunFromEarth);
  const moonToEarth = unit(
    [-moonFromEarth.positionKm[0], -moonFromEarth.positionKm[1], -moonFromEarth.positionKm[2]],
    "Moon-to-Earth vector",
  );
  const cosine = moonToSun[0] * moonToEarth[0]
    + moonToSun[1] * moonToEarth[1]
    + moonToSun[2] * moonToEarth[2];
  return Math.max(0, Math.min(1, (1 + cosine) / 2));
}
