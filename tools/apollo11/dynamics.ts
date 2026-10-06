import type { AstronomyAdapter } from "../../src/core/astronomyAdapter";
import { CONSTANTS, NUMERICS } from "./conventions";
import { hermiteAt } from "./hermite";
import { add, norm, scale, sub, toVec3, type Vec3 } from "./vec";

/** Earth-centred EQJ state, km and km/s. */
export interface EarthState {
  readonly r: Vec3;
  readonly v: Vec3;
}

/** States at fixed steps over a time span, read back by cubic Hermite between neighbouring nodes. */
export interface StateTable {
  readonly firstUtcMs: number;
  readonly stepMs: number;
  readonly nodes: readonly EarthState[];
}

interface Bodies {
  readonly moon: Vec3;
  readonly sun: Vec3;
}

/** RK4 stages revisit the same instants (t + h/2 twice, then t + h is the next step's t), so two entries suffice. */
function ephemerisCache(adapter: AstronomyAdapter): (timeUtcMs: number) => Bodies {
  const cache = new Map<number, Bodies>();
  return (timeUtcMs) => {
    const key = Math.round(timeUtcMs);
    const hit = cache.get(key);
    if (hit !== undefined) return hit;
    const bodies = { moon: toVec3(adapter.moonPositionKm(key)), sun: toVec3(adapter.sunPositionFromEarthKm(key)) };
    if (cache.size >= 2) cache.delete(cache.keys().next().value as number);
    cache.set(key, bodies);
    return bodies;
  };
}

/** Third-body acceleration on a geocentric spacecraft: direct pull minus the pull on Earth. */
function thirdBody(r: Vec3, body: Vec3, mu: number): Vec3 {
  const toBody = sub(body, r);
  return sub(scale(toBody, mu / norm(toBody) ** 3), scale(body, mu / norm(body) ** 3));
}

/** Earth point mass and J2 (about the EQJ pole), plus Moon and Sun as point-mass third bodies. */
function acceleration(r: Vec3, bodies: Bodies): Vec3 {
  const { earth, moon, sun } = CONSTANTS;
  const rn = norm(r);
  const z2 = (r[2] / rn) ** 2;
  const j2 = (1.5 * earth.j2 * earth.muKm3S2 * earth.j2ReferenceRadiusKm ** 2) / rn ** 5;
  const central = -earth.muKm3S2 / rn ** 3;
  const oblate: Vec3 = [j2 * r[0] * (5 * z2 - 1), j2 * r[1] * (5 * z2 - 1), j2 * r[2] * (5 * z2 - 3)];
  return add(add(add(scale(r, central), oblate), thirdBody(r, bodies.moon, moon.muKm3S2)), thirdBody(r, bodies.sun, sun.muKm3S2));
}

function rk4(
  state: EarthState,
  timeUtcMs: number,
  stepS: number,
  bodiesAt: (t: number) => Bodies,
  constantAcceleration: Vec3,
): EarthState {
  const derivative = (s: EarthState, t: number): EarthState => ({
    r: s.v,
    v: add(acceleration(s.r, bodiesAt(t)), constantAcceleration),
  });
  const advance = (s: EarthState, d: EarthState, h: number): EarthState => ({ r: add(s.r, scale(d.r, h)), v: add(s.v, scale(d.v, h)) });
  const halfMs = stepS * 500;
  const k1 = derivative(state, timeUtcMs);
  const k2 = derivative(advance(state, k1, stepS / 2), timeUtcMs + halfMs);
  const k3 = derivative(advance(state, k2, stepS / 2), timeUtcMs + halfMs);
  const k4 = derivative(advance(state, k3, stepS), timeUtcMs + 2 * halfMs);
  const sum = (a: Vec3, b: Vec3, c: Vec3, d: Vec3): Vec3 => add(add(a, scale(add(b, c), 2)), d);
  return {
    r: add(state.r, scale(sum(k1.r, k2.r, k3.r, k4.r), stepS / 6)),
    v: add(state.v, scale(sum(k1.v, k2.v, k3.v, k4.v), stepS / 6)),
  };
}

/** Integrates from `epochUtcMs` in one direction until `untilUtcMs` is covered, at whole steps from the epoch. */
function integrateOneWay(
  adapter: AstronomyAdapter,
  start: EarthState,
  epochUtcMs: number,
  untilUtcMs: number,
  stepS: number,
  constantAcceleration: Vec3,
): EarthState[] {
  const bodiesAt = ephemerisCache(adapter);
  const direction = Math.sign(untilUtcMs - epochUtcMs);
  const nodes: EarthState[] = [start];
  let state = start;
  for (let t = epochUtcMs; direction * (untilUtcMs - t) > 0; t += direction * stepS * 1000) {
    state = rk4(state, t, direction * stepS, bodiesAt, constantAcceleration);
    nodes.push(state);
  }
  return nodes;
}

/**
 * Numerically integrated coast through one anchor state, covering [fromUtcMs, toUtcMs] (the epoch must lie inside).
 * Nodes sit at whole steps from the epoch, so the epoch is reproduced exactly.
 */
export function integrateSpan(
  adapter: AstronomyAdapter,
  start: EarthState,
  epochUtcMs: number,
  fromUtcMs: number,
  toUtcMs: number,
): StateTable {
  const stepS = NUMERICS.coastStepS;
  const noThrust: Vec3 = [0, 0, 0];
  const before = integrateOneWay(adapter, start, epochUtcMs, fromUtcMs, stepS, noThrust);
  const after = integrateOneWay(adapter, start, epochUtcMs, toUtcMs, stepS, noThrust);
  return {
    firstUtcMs: epochUtcMs - (before.length - 1) * stepS * 1000,
    stepMs: stepS * 1000,
    nodes: [...before.slice(1).reverse(), ...after],
  };
}

/** Forward integration with a fixed inertial acceleration, used by ordinary engine burns. */
export function integrateDrivenSpan(
  adapter: AstronomyAdapter,
  start: EarthState,
  epochUtcMs: number,
  untilUtcMs: number,
  stepS: number,
  constantAcceleration: Vec3,
): StateTable {
  if (untilUtcMs <= epochUtcMs) throw new RangeError("driven integration must run forward over a positive span");
  if (!(stepS > 0)) throw new RangeError("integration step must be positive");
  const nodes = integrateOneWay(adapter, start, epochUtcMs, untilUtcMs, stepS, constantAcceleration);
  return { firstUtcMs: epochUtcMs, stepMs: stepS * 1000, nodes };
}

export function tableAt(table: StateTable, timeUtcMs: number): EarthState {
  const offset = (timeUtcMs - table.firstUtcMs) / table.stepMs;
  if (offset < 0 || offset > table.nodes.length - 1) throw new RangeError("time is outside the integrated span");
  const index = Math.min(Math.floor(offset), table.nodes.length - 2);
  const a = table.nodes[index];
  const b = table.nodes[index + 1];
  const { p, v } = hermiteAt({ p0: a.r, v0: a.v, p1: b.r, v1: b.v, spanS: table.stepMs / 1000 }, offset - index);
  return { r: p, v };
}
