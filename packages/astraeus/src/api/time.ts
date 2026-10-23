import { SceneError } from "./errors";

/** A moment: ISO text, a Date, or Unix milliseconds. */
export type TimeInput = string | number | Date;

/** Converts a moment to Unix milliseconds, or throws a `bad-time` SceneError naming it. */
export function toUtcMs(time: TimeInput, what = "time"): number {
  const ms = time instanceof Date ? time.getTime() : typeof time === "number" ? time : Date.parse(time);
  if (!Number.isFinite(ms)) throw new SceneError("bad-time", `${what} "${String(time)}" is not a valid moment; use an ISO text such as "1969-07-20T20:17:40Z", a Date or Unix milliseconds`);
  return ms;
}
