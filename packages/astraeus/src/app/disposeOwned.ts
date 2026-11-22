import type { BufferGeometry, Material, Object3D, Texture } from "three";

interface Drawn extends Object3D {
  readonly geometry?: BufferGeometry;
  readonly material?: Material | Material[];
}

/**
 * Frees the GPU copies of everything a view drew: each mesh, line, points or sprite's geometry, its material or materials and each material's `map`.
 * Nothing else (shader-uniform textures are freed by the views that hold them), and no field or array is cleared, so a view freed and then drawn
 * again is simply uploaded afresh.
 */
export function disposeOwned(root: Object3D): void {
  root.traverse((node) => {
    const drawn = node as Drawn;
    drawn.geometry?.dispose();
    if (drawn.material === undefined) return;
    for (const material of Array.isArray(drawn.material) ? drawn.material : [drawn.material]) {
      (material as Material & { map?: Texture | null }).map?.dispose();
      material.dispose();
    }
  });
}
