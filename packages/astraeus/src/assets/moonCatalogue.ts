/**
 * A planet's moon list (`data/moons/<planet>.json`, format `astraeus.moon-catalogue/1`): every moon's name, family and mean radius, and
 * the families with a plain description. Facts only, checked here once (STYLE-06); positions come from the moon's ephemeris set.
 */
export const MOON_CATALOGUE_FORMAT = "astraeus.moon-catalogue/1";

export interface MoonFamily {
  readonly id: string;
  readonly label: string;
  readonly description: string;
}

export interface MoonRecord {
  readonly id: string;
  readonly name: string;
  readonly family: string;
  readonly meanRadiusKm: number;
  /** "measured" (a published measurement) or "estimate" (a brightness-based size). */
  readonly radiusBasis: string;
  /** Present for a moon with a mapped body package; such a moon is drawn as a full body. */
  readonly bodyPackage?: string;
  /** False for a provisional designation such as "S/2003 J 19" that has no name yet. */
  readonly named: boolean;
  readonly discoveryYear?: number;
  /** Ids into the catalogue's `sources`: the list, the family, the size and the discovery. */
  readonly sourceIds: readonly string[];
}

export interface MoonSource {
  readonly title: string;
  readonly url: string;
}

export interface MoonCatalogue {
  readonly parent: string;
  readonly asOf: string;
  readonly families: readonly MoonFamily[];
  readonly moons: readonly MoonRecord[];
  readonly sources: Readonly<Record<string, MoonSource>>;
}

export class MoonCatalogueError extends TypeError {
  constructor(message: string) {
    super(message);
    this.name = "MoonCatalogueError";
  }
}

const text = (value: unknown, where: string): string => {
  if (typeof value !== "string" || value === "") throw new MoonCatalogueError(`${where} must be a non-empty string`);
  return value;
};

export function parseMoonCatalogue(raw: unknown): MoonCatalogue {
  if (typeof raw !== "object" || raw === null) throw new MoonCatalogueError("moon catalogue must be an object");
  const record = raw as Record<string, unknown>;
  if (record.format !== MOON_CATALOGUE_FORMAT) throw new MoonCatalogueError(`moon catalogue format must be "${MOON_CATALOGUE_FORMAT}"`);
  if (!Array.isArray(record.families) || !Array.isArray(record.moons)) throw new MoonCatalogueError("moon catalogue needs families and moons");
  const families = (record.families as Record<string, unknown>[]).map((family, index): MoonFamily => Object.freeze({
    id: text(family.id, `families[${index}].id`),
    label: text(family.label, `families[${index}].label`),
    description: text(family.description, `families[${index}].description`),
  }));
  const familyIds = new Set(families.map((family) => family.id));
  if (familyIds.size !== families.length) throw new MoonCatalogueError("moon catalogue family ids must be unique");
  const moons = (record.moons as Record<string, unknown>[]).map((moon, index): MoonRecord => {
    const where = `moons[${index}]`;
    const family = text(moon.family, `${where}.family`);
    if (!familyIds.has(family)) throw new MoonCatalogueError(`${where}.family "${family}" is not a listed family`);
    const radius = moon.meanRadiusKm;
    if (typeof radius !== "number" || !(radius > 0)) throw new MoonCatalogueError(`${where}.meanRadiusKm must be positive`);
    const sources = (moon.sources ?? {}) as Record<string, unknown>;
    const sourceIds = [...new Set([sources.list, sources.family, sources.radius, sources.discovery].filter((id): id is string => typeof id === "string"))];
    return Object.freeze({
      named: moon.named !== false,
      ...(typeof moon.discoveryYear === "number" ? { discoveryYear: moon.discoveryYear } : {}),
      sourceIds: Object.freeze(sourceIds),
      id: text(moon.id, `${where}.id`),
      name: text(moon.name, `${where}.name`),
      family,
      meanRadiusKm: radius,
      radiusBasis: text(moon.radiusBasis, `${where}.radiusBasis`),
      ...(typeof moon.bodyPackage === "string" ? { bodyPackage: moon.bodyPackage } : {}),
    });
  });
  if (new Set(moons.map((moon) => moon.id)).size !== moons.length) throw new MoonCatalogueError("moon catalogue moon ids must be unique");
  const sources: Record<string, MoonSource> = {};
  for (const [id, source] of Object.entries((record.sources ?? {}) as Record<string, Record<string, unknown>>)) sources[id] = Object.freeze({ title: text(source.title, `sources.${id}.title`), url: text(source.url, `sources.${id}.url`) });
  for (const moon of moons) for (const id of moon.sourceIds) if (sources[id] === undefined) throw new MoonCatalogueError(`moon "${moon.id}" cites unknown source "${id}"`);
  return Object.freeze({ parent: text(record.parent, "parent"), asOf: text(record.asOf, "asOf"), families: Object.freeze(families), moons: Object.freeze(moons), sources: Object.freeze(sources) });
}

/** The titles of the sources for one moon's family, size and discovery year, for its provenance sources list. */
export function moonSourceTitles(catalogue: MoonCatalogue, moon: MoonRecord): readonly string[] {
  return moon.sourceIds.map((id) => catalogue.sources[id].title);
}

/** The info-panel facts for one moon: its family, size and discovery year. Their sources are listed in the provenance (see `moonSourceTitles`). */
export function moonFacts(catalogue: MoonCatalogue, moon: MoonRecord): readonly { readonly label: string; readonly value: string }[] {
  const family = catalogue.families.find((candidate) => candidate.id === moon.family);
  const diameter = Math.round(2 * moon.meanRadiusKm * 10) / 10;
  return [
    { label: "Family", value: family?.label ?? moon.family },
    { label: "Size", value: `${diameter.toLocaleString("en-GB")} km across${moon.radiusBasis === "estimate" ? " (estimated from brightness)" : ""}` },
    ...(moon.discoveryYear === undefined ? [] : [{ label: "Found", value: String(moon.discoveryYear) }]),
  ];
}
