import { BufferAttribute, BufferGeometry, Group, Points, PointsMaterial } from "three";
import type { BodyAsset } from "../assets/catalogue";
import type { AtmosphereConfig, BodyMaterialConfig } from "../assets/visual";
import type { CelestialBodyDefinition } from "../core/body";
import type { ScalePolicy } from "../core/scalePolicy";

/** The two radii a body is drawn with, in scaled units. Equal for a sphere. */
export interface DrawnRadii {
  readonly equatorial: number;
  readonly polar: number;
}

/**
 * A body with both an equatorial and a polar radius is a spheroid whose two radii are mapped independently, so
 * the true-scale picture shows the actual ones. With only the mean radius it is a sphere of the mapped mean.
 * The mean radius itself stays the value every metric, focus limit and label distance uses.
 */
export function drawnRadii(definition: CelestialBodyDefinition, policy: ScalePolicy): DrawnRadii {
  const { equatorialRadiusKm, polarRadiusKm } = definition;
  if (equatorialRadiusKm === undefined || polarRadiusKm === undefined) {
    const mean = policy.mapRadius(definition.radiusKm);
    return { equatorial: mean, polar: mean };
  }
  return { equatorial: policy.mapRadius(equatorialRadiusKm), polar: policy.mapRadius(polarRadiusKm) };
}

/** A marker's colour and screen size: the record's, unless the experience chooses otherwise. */
export function markerOf(asset: BodyAsset, override: { readonly color?: string; readonly sizePx?: number } = {}): { readonly color: string; readonly sizePx: number } {
  return {
    color: override.color ?? asset.visual.material.color,
    sizePx: override.sizePx ?? asset.visual.marker?.sizePx ?? 9,
  };
}

/** A one-vertex point object at the local origin of its group; callers move `position`. */
export function createMarker(asset: BodyAsset, layer: number, override?: { readonly color?: string; readonly sizePx?: number }): { readonly group: Group; readonly position: BufferAttribute } {
  const { color, sizePx } = markerOf(asset, override);
  const position = new BufferAttribute(new Float32Array(3), 3);
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", position);
  const points = new Points(geometry, new PointsMaterial({ color, size: sizePx, sizeAttenuation: false, depthTest: false }));
  points.frustumCulled = false;
  points.layers.set(layer);
  const group = new Group();
  group.add(points);
  return { group, position };
}

/** Everything a renderer decides from a record, before any drawing: what BodyView mounts. */
export interface BodyDrawPlan {
  readonly kind: "sphere" | "marker";
  readonly radii: DrawnRadii;
  /** Scale of the pole axis against the equatorial axes; 1 for a sphere. */
  readonly poleScale: number;
  readonly textureUrl?: string;
  readonly material: BodyMaterialConfig;
  readonly atmosphere?: AtmosphereConfig;
}

export function describeBody(asset: BodyAsset, policy: ScalePolicy): BodyDrawPlan {
  const { definition, visual } = asset;
  const radii = drawnRadii(definition, policy);
  return {
    kind: visual.kind,
    radii,
    poleScale: radii.equatorial === 0 ? 1 : radii.polar / radii.equatorial,
    ...(visual.texture === undefined ? {} : { textureUrl: visual.texture.url }),
    material: visual.material,
    ...(visual.atmosphere === undefined ? {} : { atmosphere: visual.atmosphere }),
  };
}
