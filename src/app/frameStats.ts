/** Frames longer than this (about two 60 fps frames) count as over budget. */
export const FRAME_BUDGET_MS = 33.4;
/** A gap this long is a paused tab or a stall, not a frame: the window restarts instead. */
export const PAUSE_GAP_MS = 1000;
/** Frames per second are read over this much recent time. */
const FPS_SPAN_MS = 1000;
const DEFAULT_WINDOW = 120;

export interface FrameSnapshot {
  readonly frames: number;
  /** Frames per second over the last second of frames, or 0 with fewer than two frames. */
  readonly fps: number;
  readonly longestMs: number;
  readonly overBudget: number;
}

/**
 * Presentation-only frame timing. A fixed ring of frame durations, no allocation per frame,
 * knows nothing about what is drawn. Fed one timestamp per frame with `tick`.
 */
export class FrameStats {
  readonly #durations: Float64Array;
  #next = 0;
  #count = 0;
  #lastMs = Number.NaN;

  constructor(windowSize = DEFAULT_WINDOW) {
    this.#durations = new Float64Array(windowSize);
  }

  /** Records the frame that ended at `nowMs`. The first call, and a call after a pause, only set the reference time. */
  tick(nowMs: number): void {
    const gap = nowMs - this.#lastMs;
    this.#lastMs = nowMs;
    if (Number.isNaN(gap)) return;
    if (gap > PAUSE_GAP_MS || gap < 0) {
      this.#count = 0;
      this.#next = 0;
      return;
    }
    this.#durations[this.#next] = gap;
    this.#next = (this.#next + 1) % this.#durations.length;
    if (this.#count < this.#durations.length) this.#count += 1;
  }

  reset(): void {
    this.#count = 0;
    this.#next = 0;
    this.#lastMs = Number.NaN;
  }

  snapshot(): FrameSnapshot {
    const size = this.#durations.length;
    let longestMs = 0;
    let overBudget = 0;
    let spanMs = 0;
    let spanFrames = 0;
    for (let i = 0; i < this.#count; i += 1) {
      const duration = this.#durations[(this.#next - 1 - i + size * 2) % size];
      if (duration > longestMs) longestMs = duration;
      if (duration > FRAME_BUDGET_MS) overBudget += 1;
      if (spanMs < FPS_SPAN_MS) {
        spanMs += duration;
        spanFrames += 1;
      }
    }
    return { frames: this.#count, fps: spanMs > 0 ? (spanFrames * 1000) / spanMs : 0, longestMs, overBudget };
  }
}

export type Tone = "good" | "warn" | "bad";

/** Colour band for a frames-per-second reading: smooth from 50, rough below 30. */
export function fpsTone(fps: number): Tone {
  return fps >= 50 ? "good" : fps >= 30 ? "warn" : "bad";
}

/** Colour band for one frame's duration against the 33.4 ms budget. */
export function frameTone(ms: number): Tone {
  return ms <= 20 ? "good" : ms <= FRAME_BUDGET_MS ? "warn" : "bad";
}
