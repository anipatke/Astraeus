/**
 * UTC Unix milliseconds to TDB seconds from J2000 (2000-01-01 12:00 TDB), the smooth time a fitted ephemeris is a function of.
 * TT - UTC comes from a data table (leap seconds as steps; before 1972, sampled values joined by straight lines), and TDB - TT
 * from the leading terms of the Fairhead and Bretagnon (1990) series as transcribed in the IAU SOFA routine `dtdb`.
 * Dependency-free on purpose: the browser speed probe loads it on its own.
 */

/** One piece of TT - UTC: from `fromUtcMs` on, `ttMinusUtcS + driftSPerDay * days since fromUtcMs`, until the next piece starts. */
export interface TtMinusUtcPiece {
  readonly fromUtcMs: number;
  readonly ttMinusUtcS: number;
  readonly driftSPerDay: number;
}

export interface TimeScaleTable {
  /** Sorted by `fromUtcMs`; the table is valid from the first piece's start to `validToUtcMs`. */
  readonly pieces: readonly TtMinusUtcPiece[];
  readonly validToUtcMs: number;
}

export class TimeScaleOutOfRangeError extends RangeError {
  constructor(timeUtcMs: number, fromUtcMs: number, toUtcMs: number) {
    super(`time ${timeUtcMs} is outside the TT - UTC table [${fromUtcMs}, ${toUtcMs}]`);
    this.name = "TimeScaleOutOfRangeError";
  }
}

/** 2000-01-01T12:00:00Z as Unix milliseconds; J2000 TDB is this instant less TT - UTC then (64.184 s) and TDB - TT. */
const J2000_NOON_UNIX_MS = 946_728_000_000;
const DAY_MS = 86_400_000;
const JULIAN_MILLENNIUM_S = 365_250 * 86_400;

/** [amplitude in microseconds, frequency in radians per Julian millennium, phase in radians]: SOFA dtdb, the largest terms. */
const TDB_TT_TERMS: readonly (readonly [number, number, number])[] = [
  [1656.674564, 6283.075849991, 6.240054195],
  [22.417471, 5753.384884897, 4.296977442],
  [13.839792, 12566.151699983, 6.196904410],
  [4.770086, 529.690965095, 0.444401603],
  [4.676740, 6069.776754553, 4.021195093],
  [2.256707, 213.299095438, 5.543113262],
  [1.694205, -3.523118349, 5.025132748],
  [1.554905, 77713.771467920, 5.198467090],
  [1.276839, 7860.419392439, 5.988822341],
  [1.193379, 5223.693919802, 3.649823730],
  [1.115322, 3930.209696220, 1.422745069],
  [0.794185, 11506.769769794, 2.322313077],
];
/** The leading T^1 term of the same series: amplitude (microseconds per millennium), frequency, phase. */
const TDB_TT_T1: readonly [number, number, number] = [102.156724, 6283.075849991, 4.249032005];

/** TDB - TT in seconds at `ttSecondsFromJ2000` (TT and TDB differ by under 2 ms, far below this series' sensitivity to its argument). */
export function tdbMinusTtSeconds(ttSecondsFromJ2000: number): number {
  const t = ttSecondsFromJ2000 / JULIAN_MILLENNIUM_S;
  let micro = 0;
  for (const [amplitude, frequency, phase] of TDB_TT_TERMS) micro += amplitude * Math.sin(frequency * t + phase);
  micro += t * TDB_TT_T1[0] * Math.sin(TDB_TT_T1[1] * t + TDB_TT_T1[2]);
  return micro * 1e-6;
}

/** Checks the table's shape once, at the data boundary. */
export function assertTimeScaleTable(table: TimeScaleTable): void {
  if (!Array.isArray(table.pieces) || table.pieces.length === 0) throw new TypeError("time scale table needs at least one piece");
  table.pieces.forEach((piece, index) => {
    if (![piece.fromUtcMs, piece.ttMinusUtcS, piece.driftSPerDay].every(Number.isFinite)) {
      throw new TypeError(`time scale piece ${index} must hold finite numbers`);
    }
    if (index > 0 && piece.fromUtcMs <= table.pieces[index - 1].fromUtcMs) {
      throw new RangeError("time scale pieces must be sorted by fromUtcMs");
    }
  });
  if (!Number.isFinite(table.validToUtcMs) || table.validToUtcMs <= table.pieces[0].fromUtcMs) {
    throw new RangeError("time scale validToUtcMs must follow the first piece");
  }
}

/** TT - UTC in seconds at a UTC instant, from the table. */
export function ttMinusUtcSeconds(table: TimeScaleTable, timeUtcMs: number): number {
  const { pieces } = table;
  if (timeUtcMs < pieces[0].fromUtcMs || timeUtcMs > table.validToUtcMs) {
    throw new TimeScaleOutOfRangeError(timeUtcMs, pieces[0].fromUtcMs, table.validToUtcMs);
  }
  let low = 0;
  let high = pieces.length - 1;
  while (low < high) {
    const middle = (low + high + 1) >>> 1;
    if (pieces[middle].fromUtcMs <= timeUtcMs) low = middle;
    else high = middle - 1;
  }
  const piece = pieces[low];
  return piece.ttMinusUtcS + piece.driftSPerDay * ((timeUtcMs - piece.fromUtcMs) / DAY_MS);
}

/** TDB seconds from J2000 at a UTC instant. */
export function utcMsToTdbSeconds(table: TimeScaleTable, timeUtcMs: number): number {
  const tt = (timeUtcMs - J2000_NOON_UNIX_MS) / 1000 + ttMinusUtcSeconds(table, timeUtcMs);
  return tt + tdbMinusTtSeconds(tt);
}
