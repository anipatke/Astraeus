import { SceneError } from "./errors";
import { isUtcUnixMs } from "../core/state";
import { timeInputMs, type TimeInput } from "../core/timeInput";

/** A moment: ISO text, a Date, or Unix milliseconds. */
export type { TimeInput };

/** Converts a moment to Unix milliseconds, or throws a `bad-time` SceneError naming it: not a moment, not a whole number of milliseconds (a fractional time is refused, never floored; I-177) or outside the Date range. */
export function toUtcMs(time: TimeInput, what = "time"): number {
  const ms = timeInputMs(time);
  if (!Number.isFinite(ms)) throw new SceneError("bad-time", `${what} "${String(time)}" is not a valid moment; use an ISO text such as "1969-07-20T20:17:40Z", a Date or Unix milliseconds`);
  if (!isUtcUnixMs(ms)) throw new SceneError("bad-time", `${what} ${String(time)} must be a whole number of Unix milliseconds inside the Date range (a fractional or out-of-range time is refused, never rounded)`);
  return ms;
}
