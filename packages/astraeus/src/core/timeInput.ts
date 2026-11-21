/**
 * A moment: a Date, Unix milliseconds, or ISO text that means one instant for every reader. Text is `YYYY-MM-DD` (midnight UTC) or `YYYY-MM-DDTHH:MM[:SS[.fraction]]` followed by `Z` or a `±HH:MM` offset; date-time text without a zone, and any other form ("Aug 12 2026"), is refused rather than read in the reader's local zone. Declared here so `core/` records can take one; the public `TimeInput` is this type.
 */
export type TimeInput = string | number | Date;

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const ZONED_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;
const ZONELESS_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;

/** True for date-time text with no `Z` or offset: it would mean a different instant in each reader's zone. */
export function isZonelessDateTime(text: string): boolean {
  return ZONELESS_DATE_TIME.test(text);
}

/** The moment as Unix milliseconds, or NaN when it is not one (text outside the forms `TimeInput` lists is NaN). The one conversion every moment input goes through; each caller reports a bad moment in its own words. */
export function timeInputMs(time: TimeInput): number {
  if (time instanceof Date) return time.getTime();
  if (typeof time === "number") return time;
  return DATE_ONLY.test(time) || ZONED_DATE_TIME.test(time) ? Date.parse(time) : Number.NaN;
}
