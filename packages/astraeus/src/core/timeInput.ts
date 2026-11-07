/** A moment: ISO text, a Date, or Unix milliseconds. Declared here so `core/` records can take one; the public `TimeInput` is this type. */
export type TimeInput = string | number | Date;

/** The moment as Unix milliseconds, or NaN when it is not one. The one conversion every moment input goes through; each caller reports a bad moment in its own words. */
export function timeInputMs(time: TimeInput): number {
  return time instanceof Date ? time.getTime() : typeof time === "number" ? time : Date.parse(time);
}
