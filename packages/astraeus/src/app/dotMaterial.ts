import { DataTexture, PointsMaterial, RGBAFormat, type PointsMaterialParameters } from "three";

const DOT_TEXTURE_PX = 32;

/**
 * A white disc with a one-pixel soft edge, built from pixels (no DOM needed). An untextured WebGL point
 * is a square; sampled through `gl_PointCoord` this makes it a circle. Each material makes its own, so one viewer's disposal never reaches another's.
 */
function roundDotTexture(): DataTexture {
  const size = DOT_TEXTURE_PX;
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const r = Math.hypot(x + 0.5 - size / 2, y + 0.5 - size / 2);
      const alpha = Math.min(1, Math.max(0, size / 2 - r));
      pixels.set([255, 255, 255, Math.round(alpha * 255)], (y * size + x) * 4);
    }
  }
  const texture = new DataTexture(pixels, size, size, RGBAFormat);
  texture.needsUpdate = true;
  return texture;
}

/**
 * The one way the engine makes a far-away dot (body marker, group dot, anchor): a round `PointsMaterial`.
 * A map plus `alphaTest` rather than a fragment discard, because the group materials already patch the
 * vertex shader through `onBeforeCompile` and the stock fragment chunks handle the map, opacity and
 * vertex colours unchanged; the cutoff keeps the edge crisp at 2-4 px. Callers pass the same size and
 * colour as before; only the shape differs. A caller's own `map` (the anchor ring) replaces the disc.
 */
export function dotMaterial(parameters: PointsMaterialParameters): PointsMaterial {
  return new PointsMaterial({ alphaTest: 0.4, ...parameters, map: parameters.map ?? roundDotTexture() });
}
