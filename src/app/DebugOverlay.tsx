import { directionFromCenterToSun, directionToSun, lunarIlluminatedFraction } from "../core/illumination";
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
  readonly lunarIlluminatedFraction: number;
  readonly scaledOrigin: Triple;
  readonly earthLocal: Triple;
  readonly moonLocal: Triple;
}

export interface DebugReadoutInput {
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
    lunarIlluminatedFraction: lunarIlluminatedFraction(moonFromEarth, sunFromEarth),
    scaledOrigin: triple(origin.scaledCameraOrigin),
    earthLocal: triple(origin.toLocal(placed.earthAbsolute)),
    moonLocal: triple(origin.toLocal(placed.moonAbsolute)),
  };
}

const vec = (v: readonly number[], digits: number) => `(${v.map((c) => c.toFixed(digits)).join(", ")})`;

/** Ordered label/value rows; kept separate from JSX so tests can read what the overlay shows. */
export function overlayRows(r: DebugReadout): ReadonlyArray<readonly [string, string]> {
  const quat = (q: Quad | null) => (q === null ? "not modeled" : `${vec(q, 5)} [x,y,z,w] body→EQJ`);
  return [
    ["UTC time", formatUtcTimestamp(r.timeUtcMs)],
    ["Playback rate", describePlaybackRate(r.rate)],
    ["Scale policy", r.policyId],
    ["Earth–Moon distance", `${r.moonDistanceKm.toFixed(1)} km (physical)`],
    ["Rendered distance", `${r.renderedDistanceUnits.toFixed(4)} scene units (Earth radii)`],
    ["Moon position", `${vec(r.moonPosition.positionKm, 1)} ${r.moonPosition.units}, ${r.moonPosition.frame}, centre ${r.moonPosition.center}`],
    ["Earth orientation", quat(r.earthOrientation)],
    ["Moon orientation", quat(r.moonOrientation)],
    ["Sun direction (from Earth)", `${vec(r.earthSunDirection, 5)} EQJ unit`],
    ["Sun direction (from Moon)", `${vec(r.moonSunDirection, 5)} EQJ unit`],
    ["Moon lit (geometric)", `${(r.lunarIlluminatedFraction * 100).toFixed(1)}%`],
    ["Scaled origin", `${vec(r.scaledOrigin, 4)} scene units, render axes`],
    ["Earth local", `${vec(r.earthLocal, 4)} scene units`],
    ["Moon local", `${vec(r.moonLocal, 4)} scene units`],
  ];
}

export function DebugOverlay({ readout }: { readonly readout: DebugReadout | null }) {
  if (readout === null) return null;
  const hiddenInstruments = new Set([
    "UTC time",
    "Playback rate",
    "Scale policy",
    "Earth–Moon distance",
    "Rendered distance",
    "Moon lit (geometric)",
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
