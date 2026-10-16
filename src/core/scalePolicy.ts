import { EARTH, type BodyId } from "./body";

export interface ScalePolicy {
  /** Open: an application may supply policies beyond the engine's own three. */
  readonly id: string;
  mapPosition(positionKm: ArrayLike<number>): Float64Array;
  /** `bodyId` lets a policy enlarge particular bodies; the True and Readable policies ignore it. */
  mapRadius(radiusKm: number, bodyId?: BodyId): number;
}

function validateRadius(radiusKm: number): void {
  if (!Number.isFinite(radiusKm) || radiusKm < 0) throw new RangeError("radiusKm must be finite and non-negative");
}

function validatePosition(positionKm: ArrayLike<number>): void {
  if (positionKm.length !== 3 || Array.from(positionKm).some((component) => !Number.isFinite(component))) {
    throw new TypeError("positionKm must be a finite 3-vector");
  }
}

abstract class EarthRadiusScale implements ScalePolicy {
  abstract readonly id: string;
  protected abstract readonly distanceFactor: number;

  mapPosition(positionKm: ArrayLike<number>): Float64Array {
    validatePosition(positionKm);
    const factor = this.distanceFactor / EARTH.radiusKm;
    return Float64Array.of(positionKm[0] * factor, positionKm[1] * factor, positionKm[2] * factor);
  }

  mapRadius(radiusKm: number): number {
    validateRadius(radiusKm);
    return radiusKm / EARTH.radiusKm;
  }
}

export class TrueScalePolicy extends EarthRadiusScale {
  readonly id = "true-scale" as const;
  protected readonly distanceFactor = 1;
}

export class ReadableScalePolicy extends EarthRadiusScale {
  readonly id = "readable-scale" as const;
  protected readonly distanceFactor = 0.1;
}

export const trueScale: ScalePolicy = Object.freeze(new TrueScalePolicy());
export const readableScale: ScalePolicy = Object.freeze(new ReadableScalePolicy());

/** Per-body enlargement of drawn radii; distances stay exactly as True scale maps them. */
export interface SolarSystemScaleOptions {
  readonly exaggeration: Readonly<Record<BodyId, number>>;
  readonly defaultExaggeration: number;
}

export interface SolarSystemScalePolicy extends ScalePolicy {
  readonly id: "solar-system";
  /** The enlargement applied to a body (the default when it has no declared factor). */
  factorFor(bodyId?: BodyId): number;
  /** Plain words stating every factor, for the info panel. */
  readonly explanation: string;
}

function validateFactor(label: string, factor: number): void {
  if (!Number.isFinite(factor) || factor < 1) throw new RangeError(`${label} exaggeration must be finite and at least 1`);
}

export function createSolarSystemScale(options: SolarSystemScaleOptions): SolarSystemScalePolicy {
  validateFactor("default", options.defaultExaggeration);
  const factors = new Map<BodyId, number>();
  for (const [bodyId, factor] of Object.entries(options.exaggeration)) {
    validateFactor(bodyId, factor);
    factors.set(bodyId, factor);
  }
  const defaultFactor = options.defaultExaggeration;
  const declared = [...factors].map(([bodyId, factor]) => `${bodyId} \u00d7${factor}`).join(", ");
  const explanation = `Distances are true. Bodies are drawn larger than life so they can be seen: ${declared === "" ? "" : `${declared}; `}any other body \u00d7${defaultFactor}.`;
  const factorFor = (bodyId?: BodyId): number => (bodyId === undefined ? defaultFactor : factors.get(bodyId) ?? defaultFactor);
  return Object.freeze({
    id: "solar-system" as const,
    explanation,
    factorFor,
    mapPosition: (positionKm: ArrayLike<number>) => trueScale.mapPosition(positionKm),
    mapRadius: (radiusKm: number, bodyId?: BodyId) => trueScale.mapRadius(radiusKm) * factorFor(bodyId),
  });
}
