import type { TextureRef } from "./licence";

export interface BodyMaterialConfig {
  readonly color: string;
  readonly roughness: number;
  readonly metalness: number;
}

export interface AtmosphereConfig {
  readonly color: string;
  readonly intensity?: number;
  readonly power?: number;
  readonly scale?: number;
}

/**
 * How a body looks. Appearance only: it never feeds position, orientation or any metric.
 * A sphere is drawn at its mapped mean radius, or as a spheroid when the definition carries
 * both an equatorial and a polar radius.
 */
export interface BodyVisual {
  /** A star at interplanetary distance is a marker until a star renderer exists. */
  readonly kind: "sphere" | "marker";
  /** Sphere only; absent means a flat colour from the material. */
  readonly texture?: TextureRef;
  readonly material: BodyMaterialConfig;
  /** Presentation-only yaw about the body's pole, aligning the image to the body-fixed axes. */
  readonly textureYawRad?: number;
  readonly atmosphere?: AtmosphereConfig;
  /** Marker kind: the screen size of the dot. */
  readonly marker?: { readonly sizePx: number };
  /** This body's own lights in its render pass. */
  readonly light?: { readonly ambient: number; readonly directional: number };
}
