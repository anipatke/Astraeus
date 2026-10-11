import type { TimelineEvent } from "../core/events";
import { rateAt, type TimelineWindow } from "../core/timeWindow";
import type { TimeBounds } from "../core/trajectory";

export interface PlaybackSpeed {
  readonly label: string;
  readonly rate: number;
}

export const DEFAULT_PLAYBACK_SPEEDS: readonly PlaybackSpeed[] = [
  { label: describePlaybackRate(1), rate: 1 },
  { label: describePlaybackRate(3_600), rate: 3_600 },
  { label: describePlaybackRate(86_400), rate: 86_400 },
  { label: describePlaybackRate(604_800), rate: 604_800 },
];

export const TIMELINE_STEP_MS = 60_000;

export function formatRate(rate: number): string {
  return `${rate.toLocaleString("en-US")}×`;
}

function formatSimulatedDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return `${seconds} simulated seconds`;
  if (!Number.isInteger(seconds)) return `${Number(seconds.toPrecision(3))} simulated seconds`;

  let remaining = seconds;
  const parts: string[] = [];
  for (const [unit, size] of [["day", 86_400], ["hour", 3_600], ["min", 60], ["sec", 1]] as const) {
    const count = Math.floor(remaining / size);
    if (count > 0) {
      parts.push(`${count} ${unit}${count === 1 ? "" : unit === "min" || unit === "sec" ? "" : "s"}`);
      remaining -= count * size;
    }
  }
  return parts.join(" ");
}

/** Every rate explains how much simulated time passes during one real second. */
export function describePlaybackRate(rate: number): string {
  if (rate === 1) return `${formatRate(rate)} — real time`;
  return `${formatRate(rate)} — ${formatSimulatedDuration(rate)} per real second`;
}

/** Existing speeds plus experience rates not already offered, in ascending order. */
export function mergeSpeeds(base: readonly PlaybackSpeed[], rates: readonly number[]): readonly PlaybackSpeed[] {
  const extra = rates.filter((rate) => !base.some((speed) => speed.rate === rate))
    .map((rate) => ({ label: describePlaybackRate(rate), rate }));
  return [...base, ...extra].sort((a, b) => a.rate - b.rate);
}

export interface EventContext {
  /** Most recent event at or before the current time. */
  readonly current: TimelineEvent | null;
  /** Next event strictly after the current time. */
  readonly next: TimelineEvent | null;
}

export interface EventNavigationTargets {
  /** Nearest event strictly before the current time. */
  readonly previous: TimelineEvent | null;
  /** Nearest event strictly after the current time. */
  readonly next: TimelineEvent | null;
}

/** Finds the story event just reached and the next event without changing the event model. */
export function eventContextAt(events: readonly TimelineEvent[], timeUtcMs: number): EventContext {
  let low = 0;
  let high = events.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (events[middle].timeUtcMs <= timeUtcMs) low = middle + 1;
    else high = middle;
  }
  return {
    current: events[low - 1] ?? null,
    next: events[low] ?? null,
  };
}

/** Previous/next buttons move to the nearest event strictly on either side of the clock. */
export function eventNavigationTargets(events: readonly TimelineEvent[], timeUtcMs: number): EventNavigationTargets {
  let low = 0;
  let high = events.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (events[middle].timeUtcMs < timeUtcMs) low = middle + 1;
    else high = middle;
  }
  const previousIndex = low - 1;
  high = events.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (events[middle].timeUtcMs <= timeUtcMs) low = middle + 1;
    else high = middle;
  }
  return {
    previous: events[previousIndex] ?? null,
    next: events[low] ?? null,
  };
}

export function clampToBounds(timeUtcMs: number, bounds: TimeBounds): number {
  return Math.min(bounds.endUtcMs, Math.max(bounds.startUtcMs, timeUtcMs));
}

export function eventPositionPercent(event: TimelineEvent, bounds: TimeBounds): number {
  const span = bounds.endUtcMs - bounds.startUtcMs;
  if (span <= 0) return 0;
  return Math.max(0, Math.min(100, ((event.timeUtcMs - bounds.startUtcMs) / span) * 100));
}

export function formatUtcTimestamp(timeUtcMs: number): string {
  return new Date(timeUtcMs).toISOString().replace(".000Z", "Z");
}

/** A time's position on the timeline, clamped to 0–100. */
export function timePositionPercent(timeUtcMs: number, bounds: TimeBounds): number {
  const span = bounds.endUtcMs - bounds.startUtcMs;
  if (span <= 0) return 0;
  return Math.max(0, Math.min(100, ((timeUtcMs - bounds.startUtcMs) / span) * 100));
}

/** Where a window starts and ends on the timeline, each clamped to 0–100. */
export function windowPositionPercent(window: TimelineWindow, bounds: TimeBounds): { readonly startPercent: number; readonly endPercent: number } {
  return { startPercent: timePositionPercent(window.startUtcMs, bounds), endPercent: timePositionPercent(window.endUtcMs, bounds) };
}

/**
 * A line through a window's rate samples in a 0–100 box (x: timeline position, y: 100 is the window's own
 * highest rate). Only samples inside the timeline are drawn; null when fewer than two remain or all are zero.
 */
export function windowCurvePath(window: TimelineWindow, bounds: TimeBounds): string | null {
  const samples = (window.rate?.samples ?? []).filter((sample) => sample.timeUtcMs >= bounds.startUtcMs && sample.timeUtcMs <= bounds.endUtcMs);
  const peak = Math.max(0, ...(window.rate?.samples ?? []).map((sample) => sample.value));
  if (samples.length < 2 || peak === 0) return null;
  const point = (sample: { readonly timeUtcMs: number; readonly value: number }) =>
    `${Number(timePositionPercent(sample.timeUtcMs, bounds).toFixed(3))} ${Number((100 - (sample.value / peak) * 100).toFixed(3))}`;
  return samples.map((sample, index) => `${index === 0 ? "M" : "L"}${point(sample)}`).join(" ");
}

export function formatWindowRate(value: number, unit: string): string {
  return `${Number(value.toPrecision(3)).toLocaleString("en-US")} ${unit}`;
}

export interface WindowContext {
  readonly window: TimelineWindow;
  /** Null when the window has no rate or the clock is outside its samples. */
  readonly rate: number | null;
}

/** Windows that contain the clock (start and end included) with their current rate. */
export function windowContextAt(windows: readonly TimelineWindow[], timeUtcMs: number): readonly WindowContext[] {
  return windows
    .filter((window) => timeUtcMs >= window.startUtcMs && timeUtcMs <= window.endUtcMs)
    .map((window) => ({ window, rate: rateAt(window, timeUtcMs) }));
}

export type WindowPoint = "start" | "peak" | "end";

export interface NavigationStop {
  readonly timeUtcMs: number;
  /** Button text: the event's label, or "<window> opens/peaks/closes". */
  readonly label: string;
  readonly event?: TimelineEvent;
  readonly window?: TimelineWindow;
  readonly point?: WindowPoint;
}

const POINT_VERB: Readonly<Record<WindowPoint, string>> = { start: "opens", peak: "peaks", end: "closes" };

export function windowStops(window: TimelineWindow): readonly NavigationStop[] {
  const points: [WindowPoint, number | undefined][] = [["start", window.startUtcMs], ["peak", window.peakUtcMs], ["end", window.endUtcMs]];
  const stops: NavigationStop[] = [];
  for (const [point, timeUtcMs] of points) {
    if (timeUtcMs === undefined || stops.some((stop) => stop.timeUtcMs === timeUtcMs)) continue;
    stops.push({ timeUtcMs, label: `${window.label} ${POINT_VERB[point]}`, window, point });
  }
  return stops;
}

/**
 * Previous/next stops: events as before, plus each window's start, peak and end. Strictly before/after the
 * clock; where an event and a window point share a time, the event is the stop.
 */
export function navigationStops(events: readonly TimelineEvent[], windows: readonly TimelineWindow[], timeUtcMs: number): { readonly previous: NavigationStop | null; readonly next: NavigationStop | null } {
  const targets = eventNavigationTargets(events, timeUtcMs);
  const asStop = (event: TimelineEvent | null): NavigationStop | null =>
    event === null ? null : { timeUtcMs: event.timeUtcMs, label: event.label, event };
  let previous = asStop(targets.previous);
  let next = asStop(targets.next);
  for (const stop of windows.flatMap(windowStops)) {
    if (stop.timeUtcMs < timeUtcMs && (previous === null || stop.timeUtcMs > previous.timeUtcMs)) previous = stop;
    if (stop.timeUtcMs > timeUtcMs && (next === null || stop.timeUtcMs < next.timeUtcMs)) next = stop;
  }
  return { previous, next };
}
