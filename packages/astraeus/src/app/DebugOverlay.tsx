import { describePlaybackRate, formatUtcTimestamp } from "../shell/timelineModel";
import { MetricVisual } from "../shell/MetricVisual";
import { sceneMetrics } from "./metricReadouts";
import { EARTH_MOON_LABELS, type DebugReadout } from "./debugReadout";

export { formatUtcTimestamp } from "../shell/timelineModel";
export { buildDebugReadout, EARTH_MOON_LABELS } from "./debugReadout";
export type { DebugReadout, DebugReadoutInput, PairLabels } from "./debugReadout";

type Quad = readonly [number, number, number, number];

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
