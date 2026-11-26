// Where a point group's name sits: toward the dots' mean direction from the group's own centre, at the dots' mean distance from it.
// Not on any one dot: a dot chosen afresh as the dots move hands the name from dot to dot, and it jumps (I-209). Sums blend between two
// fills as the dots do, so the place glides. Pure arithmetic over plain arrays, so a label over several groups pools their sums.

export type Vec3 = readonly [number, number, number];

/** The J2000 +x direction (the vernal equinox): where a ring's name sits when the dots have no mean direction. */
export const VERNAL_EQUINOX: Vec3 = [1, 0, 0];
/** A resultant at least this share of the member count is a clear mean direction (a swarm); a shorter one is a ring or a shell. */
export const SWARM_SHARE = 0.25;

/** The sum of members' unit directions from their group's centre, the sum of their distances from it (km), and how many were summed. */
export interface Resultant {
  x: number;
  y: number;
  z: number;
  distanceKm: number;
  count: number;
}

export function emptyResultant(): Resultant {
  return { x: 0, y: 0, z: 0, distanceKm: 0, count: 0 };
}

/** What one group gives a label this frame: its resultant and its centre's place (km), each blended between its two fills. */
export interface LabelPart {
  readonly resultant: Resultant;
  readonly offsetKm: Vec3;
}

/** Adds members `from` up to `to` of `km` (x, y, z triples that include `offset`, the centre's place) to `into`. Members at the centre count but add nothing. */
export function addDirections(
  km: ArrayLike<number>,
  offset: ArrayLike<number>,
  from: number,
  to: number,
  into: Resultant,
): void {
  for (let m = from; m < to; m += 1) {
    const x = km[3 * m] - offset[0];
    const y = km[3 * m + 1] - offset[1];
    const z = km[3 * m + 2] - offset[2];
    const length = Math.hypot(x, y, z);
    if (length > 0) {
      into.distanceKm += length;
      into.x += x / length;
      into.y += y / length;
      into.z += z / length;
    }
  }
  into.count += to - from;
}

/** Several groups' resultants as one. */
export function poolResultants(parts: readonly Resultant[]): Resultant {
  const pooled = emptyResultant();
  for (const part of parts) {
    pooled.x += part.x;
    pooled.y += part.y;
    pooled.z += part.z;
    pooled.distanceKm += part.distanceKm;
    pooled.count += part.count;
  }
  return pooled;
}

/** A straight-line blend of two resultants, `f` of the way from `a` to `b` (as the dots blend between two fills). */
export function blendResultant(a: Resultant, b: Resultant, f: number): Resultant {
  return {
    x: a.x + f * (b.x - a.x),
    y: a.y + f * (b.y - a.y),
    z: a.z + f * (b.z - a.z),
    distanceKm: a.distanceKm + f * (b.distanceKm - a.distanceKm),
    count: a.count + f * (b.count - a.count),
  };
}

/** The members' mean direction when it is clear (a swarm), else null (a ring or a shell). */
export function clearDirection(resultant: Resultant): Vec3 | null {
  const length = Math.hypot(resultant.x, resultant.y, resultant.z);
  if (length > 0 && length >= SWARM_SHARE * resultant.count) {
    return [resultant.x / length, resultant.y / length, resultant.z / length];
  }
  return null;
}

/** The label's direction: the mean direction when it is clear, else `held` (the earlier choice), else the vernal equinox. */
export function labelDirection(resultant: Resultant, held: Vec3 | null): Vec3 {
  return clearDirection(resultant) ?? held ?? VERNAL_EQUINOX;
}

/**
 * Where the name stands, in km: the parts' centre (their centres weighted by member count) plus `direction` times the members' mean
 * distance from their centres. Null when there are no members.
 */
export function labelPointKm(parts: readonly LabelPart[], direction: Vec3): Vec3 | null {
  let count = 0;
  let distanceKm = 0;
  const centre = [0, 0, 0];
  for (const { resultant, offsetKm } of parts) {
    count += resultant.count;
    distanceKm += resultant.distanceKm;
    for (let k = 0; k < 3; k += 1) centre[k] += resultant.count * offsetKm[k];
  }
  if (count <= 0) return null;
  const reach = distanceKm / count;
  return [0, 1, 2].map((k) => centre[k] / count + reach * direction[k]) as unknown as Vec3;
}

/** The member among `from` up to `to` whose direction from the centre lies closest to `direction`, with its cosine; index -1 when none has a direction. */
export function bestMember(
  km: ArrayLike<number>,
  offset: ArrayLike<number>,
  from: number,
  to: number,
  direction: Vec3,
  into: { index: number; cosine: number } = { index: -1, cosine: -Infinity },
): { index: number; cosine: number } {
  for (let m = from; m < to; m += 1) {
    const x = km[3 * m] - offset[0];
    const y = km[3 * m + 1] - offset[1];
    const z = km[3 * m + 2] - offset[2];
    const length = Math.hypot(x, y, z);
    if (length === 0) continue;
    const cosine = (x * direction[0] + y * direction[1] + z * direction[2]) / length;
    if (cosine > into.cosine) {
      into.index = m;
      into.cosine = cosine;
    }
  }
  return into;
}
