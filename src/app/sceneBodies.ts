// Scene body placement: positions the body meshes from resolved states and swaps small bodies for markers.
import { Vector3, type Camera, type Group } from "three";
import type { BodyAsset } from "../assets/catalogue";
import type { BodyId } from "../core/body";
import type { ScalePolicy } from "../core/scalePolicy";
import type { State } from "../core/state";
import type { BodyParts } from "./BodyView";
import { DEFAULT_GLOW_SCALE, GLOW_BEHIND_DISC_PX, drawnRadii, drawsAsMarker, glowSizePx, projectedRadiusPx, type BodyMarkerSettings, type GlowLook } from "./bodyDraw";
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

/** What the browser scripts read back about one body: how it is drawn and where it stands in the view. */
export interface BodyScreenReadout {
  readonly id: BodyId;
  /** A sphere, a marker dot, or nothing (neither part is visible). */
  readonly as: "sphere" | "marker" | "none";
  /** The drawn sphere's radius in pixels at the current distance and scale (before the marker swap). */
  readonly radiusPx: number;
  /** Centre as shares of the view (0 to 1, y down). */
  readonly x: number;
  readonly y: number;
  /** In front of the camera and inside the view. */
  readonly inView: boolean;
  /** For a body with a halo: its width on screen in pixels (0 when the halo is off) and whether it is drawn over everything (small bodies) rather than behind the disc; null for a body without one. */
  readonly glow: { readonly sizePx: number; readonly brightness: number; readonly overDots: boolean } | null;
}

/** Reads back where every drawn body is: how it is drawn, its size in pixels and its place in the view. Call after the bodies are placed and the camera is posed. */
export function bodyScreenReadouts(assets: readonly BodyAsset[], refs: BodyRefs, camera: Camera, fovDeg: number, heightPx: number, policy: ScalePolicy, glowLook?: GlowLook): BodyScreenReadout[] {
  camera.updateMatrixWorld();
  const point = new Vector3();
  const out: BodyScreenReadout[] = [];
  for (const asset of assets) {
    const parts = refs.parts.get(asset.definition.id);
    const group = refs.groups.get(asset.definition.id);
    // A body drawn as a marker by its record (no sphere to swap) has no parts: an emissive one such as the Sun is drawn as its sphere, any other as its marker dot.
    if (group === undefined) continue;
    const radiusPx = projectedRadiusPx(drawnRadii(asset.definition, policy).equatorial, group.position.distanceTo(camera.position), fovDeg, heightPx);
    point.copy(group.position).applyMatrix4(camera.matrixWorldInverse);
    const front = point.z < 0;
    point.applyMatrix4(camera.projectionMatrix);
    const inView = front && Math.abs(point.x) <= 1 && Math.abs(point.y) <= 1;
    const round = (value: number): number => Math.round(value * 1000) / 1000;
    const base = asset.visual.glow;
    const look = base === undefined ? null : glowLook ?? { sizePx: base.sizePx, brightness: base.brightness, scale: base.scale ?? DEFAULT_GLOW_SCALE };
    const glowPx = look === null ? 0 : glowSizePx(look, 2 * radiusPx);
    const glow = look === null ? null : { sizePx: round(look.brightness > 0 ? glowPx : 0), brightness: look.brightness, overDots: 2 * radiusPx <= GLOW_BEHIND_DISC_PX };
    out.push({ id: asset.definition.id, as: parts === undefined ? (asset.visual.emissive === true ? "sphere" : "marker") : parts.sphere.visible ? "sphere" : parts.marker.visible ? "marker" : "none", radiusPx: round(radiusPx), x: round((point.x + 1) / 2), y: round((1 - point.y) / 2), inView, glow });
  }
  return out;
}
