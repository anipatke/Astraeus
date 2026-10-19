/**
 * What the moon browser (the sliding panel of a planet's moons by family) needs, as plain data any experience can hand the shell
 * (ARCH-01): families with a one-line description, and each family's moons. The panel shows named moons first and folds the unnamed away.
 */
export interface MoonListing {
  /** The id the scene knows the moon by (also its object id in the experience). */
  readonly id: string;
  readonly label: string;
  /** False for a provisional designation. */
  readonly named: boolean;
  /** A small picture for a moon the panel shows large (the big four); absent for the rest. */
  readonly pictureUrl?: string;
}

export interface MoonFamilyListing {
  readonly id: string;
  readonly label: string;
  /** One plain line. */
  readonly description: string;
  readonly moons: readonly MoonListing[];
}

export interface MoonFamilyList {
  /** The planet's name, for the panel heading. */
  readonly planetLabel: string;
  /** Family ids whose moons the panel lists first with pictures (the big four); the others fold. */
  readonly featuredFamilyId?: string;
  readonly families: readonly MoonFamilyListing[];
  /** Where the list of moons comes from, e.g. "JPL Horizons"; with listDate, the panel says how many moons the list held and when it was taken. */
  readonly listSource?: string;
  /** The day the list was taken (YYYY-MM-DD, from the data). */
  readonly listDate?: string;
}

export interface MoonSplit {
  readonly named: readonly MoonListing[];
  readonly unnamed: readonly MoonListing[];
}

/** Named moons first (as listed), provisional designations apart. */
export function splitNamed(moons: readonly MoonListing[]): MoonSplit {
  return { named: moons.filter((moon) => moon.named), unnamed: moons.filter((moon) => !moon.named) };
}

const squash = (text: string): string => text.toLowerCase().replace(/[^a-z0-9]+/g, "");

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

/** The summary of a whole moon list: every moon in every family, counted live. */
export const moonFamilyListSummary = (list: MoonFamilyList): string => moonListSummary(list.families.reduce((total, family) => total + family.moons.length, 0), list.listSource, list.listDate);

export interface MoonMatch {
  readonly moon: MoonListing;
  readonly familyLabel: string;
}

/** The moons whose name or designation contains the query, ignoring case, spaces and punctuation ("s2003 j19" finds "S/2003 J 19"); none for an empty query. */
export function searchMoons(list: MoonFamilyList, query: string): readonly MoonMatch[] {
  const wanted = squash(query);
  if (wanted === "") return [];
  return list.families.flatMap((family) => family.moons
    .filter((moon) => squash(moon.label).includes(wanted) || squash(moon.id).includes(wanted))
    .map((moon) => ({ moon, familyLabel: family.label })));
}
