/** What kind of source a path or body position comes from. `"modelled"` is a computed result of a stated model (shown as "Modelled", the same word as the story-panel badge). */
export type ProvenanceSourceType = "ephemeris" | "observed" | "reconstructed" | "modelled" | "illustrative";

const SOURCE_TYPES: readonly ProvenanceSourceType[] = ["ephemeris", "observed", "reconstructed", "modelled", "illustrative"];

/** Where a path or body position came from and how far to trust it: `sourceType`, the `sources`, the `accuracy` and `notes`. Pass one as `addTrajectory({ provenance })`. Never affects State. */
export interface Provenance {
  readonly sourceType: ProvenanceSourceType;
  readonly sources: readonly string[];
  readonly accuracy: string;
  readonly notes: string;
  /** For a position compared with an independent ephemeris: the class the comparison earned (`"approximate"` within 1% of the body's distance from the Sun, `"indicative"` within 5%). Absent for a body that has no such comparison. */
  readonly accuracyClass?: "approximate" | "indicative";
  /** The largest difference found, or the limit of the class, as a fraction of the body's distance from the Sun at the compared date (0.00857 is 0.857%). Absent with `accuracyClass`. */
  readonly maxErrorFraction?: number;
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
    ...(input.accuracyClass === undefined ? {} : { accuracyClass: input.accuracyClass }),
    ...(input.maxErrorFraction === undefined ? {} : { maxErrorFraction: input.maxErrorFraction }),
  });
}
