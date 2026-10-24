// The debug readout's values, built every frame by the scene. The panel that draws them is DebugOverlay.tsx (loaded on demand, T-179).
import { directionFromCenterToSun, directionToSun, illuminatedFraction } from "../core/illumination";
import type { CenteredPosition, State } from "../core/state";
import type { ScalePolicy } from "../core/scalePolicy";
import type { FloatingOrigin } from "./floatingOrigin";
import type { PlacedState } from "./sceneLayout";

type Triple = readonly [number, number, number];
type Quad = readonly [number, number, number, number];

/** Diagnostic snapshot. Scientific fields never depend on the scale policy; render fields do. */
export interface DebugReadout {
  readonly timeUtcMs: number;
  readonly rate: number;
  readonly policyId: ScalePolicy["id"];
  readonly moonPosition: {
    readonly frame: string;
    readonly center: string;
    readonly units: "km";
    readonly positionKm: Triple;
  };
  readonly moonDistanceKm: number;
  /** Earth–Moon distance in scene units (Earth radii) from the same mapping that places the bodies. */
  readonly renderedDistanceUnits: number;
  readonly earthOrientation: Quad | null;
  readonly moonOrientation: Quad | null;
  readonly earthSunDirection: Triple;
  readonly moonSunDirection: Triple;
  /** Fraction of the child's disc lit, seen from the parent's centre (any satellite pair, not only the Moon). */
  readonly lunarIlluminatedFraction: number;
  /** Labels of the measured pair; absent means Earth and Moon. */
  readonly pair?: PairLabels;
  readonly scaledOrigin: Triple;
  readonly earthLocal: Triple;
  readonly moonLocal: Triple;
}

/** Display names of the pair the readout measures. */
export interface PairLabels {
  readonly parent: string;
  readonly child: string;
}

export const EARTH_MOON_LABELS: PairLabels = Object.freeze({ parent: "Earth", child: "Moon" });

export interface DebugReadoutInput {
  readonly pair?: PairLabels;
  readonly timeUtcMs: number;
  readonly rate: number;
  readonly policy: ScalePolicy;
  readonly earth: State;
  readonly moonFromEarth: State;
  readonly sunFromEarth: CenteredPosition;
  readonly placed: PlacedState;
  readonly renderedDistanceUnits: number;
  readonly origin: FloatingOrigin;
}

const triple = (v: ArrayLike<number>): Triple => [v[0], v[1], v[2]];

/** Builds the overlay values from the very state, mapping and origin the scene just used. */
export function buildDebugReadout(input: DebugReadoutInput): DebugReadout {
  const { moonFromEarth, sunFromEarth, origin, placed } = input;
  return {
    timeUtcMs: input.timeUtcMs,
    rate: input.rate,
    policyId: input.policy.id,
    ...(input.pair === undefined ? {} : { pair: input.pair }),
    moonPosition: {
      frame: moonFromEarth.frame,
      center: moonFromEarth.center,
      units: "km",
      positionKm: triple(moonFromEarth.positionKm),
    },
    moonDistanceKm: Math.hypot(...triple(moonFromEarth.positionKm)),
    renderedDistanceUnits: input.renderedDistanceUnits,
    earthOrientation: input.earth.orientation,
    moonOrientation: moonFromEarth.orientation,
    earthSunDirection: triple(directionFromCenterToSun(sunFromEarth)),
    moonSunDirection: triple(directionToSun(moonFromEarth, sunFromEarth)),
    lunarIlluminatedFraction: illuminatedFraction(moonFromEarth, sunFromEarth),
    scaledOrigin: triple(origin.scaledCameraOrigin),
    earthLocal: triple(origin.toLocal(placed.earthAbsolute)),
    moonLocal: triple(origin.toLocal(placed.moonAbsolute)),
  };
}
