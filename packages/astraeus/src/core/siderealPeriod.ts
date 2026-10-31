// A mean-element record's sidereal period, kept apart from the propagator so a body definition can read it without loading the two-body code.
const DAYS_PER_YEAR = 365.25;

/** The fields of a `data/orbits/*.json` record the period reads. */
export interface PeriodRecord {
  readonly id: string;
  readonly elements: { readonly periodDays: number; readonly apsisPeriodYears: number | null };
  readonly rotation?: { readonly primeMeridianDeg: { readonly perDay: number } };
}

/**
 * How the table's period P becomes the rate of the mean longitude of a fixed ellipse.
 * `table`: P is already the sidereal period (the Saturn and Neptune rows; Mimas 0.942422 d is the known sidereal period).
 * `apsis-corrected`: P is the period of M alone and the periapsis also moves once round per `apsisPeriodYears`; the mean longitude
 * then turns once per 1 / (1/P - 1/Papsis), the rule Io's definition uses (the Jovian rows).
 */
export type PeriodRule = "table" | "apsis-corrected" | "iau-rate";

export function siderealPeriodDaysFor(record: PeriodRecord, rule: PeriodRule): number {
  const { periodDays, apsisPeriodYears } = record.elements;
  if (rule === "table") return periodDays;
  if (rule === "iau-rate") {
    const rate = record.rotation?.primeMeridianDeg.perDay;
    if (rate === undefined || rate === 0) throw new RangeError(`${record.id}: no IAU rotation rate`);
    return 360 / Math.abs(rate);
  }
  if (apsisPeriodYears === null) throw new RangeError(`${record.id}: the table gives no period of the apsides`);
  return 1 / (1 / periodDays - 1 / (apsisPeriodYears * DAYS_PER_YEAR));
}


/** The record's sidereal period, days, by the rule the record itself names (`model.periodRule`). */
export const recordPeriodDays = (record: PeriodRecord & { readonly model: { readonly periodRule: string } }): number => siderealPeriodDaysFor(record, record.model.periodRule as PeriodRule);
