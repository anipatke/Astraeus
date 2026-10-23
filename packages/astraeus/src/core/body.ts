import type { AstronomyAdapter } from "./astronomyAdapter";
import type { Provenance } from "./provenance";
import type { TimeBounds, Trajectory } from "./trajectory";

/** Any State subject: a natural body or any other non-empty id, such as a spacecraft. */
export type BodyId = string;

/** Any body a State can be measured from. Which ids are valid is the state resolver's catalogue, not a type. */
export type CenterId = BodyId;

export function assertCenterId(id: BodyId): void {
  if (typeof id !== "string" || id.length === 0) throw new RangeError("a reference center id must be a non-empty string");
}

/** Provenance and known limitations for a body's own ephemeris. */
export interface EphemerisRecord {
  readonly provenance: Provenance;
  readonly knownLimitations: readonly string[];
}

/** Which model fills State.orientation; `none` means a null orientation is valid. */
export type OrientationModel = "ecef" | "tidal-lock" | "iau-rotation" | "none";

/** Scientific identity only: it knows nothing of providers, textures or licences. */
export interface CelestialBodyDefinition {
  readonly id: BodyId;
  readonly label: string;
  /** Volumetric mean radius; what every scale policy maps and every sphere defaults to. */
  readonly radiusKm: number;
  /** Optional spheroid dimensions for bodies whose flattening is visible. */
  readonly equatorialRadiusKm?: number;
  readonly polarRadiusKm?: number;
  /** Gravitational parameter, km³/s²; present on anything that can be a two-body centre. */
  readonly gmKm3S2?: number;
  /** The one centre this body's own provider computes in; absent only for the root. */
  readonly parentId?: BodyId;
  readonly orientation: OrientationModel;
  /** What is claimed, over which dates, and what is known to be off. Never affects State. */
  readonly accuracy: {
    readonly dimensions: Provenance;
    readonly position: Provenance;
    readonly validUtc: TimeBounds;
    readonly orientationLimitations: readonly string[];
  };
}

/** Binds a definition to the Trajectory that computes it in its parent's centre. */
export interface StateSourceBinding {
  readonly body: BodyId;
  create(adapter: AstronomyAdapter): Trajectory;
}

// Existing imports of the Earth and Moon constants keep working; the definitions are the one source.
export { EARTH } from "./bodies/earth";
export { MOON } from "./bodies/moon";
export { SUN } from "./bodies/sun";
