// The timeline's activity glow (T-084): the scrubber track itself carries the activity profile as a gradient, brighter where the rate is high
// and around the peak, fainter where nothing happens. Pure maths and strings here; TimelineBar draws it. Nothing names an experience (ARCH-01):
// the profile is read from the experience's windows (`rateAt`), an experience without a rate glows evenly at the steady brightness (T-086).
import { rateAt, type TimelineWindow } from "../core/timeWindow";
import type { TimeBounds } from "../core/trajectory";
import { formatWindowRate, timePositionPercent, windowPeakRateText } from "./timelineModel";

/** How the glow looks. Every number is a live setting in the Display settings panel. */
export interface TimelineGlowLook {
  /** The glow's colour before the playhead (#rrggbb). */
  readonly color: string;
  /** The glow's colour for the played part; keeps the accent. */
  readonly playedColor: string;
  /** Brightness (0-1) where nothing happens. */
  readonly minBrightness: number;
  /** Brightness (0-1) of the whole line when the experience has no rate to follow. */
  readonly steadyBrightness: number;
  /** Rate to brightness exponent: below 1 lifts the quiet shoulders, above 1 keeps only the peak bright. */
  readonly curve: number;
  /** Brightness floor of the played part (0-1), so the played portion always reads as played. */
  readonly playedFloor: number;
  /** The line's thickness in pixels. */
  readonly thicknessPx: number;
  /** The soft halo's blur in pixels; 0 draws no halo. */
  readonly haloPx: number;
}

export const DEFAULT_TIMELINE_GLOW: TimelineGlowLook = {
  color: "#cfe0ff",
  playedColor: "#fc6323",
  minBrightness: 0.1,
  steadyBrightness: 0.5,
  curve: 0.45,
  playedFloor: 0.4,
  thicknessPx: 8,
  haloPx: 10,
};

export interface GlowStop {
  /** Position along the timeline, 0-100. */
  readonly percent: number;
  /** Activity at that position, 0 (nothing) to 1 (the highest rate of any window). */
  readonly value: number;
}

const GRID = 240;

/** The activity along the timeline as stops: an even grid plus every sample and window edge, so the gradient has no visible steps. Null without a rate. */
export function glowProfile(windows: readonly TimelineWindow[], bounds: TimeBounds): readonly GlowStop[] | null {
  const span = bounds.endUtcMs - bounds.startUtcMs;
  const top = Math.max(0, ...windows.flatMap((window) => (window.rate?.samples ?? []).map((sample) => sample.value)));
  if (span <= 0 || top === 0) return null;
  const times = new Set<number>();
  for (let i = 0; i <= GRID; i += 1) times.add(Math.round(bounds.startUtcMs + (span * i) / GRID));
  for (const window of windows) {
    if (window.rate === undefined) continue;
    for (const time of [window.startUtcMs, window.endUtcMs, window.peakUtcMs, ...window.rate.samples.map((sample) => sample.timeUtcMs)]) {
      if (time !== undefined && time >= bounds.startUtcMs && time <= bounds.endUtcMs) times.add(time);
    }
  }
  return [...times].sort((a, b) => a - b).map((time) => ({
    percent: timePositionPercent(time, bounds),
    value: Math.max(0, ...windows.map((window) => (rateAt(window, time) ?? 0) / top)),
  }));
}

/** Brightness 0-1 for an activity value under a look. */
export function glowBrightness(value: number, look: TimelineGlowLook): number {
  const v = Math.max(0, Math.min(1, value));
  return look.minBrightness + (1 - look.minBrightness) * Math.pow(v, look.curve);
}

function rgb(hex: string): string {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (match === null) return "255, 255, 255";
  const n = parseInt(match[1], 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

/** A CSS gradient along the track (a null profile is the even glow) for the unplayed ("ahead") or played colour. */
export function glowGradient(profile: readonly GlowStop[] | null, look: TimelineGlowLook, part: "ahead" | "played"): string {
  const colour = rgb(part === "ahead" ? look.color : look.playedColor);
  // No rate to follow: two stops, the same brightness end to end.
  const stops = (profile ?? [{ percent: 0, value: 0 }, { percent: 100, value: 0 }]).map((stop) => {
    const b = profile === null ? Math.max(0, Math.min(1, look.steadyBrightness)) : glowBrightness(stop.value, look);
    const alpha = part === "ahead" ? b : look.playedFloor + (1 - look.playedFloor) * b;
    return `rgba(${colour}, ${alpha.toFixed(3)}) ${stop.percent.toFixed(3)}%`;
  });
  return `linear-gradient(to right, ${stops.join(", ")})`;
}

/** The window the time is inside that has a rate there, with the rate; null otherwise. */
export function activityAt(windows: readonly TimelineWindow[], timeUtcMs: number): { readonly window: TimelineWindow; readonly rate: number } | null {
  for (const window of windows) {
    const rate = rateAt(window, timeUtcMs);
    if (rate !== null && window.rate !== undefined) return { window, rate };
  }
  return null;
}

/** "<window label>: peak <rate and unit>": the glow's text equivalent, from the window's own label and rate. */
export function glowDescription(windows: readonly TimelineWindow[]): string {
  const parts = windows.flatMap((window) => {
    const peak = windowPeakRateText(window);
    return peak === null ? [] : [`${window.label}: peak ${peak}`];
  });
  return parts.length === 0 ? "" : `Activity along the timeline, brighter where it is higher. ${parts.join("; ")}`;
}

/** The tooltip for a point on the track: the rate there, or the peak when nothing is happening. */
export function glowTooltip(windows: readonly TimelineWindow[], timeUtcMs: number): string {
  const at = activityAt(windows, timeUtcMs);
  if (at !== null && at.window.rate !== undefined) return `${at.window.label}: ${formatWindowRate(at.rate, at.window.rate.unit)}`;
  const peaks = glowDescription(windows);
  return peaks === "" ? "" : `No activity here. ${peaks}`;
}
