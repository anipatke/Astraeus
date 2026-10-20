interface OrbPlanetVector {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly coordinate_keywords: string;
  readonly unit_keywords: string;
}
interface OrbPlanetOptions { readonly vsop87a?: "short" | "full"; }

// The library's source modules are imported one by one, not through its bundled entry, so the compact planet tables
// (which the entry keeps alive) stay out of the main chunk (I-022).
declare module "@lizard-isana/orb/src/orb-planet.js" {
  export class Mercury { constructor(options?: OrbPlanetOptions); xyz(date: Date): OrbPlanetVector; }
  export class Venus { constructor(options?: OrbPlanetOptions); xyz(date: Date): OrbPlanetVector; }
  export class Mars { constructor(options?: OrbPlanetOptions); xyz(date: Date): OrbPlanetVector; }
  export class Jupiter { constructor(options?: OrbPlanetOptions); xyz(date: Date): OrbPlanetVector; }
  export class Saturn { constructor(options?: OrbPlanetOptions); xyz(date: Date): OrbPlanetVector; }
  export class Uranus { constructor(options?: OrbPlanetOptions); xyz(date: Date): OrbPlanetVector; }
  export class Neptune { constructor(options?: OrbPlanetOptions); xyz(date: Date): OrbPlanetVector; }
}

declare module "@lizard-isana/orb/src/orb-vsop87a-registry.js" {
  /** Registers a planet's full VSOP87A coefficients, which a planet built with `{ vsop87a: "full" }` then uses. */
  export function registerVSOP87A(body: string, data: readonly unknown[]): readonly unknown[];
}

declare module "@lizard-isana/orb/src/orb-luna.js" {
  export class Luna {
    xyz(date: Date): {
      readonly x: number;
      readonly y: number;
      readonly z: number;
      readonly coordinate_keywords: string;
      readonly center_keywords: string;
      readonly unit_keywords: string;
    };
  }
}

declare module "@lizard-isana/orb/time" {
  export class AstroInstant {
    static fromUnixMs(milliseconds: number): AstroInstant;
    jd2parts(scale?: "utc" | "ut1" | "tt"): [number, number];
  }
}

declare module "@lizard-isana/orb/frames" {
  import type { AstroInstant } from "@lizard-isana/orb/time";

  export interface OrbState {
    readonly t: AstroInstant;
    readonly frame: string;
    readonly center: string;
    readonly r: Float64Array;
  }
  export function makeState(input: {
    readonly t: AstroInstant;
    readonly frame: string;
    readonly center: string;
    readonly r: ArrayLike<number>;
  }): OrbState;
  export function transform(state: OrbState, options: { readonly frame: string }): OrbState;
  export function transformationMatrix(from: string, to: string, instant: AstroInstant): Float64Array;
}

declare module "@lizard-isana/orb/models/earth-epv00" {
  import type { AstroInstant } from "@lizard-isana/orb/time";

  interface OrbEphemerisState {
    readonly frame: string;
    readonly center: string;
    readonly r: Float64Array;
  }
  export const earthEpv00: { state(instant: AstroInstant): OrbEphemerisState };
  export const sunEpv00: { state(instant: AstroInstant): OrbEphemerisState };
}

declare module "@lizard-isana/orb/kepler" {
  export const GM: { readonly sun: number; readonly earth: number; readonly moon: number };
  export interface KeplerVectors {
    readonly r: Float64Array;
    readonly v: Float64Array;
  }
  export function propagateKepler(
    r0: ArrayLike<number>,
    v0: ArrayLike<number>,
    dtSeconds: number,
    mu: number,
  ): KeplerVectors;
  export function elementsToState(
    elements: {
      readonly semiMajorAxis: number;
      readonly eccentricity: number;
      readonly inclination: number;
      readonly raan: number;
      readonly argumentOfPeriapsis: number;
      readonly trueAnomaly: number;
    },
    mu: number,
  ): KeplerVectors;
}

declare module "@lizard-isana/orb/vsop87a/mercury" { export const MERCURY_FULL_COEF: readonly unknown[]; }
declare module "@lizard-isana/orb/vsop87a/venus" { export const VENUS_FULL_COEF: readonly unknown[]; }
declare module "@lizard-isana/orb/vsop87a/mars" { export const MARS_FULL_COEF: readonly unknown[]; }
declare module "@lizard-isana/orb/vsop87a/jupiter" { export const JUPITER_FULL_COEF: readonly unknown[]; }
declare module "@lizard-isana/orb/vsop87a/saturn" { export const SATURN_FULL_COEF: readonly unknown[]; }
declare module "@lizard-isana/orb/vsop87a/uranus" { export const URANUS_FULL_COEF: readonly unknown[]; }
declare module "@lizard-isana/orb/vsop87a/neptune" { export const NEPTUNE_FULL_COEF: readonly unknown[]; }
