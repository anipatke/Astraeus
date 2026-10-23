import { add, scale, type Vec3 } from "./vec";

export interface HermiteEnds {
  readonly p0: Vec3;
  readonly v0: Vec3;
  readonly p1: Vec3;
  readonly v1: Vec3;
  /** Span in seconds. */
  readonly spanS: number;
}

/** Cubic Hermite position and velocity at fraction u of the span (u may leave [0,1] slightly). */
export function hermiteAt(ends: HermiteEnds, u: number): { p: Vec3; v: Vec3 } {
  const { p0, v0, p1, v1, spanS } = ends;
  const u2 = u * u;
  const u3 = u2 * u;
  const p = add(
    add(scale(p0, 2 * u3 - 3 * u2 + 1), scale(v0, spanS * (u3 - 2 * u2 + u))),
    add(scale(p1, -2 * u3 + 3 * u2), scale(v1, spanS * (u3 - u2))),
  );
  const v = add(
    add(scale(p0, (6 * u2 - 6 * u) / spanS), scale(v0, 3 * u2 - 4 * u + 1)),
    add(scale(p1, (-6 * u2 + 6 * u) / spanS), scale(v1, 3 * u2 - 2 * u)),
  );
  return { p, v };
}
