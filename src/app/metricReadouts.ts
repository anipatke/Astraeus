import type { CenteredPosition } from "../core/state";
import type { DistanceMetric, Metric, MetricReference, PhaseMetric, SpeedMetric } from "../shell/metrics";
import type { DebugReadout } from "./DebugOverlay";
import type { TrackedBody, TrackedReadout } from "./mission";

const centreName = (center: string) => `${center.charAt(0).toUpperCase()}${center.slice(1)} centre`;

/**
 * Highest speed at the body's NASA source anchors, the honest top of its speed gauge. Anchors rather
 * than reconstructed samples, because a smoothed join can carry a known non-physical spike (I-008).
 * Null when the body has no anchors or the trajectory carries no velocity.
 */
export function peakAnchorSpeedKmS(body: TrackedBody): number | null {
  let peak: number | null = null;
  for (const time of body.anchorTimesUtcMs) {
    const velocity = body.trajectory.stateAt(time).velocityKmS;
    if (velocity === undefined) return null;
    peak = Math.max(peak ?? 0, Math.hypot(...velocity));
  }
  return peak;
}

/** A reference marker only when it is measured from the same centre and in the same frame as the value. */
export function referenceInSameFrame(
  label: string,
  row: Pick<TrackedReadout, "frame" | "center">,
  reference: CenteredPosition | null,
): MetricReference | null {
  if (reference === null || reference.center !== row.center || reference.frame !== row.frame) return null;
  return { label, value: Math.hypot(...reference.positionKm) };
}

export function spacecraftRangeMetric(row: TrackedReadout, moon: MetricReference | null): DistanceMetric {
  return {
    kind: "distance",
    id: `${row.id}-range`,
    label: "Range",
    value: row.rangeFromEarthKm,
    unit: "km",
    digits: 0,
    origin: `${centreName(row.center)} · ${row.frame}`,
    ...(moon === null ? {} : { markers: [moon] }),
  };
}

export function spacecraftSpeedMetric(row: TrackedReadout, peakKmS: number | null): SpeedMetric {
  return {
    kind: "speed",
    id: `${row.id}-speed`,
    label: "Speed",
    value: row.speedKmS,
    unit: "km/s",
    digits: 3,
    context: `inertial, relative to ${centreName(row.center)} · ${row.frame}`,
    unavailable: "not modeled",
    ...(peakKmS === null ? {} : { range: { min: 0, max: peakKmS, basis: "peak at NASA source anchors", digits: 1 } }),
  };
}

/** Scene measurements. Earth–Moon distance has no meaningful reference here, so it stays numeric-only. */
export function sceneMetrics(readout: DebugReadout): readonly Metric[] {
  const earthMoon: DistanceMetric = {
    kind: "distance",
    id: "earth-moon-distance",
    label: "Physical Earth–Moon distance",
    value: readout.moonDistanceKm,
    unit: "km",
    digits: 0,
    context: `${centreName(readout.moonPosition.center)} to Moon centre · ${readout.moonPosition.frame}`,
  };
  const rendered: DistanceMetric = {
    kind: "distance",
    id: "rendered-separation",
    label: "Rendered separation",
    value: readout.renderedDistanceUnits,
    unit: "scene units",
    digits: 4,
    context: `Earth-radius mapping · ${readout.policyId}`,
  };
  // The lit side seen from Earth depends on the observer; the core does not provide it, so no glyph.
  const illumination: PhaseMetric = {
    kind: "phase",
    id: "lunar-illumination",
    label: "Geometric lunar illumination",
    fraction: readout.lunarIlluminatedFraction,
    context: "fraction of the disc lit, seen from Earth's centre",
  };
  return [earthMoon, rendered, illumination];
}
