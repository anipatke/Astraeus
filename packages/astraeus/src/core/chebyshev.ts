/**
 * Chebyshev series on one segment, evaluated by Clenshaw's recurrence: the value and the derivative with respect to the
 * normalised argument x in [-1, 1]. Shared by the ephemeris provider and the importer that fits the coefficients, so both
 * read a segment the same way. Dependency-free on purpose: the browser speed probe loads it on its own.
 */

/** Sum of c[offset + k] * T_k(x) for k = 0 .. count - 1. */
export function chebyshevValue(coefficients: ArrayLike<number>, offset: number, count: number, x: number): number {
  let b1 = 0;
  let b2 = 0;
  const twoX = 2 * x;
  for (let k = count - 1; k >= 1; k -= 1) {
    const b0 = twoX * b1 - b2 + coefficients[offset + k];
    b2 = b1;
    b1 = b0;
  }
  return x * b1 - b2 + coefficients[offset];
}

/**
 * Value and d/dx of the same series, written into out[outIndex] and out[outIndex + 1]. The derivative uses the
 * differentiated recurrence (T_k' from U_{k-1}), so no derivative coefficients are stored.
 */
export function chebyshevValueAndSlope(
  coefficients: ArrayLike<number>,
  offset: number,
  count: number,
  x: number,
  out: Float64Array,
  outIndex: number,
): void {
  let b1 = 0;
  let b2 = 0;
  let d1 = 0;
  let d2 = 0;
  const twoX = 2 * x;
  for (let k = count - 1; k >= 1; k -= 1) {
    const b0 = twoX * b1 - b2 + coefficients[offset + k];
    const d0 = twoX * d1 - d2 + 2 * b1;
    b2 = b1;
    b1 = b0;
    d2 = d1;
    d1 = d0;
  }
  out[outIndex] = x * b1 - b2 + coefficients[offset];
  out[outIndex + 1] = x * d1 - d2 + b1;
}
