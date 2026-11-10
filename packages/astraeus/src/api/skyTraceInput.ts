import { SceneError } from "./errors";
import { DEFAULT_TRACE_SECONDS, SKY_TRACE_AFTER, TRACE_SECONDS_LIMITS, type SkyTraceAfter } from "../core/skyTrace";

/** What `handle.traceSkyFigure` takes besides the figure's id. */
export interface SkyTraceOptions {
  /** How long the trace takes, in real seconds, 0.1 to 60 (default 2). The segments are drawn in the order they were added, each growing from its first end, each for an equal share of the time. Real time: pausing or changing the scene clock does not change it. */
  readonly durationSeconds?: number;
  /** What follows: `"stay"` (the default) keeps the traced lines in the look's `skyLines.traced` colour until the figure is traced again; `"fade"` eases them to `skyLines.faded` over a second and removes them; `"clear"` removes them at once. */
  readonly after?: "stay" | "fade" | "clear";
}

/** A checked trace request: the figure and what to do with it. */
export interface CheckedTrace {
  readonly id: string;
  readonly seconds: number;
  readonly after: SkyTraceAfter;
}

const bad = (message: string): SceneError => new SceneError("bad-sky-trace", `traceSkyFigure: ${message}`);

/** Checks a trace request against the figures the viewer draws; throws `unknown-sky-figure` (the id) or `bad-sky-trace` (the options). */
export function checkedTrace(id: unknown, options: unknown, known: readonly string[]): CheckedTrace {
  if (typeof id !== "string" || !known.includes(id)) {
    throw new SceneError("unknown-sky-figure", `traceSkyFigure: ${typeof id === "string" ? `"${id}"` : String(id)} is not a sky figure this viewer draws (${known.length === 0 ? "the scene added none; add them with addSkyFigures" : known.join(", ")})`);
  }
  if (options !== undefined && (typeof options !== "object" || options === null || Array.isArray(options))) throw bad(`expected an options object or nothing, got ${String(options)}`);
  const given = (options ?? {}) as Record<string, unknown>;
  for (const key of Object.keys(given)) if (key !== "durationSeconds" && key !== "after") throw bad(`"${key}" is not an option (durationSeconds, after)`);
  const seconds = given.durationSeconds ?? DEFAULT_TRACE_SECONDS;
  const { min, max } = TRACE_SECONDS_LIMITS;
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds < min || seconds > max) throw bad(`durationSeconds must be a number from ${min} to ${max}, got ${String(seconds)}`);
  const after = given.after ?? "stay";
  if (!SKY_TRACE_AFTER.includes(after as SkyTraceAfter)) throw bad(`after must be one of ${SKY_TRACE_AFTER.join(", ")}, got ${String(after)}`);
  return { id, seconds, after: after as SkyTraceAfter };
}
