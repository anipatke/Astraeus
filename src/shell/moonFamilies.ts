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
