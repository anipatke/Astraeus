import type { TextureRef } from "./licence";
import type { RingSystem } from "./rings";

export interface BodyMaterialConfig {
  readonly color: string;
  readonly roughness: number;
  readonly metalness: number;
  /** Self-light added to the lit colour; both or neither. */
  readonly emissive?: string;
  readonly emissiveIntensity?: number;
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
  /**
   * Draw a self-bright (unlit) sphere at the body's drawn radius as well, so a star reads as a body when it is close and as its marker
   * and glow when it is not. Appearance only.
   */
  readonly emissive?: boolean;
  /**
   * A soft halo drawn round the body on top of everything else in the scene, so it reads at any zoom, even among a dense group of dots.
   * `sizePx` is its least width on screen, `brightness` its strength (0 to 2) and `scale` (default 2.5) how many times the body's projected diameter it spans at least, so close up it frames the disc; the viewer can change all three live. A body with a halo draws no marker dot: the halo is its marker.
   */
  readonly glow?: { readonly sizePx: number; readonly brightness: number; readonly scale?: number };
  /** Marker kind: the screen size of the dot. */
  readonly marker?: { readonly sizePx: number };
  /** Flat ring bands in the body's equator plane, at their real radii; a ringed planet carries them in its catalogue visual, so every scene that adds it draws them (an override may still replace them). */
  readonly rings?: RingSystem;
  /** This body's own lights in its render pass. */
  readonly light?: { readonly ambient: number; readonly directional: number };
}
