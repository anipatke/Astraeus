import { assertUtcUnixMs } from "./state";

/** A labelled moment on a timeline. Independent of any Trajectory. */
export interface TimelineEvent {
  readonly timeUtcMs: number;
  readonly id: string;
  readonly label: string;
  readonly type?: string;
}

/** Validates and returns a frozen copy: times sorted ascending (ties allowed), ids unique. */
export function createEvents(input: readonly TimelineEvent[]): readonly TimelineEvent[] {
  const ids = new Set<string>();
  let previousMs = Number.NEGATIVE_INFINITY;
  for (const event of input) {
    assertUtcUnixMs(event.timeUtcMs);
    if (event.id.length === 0) throw new TypeError("event id must be non-empty");
    if (ids.has(event.id)) throw new RangeError(`duplicate event id "${event.id}"`);
    if (event.timeUtcMs < previousMs) throw new RangeError("events must be sorted by time");
    ids.add(event.id);
    previousMs = event.timeUtcMs;
  }
  return Object.freeze(input.map((event) => Object.freeze({ ...event })));
}
