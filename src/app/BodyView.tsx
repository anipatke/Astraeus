import { useEffect, useMemo, useRef } from "react";
import { Vector3, type Group, type PerspectiveCamera } from "three";

const worldPosition = new Vector3();
import type { BodyAsset } from "../assets/catalogue";
import type { ScalePolicy } from "../core/scalePolicy";
import { AtmosphereGlow } from "./AtmosphereGlow";
import { BodyMesh } from "./BodyMesh";
import { useFrame } from "@react-three/fiber";
import { applyGlowLook, createGlow, createMarker, describeBody, DEFAULT_BODY_MARKER, DEFAULT_GLOW_SCALE, type GlowLook } from "./bodyDraw";

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
  /** The live halo settings for a body whose record has a glow. */
  readonly glowLook?: GlowLook;
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
export function BodyView({ asset, policy, layer, markerLayer, markerPx = DEFAULT_BODY_MARKER.markerPx, glowLook, groupRef, orientRef, onParts }: BodyViewProps) {
  const plan = describeBody(asset, policy);
  // A body with a halo draws no marker dot: the halo is its marker.
  const marker = useMemo(() => (plan.kind === "marker" && asset.visual.glow === undefined ? createMarker(asset, layer).group : null), [asset, plan.kind, layer]);
  const standIn = useMemo(() => (plan.kind === "sphere" ? createMarker(asset, markerLayer, undefined, markerPx).group : null), [asset, plan.kind, markerLayer, markerPx]);
  const glow = useMemo(() => (asset.visual.glow === undefined ? null : createGlow(asset.visual.material.color, layer)), [asset, layer]);
  useFrame(({ camera, size }) => {
    if (glow === null) return;
    const base = asset.visual.glow!;
    const at = glow.getWorldPosition(worldPosition);
    applyGlowLook(glow, glowLook ?? { sizePx: base.sizePx, brightness: base.brightness, scale: base.scale ?? DEFAULT_GLOW_SCALE }, asset.visual.material.color, {
      distanceUnits: at.distanceTo(camera.position),
      fovDeg: (camera as PerspectiveCamera).fov,
      viewportHeightPx: size.height,
      bodyRadiusUnits: plan.radii.equatorial,
    });
  });
  const sphereRef = useRef<Group>(null);
  useEffect(() => {
    if (standIn === null || sphereRef.current === null || onParts === undefined) return undefined;
    standIn.visible = false;
    onParts({ sphere: sphereRef.current, marker: standIn });
    return () => onParts(null);
  }, [standIn, onParts]);
  if (plan.kind === "marker") {
    return (
      <group ref={groupRef}>
        <group ref={orientRef}>
          {marker !== null && <primitive object={marker} />}
          {asset.visual.emissive === true && <BodyMesh radius={plan.radii.equatorial} {...(plan.textureUrl === undefined ? {} : { textureUrl: plan.textureUrl })} material={plan.material} layer={layer} unlit />}
          {glow !== null && <primitive object={glow} />}
        </group>
      </group>
    );
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
