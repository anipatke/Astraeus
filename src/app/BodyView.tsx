import { useEffect, useMemo, useRef } from "react";
import type { Group } from "three";
import type { BodyAsset } from "../assets/catalogue";
import type { ScalePolicy } from "../core/scalePolicy";
import { AtmosphereGlow } from "./AtmosphereGlow";
import { BodyMesh } from "./BodyMesh";
import { createMarker, describeBody, DEFAULT_BODY_MARKER } from "./bodyDraw";

/** The two ways a sphere body can show; the scene switches between them each frame by the marker rule. Absent for a body that is always a marker. */
export interface BodyParts {
  readonly sphere: Group;
  readonly marker: Group;
}

interface BodyViewProps {
  readonly asset: BodyAsset;
  readonly policy: ScalePolicy;
  readonly layer: number;
  /** The overlay layer a marker is drawn on (markers are not lit). */
  readonly markerLayer: number;
  /** Screen size of the dot a sphere shrinks to when its own record states none. */
  readonly markerPx?: number;
  /** The group the scene positions. */
  readonly groupRef?: React.Ref<Group>;
  /** The group the scene orients; the sphere and its atmosphere sit inside it. */
  readonly orientRef?: React.Ref<Group>;
  /** Hands the scene the sphere and its stand-in marker (null when unmounted) so the marker rule can swap them. */
  readonly onParts?: (parts: BodyParts | null) => void;
}

/**
 * Draws any catalogued body from its visual record: a sphere or spheroid with an optional atmosphere, or a marker. A sphere also carries a
 * hidden marker at the same place; the scene shows it instead of the sphere when the sphere would be smaller than a few pixels.
 */
export function BodyView({ asset, policy, layer, markerLayer, markerPx = DEFAULT_BODY_MARKER.markerPx, groupRef, orientRef, onParts }: BodyViewProps) {
  const plan = describeBody(asset, policy);
  const marker = useMemo(() => (plan.kind === "marker" ? createMarker(asset, layer).group : null), [asset, plan.kind, layer]);
  const standIn = useMemo(() => (plan.kind === "sphere" ? createMarker(asset, markerLayer, undefined, markerPx).group : null), [asset, plan.kind, markerLayer, markerPx]);
  const sphereRef = useRef<Group>(null);
  useEffect(() => {
    if (standIn === null || sphereRef.current === null || onParts === undefined) return undefined;
    standIn.visible = false;
    onParts({ sphere: sphereRef.current, marker: standIn });
    return () => onParts(null);
  }, [standIn, onParts]);
  if (marker !== null) {
    return <group ref={groupRef}><group ref={orientRef}><primitive object={marker} /></group></group>;
  }
  return (
    <group ref={groupRef}>
      <group ref={orientRef}>
        <group ref={sphereRef} scale={[1, plan.poleScale, 1]}>
          <BodyMesh radius={plan.radii.equatorial} textureUrl={plan.textureUrl} material={plan.material} layer={layer} />
          {plan.atmosphere !== undefined && <AtmosphereGlow radius={plan.radii.equatorial} atmosphere={plan.atmosphere} layer={layer} />}
        </group>
        {standIn !== null && <primitive object={standIn} />}
      </group>
    </group>
  );
}
