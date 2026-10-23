import type { Provenance } from "../core/provenance";
import type { InfoFact } from "./infoModel";

/** One category of tagged places on a body (a colour and a label), as the body package records it. */
export interface BodyFeatureCategory {
  readonly key: string;
  readonly label: string;
  readonly color: string;
}

/** One tagged place on a body: its name, kind, exact latitude and longitude (degrees, as stored), and the words shown when it is opened. */
export interface BodyFeature {
  readonly id: string;
  readonly name: string;
  readonly featureType: string;
  readonly category: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly description: string;
  readonly details: readonly InfoFact[];
}

/** Every tagged place of one body, with where the list comes from. Experience data (ARCH-01): the engine never names a body here. */
export interface BodyFeatureSet {
  readonly bodyId: string;
  readonly bodyLabel: string;
  readonly categories: readonly BodyFeatureCategory[];
  readonly features: readonly BodyFeature[];
  /** Shown with every place's information (PROV-01). */
  readonly provenance: Provenance;
  readonly knownLimitations?: readonly string[];
}

/** The id an info panel and a scene marker use for one place: unique across bodies. */
export const featureKey = (bodyId: string, featureId: string): string => `${bodyId}:${featureId}`;

/** The set and place a key names, or null. */
export function findFeature(sets: readonly BodyFeatureSet[] | undefined, key: string): { readonly set: BodyFeatureSet; readonly feature: BodyFeature } | null {
  for (const set of sets ?? []) {
    const feature = set.features.find((candidate) => featureKey(set.bodyId, candidate.id) === key);
    if (feature !== undefined) return { set, feature };
  }
  return null;
}

/** The colour of a place's category, white when its category is unknown (the donor's fallback). */
export const featureColor = (set: BodyFeatureSet, feature: BodyFeature): string => set.categories.find((category) => category.key === feature.category)?.color ?? "#ffffff";

/** The tagged places of a body package, taken as stored: latitude and longitude are never rounded, converted or corrected. */
export function bodyFeatureSet(input: {
  readonly bodyId: string;
  readonly bodyLabel: string;
  readonly features: { readonly features: readonly BodyFeature[] };
  readonly categories: { readonly categories: readonly BodyFeatureCategory[] };
  readonly provenance: Provenance;
  readonly knownLimitations?: readonly string[];
}): BodyFeatureSet {
  return {
    bodyId: input.bodyId,
    bodyLabel: input.bodyLabel,
    categories: input.categories.categories.map(({ key, label, color }) => ({ key, label, color })),
    features: input.features.features,
    provenance: input.provenance,
    ...(input.knownLimitations === undefined ? {} : { knownLimitations: input.knownLimitations }),
  };
}
