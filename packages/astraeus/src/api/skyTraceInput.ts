import { SceneError } from "./errors";
import { DEFAULT_TRACE_SECONDS, SKY_TRACE_AFTER, TRACE_FADE_SECONDS, TRACE_SECONDS_LIMITS, type SkyTraceAfter } from "../core/skyTrace";

/** What `handle.traceSkyFigure` takes besides the figure's id. */
export interface SkyTraceOptions {
  /** How long the trace takes, in real seconds, 0.1 to 60 (default 2). The segments are drawn in the order they were added, each growing from its first end, each for an equal share of the time. Real time: pausing or changing the scene clock does not change it. */
  readonly durationSeconds?: number;
  /** What follows: `"stay"` (the default) keeps the traced lines in the look's `skyLines.traced` colour until the figure is traced again or `clearSkyTrace` removes them; `"fade"` eases them to `skyLines.faded` over a second and removes them. */
  readonly after?: "stay" | "fade";
}

/** What `handle.clearSkyTrace` takes besides the figure's id. */
export interface SkyClearOptions {
  /** How long the trace takes to fade away, in real seconds, 0 to 60 (default 1, the time a `fade` takes); 0 removes it at once. */
  readonly durationSeconds?: number;
}

/** A checked clear request: the figure and how long its trace takes to go. */
export interface CheckedClear {
  readonly id: string;
  readonly seconds: number;
}

/** A checked trace request: the figure and what to do with it. */
export interface CheckedTrace {
  readonly id: string;
  readonly seconds: number;
  readonly after: SkyTraceAfter;
}

const bad = (message: string, verb = "traceSkyFigure"): SceneError => new SceneError("bad-sky-trace", `${verb}: ${message}`);

/** Throws `unknown-sky-figure` unless `id` is one of the figures the viewer draws. */
function knownFigure(id: unknown, known: readonly string[], verb: string): asserts id is string {
  if (typeof id !== "string" || !known.includes(id)) {
    throw new SceneError("unknown-sky-figure", `${verb}: ${typeof id === "string" ? `"${id}"` : String(id)} is not a sky figure this viewer draws (${known.length === 0 ? "the scene added none; add them with addSkyFigures" : known.join(", ")})`);
  }
}

/** The options object of a call as a record, or throws `bad-sky-trace` when it is neither an object nor nothing, or has a key outside `allowed`. */
function optionsOf(options: unknown, allowed: readonly string[], verb: string): Record<string, unknown> {
  if (options !== undefined && (typeof options !== "object" || options === null || Array.isArray(options))) throw bad(`expected an options object or nothing, got ${String(options)}`, verb);
  const given = (options ?? {}) as Record<string, unknown>;
  for (const key of Object.keys(given)) if (!allowed.includes(key)) throw bad(`"${key}" is not an option (${allowed.join(", ")})`, verb);
  return given;
}

/** Checks the options of a trace (`traceSkyFigure`'s, or a story panel's `trace`) and fills the defaults; throws `bad-sky-trace`. */
export function traceOptionsOf(options: unknown, verb = "traceSkyFigure"): { readonly seconds: number; readonly after: SkyTraceAfter } {
  const given = optionsOf(options, ["durationSeconds", "after"], verb);
  const seconds = given.durationSeconds ?? DEFAULT_TRACE_SECONDS;
  const { min, max } = TRACE_SECONDS_LIMITS;
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds < min || seconds > max) throw bad(`durationSeconds must be a number from ${min} to ${max}, got ${String(seconds)}`, verb);
  const after = given.after ?? "stay";
  if (!SKY_TRACE_AFTER.includes(after as SkyTraceAfter)) throw bad(`after must be one of ${SKY_TRACE_AFTER.join(", ")}, got ${String(after)}`, verb);
  return { seconds, after: after as SkyTraceAfter };
}

/** Checks a trace request against the figures the viewer draws; throws `unknown-sky-figure` (the id) or `bad-sky-trace` (the options). */
export function checkedTrace(id: unknown, options: unknown, known: readonly string[]): CheckedTrace {
  knownFigure(id, known, "traceSkyFigure");
  return { id, ...traceOptionsOf(options) };
}

/** Checks a clear request as `checkedTrace` checks a trace; `durationSeconds` may be 0 (at once). */
export function checkedClear(id: unknown, options: unknown, known: readonly string[]): CheckedClear {
  knownFigure(id, known, "clearSkyTrace");
  const given = optionsOf(options, ["durationSeconds"], "clearSkyTrace");
  const seconds = given.durationSeconds ?? TRACE_FADE_SECONDS;
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds < 0 || seconds > TRACE_SECONDS_LIMITS.max) throw bad(`durationSeconds must be a number from 0 to ${TRACE_SECONDS_LIMITS.max}, got ${String(seconds)}`, "clearSkyTrace");
  return { id, seconds };
}
