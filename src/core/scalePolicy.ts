import { EARTH } from "./body";

export interface ScalePolicy {
  readonly id: "true-scale" | "readable-scale";
  mapPosition(positionKm: ArrayLike<number>): Float64Array;
  mapRadius(radiusKm: number): number;
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
  abstract readonly id: ScalePolicy["id"];
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
