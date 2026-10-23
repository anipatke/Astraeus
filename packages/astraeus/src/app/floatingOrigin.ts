/**
 * Rendering-owned floating origin. It is independent of ScalePolicy and the scientific core:
 * it only subtracts a Float64 scaled origin from already-mapped absolute positions before the
 * values are narrowed to the GPU's Float32.
 */
export class FloatingOrigin {
  readonly scaledCameraOrigin = new Float64Array(3);

  set(scaledAbsolute: ArrayLike<number>): void {
    for (let i = 0; i < 3; i += 1) {
      if (!Number.isFinite(scaledAbsolute[i])) throw new TypeError("floating origin must be finite");
      this.scaledCameraOrigin[i] = scaledAbsolute[i];
    }
  }

  /** Subtracts in Float64. The result is small enough to narrow safely. */
  toLocal(scaledAbsolute: ArrayLike<number>, out: [number, number, number] = [0, 0, 0]): [number, number, number] {
    out[0] = scaledAbsolute[0] - this.scaledCameraOrigin[0];
    out[1] = scaledAbsolute[1] - this.scaledCameraOrigin[1];
    out[2] = scaledAbsolute[2] - this.scaledCameraOrigin[2];
    return out;
  }

  distanceTo(scaledAbsolute: ArrayLike<number>): number {
    return Math.hypot(
      scaledAbsolute[0] - this.scaledCameraOrigin[0],
      scaledAbsolute[1] - this.scaledCameraOrigin[1],
      scaledAbsolute[2] - this.scaledCameraOrigin[2],
    );
  }

  /** Rebases onto `scaledAbsolute` once it has drifted further than `thresholdUnits`. */
  rebaseIfFar(scaledAbsolute: ArrayLike<number>, thresholdUnits: number): boolean {
    if (this.distanceTo(scaledAbsolute) <= thresholdUnits) return false;
    this.set(scaledAbsolute);
    return true;
  }
}
