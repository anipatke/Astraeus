import type { TimelineEvent } from "../core/events";
import type { CoordinatesMetric, DistanceMetric, Metric, PhaseMetric, ProgressMetric } from "../shell/metrics";
import { EARTH_MOON_LABELS, type DebugReadout } from "./DebugOverlay";

const HOUR_MS = 3_600_000;

const centreName = (center: string) => `${center.charAt(0).toUpperCase()}${center.slice(1)} centre`;

/** Elapsed time from the first to the last event, with every event as a milestone. */
export function journeyProgressMetric(
  events: readonly TimelineEvent[],
  timeUtcMs: number,
  labels: { readonly start: string; readonly end: string },
): ProgressMetric {
  const start = events[0]?.timeUtcMs ?? timeUtcMs;
  const end = events[events.length - 1]?.timeUtcMs ?? timeUtcMs;
  const hours = (ms: number) => (ms - start) / HOUR_MS;
  return {
    kind: "progress",
    id: "journey-progress",
    label: "Journey",
    value: Math.min(Math.max(hours(timeUtcMs), 0), hours(end)),
    total: hours(end),
    unit: "h",
    digits: 1,
    startLabel: labels.start,
    endLabel: labels.end,
    markers: events.map((event) => ({ label: event.label, value: hours(event.timeUtcMs) })),
  };
}

/** Scene measurements. Earth–Moon distance has no meaningful reference here, so it stays numeric-only. */
export function sceneMetrics(readout: DebugReadout): readonly Metric[] {
  const { parent, child } = readout.pair ?? EARTH_MOON_LABELS;
  const earthMoon: DistanceMetric = {
    kind: "distance",
    id: "earth-moon-distance",
    label: `Physical ${parent}–${child} distance`,
    value: readout.moonDistanceKm,
    unit: "km",
    digits: 0,
    context: `${centreName(readout.moonPosition.center)} to ${child} centre · ${readout.moonPosition.frame}`,
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
    label: `Geometric ${child === "Moon" ? "lunar" : child} illumination`,
    fraction: readout.lunarIlluminatedFraction,
    context: `fraction of the disc lit, seen from ${parent}'s centre`,
  };
  const moonPosition: CoordinatesMetric = {
    kind: "coordinates",
    id: "moon-position",
    label: `${child} position`,
    system: "xyz",
    components: (["x", "y", "z"] as const).map((label, index) => ({
      label,
      value: readout.moonPosition.positionKm[index],
      unit: readout.moonPosition.units,
      digits: 0,
    })),
    frame: readout.moonPosition.frame,
    origin: centreName(readout.moonPosition.center),
    planViews: { references: [] },
  };
  return [earthMoon, rendered, illumination, moonPosition];
}
