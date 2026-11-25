// Where a point group's name sits: on the dot nearest the dots' mean direction from the group's own centre.
// Pure arithmetic over plain arrays, so a label over several groups can pool them (add their sums, take the best member across them).

export type Vec3 = readonly [number, number, number];

/** The J2000 +x direction (the vernal equinox): where a ring's name sits when the dots have no mean direction. */
export const VERNAL_EQUINOX: Vec3 = [1, 0, 0];
/** A resultant at least this share of the member count is a clear mean direction (a swarm); a shorter one is a ring or a shell. */
export const SWARM_SHARE = 0.25;

/** The sum of members' unit directions from their group's centre, and how many members were summed. */
export interface Resultant {
  x: number;
  y: number;
  z: number;
  count: number;
}

export function emptyResultant(): Resultant {
  return { x: 0, y: 0, z: 0, count: 0 };
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
    pooled.count += part.count;
  }
  return pooled;
}

/** The label's direction: the mean direction when it is clear, else `held` (the earlier choice), else the vernal equinox. */
export function labelDirection(resultant: Resultant, held: Vec3 | null): Vec3 {
  const length = Math.hypot(resultant.x, resultant.y, resultant.z);
  if (length > 0 && length >= SWARM_SHARE * resultant.count) {
    return [resultant.x / length, resultant.y / length, resultant.z / length];
  }
  return held ?? VERNAL_EQUINOX;
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
