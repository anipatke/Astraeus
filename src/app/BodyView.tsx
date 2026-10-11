import { useMemo } from "react";
import type { Group } from "three";
import type { BodyAsset } from "../assets/catalogue";
import type { ScalePolicy } from "../core/scalePolicy";
import { AtmosphereGlow } from "./AtmosphereGlow";
import { BodyMesh } from "./BodyMesh";
import { createMarker, describeBody } from "./bodyDraw";

interface BodyViewProps {
  readonly asset: BodyAsset;
  readonly policy: ScalePolicy;
  readonly layer: number;
  /** The group the scene positions. */
  readonly groupRef?: React.Ref<Group>;
  /** The group the scene orients; the sphere and its atmosphere sit inside it. */
  readonly orientRef?: React.Ref<Group>;
}

/** Draws any catalogued body from its visual record: a sphere or spheroid with an optional atmosphere, or a marker. */
export function BodyView({ asset, policy, layer, groupRef, orientRef }: BodyViewProps) {
  const plan = describeBody(asset, policy);
  const marker = useMemo(() => (plan.kind === "marker" ? createMarker(asset, layer).group : null), [asset, plan.kind, layer]);
  if (marker !== null) {
    return <group ref={groupRef}><group ref={orientRef}><primitive object={marker} /></group></group>;
  }
  return (
    <group ref={groupRef}>
      <group ref={orientRef}>
        <group scale={[1, plan.poleScale, 1]}>
          <BodyMesh radius={plan.radii.equatorial} textureUrl={plan.textureUrl} material={plan.material} layer={layer} />
          {plan.atmosphere !== undefined && <AtmosphereGlow radius={plan.radii.equatorial} atmosphere={plan.atmosphere} layer={layer} />}
        </group>
      </group>
    </group>
  );
}
