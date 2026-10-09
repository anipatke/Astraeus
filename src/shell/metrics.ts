/**
 * Metric Visuals: compact, numbers-first readouts. An experience supplies each value with its unit,
 * reference and any meaningful range; these helpers only map those values onto shapes.
 */

/** A labelled physical value a scale is drawn against, such as another body's current distance. */
export interface MetricReference {
  readonly label: string;
  readonly value: number;
}

/** Endpoints a gauge may span. Only real limits belong here; never a maximum chosen to fill a dial. */
export interface MetricRange {
  readonly min: number;
  readonly max: number;
  /** Says where the limits come from, for example "peak in source data". */
  readonly basis: string;
  /** Decimals for the limits; defaults to the metric's own. */
  readonly digits?: number;
}

interface MetricCommon {
  readonly id: string;
  readonly label: string;
  /** Frame, centre or basis shown under the value, for example "inertial · EQJ". */
  readonly context?: string;
  /** Shown in place of the value when it is null, for example "not modeled". */
  readonly unavailable?: string;
}

export interface SpeedMetric extends MetricCommon {
  readonly kind: "speed";
  readonly value: number | null;
  readonly unit: string;
  readonly digits: number;
  /** Without a range the readout is numeric-only. */
  readonly range?: MetricRange;
}

export interface DistanceMetric extends MetricCommon {
  readonly kind: "distance";
  readonly value: number | null;
  readonly unit: string;
  readonly digits: number;
  /** Where the distance is measured from; labels the zero end of the bar. */
  readonly origin?: string;
  /** Without markers the readout is numeric-only. */
  readonly markers?: readonly MetricReference[];
}

export interface PhaseMetric extends MetricCommon {
  readonly kind: "phase";
  /** Illuminated fraction of the disc, 0–1. */
  readonly fraction: number | null;
  /** Which side the observer sees lit. Without it no glyph is drawn, because the side would be a guess. */
  readonly litLimb?: "left" | "right";
}

export type Metric = SpeedMetric | DistanceMetric | PhaseMetric;
export type MetricKind = Metric["kind"];

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export function formatMetricNumber(value: number, digits: number): string {
  return value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export interface ArcGauge {
  /** Position of the value along the range, clamped to 0–1. */
  readonly fraction: number;
  /** The value lies outside the stated range, so the gauge is pinned at an end. */
  readonly outside: boolean;
}

/** Arc position for a speed, or null when there is no value or no usable range (numeric-only). */
export function speedGauge(metric: SpeedMetric): ArcGauge | null {
  const { value, range } = metric;
  if (value === null || range === undefined || !(range.max > range.min)) return null;
  const raw = (value - range.min) / (range.max - range.min);
  return { fraction: clamp01(raw), outside: raw < 0 || raw > 1 };
}

export interface DistanceScale {
  /** The bar spans 0 to this value, so the value and every marker fit. */
  readonly span: number;
  readonly valueFraction: number;
  readonly markers: readonly (MetricReference & { readonly fraction: number })[];
}

/** Proportional bar from the origin, or null without a value or reference markers (numeric-only). */
export function distanceScale(metric: DistanceMetric): DistanceScale | null {
  const { value, markers } = metric;
  if (value === null || markers === undefined || markers.length === 0 || value < 0) return null;
  const span = Math.max(value, ...markers.map((marker) => marker.value));
  if (!(span > 0)) return null;
  return {
    span,
    valueFraction: value / span,
    markers: markers.map((marker) => ({ ...marker, fraction: clamp01(marker.value / span) })),
  };
}

export type PhaseVisual =
  | { readonly kind: "glyph"; readonly litPath: string; readonly mirrored: boolean }
  | { readonly kind: "band"; readonly fraction: number };

/**
 * SVG path of the lit part of a unit disc (radius 1, centre 0,0) lit from the right.
 * The terminator is an ellipse whose half-width is |2k − 1|: it bulges away from the lit limb when
 * gibbous and towards it when crescent.
 */
export function litDiscPath(fraction: number): string {
  const k = clamp01(fraction);
  if (k === 0) return "";
  if (k === 1) return "M 0 -1 A 1 1 0 1 1 0 1 A 1 1 0 1 1 0 -1 Z";
  const rx = Math.abs(2 * k - 1);
  const terminatorSweep = k > 0.5 ? 1 : 0;
  return `M 0 -1 A 1 1 0 0 1 0 1 A ${rx.toFixed(4)} 1 0 0 ${terminatorSweep} 0 -1 Z`;
}

/** Phase glyph when the lit side is known, otherwise a 0–100% band; null without a fraction. */
export function phaseVisual(metric: PhaseMetric): PhaseVisual | null {
  if (metric.fraction === null) return null;
  if (metric.litLimb === undefined) return { kind: "band", fraction: clamp01(metric.fraction) };
  return { kind: "glyph", litPath: litDiscPath(metric.fraction), mirrored: metric.litLimb === "left" };
}

/** The value as it is read on screen, with its unit. */
export function metricValueText(metric: Metric): string {
  if (metric.kind === "phase") {
    return metric.fraction === null ? metric.unavailable ?? "unavailable" : `${formatMetricNumber(metric.fraction * 100, 1)}%`;
  }
  return metric.value === null ? metric.unavailable ?? "unavailable" : `${formatMetricNumber(metric.value, metric.digits)} ${metric.unit}`;
}

/** A sentence carrying the value and what the visual shows, so nothing depends on seeing the shape. */
export function describeMetric(metric: Metric): string {
  const parts = [`${metric.label}: ${metricValueText(metric)}`];
  if (metric.context !== undefined) parts.push(metric.context);
  if (metric.kind === "speed") {
    const gauge = speedGauge(metric);
    if (gauge !== null && metric.range !== undefined) {
      const { min, max, basis, digits = metric.digits } = metric.range;
      parts.push(`${Math.round(gauge.fraction * 100)}% of ${formatMetricNumber(min, digits)}–${formatMetricNumber(max, digits)} ${metric.unit} (${basis})${gauge.outside ? ", outside that range" : ""}`);
    }
  } else if (metric.kind === "distance") {
    const scale = distanceScale(metric);
    if (scale !== null) {
      for (const marker of scale.markers) parts.push(`${marker.label} at ${formatMetricNumber(marker.value, metric.digits)} ${metric.unit}`);
    }
  } else if (metric.fraction !== null && metric.litLimb !== undefined) {
    parts.push(`lit on the ${metric.litLimb}`);
  }
  return `${parts.join("; ")}.`;
}
