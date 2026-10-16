import { AdditiveBlending, BufferAttribute, BufferGeometry, DoubleSide, LinearFilter, LinearMipmapLinearFilter, Group, Mesh, Points, ShaderMaterial, NoColorSpace, TextureLoader, Vector3 } from "three";
import type { Camera, PerspectiveCamera, Texture } from "three";
import { ESO_PICTURE, SKY_MAP_SOURCES, DEFAULT_SKY_MAP, loadPictureSet, type PictureSet, type SkyMapSource, type StarRow } from "../assets/sky";
import { buildPictureMesh, buildStarBuffers } from "./skyModel";

// Both draws sit before everything else in the first pass (the layer-0 pass), ignore depth, and write none.
const SKY_ORDER = -1000;
/** Strength of the picture at brightness 1: the Milky Way is a backdrop, not the subject. */
const PICTURE_GAIN = 0.5;
/** A fixed render-frame direction used to read the sky back: where it lands on screen depends only on the camera orientation. */
const PROBE_DIRECTION = new Vector3(0.62, 0.35, -0.7).normalize();

const PICTURE_VERTEX = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const PICTURE_FRAGMENT = `
uniform sampler2D uMap;
uniform float uGain;
varying vec2 vUv;
void main() {
  gl_FragColor = vec4(texture2D(uMap, vUv).rgb * uGain, 1.0);
}`;

// A star is a small Gaussian core: `aSize` is its width at half maximum in CSS pixels, the sprite is wide enough to hold three
// sigma either side, and the fragment measures the distance from the star's centre in device pixels, so it is sharp at any pixel ratio.
const STAR_VERTEX = `
attribute vec3 aColour;
attribute float aSize;
uniform float uPixelRatio;
varying vec3 vColour;
varying float vSigma;
varying float vSprite;
void main() {
  vColour = aColour;
  vSigma = aSize * uPixelRatio / 2.355;
  vSprite = ceil(6.0 * vSigma) + 2.0;
  gl_PointSize = vSprite;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const STAR_FRAGMENT = `
const float STAR_PEAK = 1.25;
uniform float uGain;
varying vec3 vColour;
varying float vSigma;
varying float vSprite;
void main() {
  vec2 offset = (gl_PointCoord - 0.5) * vSprite;
  float a = exp(-dot(offset, offset) / (2.0 * vSigma * vSigma));
  gl_FragColor = vec4(vColour * uGain * STAR_PEAK * a, 1.0);
}`;

export interface SkyViewOptions {
  /** Star strength, 0 to 2 (1 is the baseline curve). */
  readonly starBrightness: number;
  /** Picture strength, 0 to 2 (1 is the baseline). */
  readonly milkyWayBrightness: number;
  readonly pixelRatio: number;
  /** The GPU's anisotropy limit (`renderer.capabilities.getMaxAnisotropy()`); 1 when unknown. */
  readonly maxAnisotropy?: number;
  /** Whether the picture is drawn. Defaults to true. */
  readonly milkyWay?: boolean;
  /** Legacy: the two ESO halves as ready textures (a test may pass empty ones). Overrides `picture`. */
  readonly pictures?: readonly Texture[];
  /** The picture to draw, as a tile grid; defaults to the ESO panorama. `null` draws none until `setPicture` is called. */
  readonly picture?: PictureSet | null;
  /** The source `requestPicture` loads: `nasa` (local only, falls back to ESO) or `eso`. Defaults to `eso`. */
  readonly source?: SkyMapSource;
}

/**
 * The sky: stars and the Milky Way picture at infinity. The group is put on the camera's position every frame, so what is drawn
 * depends only on the camera's orientation; it takes no scene centre, floating origin, scale policy or follow target. It is on
 * layer 0, which the first render pass draws, and carries no State. The picture is a mesh placed by galactic coordinates (`buildPictureMesh`).
 */
export class SkyView {
  readonly group = new Group();
  #stars: Points | null = null;
  readonly #pictures: Mesh[] = [];
  readonly #pictureMaterials: ShaderMaterial[] = [];
  readonly #starMaterial: ShaderMaterial;
  #textures: Texture[] = [];
  #starCount = 0;
  #pictureOn: boolean;
  #brightness: number;
  #gain = 1;
  #maxAnisotropy: number;
  #pictureId: SkyMapSource | null = null;
  readonly #source: SkyMapSource;
  #requested = false;
  #disposed = false;

  /** `options.picture` is the tile set; the scene passes the one it resolved, a test may pass `pictures` (empty textures). */
  constructor(options: SkyViewOptions) {
    const { starBrightness, milkyWayBrightness, pixelRatio, maxAnisotropy = 1 } = options;
    this.#pictureOn = options.milkyWay ?? false;
    this.#brightness = milkyWayBrightness;
    this.#maxAnisotropy = maxAnisotropy;
    this.#source = options.source ?? DEFAULT_SKY_MAP;
    if (options.pictures !== undefined) this.#build(ESO_PICTURE, options.pictures);
    else if (options.picture !== null) this.#build(options.picture ?? ESO_PICTURE);
    this.#starMaterial = new ShaderMaterial({
      vertexShader: STAR_VERTEX,
      fragmentShader: STAR_FRAGMENT,
      uniforms: { uPixelRatio: { value: pixelRatio }, uGain: { value: starBrightness } },
      blending: AdditiveBlending,
      depthTest: false,
      depthWrite: false,
    });
    this.group.name = "sky";
  }

  /** Builds one mesh per tile of a picture, each with its own texture; replaces nothing (callers clear first). */
  #build(set: PictureSet, textures?: readonly Texture[]): void {
    this.#pictureId = set.id;
    this.#gain = set.gain;
    // The sphere has 64 cells per tile on a side (about 1.4 degrees at 4x2 tiles), so a straight-edged cell never strays measurably from the true projection.
    const columns = Math.max(128, set.columns * 64);
    const rows = Math.max(64, set.rows * 64);
    set.tiles.forEach((tile, index) => {
      const texture = textures?.[index] ?? new TextureLoader().load(tile.url);
      this.#textures.push(texture);
      // Raw sRGB goes to the framebuffer as it is (no decode and re-encode per pixel); mipmaps and anisotropic filtering keep the
      // picture from sparkling when it is drawn smaller than the file, and the magnified case is plain bilinear.
      texture.colorSpace = NoColorSpace;
      texture.generateMipmaps = true;
      texture.minFilter = LinearMipmapLinearFilter;
      texture.magFilter = LinearFilter;
      texture.anisotropy = this.#maxAnisotropy;
      // Every triangle of the sphere is drawn once from inside, so both sides are drawn and no winding order matters.
      const material = new ShaderMaterial({
        vertexShader: PICTURE_VERTEX,
        fragmentShader: PICTURE_FRAGMENT,
        uniforms: { uMap: { value: texture }, uGain: { value: PICTURE_GAIN * this.#gain * this.#brightness } },
        side: DoubleSide,
        depthTest: false,
        depthWrite: false,
      });
      const data = buildPictureMesh(columns, rows, { column: tile.column, row: tile.row, columns: set.columns, rows: set.rows, frame: set.frame });
      const geometry = new BufferGeometry();
      geometry.setAttribute("position", new BufferAttribute(data.positions, 3));
      geometry.setAttribute("uv", new BufferAttribute(data.uvs, 2));
      geometry.setIndex(new BufferAttribute(data.indices, 1));
      const picture = new Mesh(geometry, material);
      picture.renderOrder = SKY_ORDER;
      picture.frustumCulled = false;
      picture.visible = this.#pictureOn;
      this.#pictures.push(picture);
      this.#pictureMaterials.push(material);
      this.group.add(picture);
    });
  }

  #clear(): void {
    for (const picture of this.#pictures) { this.group.remove(picture); picture.geometry.dispose(); }
    for (const material of this.#pictureMaterials) material.dispose();
    for (const texture of this.#textures) texture.dispose();
    this.#pictures.length = 0;
    this.#pictureMaterials.length = 0;
    this.#textures = [];
    this.#pictureId = null;
  }

  /** Replaces the picture with another tile set (a different source or size); the on/off state and the brightness carry over. */
  setPicture(set: PictureSet): void {
    this.#clear();
    this.#build(set);
  }

  /**
   * Loads the picture for this view's source the first time it is wanted (nothing is fetched or decoded while the picture stays off):
   * `nasa` when its local tiles exist, otherwise the ESO panorama. A no-op once a picture is held or a load is under way.
   */
  requestPicture(load: (source: SkyMapSource) => Promise<PictureSet> = loadPictureSet): void {
    if (this.#requested || this.#pictureId !== null) return;
    this.#requested = true;
    void load(this.#source).then((set) => { if (!this.#disposed) this.setPicture(set); });
  }

  /** The source of the picture now held (`nasa` or `eso`), or null when none. */
  get pictureSource(): SkyMapSource | null {
    return this.#pictureId;
  }

  /** Sets the star strength in place (0 to 2); no rebuild. */
  setStarBrightness(value: number): void {
    this.#starMaterial.uniforms.uGain.value = value;
  }

  /** Sets the picture strength in place (0 to 2); no rebuild. */
  setMilkyWayBrightness(value: number): void {
    this.#brightness = value;
    for (const material of this.#pictureMaterials) material.uniforms.uGain.value = PICTURE_GAIN * this.#gain * value;
  }

  get starBrightness(): number {
    return this.#starMaterial.uniforms.uGain.value as number;
  }

  get milkyWayBrightness(): number {
    return this.#brightness;
  }

  /** Shows or hides the Milky Way picture; the catalogue stars are not affected. */
  setPictureVisible(visible: boolean): void {
    this.#pictureOn = visible;
    for (const picture of this.#pictures) picture.visible = visible;
  }

  get pictureVisible(): boolean {
    return this.#pictureOn && this.#pictures.length > 0;
  }

  /** Number of stars drawn; zero until a catalogue is set. */
  get starCount(): number {
    return this.#starCount;
  }

  /** Draws these stars (replacing any earlier set). An empty list removes them. */
  setStars(stars: readonly StarRow[]): void {
    if (this.#stars !== null) {
      this.group.remove(this.#stars);
      this.#stars.geometry.dispose();
      this.#stars = null;
    }
    this.#starCount = stars.length;
    if (stars.length === 0) return;
    const buffers = buildStarBuffers(stars);
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(buffers.directions, 3));
    geometry.setAttribute("aColour", new BufferAttribute(buffers.colours, 3));
    geometry.setAttribute("aSize", new BufferAttribute(buffers.sizesPx, 1));
    this.#stars = new Points(geometry, this.#starMaterial);
    this.#stars.renderOrder = SKY_ORDER + 1;
    this.#stars.frustumCulled = false;
    this.group.add(this.#stars);
  }

  /** Puts the sky on the camera. Orientation is the camera's alone; nothing about the scene is read. */
  follow(camera: PerspectiveCamera): void {
    this.group.position.copy(camera.position);
    // The unit sphere is scaled to sit midway between the near and far planes (the near plane moves with the zoom), so it is never clipped.
    this.group.scale.setScalar(0.5 * (camera.near + camera.far));
  }

  /** The probe direction's normalised screen position and the camera orientation it was read with. */
  probe(camera: Camera): { readonly ndc: readonly [number, number]; readonly quaternion: readonly [number, number, number, number] } {
    camera.updateMatrixWorld(true); // the camera was posed this frame; its inverse matrix is rebuilt at render
    const point = PROBE_DIRECTION.clone().add(camera.position).project(camera);
    return { ndc: [point.x, point.y], quaternion: [camera.quaternion.x, camera.quaternion.y, camera.quaternion.z, camera.quaternion.w] };
  }

  dispose(): void {
    this.setStars([]);
    this.#disposed = true;
    this.#clear();
    this.#starMaterial.dispose();
  }
}

/** The probe direction in the render frame, for tests and the browser check. */
export const SKY_PROBE_DIRECTION: readonly [number, number, number] = [PROBE_DIRECTION.x, PROBE_DIRECTION.y, PROBE_DIRECTION.z];

/** `?milkyway=off` or `?milkyway=on` overrides the experience's picture setting for a comparison; anything else is null (no override). */
export function milkyWayFromSearch(search: string): boolean | null {
  const value = new URLSearchParams(search).get("milkyway");
  return value === "off" ? false : value === "on" ? true : null;
}

/**
 * A brightness override from the address (`?stars=1.4`, `?milkywaybrightness=0.8`): null when absent. A value that is not a number
 * from 0 to 2 is ignored with a console warning, never thrown.
 */
export function brightnessFromSearch(search: string, key: "stars" | "milkywaybrightness"): number | null {
  const raw = new URLSearchParams(search).get(key);
  if (raw === null) return null;
  const value = raw.trim() === "" ? Number.NaN : Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > 2) {
    console.warn(`?${key}=${raw} ignored: the value must be a number from 0 to 2`);
    return null;
  }
  return value;
}

/** `?sky=off` hides the sky for a comparison; anything else keeps the experience's own setting. */
export function skyHiddenBySearch(search: string): boolean {
  return new URLSearchParams(search).get("sky") === "off";
}

/** `?skymap=nasa` or `?skymap=eso` overrides the picture source for a comparison; anything else is null (the experience's own setting). */
export function skyMapFromSearch(search: string): SkyMapSource | null {
  const value = new URLSearchParams(search).get("skymap");
  return (SKY_MAP_SOURCES as readonly string[]).includes(value ?? "") ? (value as SkyMapSource) : null;
}
