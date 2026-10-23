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

/**
 * Fraction of a satellite's disc lit, seen from its parent's centre, from the satellite and the Sun both measured from that parent.
 * Any satellite works: the geometry needs the Sun's position and one body orbiting the centre, not their names.
 */
export function illuminatedFraction(bodyFromParent: CenteredPosition, sunFromParent: CenteredPosition): number {
  validateSameCenter(bodyFromParent, sunFromParent);
  if (sunFromParent.body !== "sun") throw new RangeError("light source must be the Sun");
  if (bodyFromParent.body === "sun" || bodyFromParent.body === bodyFromParent.center) {
    throw new RangeError("illuminated fraction needs a satellite of the centre, not the Sun or the centre itself");
  }
  const toSun = directionToSun(bodyFromParent, sunFromParent);
  const toParent = unit(
    [-bodyFromParent.positionKm[0], -bodyFromParent.positionKm[1], -bodyFromParent.positionKm[2]],
    "body-to-parent vector",
  );
  const cosine = toSun[0] * toParent[0] + toSun[1] * toParent[1] + toSun[2] * toParent[2];
  return Math.max(0, Math.min(1, (1 + cosine) / 2));
}

export function lunarIlluminatedFraction(moonFromEarth: CenteredPosition, sunFromEarth: CenteredPosition): number {
  if (moonFromEarth.body !== "moon" || moonFromEarth.center !== "earth" || sunFromEarth.body !== "sun") {
    throw new RangeError("lunar phase requires Moon/Earth and Sun/Earth positions");
  }
  return illuminatedFraction(moonFromEarth, sunFromEarth);
}
