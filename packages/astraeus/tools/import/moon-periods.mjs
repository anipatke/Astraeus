// The orbit period of each listed moon (O-049 T-210): JPL SSD Planetary Satellite Mean Elements, transcribed into planet-moon-periods.json.
// Both moon-list importers read it here so a list entry gets the period by one rule: matched by NAIF id, null when the table gives none.
import { readFileSync } from "node:fs";

const table = JSON.parse(readFileSync(new URL("planet-moon-periods.json", import.meta.url), "utf8"));

export const PERIODS_FETCHED = table.fetched;
export const PERIODS_SOURCE = table.source;

/** A planet's moon-list fields for periods: the entry's `orbitPeriodDays` (days, or null for none published) by NAIF id, and the list-level `periods` note. */
export function periodsFor(planet, moons) {
  const rows = table.periods[planet] ?? [];
  const byNaif = new Map(rows.map((row) => [row.naifId, row.periodDays]));
  const stray = rows.filter((row) => !moons.some((moon) => moon.naifId === row.naifId));
  if (stray.length > 0) throw new Error(`${planet}: periods for moons not in the list: ${stray.map((row) => row.id).join(", ")}`);
  const periodOf = (moon) => byNaif.get(moon.naifId) ?? null;
  const missing = moons.filter((moon) => periodOf(moon) === null).map((moon) => moon.id);
  return { periodOf, note: { source: PERIODS_SOURCE, column: "P (days)", fetched: PERIODS_FETCHED, missing } };
}
