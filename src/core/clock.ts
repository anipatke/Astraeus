import { assertUtcUnixMs } from "./state";

export type MonotonicTimeSource = () => number;
const MAX_DATE_MS = 8.64e15;

export interface ClockSnapshot {
  readonly timeUtcMs: number;
  readonly playing: boolean;
  readonly rate: number;
}

export class SimulationClock {
  #anchorUtcMs: number;
  #anchorMonotonicMs: number;
  #rate = 1;
  #playing = false;
  #lastMonotonicMs = Number.NEGATIVE_INFINITY;

  constructor(
    initialUtcMs: number,
    private readonly monotonicNow: MonotonicTimeSource = () => performance.now(),
  ) {
    assertUtcUnixMs(initialUtcMs);
    this.#anchorUtcMs = initialUtcMs;
    this.#anchorMonotonicMs = this.#readMonotonic();
    this.#lastMonotonicMs = this.#anchorMonotonicMs;
  }

  get playing(): boolean {
    return this.#playing;
  }

  get rate(): number {
    return this.#rate;
  }

  now(): number {
    if (!this.#playing) return this.#anchorUtcMs;
    const monotonicMs = this.#readMonotonic();
    const elapsedTimeUtcMs = this.#anchorUtcMs + (monotonicMs - this.#anchorMonotonicMs) * this.#rate;
    if (!Number.isFinite(elapsedTimeUtcMs) || Math.abs(elapsedTimeUtcMs) > MAX_DATE_MS) {
      throw new RangeError("clock advanced outside the JavaScript UTC Unix-millisecond range");
    }
    // Astronomical inputs follow JavaScript Date's integer-millisecond resolution.
    const timeUtcMs = Math.trunc(elapsedTimeUtcMs);
    assertUtcUnixMs(timeUtcMs);
    return timeUtcMs;
  }

  snapshot(): ClockSnapshot {
    return Object.freeze({ timeUtcMs: this.now(), playing: this.#playing, rate: this.#rate });
  }

  play(): void {
    if (this.#playing) return;
    this.#anchorMonotonicMs = this.#readMonotonic();
    this.#playing = true;
  }

  pause(): void {
    if (!this.#playing) return;
    this.#anchorUtcMs = this.now();
    this.#playing = false;
  }

  seek(timeUtcMs: number): void {
    assertUtcUnixMs(timeUtcMs);
    this.#anchorUtcMs = timeUtcMs;
    this.#anchorMonotonicMs = this.#readMonotonic();
  }

  setRate(rate: number): void {
    if (!Number.isFinite(rate) || rate === 0) {
      throw new RangeError("playback rate must be a finite, non-zero number");
    }
    const monotonicMs = this.#readMonotonic();
    if (this.#playing) {
      const advancedUtcMs = this.#anchorUtcMs + (monotonicMs - this.#anchorMonotonicMs) * this.#rate;
      if (!Number.isFinite(advancedUtcMs) || Math.abs(advancedUtcMs) > MAX_DATE_MS) {
        throw new RangeError("clock advanced outside the JavaScript UTC Unix-millisecond range");
      }
      this.#anchorUtcMs = advancedUtcMs;
      this.#anchorMonotonicMs = monotonicMs;
    }
    this.#rate = rate;
  }

  #readMonotonic(): number {
    const value = this.monotonicNow();
    if (!Number.isFinite(value)) throw new TypeError("monotonic time source must return a finite number");
    if (value < this.#lastMonotonicMs) throw new RangeError("monotonic time source moved backwards");
    this.#lastMonotonicMs = value;
    return value;
  }
}
