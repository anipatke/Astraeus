import { directionFromCenterToSun, directionToSun, illuminatedFraction } from "../core/illumination";
import type { CenteredPosition, State } from "../core/state";
import type { ScalePolicy } from "../core/scalePolicy";
import type { FloatingOrigin } from "./floatingOrigin";
import type { PlacedState } from "./sceneLayout";
import { describePlaybackRate, formatUtcTimestamp } from "../shell/timelineModel";
import { MetricVisual } from "../shell/MetricVisual";
import { sceneMetrics } from "./metricReadouts";

export { formatUtcTimestamp } from "../shell/timelineModel";

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

const vec = (v: readonly number[], digits: number) => `(${v.map((c) => c.toFixed(digits)).join(", ")})`;

/** Ordered label/value rows; kept separate from JSX so tests can read what the overlay shows. */
export function overlayRows(r: DebugReadout): ReadonlyArray<readonly [string, string]> {
  const { parent, child } = r.pair ?? EARTH_MOON_LABELS;
  const quat = (q: Quad | null) => (q === null ? "not modeled" : `${vec(q, 5)} [x,y,z,w] body→EQJ`);
  return [
    ["UTC time", formatUtcTimestamp(r.timeUtcMs)],
    ["Playback rate", describePlaybackRate(r.rate)],
    ["Scale policy", r.policyId],
    [`${parent}–${child} distance`, `${r.moonDistanceKm.toFixed(1)} km (physical)`],
    ["Rendered distance", `${r.renderedDistanceUnits.toFixed(4)} scene units (Earth radii)`],
    [`${child} position`, `${vec(r.moonPosition.positionKm, 1)} ${r.moonPosition.units}, ${r.moonPosition.frame}, centre ${r.moonPosition.center}`],
    [`${parent} orientation`, quat(r.earthOrientation)],
    [`${child} orientation`, quat(r.moonOrientation)],
    [`Sun direction (from ${parent})`, `${vec(r.earthSunDirection, 5)} EQJ unit`],
    [`Sun direction (from ${child})`, `${vec(r.moonSunDirection, 5)} EQJ unit`],
    [`${child} lit (geometric)`, `${(r.lunarIlluminatedFraction * 100).toFixed(1)}%`],
    ["Scaled origin", `${vec(r.scaledOrigin, 4)} scene units, render axes`],
    [`${parent} local`, `${vec(r.earthLocal, 4)} scene units`],
    [`${child} local`, `${vec(r.moonLocal, 4)} scene units`],
  ];
}

export function DebugOverlay({ readout }: { readonly readout: DebugReadout | null }) {
  if (readout === null) return null;
  const { parent, child } = readout.pair ?? EARTH_MOON_LABELS;
  const hiddenInstruments = new Set([
    "UTC time",
    "Playback rate",
    "Scale policy",
    `${parent}–${child} distance`,
    "Rendered distance",
    `${child} lit (geometric)`,
    `${child} position`,
  ]);
  const advancedRows = overlayRows(readout).filter(([label]) => !hiddenInstruments.has(label));

  return (
    <div className="scientific-instruments" aria-label="Scene measurements">
      <div className="instrument-grid">
        {sceneMetrics(readout).map((metric) => <MetricVisual key={metric.id} metric={metric} />)}
      </div>
      <details className="advanced-readouts">
        <summary>Advanced coordinates and vectors</summary>
        <dl className="overlay" aria-label="Advanced scientific readouts">
          {advancedRows.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  );
}
