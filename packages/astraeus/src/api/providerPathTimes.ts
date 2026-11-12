/** The moments a provider path's line is drawn at: 128 even ones plus extra ones where the line bends or the body moves fast, as seen from the path's centre (O-070). */

/** Even moments every path starts from. */
export const PROVIDER_SEED_SAMPLES = 128;
/** Most moments a provider path is drawn at. */
export const PROVIDER_MAX_SAMPLES = 4096;
/** An interval is split while the body sweeps more than this angle about the centre between its ends. */
const MAX_SWEEP_RAD = (3 * Math.PI) / 180;
/** An interval is split while its true midpoint lies farther than this fraction of its distance from the centre from the chord's midpoint (the body speeding up or slowing down shows here too). */
const MAX_CHORD_ERROR = 0.0025;

type Vec = readonly [number, number, number];

interface Interval {
  readonly a: number;
  readonly b: number;
  readonly pa: Vec;
  readonly pb: Vec;
  readonly mid: number;
  readonly pm: Vec;
  /** How far past the limits the interval is; above 1 means it is split. */
  readonly score: number;
}

/** The position as three finite numbers, or null when the provider gave something else. */
const read = (positionAt: (timeUtcMs: number) => ArrayLike<number>, timeUtcMs: number): Vec | null => {
  const p = positionAt(timeUtcMs) as ArrayLike<number> | undefined;
  return p?.length === 3 && Number.isFinite(p[0]) && Number.isFinite(p[1]) && Number.isFinite(p[2]) ? [p[0]!, p[1]!, p[2]!] : null;
};

/** The interval's score. */
function scored(a: number, b: number, pa: Vec, pb: Vec, positionAt: (timeUtcMs: number) => ArrayLike<number>): Interval {
  const mid = Math.floor((a + b) / 2);
  const pm = read(positionAt, mid);
  if (pm === null) return { a, b, pa, pb, mid, pm: pa, score: 0 };
  const w = (mid - a) / (b - a);
  const na = Math.hypot(...pa);
  const nb = Math.hypot(...pb);
  const dot = pa[0] * pb[0] + pa[1] * pb[1] + pa[2] * pb[2];
  const sweep = Math.acos(Math.max(-1, Math.min(1, dot / (na * nb))));
  const chord = Math.hypot(pm[0] - (pa[0] + w * (pb[0] - pa[0])), pm[1] - (pa[1] + w * (pb[1] - pa[1])), pm[2] - (pa[2] + w * (pb[2] - pa[2])));
  const reach = Math.max(Math.hypot(...pm), Math.min(na, nb));
  const score = Math.max(sweep / MAX_SWEEP_RAD, chord / (MAX_CHORD_ERROR * reach));
  return { a, b, pa, pb, mid, pm, score: Number.isFinite(score) ? score : 0 };
}

/** Max-heap on score; ties go to the earlier interval, so the result is the same every time. */
class Worst {
  readonly #items: Interval[] = [];
  get size(): number {
    return this.#items.length;
  }
  #before(i: number, j: number): boolean {
    const x = this.#items[i]!;
    const y = this.#items[j]!;
    return x.score > y.score || (x.score === y.score && x.a < y.a);
  }
  #swap(i: number, j: number): void {
    [this.#items[i], this.#items[j]] = [this.#items[j]!, this.#items[i]!];
  }
  push(item: Interval): void {
    this.#items.push(item);
    for (let i = this.#items.length - 1; i > 0; ) {
      const parent = (i - 1) >> 1;
      if (!this.#before(i, parent)) break;
      this.#swap(i, parent);
      i = parent;
    }
  }
  pop(): Interval {
    const top = this.#items[0]!;
    const last = this.#items.pop()!;
    if (this.#items.length > 0) {
      this.#items[0] = last;
      for (let i = 0; ; ) {
        let best = i;
        for (const child of [2 * i + 1, 2 * i + 2]) if (child < this.#items.length && this.#before(child, best)) best = child;
        if (best === i) break;
        this.#swap(i, best);
        i = best;
      }
    }
    return top;
  }
}

/**
 * Strictly increasing whole-millisecond moments from `startUtcMs` to `endUtcMs`: the 128 even ones (the first and last are the bounds), then midpoints of the intervals that bend
 * or speed up most, until none is over the limits or there are 4,096. `positionAt` gives the body's position about the path's centre; if it throws or gives no position, the even moments stand alone.
 */
export function providerPathTimes(startUtcMs: number, endUtcMs: number, positionAt: (timeUtcMs: number) => ArrayLike<number>): number[] {
  const step = (endUtcMs - startUtcMs) / (PROVIDER_SEED_SAMPLES - 1);
  const seeds = [...new Set(Array.from({ length: PROVIDER_SEED_SAMPLES }, (_, index) => Math.round(startUtcMs + index * step)))];
  try {
    return refined(seeds, positionAt);
  } catch {
    return seeds; // a provider that cannot answer yet (its data is not loaded) keeps the even moments
  }
}

function refined(seeds: readonly number[], positionAt: (timeUtcMs: number) => ArrayLike<number>): number[] {
  const found = seeds.map((t) => read(positionAt, t));
  const positions = found.filter((p): p is Vec => p !== null);
  if (positions.length < seeds.length) return [...seeds]; // a position the provider does not give: the fault is named when the line is drawn
  const heap = new Worst();
  for (let i = 1; i < seeds.length; i += 1) if (seeds[i]! - seeds[i - 1]! >= 2) heap.push(scored(seeds[i - 1]!, seeds[i]!, positions[i - 1]!, positions[i]!, positionAt));
  const times = new Set(seeds);
  while (heap.size > 0 && times.size < PROVIDER_MAX_SAMPLES) {
    const worst = heap.pop();
    if (worst.score <= 1) break;
    times.add(worst.mid);
    for (const [a, b, pa, pb] of [[worst.a, worst.mid, worst.pa, worst.pm], [worst.mid, worst.b, worst.pm, worst.pb]] as const) {
      if (b - a >= 2) heap.push(scored(a, b, pa, pb, positionAt));
    }
  }
  return [...times].sort((x, y) => x - y);
}
