import type { ReactNode } from "react";
import {
  altitudeGlyph,
  describeMetric,
  distanceScale,
  metricNotes,
  metricReadings,
  phaseVisual,
  planViews,
  progressScale,
  RADII_WINDOW,
  relationGlyph,
  speedGauge,
  uncertaintyBand,
  type AltitudeMetric,
  type CoordinatesMetric,
  type CoordinateSystem,
  type LinearScale,
  type Metric,
  type PhaseMetric,
  type RelativeDistanceMetric,
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

function Svg({ metric, className, viewBox, stretch, children }: {
  readonly metric: Metric;
  readonly className: string;
  readonly viewBox: string;
  readonly stretch?: boolean;
  readonly children: ReactNode;
}) {
  return (
    <svg
      className={`metric-visual ${className}`}
      viewBox={viewBox}
      preserveAspectRatio={stretch ? "none" : undefined}
      role="img"
      aria-label={describeMetric(metric)}
    >
      {children}
    </svg>
  );
}

function Bar({ metric, scale, light }: { readonly metric: Metric; readonly scale: LinearScale; readonly light?: boolean }) {
  return (
    <Svg metric={metric} className="metric-bar" viewBox="0 0 100 14" stretch>
      <line className="metric-track" x1="0" y1="7" x2="100" y2="7" />
      <line className={light ? "metric-fill metric-fill-light" : "metric-fill"} x1="0" y1="7" x2={scale.valueFraction * 100} y2="7" />
      {scale.markers.map((marker) => (
        <line key={`${marker.label}-${marker.value}`} className="metric-marker" x1={marker.fraction * 100} y1="2" x2={marker.fraction * 100} y2="12" />
      ))}
    </Svg>
  );
}

function SpeedVisual({ metric }: { readonly metric: SpeedMetric }) {
  const gauge = speedGauge(metric);
  if (gauge === null) return null;
  return (
    <Svg metric={metric} className="metric-arc" viewBox="-1.25 -1.25 2.5 2.1">
      <path className="metric-track" d={arcPath(1)} />
      {gauge.fraction > 0 && <path className="metric-fill" d={arcPath(gauge.fraction)} />}
    </Svg>
  );
}

/** Target disc on the right, object dot to its left at the true gap in target radii; a break when farther. */
function RelationVisual({ metric }: { readonly metric: RelativeDistanceMetric }) {
  const glyph = relationGlyph(metric);
  if (glyph === null) return null;
  const discX = RADII_WINDOW + 1;
  const dotX = discX - Math.min(glyph.radii, RADII_WINDOW);
  return (
    <Svg metric={metric} className="metric-relation" viewBox={`-0.6 -1.2 ${RADII_WINDOW + 2.8} 2.4`}>
      <line className="metric-link" x1={dotX} y1="0" x2={discX} y2="0" />
      {glyph.beyondWindow && <path className="metric-break" d={`M ${dotX + 0.55} -0.45 l 0.3 0.9 M ${dotX + 0.95} -0.45 l 0.3 0.9`} />}
      <circle className="metric-disc" cx={discX} cy="0" r="1" />
      <circle className="metric-dot" cx={dotX} cy="0" r="0.32" />
    </Svg>
  );
}

/** Curved horizon of the body with the object above it at its height in body radii (one radius shown). */
function AltitudeVisual({ metric }: { readonly metric: AltitudeMetric }) {
  const glyph = altitudeGlyph(metric);
  if (glyph === null) return null;
  const horizonY = 2.2;
  const dotY = horizonY - 2 * Math.max(-0.1, Math.min(glyph.radii, 1));
  return (
    <Svg metric={metric} className="metric-horizon-glyph" viewBox="-1.6 -0.4 3.2 3.2">
      <path className="metric-horizon" d={`M -1.5 ${horizonY + 0.45} Q 0 ${horizonY - 0.45} 1.5 ${horizonY + 0.45}`} />
      <line className="metric-link" x1="0" y1={horizonY} x2="0" y2={dotY} />
      {glyph.beyondWindow && <path className="metric-break" d="M -0.3 0.55 l 0.6 -0.2 M -0.3 0.85 l 0.6 -0.2" />}
      <circle className="metric-dot" cx="0" cy={dotY} r="0.24" />
    </Svg>
  );
}

function UncertaintyVisual({ metric }: { readonly metric: Metric & { readonly kind: "uncertainty" } }) {
  const band = uncertaintyBand(metric);
  if (band === null) return null;
  const half = Math.max(band * 50, 0.6);
  return (
    <Svg metric={metric} className="metric-bar" viewBox="0 0 100 14" stretch>
      <line className="metric-track metric-track-thin" x1="0" y1="7" x2="100" y2="7" />
      <rect className="metric-band" x={50 - half} y="2.5" width={2 * half} height="9" rx="2" />
      <line className="metric-centre" x1="50" y1="1" x2="50" y2="13" />
    </Svg>
  );
}

function PhaseVisual({ metric }: { readonly metric: PhaseMetric }) {
  const visual = phaseVisual(metric);
  if (visual === null) return null;
  if (visual.kind === "band") {
    return <Bar metric={metric} scale={{ span: 1, valueFraction: visual.fraction, markers: [] }} light />;
  }
  return (
    <Svg metric={metric} className="metric-glyph" viewBox="-1.1 -1.1 2.2 2.2">
      <circle className="metric-disc" r="1" />
      {visual.litPath !== "" && <path className="metric-lit" d={visual.litPath} transform={visual.mirrored ? "scale(-1 1)" : undefined} />}
    </Svg>
  );
}

const SYSTEM_GLYPHS: Record<CoordinateSystem, ReactNode> = {
  // Three axes from one origin.
  xyz: <><path className="metric-axis" d="M 0 0 H 1.2 M 0 0 V -1.2 M 0 0 L -0.8 0.7" /><circle className="metric-dot" r="0.14" /></>,
  // Celestial sphere with its equator.
  radec: <><circle className="metric-outline" r="1" /><ellipse className="metric-axis" rx="1" ry="0.32" /></>,
  // Globe with a meridian and the equator.
  latlon: <><circle className="metric-outline" r="1" /><ellipse className="metric-axis" rx="0.42" ry="1" /><line className="metric-axis" x1="-1" y1="0" x2="1" y2="0" /></>,
};

const TICK_X = 1.55;

/**
 * Radar-style position: a round top view (x–y) with the origin at the centre and a slim height tick (z)
 * beside it, on one scale, so direction in 3D reads as two flat readings rather than a guessed angle.
 */
function RadarVisual({ metric }: { readonly metric: CoordinatesMetric }) {
  const views = planViews(metric);
  if (views === null) return null;
  const [top, side] = views.views;
  const toScreen = ([a, b]: readonly [number, number]) => [a, -b] as const;
  const [ox, oy] = toScreen(top.object);
  return (
    <Svg metric={metric} className="metric-radar" viewBox="-1.1 -1.1 2.95 2.2">
      <circle className="metric-view-frame" r="1" />
      <line className="metric-view-axis" x1="-1" y1="0" x2="1" y2="0" />
      <line className="metric-view-axis" x1="0" y1="-1" x2="0" y2="1" />
      <circle className="metric-view-origin" r="0.09" />
      {top.references.map((reference) => {
        const [rx, ry] = toScreen(reference.point);
        return <circle key={reference.label} className="metric-view-reference" cx={rx} cy={ry} r="0.1" />;
      })}
      <line className="metric-view-link" x1="0" y1="0" x2={ox} y2={oy} />
      <circle className="metric-dot" cx={ox} cy={oy} r="0.12" />
      <line className="metric-view-axis" x1={TICK_X} y1="-1" x2={TICK_X} y2="1" />
      <line className="metric-view-origin-tick" x1={TICK_X - 0.12} y1="0" x2={TICK_X + 0.12} y2="0" />
      {side.references.map((reference) => (
        <line key={reference.label} className="metric-view-reference-tick" x1={TICK_X - 0.16} y1={-reference.point[1]} x2={TICK_X + 0.16} y2={-reference.point[1]} />
      ))}
      <line className="metric-view-object-tick" x1={TICK_X - 0.2} y1={-side.object[1]} x2={TICK_X + 0.2} y2={-side.object[1]} />
    </Svg>
  );
}

function Visual({ metric }: { readonly metric: Metric }) {
  switch (metric.kind) {
    case "speed": return <SpeedVisual metric={metric} />;
    case "distance": {
      const scale = distanceScale(metric);
      return scale === null ? null : <Bar metric={metric} scale={scale} />;
    }
    case "progress": {
      const scale = progressScale(metric);
      return scale === null ? null : <Bar metric={metric} scale={scale} />;
    }
    case "relative-distance": return <RelationVisual metric={metric} />;
    case "altitude": return <AltitudeVisual metric={metric} />;
    case "uncertainty": return <UncertaintyVisual metric={metric} />;
    case "phase": return <PhaseVisual metric={metric} />;
    case "coordinates":
      if (planViews(metric) !== null) return <RadarVisual metric={metric} />;
      return (
        <Svg metric={metric} className="metric-glyph" viewBox="-1.3 -1.3 2.6 2.6">{SYSTEM_GLYPHS[metric.system]}</Svg>
      );
  }
}

/** One measurement: the number and unit first, then a small visual only where it has a real reference. */
export function MetricVisual({ metric }: { readonly metric: Metric }) {
  const readings = metricReadings(metric);
  const notes = metricNotes(metric);
  return (
    <div className={`metric metric-${metric.kind}`} role="group" aria-label={metric.label} data-metric={metric.id}>
      <span className="metric-label">{metric.label}</span>
      <div className="metric-body">
        <span className="metric-readings">
          {readings.map((reading, index) => (
            <span key={index} className="metric-reading">
              <strong className="metric-value">{reading.value}</strong>
              <span className="metric-unit">{reading.unit}</span>
            </span>
          ))}
        </span>
        <Visual metric={metric} />
      </div>
      {metric.context !== undefined && <span className="metric-context">{metric.context}</span>}
      {notes.length > 0 && (
        <span className="metric-scale">{notes.map((note) => <span key={note}>{note}</span>)}</span>
      )}
    </div>
  );
}
