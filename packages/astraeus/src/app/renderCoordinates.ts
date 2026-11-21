import type { EqjQuaternionInput, EqjVectorInput, frameTag } from "../core/state";

/** A vector in the drawing library's axes. Its optional tag keeps plain literals assignable, yet a typed render value cannot pass as an EQJ vector. */
export type RenderVector = [x: number, y: number, z: number] & { readonly [frameTag]?: "render" };
/** A quaternion in the drawing library's axes; tagged like `RenderVector`. */
export type RenderQuaternion = [x: number, y: number, z: number, w: number] & { readonly [frameTag]?: "render" };

/**
 * Fixed render-axis conversion: EQJ (x, y, z) -> Three.js (x, z, -y).
 * It is a proper rotation (determinant +1), so EQJ handedness is preserved.
 */
export function eqjToRenderVector(vector: EqjVectorInput): RenderVector {
  return [vector[0], vector[2], -vector[1]] as RenderVector;
}

/**
 * Conjugates a scientific EQJ quaternion [x,y,z,w] by the render-axis rotation.
 * The vector part transforms like a vector; the scalar part is unchanged.
 */
export function eqjToRenderQuaternion(quaternion: EqjQuaternionInput): RenderQuaternion {
  return [quaternion[0], quaternion[2], -quaternion[1], quaternion[3]] as RenderQuaternion;
}
