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
    const mean = policy.mapRadius(definition.radiusKm, definition.id);
    return { equatorial: mean, polar: mean };
  }
  return { equatorial: policy.mapRadius(equatorialRadiusKm, definition.id), polar: policy.mapRadius(polarRadiusKm, definition.id) };
}

/**
 * How a body that would be a speck is drawn. Look-and-feel numbers, not rules: they change how a body is shown, never where it is,
 * so they are settings with defaults (Developer > Display settings, or `?markerpx=` in the address).
 */
export interface BodyMarkerSettings {
  /** A sphere whose drawn radius is under this many screen pixels is drawn as a marker instead. 0 never swaps. */
  readonly minSpherePx: number;
  /** Screen size of the dot of a body whose own record states none. */
  readonly markerPx: number;
}

export const DEFAULT_BODY_MARKER: BodyMarkerSettings = Object.freeze({ minSpherePx: 3, markerPx: 6 });

/** Screen radius, in pixels, of a sphere of `radiusUnits` seen from `distanceUnits` by a camera of vertical field `fovDeg` over `viewportHeightPx`. */
export function projectedRadiusPx(radiusUnits: number, distanceUnits: number, fovDeg: number, viewportHeightPx: number): number {
  if (!(distanceUnits > 0)) return Number.POSITIVE_INFINITY;
  return (radiusUnits * (viewportHeightPx / 2)) / (distanceUnits * Math.tan((fovDeg * Math.PI) / 360));
}

/** The marker rule: a sphere is drawn as a marker when its screen radius falls below the threshold; at the threshold it is still a sphere. */
export function drawsAsMarker(radiusPx: number, settings: BodyMarkerSettings = DEFAULT_BODY_MARKER): boolean {
  return radiusPx < settings.minSpherePx;
}

/** `?markerpx=<n>` sets the swap threshold for a comparison; an unusable value keeps the default with a console warning. */
export function markerSettingsFromSearch(search: string, base: BodyMarkerSettings = DEFAULT_BODY_MARKER): BodyMarkerSettings {
  const raw = new URLSearchParams(search).get("markerpx");
  if (raw === null) return base;
  const value = raw.trim() === "" ? Number.NaN : Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    console.warn(`?markerpx=${raw} ignored: the value must be a number from 0 to 100`);
    return base;
  }
  return { ...base, minSpherePx: value };
}

/** A marker's colour and screen size: the experience's choice, else the record's, else the settings' default. */
export function markerOf(
  asset: BodyAsset,
  override: { readonly color?: string; readonly sizePx?: number } = {},
  fallbackPx: number = 9,
): { readonly color: string; readonly sizePx: number } {
  return {
    color: override.color ?? asset.visual.material.color,
    sizePx: override.sizePx ?? asset.visual.marker?.sizePx ?? fallbackPx,
  };
}

/** A one-vertex point object at the local origin of its group; callers move `position`. */
export function createMarker(asset: BodyAsset, layer: number, override?: { readonly color?: string; readonly sizePx?: number }, fallbackPx?: number): { readonly group: Group; readonly position: BufferAttribute } {
  const { color, sizePx } = markerOf(asset, override, fallbackPx);
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
