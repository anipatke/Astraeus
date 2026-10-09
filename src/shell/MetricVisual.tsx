import {
  describeMetric,
  distanceScale,
  formatMetricNumber,
  phaseVisual,
  speedGauge,
  type DistanceMetric,
  type Metric,
  type PhaseMetric,
  type SpeedMetric,
} from "./metrics";

const ARC_START_DEG = 150;
const ARC_SWEEP_DEG = 240;

function arcPoint(degrees: number): string {
  const radians = (degrees * Math.PI) / 180;
  return `${Math.cos(radians).toFixed(4)} ${Math.sin(radians).toFixed(4)}`;
}

function arcPath(fraction: number): string {
  const sweep = ARC_SWEEP_DEG * fraction;
  return `M ${arcPoint(ARC_START_DEG)} A 1 1 0 ${sweep > 180 ? 1 : 0} 1 ${arcPoint(ARC_START_DEG + sweep)}`;
}

function SpeedVisual({ metric }: { readonly metric: SpeedMetric }) {
  const gauge = speedGauge(metric);
  if (gauge === null) return null;
  return (
    <svg className="metric-visual metric-arc" viewBox="-1.25 -1.25 2.5 2.1" role="img" aria-label={describeMetric(metric)}>
      <path className="metric-track" d={arcPath(1)} />
      {gauge.fraction > 0 && <path className="metric-fill" d={arcPath(gauge.fraction)} />}
    </svg>
  );
}

function DistanceVisual({ metric }: { readonly metric: DistanceMetric }) {
  const scale = distanceScale(metric);
  if (scale === null) return null;
  return (
    <svg className="metric-visual metric-bar" viewBox="0 0 100 14" preserveAspectRatio="none" role="img" aria-label={describeMetric(metric)}>
      <line className="metric-track" x1="0" y1="7" x2="100" y2="7" />
      <line className="metric-fill" x1="0" y1="7" x2={scale.valueFraction * 100} y2="7" />
      {scale.markers.map((marker) => (
        <line key={marker.label} className="metric-marker" x1={marker.fraction * 100} y1="1" x2={marker.fraction * 100} y2="13" />
      ))}
    </svg>
  );
}

function PhaseVisual({ metric }: { readonly metric: PhaseMetric }) {
  const visual = phaseVisual(metric);
  if (visual === null) return null;
  if (visual.kind === "band") {
    return (
      <svg className="metric-visual metric-bar" viewBox="0 0 100 14" preserveAspectRatio="none" role="img" aria-label={describeMetric(metric)}>
        <line className="metric-track" x1="0" y1="7" x2="100" y2="7" />
        <line className="metric-fill metric-fill-light" x1="0" y1="7" x2={visual.fraction * 100} y2="7" />
      </svg>
    );
  }
  return (
    <svg className="metric-visual metric-glyph" viewBox="-1.1 -1.1 2.2 2.2" role="img" aria-label={describeMetric(metric)}>
      <circle className="metric-disc" r="1" />
      {visual.litPath !== "" && <path className="metric-lit" d={visual.litPath} transform={visual.mirrored ? "scale(-1 1)" : undefined} />}
    </svg>
  );
}

function MetricCaption({ metric }: { readonly metric: Metric }) {
  if (metric.kind === "speed") {
    const range = speedGauge(metric) === null ? undefined : metric.range;
    if (range === undefined) return null;
    return (
      <span className="metric-scale">
        <span>{formatMetricNumber(range.min, range.digits ?? metric.digits)}–{formatMetricNumber(range.max, range.digits ?? metric.digits)} {metric.unit}</span>
        <span>{range.basis}</span>
      </span>
    );
  }
  if (metric.kind === "distance") {
    const scale = distanceScale(metric);
    if (scale === null) return null;
    return (
      <span className="metric-scale">
        {metric.origin !== undefined && <span>from {metric.origin}</span>}
        {scale.markers.map((marker) => (
          <span key={marker.label}><span className="metric-marker-key" aria-hidden="true" />{marker.label} {formatMetricNumber(marker.value, metric.digits)} {metric.unit}</span>
        ))}
      </span>
    );
  }
  return null;
}

function Reading({ metric }: { readonly metric: Metric }) {
  const value = metric.kind === "phase" ? metric.fraction : metric.value;
  if (value === null) return <span className="metric-reading"><strong className="metric-value">—</strong><span className="metric-unit">{metric.unavailable ?? "unavailable"}</span></span>;
  if (metric.kind === "phase") {
    return <span className="metric-reading"><strong className="metric-value">{formatMetricNumber(value * 100, 1)}</strong><span className="metric-unit">%</span></span>;
  }
  return <span className="metric-reading"><strong className="metric-value">{formatMetricNumber(value, metric.digits)}</strong><span className="metric-unit">{metric.unit}</span></span>;
}

function Visual({ metric }: { readonly metric: Metric }) {
  switch (metric.kind) {
    case "speed": return <SpeedVisual metric={metric} />;
    case "distance": return <DistanceVisual metric={metric} />;
    case "phase": return <PhaseVisual metric={metric} />;
  }
}

/** One measurement: the number and unit first, then a small visual only where it has a real reference. */
export function MetricVisual({ metric }: { readonly metric: Metric }) {
  return (
    <div className={`metric metric-${metric.kind}`} role="group" aria-label={metric.label} data-metric={metric.id}>
      <span className="metric-label">{metric.label}</span>
      <div className="metric-body">
        <Reading metric={metric} />
        <Visual metric={metric} />
      </div>
      {metric.context !== undefined && <span className="metric-context">{metric.context}</span>}
      <MetricCaption metric={metric} />
    </div>
  );
}
