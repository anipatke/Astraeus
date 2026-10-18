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
}

export interface MoonCatalogue {
  readonly parent: string;
  readonly asOf: string;
  readonly families: readonly MoonFamily[];
  readonly moons: readonly MoonRecord[];
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
    return Object.freeze({
      id: text(moon.id, `${where}.id`),
      name: text(moon.name, `${where}.name`),
      family,
      meanRadiusKm: radius,
      radiusBasis: text(moon.radiusBasis, `${where}.radiusBasis`),
      ...(typeof moon.bodyPackage === "string" ? { bodyPackage: moon.bodyPackage } : {}),
    });
  });
  if (new Set(moons.map((moon) => moon.id)).size !== moons.length) throw new MoonCatalogueError("moon catalogue moon ids must be unique");
  return Object.freeze({ parent: text(record.parent, "parent"), asOf: text(record.asOf, "asOf"), families: Object.freeze(families), moons: Object.freeze(moons) });
}
