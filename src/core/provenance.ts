export type ProvenanceSourceType = "ephemeris" | "observed" | "reconstructed" | "illustrative";

const SOURCE_TYPES: readonly ProvenanceSourceType[] = ["ephemeris", "observed", "reconstructed", "illustrative"];

/** Where a Trajectory's samples came from and how far to trust them. Never affects State. */
export interface Provenance {
  readonly sourceType: ProvenanceSourceType;
  readonly sources: readonly string[];
  readonly accuracy: string;
  readonly notes: string;
}

export function createProvenance(input: Provenance): Provenance {
  if (!SOURCE_TYPES.includes(input.sourceType)) throw new RangeError("provenance sourceType is not recognised");
  if (input.sources.some((source) => typeof source !== "string" || source.length === 0)) {
    throw new TypeError("provenance sources must be non-empty strings");
  }
  return Object.freeze({
    sourceType: input.sourceType,
    sources: Object.freeze([...input.sources]),
    accuracy: input.accuracy,
    notes: input.notes,
  });
}
