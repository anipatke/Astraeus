import { assertUtcUnixMs } from "./state";
import { createProvenance, type Provenance } from "./provenance";

export interface RateSample {
  readonly timeUtcMs: number;
  readonly value: number;
}

/** Rate samples over a window; values between samples are linear. */
export interface WindowRate {
  readonly unit: string;
  readonly samples: readonly RateSample[];
}

/** The source of a part of a window. Gaps between spans are allowed. */
export interface WindowProvenanceSpan {
  readonly startUtcMs: number;
  readonly endUtcMs: number;
  readonly provenance: Provenance;
}

/** A labelled period that lasts from a start to an end. Independent of any Trajectory. */
export interface TimelineWindow {
  readonly id: string;
  readonly label: string;
  readonly type?: string;
  readonly startUtcMs: number;
  readonly endUtcMs: number;
  readonly peakUtcMs?: number;
  readonly rate?: WindowRate;
  readonly provenance?: readonly WindowProvenanceSpan[];
}

function assertInside(window: TimelineWindow, timeUtcMs: number, what: string): void {
  if (timeUtcMs < window.startUtcMs || timeUtcMs > window.endUtcMs) {
    throw new RangeError(`window "${window.id}" ${what} is outside the window`);
  }
}

function copyRate(window: TimelineWindow, rate: WindowRate): WindowRate {
  if (rate.unit.length === 0) throw new TypeError(`window "${window.id}" rate unit must be non-empty`);
  let previousMs = Number.NEGATIVE_INFINITY;
  const samples = rate.samples.map((sample) => {
    assertUtcUnixMs(sample.timeUtcMs);
    assertInside(window, sample.timeUtcMs, "rate sample");
    if (sample.timeUtcMs <= previousMs) {
      throw new RangeError(`window "${window.id}" rate samples must be sorted with unique times`);
    }
    if (!Number.isFinite(sample.value) || sample.value < 0) {
      throw new RangeError(`window "${window.id}" rate values must be finite and not negative`);
    }
    previousMs = sample.timeUtcMs;
    return Object.freeze({ timeUtcMs: sample.timeUtcMs, value: sample.value });
  });
  return Object.freeze({ unit: rate.unit, samples: Object.freeze(samples) });
}

function copySpans(window: TimelineWindow, spans: readonly WindowProvenanceSpan[]): readonly WindowProvenanceSpan[] {
  let previousEndMs = Number.NEGATIVE_INFINITY;
  const copies = spans.map((span) => {
    assertUtcUnixMs(span.startUtcMs);
    assertUtcUnixMs(span.endUtcMs);
    if (span.endUtcMs <= span.startUtcMs) {
      throw new RangeError(`window "${window.id}" provenance span end must be after its start`);
    }
    assertInside(window, span.startUtcMs, "provenance span");
    assertInside(window, span.endUtcMs, "provenance span");
    if (span.startUtcMs < previousEndMs) {
      throw new RangeError(`window "${window.id}" provenance spans must be sorted and not overlap`);
    }
    previousEndMs = span.endUtcMs;
    return Object.freeze({
      startUtcMs: span.startUtcMs,
      endUtcMs: span.endUtcMs,
      provenance: createProvenance(span.provenance),
    });
  });
  return Object.freeze(copies);
}

/** Validates and returns frozen copies sorted by start (ties allowed), ids unique. */
export function createWindows(input: readonly TimelineWindow[]): readonly TimelineWindow[] {
  const ids = new Set<string>();
  const windows = input.map((window) => {
    assertUtcUnixMs(window.startUtcMs);
    assertUtcUnixMs(window.endUtcMs);
    if (window.id.length === 0) throw new TypeError("window id must be non-empty");
    if (ids.has(window.id)) throw new RangeError(`duplicate window id "${window.id}"`);
    if (window.endUtcMs <= window.startUtcMs) {
      throw new RangeError(`window "${window.id}" end must be after its start`);
    }
    ids.add(window.id);
    if (window.peakUtcMs !== undefined) {
      assertUtcUnixMs(window.peakUtcMs);
      assertInside(window, window.peakUtcMs, "peak");
    }
    return Object.freeze({
      ...window,
      ...(window.rate === undefined ? {} : { rate: copyRate(window, window.rate) }),
      ...(window.provenance === undefined ? {} : { provenance: copySpans(window, window.provenance) }),
    });
  });
  windows.sort((a, b) => a.startUtcMs - b.startUtcMs);
  return Object.freeze(windows);
}

/** Linear rate at a time; null outside the window, outside the samples, or without a rate. */
export function rateAt(window: TimelineWindow, timeUtcMs: number): number | null {
  const samples = window.rate?.samples;
  if (samples === undefined || samples.length === 0) return null;
  if (timeUtcMs < window.startUtcMs || timeUtcMs > window.endUtcMs) return null;
  if (timeUtcMs < samples[0].timeUtcMs || timeUtcMs > samples[samples.length - 1].timeUtcMs) return null;
  let low = 0;
  let high = samples.length - 1;
  while (high - low > 1) {
    const mid = (low + high) >> 1;
    if (samples[mid].timeUtcMs <= timeUtcMs) low = mid;
    else high = mid;
  }
  const a = samples[low];
  const b = samples[high];
  if (timeUtcMs === a.timeUtcMs) return a.value;
  if (timeUtcMs === b.timeUtcMs) return b.value;
  return a.value + ((b.value - a.value) * (timeUtcMs - a.timeUtcMs)) / (b.timeUtcMs - a.timeUtcMs);
}

/** The provenance span covering a time (a shared boundary belongs to the later span); null if none. */
export function provenanceAt(window: TimelineWindow, timeUtcMs: number): Provenance | null {
  const spans = window.provenance;
  if (spans === undefined) return null;
  for (let i = spans.length - 1; i >= 0; i -= 1) {
    if (timeUtcMs >= spans[i].startUtcMs && timeUtcMs < spans[i].endUtcMs) return spans[i].provenance;
  }
  const last = spans[spans.length - 1];
  return last !== undefined && timeUtcMs === last.endUtcMs ? last.provenance : null;
}
