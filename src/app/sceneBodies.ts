// Scene body placement: positions the body meshes from resolved states and swaps small bodies for markers.
import type { Camera, Group } from "three";
import type { BodyAsset } from "../assets/catalogue";
import type { BodyId } from "../core/body";
import type { ScalePolicy } from "../core/scalePolicy";
import type { State } from "../core/state";
import type { BodyParts } from "./BodyView";
import { drawnRadii, drawsAsMarker, projectedRadiusPx, type BodyMarkerSettings } from "./bodyDraw";
import type { FloatingOrigin } from "./floatingOrigin";
import { placeBody } from "./sceneLayout";

/** The scene objects each drawn body owns, looked up by body id. */
export interface BodyRefs {
  readonly groups: ReadonlyMap<BodyId, Group>;
  readonly orients: ReadonlyMap<BodyId, Group>;
  readonly parts: ReadonlyMap<BodyId, BodyParts>;
}

/** Puts every drawn body at its state, relative to the floating origin. */
export function placeBodies(assets: readonly BodyAsset[], states: ReadonlyMap<BodyId, State>, refs: BodyRefs, policy: ScalePolicy, origin: FloatingOrigin): void {
  for (const asset of assets) {
    const id = asset.definition.id;
    const state = states.get(id)!;
    const mesh = asset.definition.orientation === "none" ? null : refs.orients.get(id)!;
    placeBody(refs.groups.get(id)!, mesh, state, state.positionKm, asset.visual.textureYawRad ?? 0, policy, origin);
  }
}

/**
 * The marker rule: a sphere that would be under a few pixels across is drawn as a marker at the same place. Presentation only.
 * Returns the ids of the bodies now drawn as markers.
 */
export function swapSmallBodiesToMarkers(assets: readonly BodyAsset[], refs: BodyRefs, camera: Camera, fovDeg: number, heightPx: number, policy: ScalePolicy, marker: BodyMarkerSettings): BodyId[] {
  const swapped: BodyId[] = [];
  for (const asset of assets) {
    const parts = refs.parts.get(asset.definition.id);
    if (parts === undefined) continue;
    const at = refs.groups.get(asset.definition.id)!.position;
    const radiusPx = projectedRadiusPx(drawnRadii(asset.definition, policy).equatorial, at.distanceTo(camera.position), fovDeg, heightPx);
    const asMarker = drawsAsMarker(radiusPx, marker);
    parts.sphere.visible = !asMarker;
    parts.marker.visible = asMarker;
    if (asMarker) swapped.push(asset.definition.id);
  }
  return swapped;
}
