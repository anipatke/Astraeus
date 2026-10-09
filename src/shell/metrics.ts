/**
 * Metric Visuals: compact, numbers-first readouts. An experience supplies each value with its unit,
 * reference and any meaningful range; these helpers only map those values onto shapes and words.
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

interface ScalarMetric extends MetricCommon {
  readonly value: number | null;
  readonly unit: string;
  readonly digits: number;
}

export interface SpeedMetric extends ScalarMetric {
  readonly kind: "speed";
  /** Without a range the readout is numeric-only. */
  readonly range?: MetricRange;
}

export interface DistanceMetric extends ScalarMetric {
  readonly kind: "distance";
  /** Where the distance is measured from; labels the zero end of the bar. */
  readonly origin?: string;
  /** Without markers the readout is numeric-only. */
  readonly markers?: readonly MetricReference[];
}

/** Centre-to-centre distance between two objects. */
export interface RelativeDistanceMetric extends ScalarMetric {
  readonly kind: "relative-distance";
  readonly from: string;
  readonly to: string;
  /** Radius of the `to` body in the same unit. The gap is drawn in its radii; without it, numeric-only. */
  readonly targetRadius?: number;
}

/** Height above a stated datum of a body, for example its mean radius. Negative means below the datum. */
export interface AltitudeMetric extends ScalarMetric {
  readonly kind: "altitude";
  readonly body: string;
  readonly datum: string;
  /** Body radius in the same unit. The height is drawn in its radii; without it, numeric-only. */
  readonly bodyRadius?: number;
}

/** How far along a journey of known length the value is. */
export interface ProgressMetric extends ScalarMetric {
  readonly kind: "progress";
  readonly total: number;
  readonly startLabel?: string;
  readonly endLabel?: string;
  /** Milestones along the journey, in the value's unit. */
  readonly markers?: readonly MetricReference[];
}

/** A ± half-width. The band compares it with the largest half-width in the same data. */
export interface UncertaintyMetric extends ScalarMetric {
  readonly kind: "uncertainty";
  readonly scale?: { readonly max: number; readonly basis: string };
}

export interface PhaseMetric extends MetricCommon {
  readonly kind: "phase";
  /** Illuminated fraction of the disc, 0–1. */
  readonly fraction: number | null;
  /** Which side the observer sees lit. Without it no glyph is drawn, because the side would be a guess. */
  readonly litLimb?: "left" | "right";
}

export type CoordinateSystem = "xyz" | "radec" | "latlon";

export interface CoordinateComponent {
  readonly label: string;
  readonly value: number;
  readonly unit: string;
  readonly digits: number;
}

export interface CoordinatesMetric extends MetricCommon {
  readonly kind: "coordinates";
  readonly system: CoordinateSystem;
  readonly components: readonly CoordinateComponent[] | null;
  /** Reference frame, for example "EQJ" or "J2000 equatorial". */
  readonly frame: string;
  /** Reference body or observer, for example "Earth centre". */
  readonly origin: string;
  /**
   * XYZ only: draw a round top view (x–y) and a height tick (z) on one shared scale, with reference
   * objects given in the same frame and origin. Without it only the system's symbol is drawn.
   */
  readonly planViews?: { readonly references: readonly CoordinateReference[] };
}

/** Another object's position in the same frame and from the same origin as the metric. */
export interface CoordinateReference {
  readonly label: string;
  readonly xyz: readonly [number, number, number];
}

export type Metric =
  | SpeedMetric
  | DistanceMetric
  | RelativeDistanceMetric
  | AltitudeMetric
  | ProgressMetric
  | UncertaintyMetric
  | PhaseMetric
  | CoordinatesMetric;
export type MetricKind = Metric["kind"];

/** Glyphs that draw a value in a body's radii show this many radii; farther values are drawn broken. */
export const RADII_WINDOW = 6;

const SYSTEM_NAMES: Record<CoordinateSystem, string> = {
  xyz: "Cartesian XYZ",
  radec: "Right ascension / declination",
  latlon: "Latitude / longitude",
};

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

export interface LinearScale {
  /** The bar spans 0 to this value. */
  readonly span: number;
  readonly valueFraction: number;
  readonly markers: readonly (MetricReference & { readonly fraction: number })[];
}

/** Proportional bar from the origin, or null without a value or reference markers (numeric-only). */
export function distanceScale(metric: DistanceMetric): LinearScale | null {
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

/** Journey line from start to total, or null without a value or a positive total. */
export function progressScale(metric: ProgressMetric): LinearScale | null {
  if (metric.value === null || !(metric.total > 0)) return null;
  return {
    span: metric.total,
    valueFraction: clamp01(metric.value / metric.total),
    markers: (metric.markers ?? []).map((marker) => ({ ...marker, fraction: clamp01(marker.value / metric.total) })),
  };
}

export interface RadiiGlyph {
  /** The value in radii of the reference body. */
  readonly radii: number;
  /** Beyond the drawn window, so the glyph shows a break. */
  readonly beyondWindow: boolean;
}

/** Gap to the target in its own radii, or null without a value or radius (numeric-only). */
export function relationGlyph(metric: RelativeDistanceMetric): RadiiGlyph | null {
  const { value, targetRadius } = metric;
  if (value === null || targetRadius === undefined || !(targetRadius > 0) || value < 0) return null;
  const radii = value / targetRadius;
  return { radii, beyondWindow: radii > RADII_WINDOW };
}

/** Height above the datum in body radii, or null without a value or radius (numeric-only). */
export function altitudeGlyph(metric: AltitudeMetric): RadiiGlyph | null {
  const { value, bodyRadius } = metric;
  if (value === null || bodyRadius === undefined || !(bodyRadius > 0)) return null;
  const radii = value / bodyRadius;
  return { radii, beyondWindow: radii > 1 };
}

/** Width of the ± band as a fraction of the largest half-width, or null without a scale. */
export function uncertaintyBand(metric: UncertaintyMetric): number | null {
  if (metric.value === null || metric.scale === undefined || !(metric.scale.max > 0) || metric.value < 0) return null;
  return clamp01(metric.value / metric.scale.max);
}

export interface PlanView {
  readonly name: "top" | "side";
  readonly axes: readonly [string, string];
  /** The object's projected position, scaled so the shared half-span is 1. */
  readonly object: readonly [number, number];
  readonly references: readonly { readonly label: string; readonly point: readonly [number, number] }[];
}

export interface PlanViews {
  /** Distance from the origin to the round view's rim and to each end of the height tick, in the metric's unit. */
  readonly halfSpan: number;
  readonly unit: string;
  readonly views: readonly [PlanView, PlanView];
}

/** Top (x–y) and side (x–z) projections on one scale; every point fits inside the round top view and the z tick. */
export function planViews(metric: CoordinatesMetric): PlanViews | null {
  const { components, planViews: config } = metric;
  if (config === undefined || metric.system !== "xyz" || components === null || components.length !== 3) return null;
  const object = components.map((c) => c.value) as [number, number, number];
  const all = [object, ...config.references.map((r) => r.xyz)];
  const halfSpan = Math.max(...all.flatMap((xyz) => [Math.hypot(xyz[0], xyz[1]), Math.abs(xyz[2])]));
  if (!(halfSpan > 0)) return null;
  const project = (xyz: readonly number[], second: 1 | 2): [number, number] => [xyz[0] / halfSpan, xyz[second] / halfSpan];
  const view = (name: "top" | "side", second: 1 | 2): PlanView => ({
    name,
    axes: ["x", second === 1 ? "y" : "z"],
    object: project(object, second),
    references: config.references.map((r) => ({ label: r.label, point: project(r.xyz, second) })),
  });
  return { halfSpan, unit: components[0].unit, views: [view("top", 1), view("side", 2)] };
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

export interface MetricReading {
  readonly value: string;
  readonly unit: string;
}

const unavailableReading = (metric: MetricCommon): MetricReading => ({ value: "—", unit: metric.unavailable ?? "unavailable" });

/** The headline number and its unit, as shown first. Coordinates read as one row per component. */
export function metricReadings(metric: Metric): readonly MetricReading[] {
  switch (metric.kind) {
    case "phase":
      return [metric.fraction === null ? unavailableReading(metric) : { value: formatMetricNumber(metric.fraction * 100, 1), unit: "%" }];
    case "progress":
      return [metric.value === null || !(metric.total > 0)
        ? unavailableReading(metric)
        : { value: formatMetricNumber(clamp01(metric.value / metric.total) * 100, 1), unit: "%" }];
    case "uncertainty":
      return [metric.value === null ? unavailableReading(metric) : { value: `±${formatMetricNumber(metric.value, metric.digits)}`, unit: metric.unit }];
    case "coordinates":
      return metric.components === null
        ? [unavailableReading(metric)]
        : metric.components.map((c) => ({ value: `${c.label} ${formatMetricNumber(c.value, c.digits)}`, unit: c.unit }));
    default:
      return [metric.value === null ? unavailableReading(metric) : { value: formatMetricNumber(metric.value, metric.digits), unit: metric.unit }];
  }
}

/** Caption lines naming the reference the visual is drawn against, in the order they are shown. */
export function metricNotes(metric: Metric): readonly string[] {
  const n = (value: number, digits: number) => formatMetricNumber(value, digits);
  switch (metric.kind) {
    case "speed": {
      const gauge = speedGauge(metric);
      if (gauge === null || metric.range === undefined) return [];
      const { min, max, basis, digits = metric.digits } = metric.range;
      return [`${n(min, digits)}–${n(max, digits)} ${metric.unit}${gauge.outside ? " · value outside this range" : ""}`, basis];
    }
    case "distance": {
      const scale = distanceScale(metric);
      const origin = metric.origin === undefined ? [] : [`from ${metric.origin}`];
      if (scale === null) return origin;
      return [...origin, ...scale.markers.map((m) => `${m.label} ${n(m.value, metric.digits)} ${metric.unit}`)];
    }
    case "relative-distance": {
      const glyph = relationGlyph(metric);
      const between = `${metric.from} → ${metric.to}`;
      return glyph === null ? [between] : [between, `${n(glyph.radii, 1)} × ${metric.to} radius`];
    }
    case "altitude": {
      if (metric.value === null) return [];
      const side = metric.value < 0 ? "below" : "above";
      const radius = metric.bodyRadius === undefined ? "" : ` (${n(metric.bodyRadius, 1)} ${metric.unit})`;
      return [`${side} ${metric.body} ${metric.datum}${radius}`];
    }
    case "progress": {
      if (metric.value === null) return [];
      const ends = metric.startLabel !== undefined && metric.endLabel !== undefined ? ` · ${metric.startLabel} → ${metric.endLabel}` : "";
      return [`${n(metric.value, metric.digits)} of ${n(metric.total, metric.digits)} ${metric.unit}${ends}`];
    }
    case "uncertainty": {
      if (uncertaintyBand(metric) === null || metric.scale === undefined) return [];
      return [`largest ±${n(metric.scale.max, metric.digits)} ${metric.unit} · ${metric.scale.basis}`];
    }
    case "phase":
      return metric.fraction !== null && metric.litLimb !== undefined ? [`lit on the ${metric.litLimb}`] : [];
    case "coordinates": {
      const system = `${SYSTEM_NAMES[metric.system]} · ${metric.frame} · from ${metric.origin}`;
      const views = planViews(metric);
      if (views === null) return [system];
      const references = metric.planViews?.references.map((r) => r.label).join(", ");
      return [
        system,
        `round: top view x–y · tick: z · rim ±${formatMetricNumber(views.halfSpan, 0)} ${views.unit}${references ? ` · lavender: ${references}` : ""}`,
      ];
    }
  }
}

/** A sentence carrying the value and what the visual shows, so nothing depends on seeing the shape. */
export function describeMetric(metric: Metric): string {
  const reading = metricReadings(metric).map((r) => `${r.value} ${r.unit}`).join(", ");
  return [`${metric.label}: ${reading}`, ...(metric.context === undefined ? [] : [metric.context]), ...metricNotes(metric)].join("; ") + ".";
}
