// The look is adapted from planetary-explorer src/features/moon/OrbitalTrail.tsx and OrbitalTrailArc.tsx (the owner's own project): a faint
// full orbit ring plus a comet-like arc behind the body, quadratic fade, both brightening a little as the camera zooms out.

/**
 * How a composition's orbit line looks: a faint ring over one period whose two ends fade out (so a perturbed orbit shows neither a break
 * nor a double line), a brighter arc over the stretch just behind the body that fades to nothing at its tail, and a brightening as the
 * camera pulls back. Each layer switches on and off by itself. Presentation only: it never touches a position.
 */
export interface OrbitLook {
  /** The faint ring over the whole period. */
  readonly baseOn: boolean;
  /** Ring opacity at close range, 0 to 1. */
  readonly baseOpacity: number;
  /** Fade both ends of the ring out, opposite the body. */
  readonly endFadeOn: boolean;
  /** Fraction of the window over which each end fades, 0 to 0.5. */
  readonly endFade: number;
  /** The brighter trailing arc just behind the body. */
  readonly arcOn: boolean;
  /** How much of the period the arc covers, 0 to 0.5. */
  readonly arcFraction: number;
  /** Arc opacity just behind the body, 0 to 1. */
  readonly arcPeak: number;
  /** Separate segments the arc is built from, each with its own opacity (Planetary Explorer uses 16). */
  readonly arcSegments: number;
  /** Half-width of the arc's ribbon as a share of the orbit's size. Planetary Explorer's value, 0.0015 of the radius (its ring slices span R - hw to R + hw in the orbit's plane). */
  readonly arcWidth: number;
  /** Fade curve: segment opacity is peak times t to this power, t from 1 at the body to 0 at the tail. 1 is linear, 2 quadratic. */
  readonly arcExponent: number;
  /** Brighten both layers as the camera zooms out. */
  readonly zoomOn: boolean;
  /** Extra ring opacity at full zoom-out. */
  readonly zoomBoostBase: number;
  /** Extra arc opacity at full zoom-out. */
  readonly zoomBoostArc: number;
  /** Share of the window the clock may move before the ring is resampled at once (a seek, a load or fast playback always resamples). */
  readonly ringRefresh: number;
  /** Camera distance, in multiples of the orbit's own size, at which the brightening is complete (it starts at 1). Above 1. */
  readonly zoomFarRatio: number;
}

/** Planetary Explorer's values (ring 0.18, arc 1/5 of the orbit at 0.65 with a quadratic fade, boosts 0.45 and 0.3). */
export const DEFAULT_ORBIT_LOOK: OrbitLook = Object.freeze({
  baseOn: true,
  baseOpacity: 0.18,
  endFadeOn: true,
  endFade: 0.1,
  arcOn: true,
  arcFraction: 0.2,
  arcPeak: 0.65,
  arcSegments: 16,
  arcWidth: 0.0015,
  arcExponent: 2,
  zoomOn: true,
  zoomBoostBase: 0.45,
  zoomBoostArc: 0.3,
  ringRefresh: 0.05,
  zoomFarRatio: 4,
});

/** Inclusive bounds of each number, shared by the validator and the live sliders. */
export const ORBIT_LOOK_LIMITS = Object.freeze({
  baseOpacity: { min: 0, max: 1 },
  endFade: { min: 0, max: 0.5 },
  arcFraction: { min: 0, max: 0.5 },
  arcPeak: { min: 0, max: 1 },
  arcSegments: { min: 2, max: 32 },
  arcWidth: { min: 0.0002, max: 0.01 },
  ringRefresh: { min: 0.005, max: 0.25 },
  arcExponent: { min: 0.5, max: 4 },
  zoomBoostBase: { min: 0, max: 1 },
  zoomBoostArc: { min: 0, max: 1 },
  zoomFarRatio: { min: 1.5, max: 20 },
});

/** Merges a path's partial look over the defaults; a number outside its bounds throws, naming it. */
export function resolveOrbitLook(partial: Partial<OrbitLook> | undefined, owner = "orbit look"): OrbitLook {
  const look = { ...DEFAULT_ORBIT_LOOK, ...partial };
  for (const [key, bounds] of Object.entries(ORBIT_LOOK_LIMITS)) {
    const value = look[key as keyof typeof ORBIT_LOOK_LIMITS];
    if (!(value >= bounds.min && value <= bounds.max)) throw new RangeError(`${owner}: ${key} must be from ${bounds.min} to ${bounds.max}`);
  }
  return Object.freeze(look);
}
