import type { TimelineEvent } from "../core/events";
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
