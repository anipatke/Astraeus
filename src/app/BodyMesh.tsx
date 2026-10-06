// Sphere + material adapted from planetary-explorer MoonMesh.tsx / CompanionMoon.tsx and
// src/entities/{earth,moon}.ts. Donor rotation/drag/store logic is deliberately not imported.
import { forwardRef } from "react";
import type { Mesh } from "three";
import { useBodyTexture } from "./useBodyTexture";

export interface BodyMaterialConfig {
  readonly color: string;
  readonly roughness: number;
  readonly metalness: number;
}

/** Donor materials. */
export const EARTH_MATERIAL: BodyMaterialConfig = { color: "#e8e8e8", roughness: 0.82, metalness: 0.05 };
export const MOON_MATERIAL: BodyMaterialConfig = { color: "#f3ede4", roughness: 0.98, metalness: 0.02 };

interface BodyMeshProps {
  readonly radius: number;
  readonly textureUrl: string;
  readonly material: BodyMaterialConfig;
  readonly layer: number;
  readonly children?: React.ReactNode;
}

export const BodyMesh = forwardRef<Mesh, BodyMeshProps>(function BodyMesh(
  { radius, textureUrl, material, layer, children },
  ref,
) {
  const texture = useBodyTexture(textureUrl);
  return (
    <mesh ref={ref} layers={layer}>
      <sphereGeometry args={[radius, 64, 64]} />
      <meshStandardMaterial
        map={texture ?? undefined}
        color={texture ? "#ffffff" : material.color}
        roughness={material.roughness}
        metalness={material.metalness}
      />
      {children}
    </mesh>
  );
});
