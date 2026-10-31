import { createProvenance } from "../core/provenance";
import type { WindowProvenanceSpan } from "../core/timeWindow";
import { SceneError } from "./errors";
import type { ActivitySourceInput } from "./activity";
import { toUtcMs, type TimeInput } from "./time";
import type { LineStretch } from "../app/mission";

interface Bounds { readonly startUtcMs: number; readonly endUtcMs: number }

/**
 * The shared plan for a path's time-span lists (`provenanceSpans`, `lineFixedTo`): each span's `start` and `end` are read to milliseconds, `read` builds the item from the span,
 * and the list must be sorted, not overlap and lie inside `bounds`. Any fault is a `bad-trajectory` naming the path, the field and the index.
 */
function planSpans<S extends { readonly start: unknown; readonly end: unknown }, T>(id: string, field: string, spans: readonly S[], bounds: Bounds, read: (span: S) => T): readonly (T & Bounds)[] {
  const bad = (index: number, message: string): SceneError => new SceneError("bad-trajectory", `addTrajectory("${id}"): ${field}[${index}] ${message}`);
  if (!Array.isArray(spans)) throw new SceneError("bad-trajectory", `addTrajectory("${id}"): ${field} must be a list`);
  let previousEnd = -Infinity;
  return spans.map((span, index) => {
    let startUtcMs: number;
    let endUtcMs: number;
    let item: T;
    try {
      startUtcMs = toUtcMs(span?.start, `addTrajectory("${id}") ${field}[${index}] start`);
      endUtcMs = toUtcMs(span?.end, `addTrajectory("${id}") ${field}[${index}] end`);
      item = read(span);
    } catch (error) {
      throw bad(index, error instanceof Error ? error.message : String(error));
    }
    if (endUtcMs <= startUtcMs) throw bad(index, "must end after it starts");
    if (startUtcMs < bounds.startUtcMs || endUtcMs > bounds.endUtcMs) throw bad(index, "lies outside the path");
    if (startUtcMs < previousEnd) throw bad(index, "overlaps or is out of order; spans must be sorted and not overlap");
    previousEnd = endUtcMs;
    return { ...item, startUtcMs, endUtcMs };
  });
}

/** Checks a path's provenance by time span (the same `{ start, end, provenance }` shape as an activity's) and returns it in milliseconds. */
export function planPathProvenance(id: string, spans: readonly ActivitySourceInput[], boundsUtcMs: Bounds): readonly WindowProvenanceSpan[] {
  return planSpans(id, "provenanceSpans", spans, boundsUtcMs, (span) => ({ provenance: createProvenance(span?.provenance) }));
}

/** One stretch of a path's line and the body it is drawn against, as the caller gives it. */
export interface LineStretchInput {
  readonly start: TimeInput;
  readonly end: TimeInput;
  readonly body: string;
}

/** Checks a path's `lineFixedTo` list (same span rules as `provenanceSpans`) and returns it in milliseconds. */
export function planLineStretches(id: string, stretches: readonly LineStretchInput[], boundsUtcMs: Bounds): readonly LineStretch[] {
  return planSpans(id, "lineFixedTo", stretches, boundsUtcMs, (stretch) => {
    if (typeof stretch.body !== "string" || stretch.body === "") throw new Error("body must be a body id");
    return { body: stretch.body };
  });
}
