import { createProvenance } from "../core/provenance";
import type { WindowProvenanceSpan } from "../core/timeWindow";
import { SceneError } from "./errors";
import type { ActivitySourceInput } from "./activity";
import { toUtcMs } from "./time";

/**
 * Checks a path's provenance by time span (the same `{ start, end, provenance }` shape as an activity's) and returns it in milliseconds.
 * Spans are sorted, do not overlap and lie inside the path's bounds; any fault is a `bad-trajectory` naming the path and the span's index.
 */
export function planPathProvenance(id: string, spans: readonly ActivitySourceInput[], boundsUtcMs: { readonly startUtcMs: number; readonly endUtcMs: number }): readonly WindowProvenanceSpan[] {
  const bad = (index: number, message: string): SceneError => new SceneError("bad-trajectory", `addTrajectory("${id}"): provenanceSpans[${index}] ${message}`);
  if (!Array.isArray(spans)) throw new SceneError("bad-trajectory", `addTrajectory("${id}"): provenanceSpans must be a list`);
  let previousEnd = -Infinity;
  return spans.map((span, index) => {
    let startUtcMs: number;
    let endUtcMs: number;
    let provenance;
    try {
      startUtcMs = toUtcMs(span?.start, `addTrajectory("${id}") provenanceSpans[${index}] start`);
      endUtcMs = toUtcMs(span?.end, `addTrajectory("${id}") provenanceSpans[${index}] end`);
      provenance = createProvenance(span?.provenance);
    } catch (error) {
      throw bad(index, error instanceof Error ? error.message : String(error));
    }
    if (endUtcMs <= startUtcMs) throw bad(index, "must end after it starts");
    if (startUtcMs < boundsUtcMs.startUtcMs || endUtcMs > boundsUtcMs.endUtcMs) throw bad(index, "lies outside the path");
    if (startUtcMs < previousEnd) throw bad(index, "overlaps or is out of order; spans must be sorted and not overlap");
    previousEnd = endUtcMs;
    return { startUtcMs, endUtcMs, provenance };
  });
}
