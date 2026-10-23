import config from "./config.json";

export type Constants = typeof config.constants;
export type Numerics = typeof config.numerics;
export const CONSTANTS: Constants = config.constants;
export const NUMERICS: Numerics = config.numerics;

/** "H:MM:SS.s" ground elapsed time to integer UTC Unix milliseconds (docs/APOLLO11_SOURCES.md 4.1). */
export function getToUtcMs(printed: string, rangeZeroUtcMs: number = CONSTANTS.rangeZeroUtcMs): number {
  const match = /^(\d+):(\d{2}):(\d{2})(?:\.(\d+))?$/.exec(printed.trim());
  if (match === null) throw new RangeError(`unrecognised GET "${printed}"`);
  const whole = (Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3])) * 1000;
  const fraction = match[4] === undefined ? 0 : Math.round(Number(`0.${match[4]}`) * 1000);
  return rangeZeroUtcMs + whole + fraction;
}

/** Decimal places printed in a value, which sets its rounding half-unit. */
export function printedDecimals(printed: string): number {
  const digits = /\.(\d+)/.exec(printed);
  return digits === null ? 0 : digits[1].length;
}

/** Table values print thousands with a space ("4 110.0"). */
export function parsePrintedNumber(printed: string): number {
  const value = Number(printed.replace(/\s+/g, ""));
  if (!Number.isFinite(value)) throw new RangeError(`unrecognised number "${printed}"`);
  return value;
}

function parseHemisphere(printed: string, positive: string, negative: string): number {
  const match = /^(\d+(?:\.\d+)?)([A-Z])$/.exec(printed.trim());
  if (match === null || (match[2] !== positive && match[2] !== negative)) {
    throw new RangeError(`unrecognised coordinate "${printed}"`);
  }
  return match[2] === positive ? Number(match[1]) : -Number(match[1]);
}

export const parseLatitudeDeg = (printed: string): number => parseHemisphere(printed, "N", "S");
export const parseLongitudeDeg = (printed: string): number => parseHemisphere(printed, "E", "W");
