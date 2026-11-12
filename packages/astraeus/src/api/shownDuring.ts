import type { ShownSpan } from "../shell/experience";
import { SceneError } from "./errors";
import { toUtcMs, type TimeInput } from "./time";

/** Shown while `start <= t < end`; an absent end is unbounded, give at least one. Outside it nothing is drawn or pickable; `stateOf` is unchanged. */
export interface ShownDuringInput {
  readonly start?: TimeInput;
  readonly end?: TimeInput;
}

/**
 * Checks a `shownDuring` input (API-04) and returns it in milliseconds (undefined when none is given). `call` is the public call's name, `code` its own error code
 * (`bad-body` for `addBody` and `addBodyFromElements`, `bad-trajectory` for `addTrajectory`). Not an object, no end, a bad moment or an end not after the start throws.
 */
export function planShownDuring(call: string, id: string, code: "bad-body" | "bad-trajectory", input: ShownDuringInput | undefined): ShownSpan | undefined {
  if (input === undefined) return undefined;
  const bad = (message: string) => new SceneError(code, `${call}("${id}"): shownDuring ${message}`);
  if (typeof input !== "object" || input === null || Array.isArray(input)) throw bad("must be an object { start?, end? }");
  if (input.start === undefined && input.end === undefined) throw bad("needs a start, an end or both");
  const moment = (field: "start" | "end", time: TimeInput | undefined): number | undefined => {
    if (time === undefined) return undefined;
    try {
      return toUtcMs(time, `${call}("${id}") shownDuring.${field}`);
    } catch (error) {
      throw bad(`${field}: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  const startUtcMs = moment("start", input.start);
  const endUtcMs = moment("end", input.end);
  if (startUtcMs !== undefined && endUtcMs !== undefined && endUtcMs <= startUtcMs) throw bad("must end after it starts");
  return { ...(startUtcMs === undefined ? {} : { startUtcMs }), ...(endUtcMs === undefined ? {} : { endUtcMs }) };
}
