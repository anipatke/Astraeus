import { Object3D, Quaternion as ThreeQuaternion, Vector3 } from "three";
import { catalogue, type BodyCatalogue } from "../assets/catalogue";
import type { BodyId, CenterId } from "../core/body";
import type { State } from "../core/state";
import type { ScalePolicy } from "../core/scalePolicy";
import type { AstronomyAdapter } from "../core/astronomyAdapter";
import { createStateResolver, type StateResolver } from "../core/stateResolver";
import { FloatingOrigin } from "./floatingOrigin";
import { BARE_SCENE_SPAN } from "./sceneFraming";
import { eqjToRenderQuaternion, eqjToRenderVector, type RenderVector } from "./renderCoordinates";

const yaw = new ThreeQuaternion();
const pole = new Vector3(0, 1, 0);

export function applyOrientation(mesh: Object3D, state: State, textureYawRad: number): void {
  if (state.orientation === null) throw new TypeError(`${state.body} requires scientific orientation`);
  const [x, y, z, w] = eqjToRenderQuaternion(state.orientation);
  mesh.quaternion.set(x, y, z, w);
  // Texture-facing offset (the body visual's textureYawRad, presentation only) is applied in the body-fixed frame, i.e. before the scientific rotation.
  mesh.quaternion.multiply(yaw.setFromAxisAngle(pole, textureYawRad));
}

/** The resolver a scene mount owns: the built-in catalogue's definitions and state sources over one adapter. */
export function createSceneResolver(adapter: AstronomyAdapter, source: BodyCatalogue = catalogue): StateResolver {
  return createStateResolver(source.definitions(), source.sources(), adapter);
}

/** Where the scene's zero is: every position handed to a view is first expressed from `center`. */
export interface ScenePlacement {
  readonly resolver: StateResolver;
  readonly center: CenterId;
}

/**
 * The vector from the scene centre to `from`'s centre, to add to a position measured from `from`. Null when `from` is the
 * scene centre, so a scene centred where its data is measured adds nothing and keeps its positions bit for bit.
 */
export function sceneOffsetKm(placement: ScenePlacement, from: CenterId, timeUtcMs: number): Float64Array | null {
  return from === placement.center ? null : placement.resolver.offsetKm(from, placement.center, timeUtcMs);
}

export interface PlacedState {
  /** Scaled absolute positions in render axes (Float64), before origin subtraction. */
  readonly earthAbsolute: RenderVector;
  readonly moonAbsolute: RenderVector;
}

/**
 * The pair the developer readout measures: a mounted body that orbits another mounted body which itself orbits something (so the
 * pair is a satellite and its planet, not a planet and the root). Null when the scene mounts no such pair.
 */
export function readoutPairOf(bodies: readonly BodyId[], source: BodyCatalogue = catalogue): { readonly parent: BodyId; readonly child: BodyId } | null {
  for (const id of bodies) {
    const parentId = source.get(id).definition.parentId;
    if (parentId === undefined || !bodies.includes(parentId)) continue;
    if (source.get(parentId).definition.parentId !== undefined) return { parent: parentId, child: id };
  }
  return null;
}

/** Scientific position (from the scene centre) -> ScalePolicy -> fixed axis conversion, in Float64 (no origin yet). */
export function bodyAbsolute(positionKm: ArrayLike<number>, policy: ScalePolicy): RenderVector {
  return eqjToRenderVector(policy.mapPosition(positionKm));
}

/**
 * Places one body: scientific position from the scene centre -> ScalePolicy -> fixed axis conversion -> Float64 origin
 * subtraction -> GPU, and its orientation unless `mesh` is null (a body with no orientation model). The axis conversion is an exact signed permutation, so it
 * commutes with the subtraction. Returns the scaled absolute position.
 */
export function placeBody(
  group: Object3D,
  mesh: Object3D | null,
  state: State,
  positionKm: ArrayLike<number>,
  textureYawRad: number,
  policy: ScalePolicy,
  origin: FloatingOrigin,
): RenderVector {
  const absolute = bodyAbsolute(positionKm, policy);
  const [x, y, z] = origin.toLocal(absolute);
  group.position.set(x, y, z);
  if (mesh !== null) applyOrientation(mesh, state, textureYawRad);
  return absolute;
}

/** Scientific positions -> ScalePolicy -> fixed axis conversion, in Float64 (no origin yet). */
export function bodyAbsolutes(
  moon: State,
  policy: ScalePolicy,
  earthPositionKm: ArrayLike<number> = [0, 0, 0],
): PlacedState {
  const moonKm = [
    earthPositionKm[0] + moon.positionKm[0],
    earthPositionKm[1] + moon.positionKm[1],
    earthPositionKm[2] + moon.positionKm[2],
  ];
  return {
    earthAbsolute: bodyAbsolute(earthPositionKm, policy),
    moonAbsolute: bodyAbsolute(moonKm, policy),
  };
}

/** Any State -> its position from the scene centre -> ScalePolicy -> fixed axis conversion, in Float64 (no origin yet). */
export function trackedAbsolute(state: State, policy: ScalePolicy, placement: ScenePlacement): RenderVector {
  const offset = sceneOffsetKm(placement, state.center, state.timeUtcMs);
  if (offset === null) return bodyAbsolute(state.positionKm, policy);
  return bodyAbsolute([state.positionKm[0] + offset[0], state.positionKm[1] + offset[1], state.positionKm[2] + offset[2]], policy);
}

/** Every drawn body measured from the scene centre, and how far across the drawn bodies reach. */
export interface PlacedComposition {
  readonly states: ReadonlyMap<BodyId, State>;
  /** Scaled absolute positions in render axes (Float64), before origin subtraction. */
  readonly absolutes: ReadonlyMap<BodyId, RenderVector>;
  /** The scene centre's own scaled absolute position, drawn or not. */
  readonly centre: RenderVector;
  /** Scaled distance from the centre to the farthest other drawn body; `BARE_SCENE_SPAN` when there is none. */
  readonly span: number;
}

/** Resolver -> ScalePolicy -> render axes for each body: the one place a composition's positions are decided. */
export function placeComposition(bodies: readonly BodyId[], placement: ScenePlacement, policy: ScalePolicy, timeUtcMs: number): PlacedComposition {
  const states = new Map<BodyId, State>();
  const absolutes = new Map<BodyId, RenderVector>();
  for (const id of bodies) {
    const state = placement.resolver.stateOf(id, timeUtcMs, placement.center);
    states.set(id, state);
    absolutes.set(id, bodyAbsolute(state.positionKm, policy));
  }
  const centre = absolutes.get(placement.center) ?? bodyAbsolute(placement.resolver.stateOf(placement.center, timeUtcMs, placement.center).positionKm, policy);
  let widest = 0;
  let others = 0;
  for (const [id, at] of absolutes) {
    if (id === placement.center) continue;
    others += 1;
    widest = Math.max(widest, Math.hypot(at[0] - centre[0], at[1] - centre[1], at[2] - centre[2]));
  }
  return { states, absolutes, centre, span: others === 0 ? BARE_SCENE_SPAN : widest };
}
