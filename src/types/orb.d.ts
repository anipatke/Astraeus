declare module "@lizard-isana/orb" {
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
