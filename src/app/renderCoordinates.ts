import type { Quaternion } from "../core/state";

export type RenderVector = [x: number, y: number, z: number];
export type RenderQuaternion = [x: number, y: number, z: number, w: number];

/**
 * Fixed render-axis conversion: EQJ (x, y, z) -> Three.js (x, z, -y).
 * It is a proper rotation (determinant +1), so EQJ handedness is preserved.
 */
export function eqjToRenderVector(vector: ArrayLike<number>): RenderVector {
  return [vector[0], vector[2], -vector[1]];
}

/**
 * Conjugates a scientific EQJ quaternion [x,y,z,w] by the render-axis rotation.
 * The vector part transforms like a vector; the scalar part is unchanged.
 */
export function eqjToRenderQuaternion(quaternion: Quaternion): RenderQuaternion {
  return [quaternion[0], quaternion[2], -quaternion[1], quaternion[3]];
}

/**
 * Body-fixed +X/+Y/+Z (lon 0 / lon 90E / pole) become mesh-local axes through the same
 * fixed conversion, because an equirectangular Three.js sphere puts texture-centre
 * longitude 0 on +X, longitude 90E on -Z and the pole on +Y.
 */
export const BODY_FIXED_TO_MESH_NOTE = "mesh-local = (bodyX, bodyZ, -bodyY)";
