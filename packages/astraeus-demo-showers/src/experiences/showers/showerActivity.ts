// Shower activity: the rate samples, activity window and the rate and radiant metrics.
import { createProvenance, type Provenance } from "astraeus/core/provenance";
import { createWindows, rateAt, type RateSample, type TimelineWindow } from "astraeus/core/timeWindow";
import type { CoordinatesMetric, RateMetric } from "astraeus/shell/metrics";
import { DAY_MS, HOUR_MS, sourceLine, windowIdOf } from "./showerBasics";
import type { ShowerSettings } from "./showerSettings";

/** Rate samples: one per day over the window and one at the peak, falling off from the peak by powers of ten. */
export function rateSamplesOf(settings: ShowerSettings): readonly RateSample[] {
  const { startUtc, endUtc, peakUtc, peakRate, fallOffPerDay } = settings.activity;
  const [startMs, endMs, peakMs] = [startUtc, endUtc, peakUtc].map(Date.parse);
  const times = new Set<number>([peakMs, startMs, endMs]);
  for (let t = startMs + DAY_MS; t < endMs; t += DAY_MS) times.add(t);
  return [...times]
    .sort((a, b) => a - b)
    .map((timeUtcMs) => ({ timeUtcMs, value: peakRate * 10 ** (-fallOffPerDay * (Math.abs(timeUtcMs - peakMs) / DAY_MS)) }));
}

function publishedProvenance(settings: ShowerSettings): Provenance {
  return createProvenance({
    sourceType: "observed",
    sources: [sourceLine(settings.activity.source)],
    accuracy: `As published for the night of ${settings.activity.peakPublishedNight}; not checked against the primary source.`,
    notes: `The published peak night and peak rate of ${settings.activity.peakRate}. The exact instant inside the night is chosen for the picture.`,
  });
}

function modelledProvenance(side: "rise" | "fall"): Provenance {
  return createProvenance({
    sourceType: "illustrative",
    sources: ["Modelled rate curve; not observed"],
    accuracy: "None claimed. The rate between the published points falls off smoothly from the peak.",
    notes: side === "rise" ? "Modelled rise toward the published peak." : "Modelled fall after the published peak.",
  });
}

export function createActivityWindow(settings: ShowerSettings): TimelineWindow {
  const { startUtc, endUtc, peakUtc, rateUnit } = settings.activity;
  const [startUtcMs, endUtcMs, peakUtcMs] = [startUtc, endUtc, peakUtc].map(Date.parse);
  const halfNight = 12 * HOUR_MS;
  const nightStart = Math.max(startUtcMs, peakUtcMs - halfNight);
  const nightEnd = Math.min(endUtcMs, peakUtcMs + halfNight);
  return createWindows([{
    id: windowIdOf(settings),
    label: `${settings.label} activity`,
    type: "meteor-shower",
    startUtcMs,
    endUtcMs,
    peakUtcMs,
    rate: { unit: rateUnit, samples: rateSamplesOf(settings) },
    provenance: [
      { startUtcMs, endUtcMs: nightStart, provenance: modelledProvenance("rise") },
      { startUtcMs: nightStart, endUtcMs: nightEnd, provenance: publishedProvenance(settings) },
      { startUtcMs: nightEnd, endUtcMs, provenance: modelledProvenance("fall") },
    ].filter((span) => span.endUtcMs > span.startUtcMs),
  }])[0];
}

export function rateMetricOf(settings: ShowerSettings, window: TimelineWindow, timeUtcMs: number): RateMetric {
  return {
    kind: "rate",
    id: `${settings.id}-rate`,
    label: "Activity rate",
    value: rateAt(window, timeUtcMs),
    unit: window.rate?.unit ?? "",
    digits: 0,
    context: window.label,
    unavailable: "outside the activity window",
    peak: { label: "Published peak", value: settings.activity.peakRate },
  };
}

export function radiantMetricOf(settings: ShowerSettings): CoordinatesMetric {
  return {
    kind: "coordinates",
    id: `${settings.id}-radiant`,
    label: "Radiant",
    system: "radec",
    components: [
      { label: "RA", value: settings.radiant.raDeg, unit: "°", digits: 1 },
      { label: "Dec", value: settings.radiant.decDeg, unit: "°", digits: 1 },
    ],
    frame: settings.radiant.equinox,
    origin: "Earth",
    context: `Published: ${settings.radiant.source.name}`,
  };
}
