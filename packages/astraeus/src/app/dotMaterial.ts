import { DataTexture, PointsMaterial, RGBAFormat, type PointsMaterialParameters } from "three";

const DOT_TEXTURE_PX = 32;
let dotTexture: DataTexture | null = null;

/**
 * A white disc with a one-pixel soft edge, built from pixels (no DOM needed). An untextured WebGL point
 * is a square; sampled through `gl_PointCoord` this makes it a circle.
 */
function roundDotTexture(): DataTexture {
  if (dotTexture !== null) return dotTexture;
  const size = DOT_TEXTURE_PX;
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const r = Math.hypot(x + 0.5 - size / 2, y + 0.5 - size / 2);
      const alpha = Math.min(1, Math.max(0, size / 2 - r));
      pixels.set([255, 255, 255, Math.round(alpha * 255)], (y * size + x) * 4);
    }
  }
  dotTexture = new DataTexture(pixels, size, size, RGBAFormat);
  dotTexture.needsUpdate = true;
  return dotTexture;
}

/** Frees the shared dot picture (an unmounted scene's renderer must not stay reachable through it); the next dot makes a new one. */
export function releaseDotTexture(): void {
  dotTexture?.dispose();
  dotTexture = null;
}

/**
 * The one way the engine makes a far-away dot (body marker, group dot, anchor): a round `PointsMaterial`.
 * A map plus `alphaTest` rather than a fragment discard, because the group materials already patch the
 * vertex shader through `onBeforeCompile` and the stock fragment chunks handle the map, opacity and
 * vertex colours unchanged; the cutoff keeps the edge crisp at 2-4 px. Callers pass the same size and
 * colour as before; only the shape differs. A caller's own `map` (the anchor ring) replaces the disc.
 */
export function dotMaterial(parameters: PointsMaterialParameters): PointsMaterial {
  return new PointsMaterial({ map: roundDotTexture(), alphaTest: 0.4, ...parameters });
}
