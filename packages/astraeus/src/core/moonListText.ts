// The words of a moon list's count line, shared by the moon panel and `Scene.moonPanel` (no display code here, so the api can use it without loading the panel).

/** A family's heading count: "5 moons", "1 moon". */
export function moonCountText(count: number): string {
  return count === 1 ? "1 moon" : `${count} moons`;
}

/** A date from the data (YYYY-MM-DD, or an ISO timestamp) as "18 October 2026"; the text itself when it is not a date. */
export function moonListDateText(date: string): string {
  const parsed = /^\d{4}-\d{2}-\d{2}/.test(date) ? new Date(`${date.slice(0, 10)}T00:00:00Z`) : new Date(Number.NaN);
  return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/** "115 moons in the JPL Horizons list of 18 October 2026": the count is the moons the list holds, the source and date come from the data. */
export function moonListSummary(count: number, source?: string, date?: string): string {
  const head = moonCountText(count);
  if (source !== undefined && date !== undefined) return `${head} in the ${source} list of ${moonListDateText(date)}`;
  if (date !== undefined) return `${head}, list of ${moonListDateText(date)}`;
  return head;
}
