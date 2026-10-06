import { Object3D, Quaternion as ThreeQuaternion, Vector3 } from "three";
import type { State } from "../core/state";
import type { ScalePolicy } from "../core/scalePolicy";
import { FloatingOrigin } from "./floatingOrigin";
import { eqjToRenderQuaternion, eqjToRenderVector, type RenderVector } from "./renderCoordinates";

/**
 * Texture-facing offsets (radians about the body's mesh-local pole axis +Y).
 * These are presentation-only alignment of the donor image to the scientific body-fixed axes;
 * they never feed time, position or scientific orientation. Values are set by visual verification.
 */
export const EARTH_TEXTURE_YAW_RAD = 0;
export const MOON_TEXTURE_YAW_RAD = 0;

/** Stationary scientific scene root and its siblings; nothing here is parented to a body mesh. */
export interface SceneHierarchy {
  readonly root: Object3D;
  readonly earthGroup: Object3D;
  readonly earthMesh: Object3D;
  readonly moonGroup: Object3D;
  readonly moonMesh: Object3D;
}

export function createSceneHierarchy(): SceneHierarchy {
  const root = new Object3D();
  const earthGroup = new Object3D();
  const earthMesh = new Object3D();
  const moonGroup = new Object3D();
  const moonMesh = new Object3D();
  earthGroup.add(earthMesh);
  moonGroup.add(moonMesh);
  root.add(earthGroup, moonGroup);
  return { root, earthGroup, earthMesh, moonGroup, moonMesh };
}

const yaw = new ThreeQuaternion();
const pole = new Vector3(0, 1, 0);

function applyOrientation(mesh: Object3D, state: State, textureYawRad: number): void {
  if (state.orientation === null) throw new TypeError(`${state.body} requires scientific orientation`);
  const [x, y, z, w] = eqjToRenderQuaternion(state.orientation);
  mesh.quaternion.set(x, y, z, w);
  // Texture-facing offset is applied in the body-fixed frame, i.e. before the scientific rotation.
  mesh.quaternion.multiply(yaw.setFromAxisAngle(pole, textureYawRad));
}

export interface PlacedState {
  /** Scaled absolute positions in render axes (Float64), before origin subtraction. */
  readonly earthAbsolute: RenderVector;
  readonly moonAbsolute: RenderVector;
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
    earthAbsolute: eqjToRenderVector(policy.mapPosition(earthPositionKm)),
    moonAbsolute: eqjToRenderVector(policy.mapPosition(moonKm)),
  };
}

/**
 * Scientific State -> ScalePolicy -> fixed axis conversion -> Float64 origin subtraction -> GPU.
 * The axis conversion is an exact signed permutation, so it commutes with the subtraction.
 * Earth/Moon positions are expressed in a common centre (earth-centred: Earth is the zero vector).
 */
export function placeBodies(
  hierarchy: SceneHierarchy,
  earth: State,
  moon: State,
  policy: ScalePolicy,
  origin: FloatingOrigin,
  earthPositionKm: ArrayLike<number> = [0, 0, 0],
): PlacedState {
  const placed = bodyAbsolutes(moon, policy, earthPositionKm);
  const [ex, ey, ez] = origin.toLocal(placed.earthAbsolute);
  const [mx, my, mz] = origin.toLocal(placed.moonAbsolute);
  hierarchy.earthGroup.position.set(ex, ey, ez);
  hierarchy.moonGroup.position.set(mx, my, mz);
  applyOrientation(hierarchy.earthMesh, earth, EARTH_TEXTURE_YAW_RAD);
  applyOrientation(hierarchy.moonMesh, moon, MOON_TEXTURE_YAW_RAD);
  return placed;
}

/** Any Earth-centred State -> ScalePolicy -> fixed axis conversion, in Float64 (no origin yet). */
export function trackedAbsolute(state: State, policy: ScalePolicy): RenderVector {
  if (state.center !== "earth") throw new RangeError("tracked bodies are placed from Earth-centred State");
  return eqjToRenderVector(policy.mapPosition(state.positionKm));
}
