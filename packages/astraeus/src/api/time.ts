import { SceneError } from "./errors";
import { isUtcUnixMs } from "../core/state";
import { isZonelessDateTime, timeInputMs, type TimeInput } from "../core/timeInput";

/** A moment: a Date, Unix milliseconds, or ISO text, which is `YYYY-MM-DD` (midnight UTC) or `YYYY-MM-DDTHH:MM[:SS[.fraction]]` followed by `Z` or a `±HH:MM` offset. Date-time text without a zone is refused (`bad-time`), never read in the visitor's local zone. */
export type { TimeInput };

/** Converts a moment to Unix milliseconds, or throws a `bad-time` SceneError naming it: not a moment, not a whole number of milliseconds (a fractional time is refused, never floored; I-177) or outside the Date range. */
export function toUtcMs(time: TimeInput, what = "time"): number {
  const ms = timeInputMs(time);
  if (typeof time === "string" && isZonelessDateTime(time)) throw new SceneError("bad-time", `${what} "${time}" does not say its time zone, so it would mean a different instant for each visitor; add Z for UTC or an offset such as +10:00, e.g. "${time}Z"`);
  if (!Number.isFinite(ms)) throw new SceneError("bad-time", `${what} "${String(time)}" is not a valid moment; use an ISO text such as "1969-07-20T20:17:40Z", a Date or Unix milliseconds`);
  if (!isUtcUnixMs(ms)) throw new SceneError("bad-time", `${what} ${String(time)} must be a whole number of Unix milliseconds inside the Date range (a fractional or out-of-range time is refused, never rounded)`);
  return ms;
}
