import { AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, Group, Points, PointsMaterial, Sprite, SpriteMaterial } from "three";
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

/** The live halo settings: the least width on screen, how far it reaches past the body's disc, and its strength. Presentation only. */
export interface GlowLook {
  /** Least width of the halo on screen, px. */
  sizePx: number;
  /** 0 to 2. */
  brightness: number;
  /** The halo is at least this many times the body's projected diameter, so close up it frames the disc rather than shrinking into it. */
  scale: number;
}

export const DEFAULT_GLOW_SCALE = 2.5;
/** From this projected diameter (px) the halo goes behind the disc. */
export const GLOW_BEHIND_DISC_PX = 24;
export const GLOW_LIMITS = { sizePx: { min: 0, max: 400 }, brightness: { min: 0, max: 2 }, scale: { min: 1, max: 6 } } as const;

function boundedParam(search: string, name: string, limit: { min: number; max: number }, fallback: number): number {
  const raw = new URLSearchParams(search).get(name);
  if (raw === null) return fallback;
  const value = raw.trim() === "" ? Number.NaN : Number(raw);
  if (!Number.isFinite(value) || value < limit.min || value > limit.max) {
    console.warn(`?${name}=${raw} ignored: the value must be a number from ${limit.min} to ${limit.max}`);
    return fallback;
  }
  return value;
}

/** `?sunglow=<px>`, `?sunbrightness=<0..2>` and `?sunglowscale=<1..6>` override the record's halo; an unusable value keeps it with a console warning. */
export function glowLookFromSearch(search: string, base: GlowLook): GlowLook {
  return {
    sizePx: boundedParam(search, "sunglow", GLOW_LIMITS.sizePx, base.sizePx),
    brightness: boundedParam(search, "sunbrightness", GLOW_LIMITS.brightness, base.brightness),
    scale: boundedParam(search, "sunglowscale", GLOW_LIMITS.scale, base.scale),
  };
}

/** The first halo any of these bodies' records carries: what the live settings start from. */
export function baseGlowOf(assets: readonly BodyAsset[]): GlowLook | null {
  const glow = assets.find((asset) => asset.visual.glow !== undefined)?.visual.glow;
  return glow === undefined ? null : { sizePx: glow.sizePx, brightness: glow.brightness, scale: glow.scale ?? DEFAULT_GLOW_SCALE };
}

/** The halo's width on screen, px: the setting, or `scale` times the body's projected diameter when that is more. */
export function glowSizePx(look: GlowLook, bodyDiameterPx: number): number {
  return Math.max(look.sizePx, look.scale * (Number.isFinite(bodyDiameterPx) ? bodyDiameterPx : 0));
}

/** The world length that spans `px` on screen at `distanceUnits` from the camera. */
export function pxToUnits(px: number, distanceUnits: number, fovDeg: number, viewportHeightPx: number): number {
  return (px * 2 * distanceUnits * Math.tan((fovDeg * Math.PI) / 360)) / viewportHeightPx;
}

let glowTexture: CanvasTexture | null = null;

/** A soft round falloff, white at the centre and clear at the edge, made once (no image file). */
function softGlowTexture(): CanvasTexture {
  if (glowTexture !== null) return glowTexture;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.12, "rgba(255,255,255,0.85)");
  gradient.addColorStop(0.35, "rgba(255,255,255,0.3)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  glowTexture = new CanvasTexture(canvas);
  return glowTexture;
}

/**
 * The halo: a camera-facing sprite at the body's place, additive, drawn after everything else and without a depth test so dots never cover it.
 * It is sized in world units each frame (see `applyGlowLook`), so it grows with the body close up and is never limited by a point-size cap.
 */
export function createGlow(color: string, layer: number): Sprite {
  const sprite = new Sprite(new SpriteMaterial({ color, map: softGlowTexture(), transparent: true, depthTest: false, depthWrite: false, blending: AdditiveBlending }));
  sprite.renderOrder = 1000;
  sprite.frustumCulled = false;
  sprite.layers.set(layer);
  return sprite;
}

/** What `applyGlowLook` needs about the view this frame. */
export interface GlowView {
  readonly distanceUnits: number;
  readonly fovDeg: number;
  readonly viewportHeightPx: number;
  /** The body's drawn radius, scaled units. */
  readonly bodyRadiusUnits: number;
}

/** Applies the live halo settings to a halo made by `createGlow`: strength, colour and a size of at least the setting and `scale` times the disc. */
export function applyGlowLook(sprite: Sprite, look: GlowLook, baseColor: string, view: GlowView): number {
  const material = sprite.material;
  const diameterPx = 2 * projectedRadiusPx(view.bodyRadiusUnits, view.distanceUnits, view.fovDeg, view.viewportHeightPx);
  const sizePx = glowSizePx(look, diameterPx);
  const units = pxToUnits(sizePx, view.distanceUnits, view.fovDeg, view.viewportHeightPx);
  sprite.scale.set(units, units, 1);
  // Small on screen the halo is drawn over everything (dots cannot bury it); once the disc is big it is drawn with the depth test, so it frames the
  // disc from behind instead of washing it out.
  material.depthTest = diameterPx > GLOW_BEHIND_DISC_PX;
  // The colour only changes with the brightness setting: not rewritten every frame.
  const tint = sprite.userData as { tint?: string };
  const key = `${baseColor}|${look.brightness}`;
  if (tint.tint !== key) {
    material.opacity = Math.min(1, look.brightness);
    material.color.set(baseColor).multiplyScalar(Math.max(0, look.brightness));
    tint.tint = key;
  }
  sprite.visible = sizePx > 0 && look.brightness > 0;
  return sizePx;
}
