import type { Quaternion } from "./state";

export type Vector3 = ArrayLike<number>;

function requireVector(vector: Vector3, label: string): void {
  if (vector.length !== 3 || Array.from(vector).some((value) => !Number.isFinite(value))) {
    throw new TypeError(`${label} must be a finite 3-vector`);
  }
}

function normalize(vector: Vector3, label: string): Float64Array {
  requireVector(vector, label);
  const magnitude = Math.hypot(vector[0], vector[1], vector[2]);
  if (magnitude < 1e-12) throw new RangeError(`${label} has no stable direction`);
  return Float64Array.of(vector[0] / magnitude, vector[1] / magnitude, vector[2] / magnitude);
}

function cross(a: Vector3, b: Vector3): Float64Array {
  return Float64Array.of(
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  );
}

/** Converts a row-major body-to-EQJ rotation matrix into an [x,y,z,w] quaternion. */
export function quaternionFromMatrix(matrix: ArrayLike<number>): Quaternion {
  if (matrix.length !== 9 || Array.from(matrix).some((value) => !Number.isFinite(value))) {
    throw new TypeError("rotation matrix must contain nine finite values");
  }
  const m00 = matrix[0], m01 = matrix[1], m02 = matrix[2];
  const m10 = matrix[3], m11 = matrix[4], m12 = matrix[5];
  const m20 = matrix[6], m21 = matrix[7], m22 = matrix[8];
  const trace = m00 + m11 + m22;
  let x: number, y: number, z: number, w: number;
  if (trace > 0) {
    const s = Math.sqrt(trace + 1) * 2;
    w = 0.25 * s;
    x = (m21 - m12) / s;
    y = (m02 - m20) / s;
    z = (m10 - m01) / s;
  } else if (m00 > m11 && m00 > m22) {
    const s = Math.sqrt(1 + m00 - m11 - m22) * 2;
    w = (m21 - m12) / s;
    x = 0.25 * s;
    y = (m01 + m10) / s;
    z = (m02 + m20) / s;
  } else if (m11 > m22) {
    const s = Math.sqrt(1 + m11 - m00 - m22) * 2;
    w = (m02 - m20) / s;
    x = (m01 + m10) / s;
    y = 0.25 * s;
    z = (m12 + m21) / s;
  } else {
    const s = Math.sqrt(1 + m22 - m00 - m11) * 2;
    w = (m10 - m01) / s;
    x = (m02 + m20) / s;
    y = (m12 + m21) / s;
    z = 0.25 * s;
  }
  return normalizeQuaternion([x, y, z, w]);
}

export function normalizeQuaternion(value: ArrayLike<number>): Quaternion {
  if (value.length !== 4 || Array.from(value).some((component) => !Number.isFinite(component))) {
    throw new TypeError("quaternion must contain four finite values");
  }
  const magnitude = Math.hypot(value[0], value[1], value[2], value[3]);
  if (magnitude < 1e-12) throw new RangeError("quaternion must be non-zero");
  return Object.freeze([
    value[0] / magnitude,
    value[1] / magnitude,
    value[2] / magnitude,
    value[3] / magnitude,
  ]) as Quaternion;
}

export function rotateVectorByQuaternion(quaternion: Quaternion, vector: Vector3): Float64Array {
  requireVector(vector, "vector");
  const [x, y, z, w] = quaternion;
  const tx = 2 * (y * vector[2] - z * vector[1]);
  const ty = 2 * (z * vector[0] - x * vector[2]);
  const tz = 2 * (x * vector[1] - y * vector[0]);
  return Float64Array.of(
    vector[0] + w * tx + y * tz - z * ty,
    vector[1] + w * ty + z * tx - x * tz,
    vector[2] + w * tz + x * ty - y * tx,
  );
}

export function earthOrientationFromEcefToEqj(matrix: ArrayLike<number>): Quaternion {
  return quaternionFromMatrix(matrix);
}

export function moonOrientationFromOrbit(
  moonFromEarthKm: Vector3,
  earlierMoonFromEarthKm: Vector3,
  laterMoonFromEarthKm: Vector3,
): Quaternion {
  const nearSideX = normalize(
    [-moonFromEarthKm[0], -moonFromEarthKm[1], -moonFromEarthKm[2]],
    "Moon near-side axis",
  );
  const orbitalNormal = normalize(
    cross(earlierMoonFromEarthKm, laterMoonFromEarthKm),
    "Moon local orbital normal",
  );
  const nearSideY = normalize(cross(orbitalNormal, nearSideX), "Moon local east axis");
  const correctedZ = normalize(cross(nearSideX, nearSideY), "Moon local pole axis");
  const bodyToEqj = [
    nearSideX[0], nearSideY[0], correctedZ[0],
    nearSideX[1], nearSideY[1], correctedZ[1],
    nearSideX[2], nearSideY[2], correctedZ[2],
  ];
  return quaternionFromMatrix(bodyToEqj);
}
