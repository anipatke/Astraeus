// Sphere + material adapted from planetary-explorer MoonMesh.tsx / CompanionMoon.tsx and
// src/entities/{earth,moon}.ts. Donor rotation/drag/store logic is deliberately not imported.
import { forwardRef } from "react";
import type { Mesh } from "three";
import type { BodyMaterialConfig } from "../assets/visual";
import { useBodyTexture } from "./useBodyTexture";

interface BodyMeshProps {
  readonly radius: number;
  /** Absent means a flat colour from the material. */
  readonly textureUrl?: string;
  readonly material: BodyMaterialConfig;
  readonly layer: number;
  /** Self-bright: drawn in its flat colour whatever the light. */
  readonly unlit?: boolean;
  readonly children?: React.ReactNode;
}

export const BodyMesh = forwardRef<Mesh, BodyMeshProps>(function BodyMesh(
  { radius, textureUrl, material, layer, unlit, children },
  ref,
) {
  return (
    <mesh ref={ref} layers={layer}>
      <sphereGeometry args={[radius, 64, 64]} />
      {unlit === true ? (textureUrl === undefined ? <meshBasicMaterial color={material.color} /> : <UnlitTexturedMaterial url={textureUrl} />) : textureUrl === undefined ? <FlatMaterial material={material} /> : <TexturedMaterial url={textureUrl} material={material} />}
      {children}
    </mesh>
  );
});

/** A self-bright textured surface: the map as it is, whatever the light. */
function UnlitTexturedMaterial({ url }: { readonly url: string }) {
  const texture = useBodyTexture(url);
  return <meshBasicMaterial map={texture ?? undefined} color="#ffffff" />;
}

function FlatMaterial({ material }: { readonly material: BodyMaterialConfig }) {
  return <meshStandardMaterial color={material.color} roughness={material.roughness} metalness={material.metalness} />;
}

function TexturedMaterial({ url, material }: { readonly url: string; readonly material: BodyMaterialConfig }) {
  const texture = useBodyTexture(url);
  return (
    <meshStandardMaterial
      map={texture ?? undefined}
      color={texture ? "#ffffff" : material.color}
      roughness={material.roughness}
      metalness={material.metalness}
      {...(material.emissive === undefined ? {} : { emissive: material.emissive, emissiveIntensity: material.emissiveIntensity ?? 1 })}
    />
  );
}
