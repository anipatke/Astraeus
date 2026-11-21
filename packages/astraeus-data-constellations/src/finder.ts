import type { ConstellationBoundaries } from "./index.js";

/** A J2000 direction: right ascension (taken modulo 360) and declination in degrees. */
export interface SkyDirection {
  readonly raDeg: number;
  readonly decDeg: number;
}

/** Tolerance, in radians (1e-9, about 0.2 milliarcseconds), within which a direction counts as lying on a boundary edge. */
const EDGE_EPS = 1e-9;
const RAD = Math.PI / 180;

type Vec = readonly [number, number, number];

interface Loop {
  readonly abbr: string;
  readonly points: readonly Vec[];
  /** Unit normal of each edge's great circle (edge i runs from point i to point i + 1, the last joining the first). */
  readonly normals: readonly Vec[];
  /** True when the loop encloses the north celestial pole (the south one otherwise, for a loop that circles a pole). */
  readonly pole: "north" | "south" | "none";
  /** Bounds of sin(declination) over the outline's region: its vertices, each edge's highest and lowest point, and a pole's own value (+1 or -1) for a loop that encloses it. */
  readonly minZ: number;
  readonly maxZ: number;
}

const unit = (raDeg: number, decDeg: number): Vec => {
  const cosDec = Math.cos(decDeg * RAD);
  return [cosDec * Math.cos(raDeg * RAD), cosDec * Math.sin(raDeg * RAD), Math.sin(decDeg * RAD)];
};
const dot = (a: Vec, b: Vec): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec, b: Vec): Vec => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const normalize = (a: Vec): Vec => {
  const length = Math.hypot(a[0], a[1], a[2]);
  return length === 0 ? a : [a[0] / length, a[1] / length, a[2] / length];
};

const buildLoop = (abbr: string, flat: readonly number[]): Loop => {
  const points: Vec[] = [];
  const raDegs: number[] = [];
  let decSum = 0;
  for (let i = 0; i + 1 < flat.length; i += 2) {
    points.push(unit(flat[i] as number, flat[i + 1] as number));
    raDegs.push(flat[i] as number);
    decSum += flat[i + 1] as number;
  }
  // A loop that goes once round the polar axis (its right ascension winds by 360 degrees) encloses a pole: the one on the side of its mean declination.
  let wind = 0;
  for (let i = 0; i < raDegs.length; i++) {
    let step = (raDegs[(i + 1) % raDegs.length] as number) - (raDegs[i] as number);
    if (step > 180) step -= 360;
    if (step < -180) step += 360;
    wind += step;
  }
  const circles = Math.abs(wind) > 180;
  const normals = points.map((a, i) => normalize(cross(a, points[(i + 1) % points.length] as Vec)));
  const pole = !circles ? "none" : decSum > 0 ? "north" : "south";
  let minZ = pole === "south" ? -1 : Infinity;
  let maxZ = pole === "north" ? 1 : -Infinity;
  points.forEach((a, i) => {
    const b = points[(i + 1) % points.length] as Vec;
    const normal = normals[i] as Vec;
    minZ = Math.min(minZ, a[2]);
    maxZ = Math.max(maxZ, a[2]);
    // The great circle's highest point is the projection of the north pole onto its plane; the lowest is its opposite. Either counts when the edge's arc runs through it.
    const top = normalize([-normal[2] * normal[0], -normal[2] * normal[1], 1 - normal[2] * normal[2]]);
    if (top[2] === 0 && top[0] === 0 && top[1] === 0) return;
    for (const extreme of [top, [-top[0], -top[1], -top[2]] as Vec]) {
      if (dot(cross(a, extreme), normal) >= 0 && dot(cross(extreme, b), normal) >= 0) {
        minZ = Math.min(minZ, extreme[2]);
        maxZ = Math.max(maxZ, extreme[2]);
      }
    }
  });
  return { abbr, points, normals, pole, minZ, maxZ };
};

/** Could the direction (its z = sin(declination)) lie in or on the loop? False only when z is outside the loop's band widened by the edge tolerance (twice it, for rounding). */
const inBand = (loop: Loop, z: number): boolean => z >= loop.minZ - 2 * EDGE_EPS && z <= loop.maxZ + 2 * EDGE_EPS;

/** Does the loop enclose the direction? Ray casting along the direction's meridian up to the north pole, edges as great-circle arcs; crossings are counted half-open so a vertex on the ray counts once. */
const contains = (loop: Loop, p: Vec, raDeg: number): boolean => {
  const c = Math.cos(raDeg * RAD);
  const s = Math.sin(raDeg * RAD);
  // The meridian plane's normal and the half plane (the direction's own right ascension) the ray lies in.
  const plane: Vec = [s, -c, 0];
  let crossings = 0;
  const n = loop.points.length;
  for (let i = 0; i < n; i++) {
    const a = loop.points[i] as Vec;
    const b = loop.points[(i + 1) % n] as Vec;
    const da = dot(a, plane);
    const db = dot(b, plane);
    if (da >= 0 === db >= 0) continue;
    // The point of the arc on the plane: the convex mix of the ends that cancels the signed distances.
    const x: Vec = [
      a[0] * Math.abs(db) + b[0] * Math.abs(da),
      a[1] * Math.abs(db) + b[1] * Math.abs(da),
      a[2] * Math.abs(db) + b[2] * Math.abs(da),
    ];
    if (x[0] * c + x[1] * s > 0 && x[2] / Math.hypot(x[0], x[1], x[2]) > p[2]) crossings++;
  }
  return (crossings % 2 === 1) !== (loop.pole === "north");
};

/** Angular distance, in radians, from the direction to the loop's nearest edge. */
const edgeDistance = (loop: Loop, p: Vec): number => {
  let best = Infinity;
  const n = loop.points.length;
  for (let i = 0; i < n; i++) {
    const a = loop.points[i] as Vec;
    const b = loop.points[(i + 1) % n] as Vec;
    const normal = loop.normals[i] as Vec;
    const within = dot(cross(a, p), normal) >= 0 && dot(cross(p, b), normal) >= 0;
    const d = within
      ? Math.asin(Math.min(1, Math.abs(dot(p, normal))))
      : Math.acos(Math.min(1, Math.max(dot(p, a), dot(p, b))));
    if (d < best) best = d;
  }
  return best;
};

const checked = (direction: SkyDirection): void => {
  if (typeof direction !== "object" || direction === null)
    throw new RangeError("constellationFinder: the direction must be an object { raDeg, decDeg }");
  if (typeof direction.raDeg !== "number" || !Number.isFinite(direction.raDeg))
    throw new RangeError(`constellationFinder: raDeg must be a finite number, got ${String(direction.raDeg)}`);
  if (
    typeof direction.decDeg !== "number" ||
    !Number.isFinite(direction.decDeg) ||
    direction.decDeg < -90 ||
    direction.decDeg > 90
  )
    throw new RangeError(
      `constellationFinder: decDeg must be a number from -90 to 90, got ${String(direction.decDeg)}`,
    );
};

/** What `buildMatcher` gives: the finder itself, and (for tests) every loop's abbreviation that encloses a direction by the containment test alone, before the edge rule. */
export interface Matcher {
  readonly find: (direction: SkyDirection) => string;
  readonly enclosing: (direction: SkyDirection) => readonly string[];
}

/** Builds the finder from boundary outlines (`loadBoundaries()`'s result). */
export const buildMatcher = (boundaries: ConstellationBoundaries): Matcher => {
  // Alphabetical, so every tie below resolves to the first abbreviation in this order.
  const loops = Object.keys(boundaries)
    .sort()
    .flatMap((abbr) => (boundaries[abbr] ?? []).map((flat) => buildLoop(abbr, flat)));
  const prepare = (direction: SkyDirection): { p: Vec; raDeg: number } => {
    checked(direction);
    const raDeg = ((direction.raDeg % 360) + 360) % 360;
    return { p: unit(raDeg, direction.decDeg), raDeg };
  };
  const find = (direction: SkyDirection): string => {
    const { p, raDeg } = prepare(direction);
    // 1. On an edge (within EDGE_EPS): the first abbreviation of the constellations whose edge it lies on.
    // 2. Else inside a loop: that loop's abbreviation (the first, should rounding give more than one).
    // 3. Else (rounding left it in no loop): the constellation of the nearest edge, the first on a tie.
    let inside: string | undefined;
    for (const loop of loops) {
      if (!inBand(loop, p[2])) continue;
      if (edgeDistance(loop, p) <= EDGE_EPS) return loop.abbr;
      if (inside === undefined && contains(loop, p, raDeg)) inside = loop.abbr;
    }
    if (inside !== undefined) return inside;
    let nearest = (loops[0] as Loop).abbr;
    let best = Infinity;
    for (const loop of loops) {
      const d = edgeDistance(loop, p);
      if (d < best) {
        best = d;
        nearest = loop.abbr;
      }
    }
    return nearest;
  };
  const enclosing = (direction: SkyDirection): readonly string[] => {
    const { p, raDeg } = prepare(direction);
    return loops.filter((loop) => inBand(loop, p[2]) && contains(loop, p, raDeg)).map((loop) => loop.abbr);
  };
  return { find, enclosing };
};

/** Builds the finder from boundary outlines (`loadBoundaries()`'s result). */
export const buildFinder = (boundaries: ConstellationBoundaries): ((direction: SkyDirection) => string) =>
  buildMatcher(boundaries).find;
