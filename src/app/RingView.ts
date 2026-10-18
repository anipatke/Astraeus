// Flat ring bands, copied from planetary-explorer src/features/moon/SaturnRingMesh.tsx (the owner's own project, commit 84f8d3e): a ring
// disc with a radial canvas texture, each band an annulus with soft edges (6% of its width), transparent, both sides, no depth write.
// Named deviation (owner, O-025 Decision 7): the donor's band radii are replaced by each band's real radii from the data; the donor drew
// its disc from 1.6 to 3.2 planet radii. The texture is built at the donor's size (2048 px).
import { CanvasTexture, DoubleSide, LinearFilter, LinearMipmapLinearFilter, Mesh, MeshBasicMaterial, RingGeometry, SRGBColorSpace } from "three";
import type { RingBand } from "../assets/rings";

const TEX_SIZE = 2048;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

/** The donor's radial texture: band radii in any one unit, the disc's outer radius in the same unit. */
export function drawRingTexture(ctx: CanvasRenderingContext2D, bands: readonly RingBand[], outerKm: number, size: number = TEX_SIZE): void {
  const cx = size / 2;
  const cy = size / 2;
  const pxPerKm = cx / outerKm;
  ctx.clearRect(0, 0, size, size);
  for (const band of bands) {
    const r0 = band.innerKm * pxPerKm;
    const r1 = band.outerKm * pxPerKm;
    if (r1 <= r0) continue;
    const edge = Math.max(1, (r1 - r0) * 0.06);
    const [r, g, b] = hexToRgb(band.color);
    const a = band.opacity;
    const grad = ctx.createRadialGradient(cx, cy, r0, cx, cy, r1);
    grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
    grad.addColorStop(Math.min(edge / (r1 - r0), 0.5), `rgba(${r},${g},${b},${a})`);
    grad.addColorStop(Math.max(1 - edge / (r1 - r0), 0.5), `rgba(${r},${g},${b},${a})`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.beginPath();
    ctx.arc(cx, cy, r1, 0, Math.PI * 2);
    ctx.arc(cx, cy, r0, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
  }
}

/** The disc's extent in km: the innermost band's inner edge to the outermost band's outer edge. */
export function ringExtentKm(bands: readonly RingBand[]): { readonly innerKm: number; readonly outerKm: number } {
  return { innerKm: Math.min(...bands.map((band) => band.innerKm)), outerKm: Math.max(...bands.map((band) => band.outerKm)) };
}

/**
 * The ring disc in the body's equator plane (the local XZ plane of its oriented group, whose +Y is the pole), `unitsPerKm` the body's
 * own drawn scale. Drawn on the body's layer, so the planet hides the far side of the rings.
 */
export class RingView {
  readonly mesh: Mesh;
  readonly #material: MeshBasicMaterial;
  readonly #canvas: HTMLCanvasElement;
  readonly #texture: CanvasTexture;
  #key = "";
  #bands: readonly RingBand[] = [];
  readonly #unitsPerKm: number;

  constructor(bands: readonly RingBand[], unitsPerKm: number, layer: number, anisotropy = 1) {
    const { innerKm, outerKm } = ringExtentKm(bands);
    this.#unitsPerKm = unitsPerKm;
    this.#canvas = document.createElement("canvas");
    this.#canvas.width = TEX_SIZE;
    this.#canvas.height = TEX_SIZE;
    this.#texture = new CanvasTexture(this.#canvas);
    this.#texture.colorSpace = SRGBColorSpace;
    this.#texture.magFilter = LinearFilter;
    this.#texture.minFilter = LinearMipmapLinearFilter;
    this.#texture.generateMipmaps = true;
    this.#texture.anisotropy = anisotropy;
    this.#material = new MeshBasicMaterial({ map: this.#texture, transparent: true, side: DoubleSide, depthWrite: false, toneMapped: false });
    this.mesh = new Mesh(new RingGeometry(innerKm * unitsPerKm, outerKm * unitsPerKm, 256, 2), this.#material);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.layers.set(layer);
    this.mesh.name = "rings";
    this.mesh.userData.outerKm = outerKm;
    this.setBands(bands);
  }

  /** Repaints the texture when a band's colour or opacity changes (the live settings); the radii stay the data's. */
  setBands(bands: readonly RingBand[]): void {
    const key = bands.map((band) => `${band.color}:${band.opacity}`).join("|");
    if (key === this.#key) return;
    this.#key = key;
    this.#bands = bands;
    const ctx = this.#canvas.getContext("2d");
    if (ctx !== null) drawRingTexture(ctx, bands, ringExtentKm(bands).outerKm);
    this.#texture.needsUpdate = true;
  }

  /** What is drawn, for the browser checks: each band's radii (km and scaled units), colour and opacity in force, and whether the disc is shown. */
  readout(): { readonly shown: boolean; readonly bands: readonly { id: string; innerKm: number; outerKm: number; innerUnits: number; outerUnits: number; color: string; opacity: number }[] } {
    const shown = this.mesh.visible && this.mesh.parent !== null;
    return { shown, bands: this.#bands.map((band) => ({ id: band.id, innerKm: band.innerKm, outerKm: band.outerKm, innerUnits: band.innerKm * this.#unitsPerKm, outerUnits: band.outerKm * this.#unitsPerKm, color: band.color, opacity: band.opacity })) };
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.#material.dispose();
    this.#texture.dispose();
  }
}
