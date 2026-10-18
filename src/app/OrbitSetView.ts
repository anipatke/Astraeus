// The orbit lines of a body set as one batch: each member's own fitted path over about one orbital period ending at the clock time, so the
// member always sits on the head of its line (as the composition paths sample their body's own trajectory, I-035), coloured by its family.
// The look is the faint ring of the composition orbit lines (Planetary Explorer's OrbitalTrail: opacity 0.18, brightening by 0.45 as the
// camera pulls back to four orbit sizes) with the I-035 end fade at the tail (the oldest tenth fades out, so a perturbed path shows no hard
// end), done per vertex in the shader: two draws for 100+ orbits (the sampled paths, and the short head segments to the bodies' live places).
// Named deviation from the composition lines: no trailing arc.
import { BufferAttribute, BufferGeometry, Color, Group, LineSegments, ShaderMaterial, Vector3, type Camera } from "three";
import { osculatingPeriodS } from "../core/orbitPeriod";
import type { ScalePolicy } from "../core/scalePolicy";
import { familyColorOf, MAX_BODY_SET_FAMILIES, type BodySetLayer, type BodySetLook } from "./bodySet";
import type { FloatingOrigin } from "./floatingOrigin";
import { eqjToRenderVector, type RenderVector } from "./renderCoordinates";
import { sceneOffsetKm, type ScenePlacement } from "./sceneLayout";
import { TRACK_LAYER } from "./TrackedBodyView";

/** Points along each path. */
export const ORBIT_SET_SAMPLES = 128;
/** At most this many stale paths are re-sampled per frame, in turn, so no frame pays for all. */
export const ORBITS_PER_FRAME = 12;
/** The share of each path, from its tail, over which the line fades out (the I-035 end fade, Planetary Explorer's 0.1). */
export const ORBIT_TAIL_FADE = 0.1;
/** A clock jump larger than this share of a path's span (a seek, a load) re-samples that path at once rather than in turn. */
const JUMP_SHARE = 0.25;
/** Least re-sampling step and jump (simulation ms), for a path with no history loaded. */
const MIN_STEP_MS = 60_000;

const VERTEX = /* glsl */ `
attribute float aFamily;
attribute float aSize;
attribute float aFade;
uniform vec3 uColors[${MAX_BODY_SET_FAMILIES}];
uniform float uGains[${MAX_BODY_SET_FAMILIES}];
uniform vec3 uCentre;
uniform float uBase;
uniform float uBoost;
uniform float uFar;
varying vec4 vColor;
void main() {
  int family = int(aFamily + 0.5);
  float distanceRatio = distance(cameraPosition, uCentre) / max(aSize, 1e-9);
  float zoom = clamp((distanceRatio - 1.0) / (uFar - 1.0), 0.0, 1.0);
  vColor = vec4(uColors[family], aFade * min(1.0, (uBase + zoom * uBoost) * uGains[family]));
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const FRAGMENT = /* glsl */ `
varying vec4 vColor;
void main() {
  gl_FragColor = vColor;
  #include <colorspace_fragment>
}`;

/** One orbit line's source: where its body is (km about the set's centre), how far back the loaded data reach, and its period. */
interface PathSource {
  readonly family: string;
  readonly id: string;
  positionInto(timeUtcMs: number, out: Float64Array, offset: number): void;
  loadedFrom(timeUtcMs: number): number | null;
  periodMs(timeUtcMs: number): number;
}

/** How far a line is from its body on screen, for the checks. */
export interface OrbitGap {
  readonly id: string;
  /** Pixels from the body's place on screen to the nearest point of its own drawn line. */
  readonly gapPx: number;
  /** Pixels from the body to the sampled path alone (without the head segment, which always ends at the body). */
  readonly pathGapPx: number;
  /** The line's extent on screen (px), so a check knows it is looking at a real line, not a dot. */
  readonly lineSpanPx: number;
}

export class OrbitSetView {
  readonly group = new Group();
  /** Orbit lines in the batch: the set's members, then any extra bodies'. */
  readonly count: number;
  readonly #sources: readonly PathSource[];
  readonly #paths: LineSegments;
  readonly #heads: LineSegments;
  readonly #material: ShaderMaterial;
  readonly #pathPositions: BufferAttribute;
  readonly #pathSizes: BufferAttribute;
  readonly #headPositions: BufferAttribute;
  readonly #headSizes: BufferAttribute;
  /** Each path's samples (km about the centre), oldest first; when, and over how long, it was sampled; each body's place now. */
  readonly #pathKm: Float64Array;
  readonly #builtAt: Float64Array;
  readonly #spanMs: Float64Array;
  readonly #headKm: Float64Array;
  #cursor = 0;
  #policyId = "";
  #centre: RenderVector = [0, 0, 0];
  #centreKm: [number, number, number] = [0, 0, 0];
  #drawn = false;
  #unitsPerKm: number | undefined;
  /** Paths sampled so far; tests and diagnostics read it. */
  computed = 0;

  constructor(readonly layer: BodySetLayer, readonly samples: number = ORBIT_SET_SAMPLES) {
    const extra = layer.extraOrbits;
    const gm = layer.centreGmKm3S2;
    const fromGroup = (group: BodySetLayer["group"], index: number, family: string): PathSource => ({
      family,
      id: group.members[index],
      positionInto: (t, out, offset) => group.memberPositionKmInto(index, t, out, offset),
      loadedFrom: (t) => group.memberLoadedFromUtcMs(index, t),
      periodMs: (t) => { const state = group.memberStateAt(index, t); return 1000 * osculatingPeriodS(state.positionKm, state.velocityKmS ?? [0, 0, 0], gm); },
    });
    this.#sources = [
      ...layer.members.map((member, index) => fromGroup(layer.group, index, member.family)),
      ...(extra === undefined ? [] : extra.families.map((family, index) => fromGroup(extra.group, index, family))),
    ];
    const n = this.#sources.length;
    this.count = n;
    this.#pathKm = new Float64Array(n * samples * 3);
    this.#builtAt = new Float64Array(n).fill(Number.NaN);
    this.#spanMs = new Float64Array(n);
    this.#headKm = new Float64Array(n * 3);
    const familyIndex = new Map(layer.families.map((family, index) => [family.id, index]));
    const segments = samples - 1;
    // The sampled paths: one segment between each pair of consecutive samples; the oldest tenth fades out.
    const pathVertices = n * segments * 2;
    const pathFamilies = new Float32Array(pathVertices);
    const pathFade = new Float32Array(pathVertices);
    this.#sources.forEach((source, m) => {
      pathFamilies.fill(familyIndex.get(source.family)!, m * segments * 2, (m + 1) * segments * 2);
      for (let i = 0; i < segments; i += 1) {
        pathFade[2 * (m * segments + i)] = Math.min(1, i / (ORBIT_TAIL_FADE * segments));
        pathFade[2 * (m * segments + i) + 1] = Math.min(1, (i + 1) / (ORBIT_TAIL_FADE * segments));
      }
    });
    const pathGeometry = new BufferGeometry();
    this.#pathPositions = new BufferAttribute(new Float32Array(pathVertices * 3), 3);
    this.#pathSizes = new BufferAttribute(new Float32Array(pathVertices), 1);
    pathGeometry.setAttribute("position", this.#pathPositions);
    pathGeometry.setAttribute("aSize", this.#pathSizes);
    pathGeometry.setAttribute("aFamily", new BufferAttribute(pathFamilies, 1));
    pathGeometry.setAttribute("aFade", new BufferAttribute(pathFade, 1));
    // The heads: one short segment per path from its newest sample to the body's live place, rewritten every frame.
    const headGeometry = new BufferGeometry();
    const headFamilies = new Float32Array(2 * n);
    this.#sources.forEach((source, m) => headFamilies.fill(familyIndex.get(source.family)!, 2 * m, 2 * m + 2));
    this.#headPositions = new BufferAttribute(new Float32Array(2 * n * 3), 3);
    this.#headSizes = new BufferAttribute(new Float32Array(2 * n), 1);
    headGeometry.setAttribute("position", this.#headPositions);
    headGeometry.setAttribute("aSize", this.#headSizes);
    headGeometry.setAttribute("aFamily", new BufferAttribute(headFamilies, 1));
    headGeometry.setAttribute("aFade", new BufferAttribute(new Float32Array(2 * n).fill(1), 1));
    this.#material = new ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      uniforms: {
        uColors: { value: Array.from({ length: MAX_BODY_SET_FAMILIES }, () => new Color(0xffffff)) },
        uGains: { value: new Array<number>(MAX_BODY_SET_FAMILIES).fill(1) },
        uCentre: { value: new Vector3() },
        uBase: { value: 0.18 },
        uBoost: { value: 0.45 },
        uFar: { value: 4 },
      },
      transparent: true,
      depthWrite: false,
    });
    this.#paths = new LineSegments(pathGeometry, this.#material);
    this.#heads = new LineSegments(headGeometry, this.#material);
    for (const lines of [this.#paths, this.#heads]) {
      lines.frustumCulled = false;
      lines.layers.set(TRACK_LAYER);
      this.group.add(lines);
    }
    this.#paths.name = `${layer.id}-orbits`;
    this.#heads.name = `${layer.id}-orbit-heads`;
  }

  get id(): string {
    return `${this.layer.id}-orbits`;
  }

  /** How long (ms) path `index` reaches back, as last sampled: one period, or less where the loaded data begin later. */
  spanMs(index: number): number {
    return this.#spanMs[index];
  }

  /** Sample `sample` of path `index` (km about the centre) as last sampled; the last is the body's place when it was sampled. */
  pointKm(index: number, sample: number): [number, number, number] {
    const at = 3 * (index * this.samples + sample);
    return [this.#pathKm[at], this.#pathKm[at + 1], this.#pathKm[at + 2]];
  }

  /** The body's place (km about the centre) at the last sync: the head of its line. */
  headKm(index: number): [number, number, number] {
    return [this.#headKm[3 * index], this.#headKm[3 * index + 1], this.#headKm[3 * index + 2]];
  }

  /**
   * Brings every head to the clock time and re-samples paths: all of them at the start or on a scale change, any whose clock jumped by
   * more than a quarter of its span, then the stale ones (the clock has moved a sample step past them) a few per frame in turn.
   */
  sync(timeUtcMs: number, placement: ScenePlacement, policy: ScalePolicy, enabled: boolean): void {
    const { group } = this.layer;
    const bounds = group.bounds!;
    this.#drawn = enabled && timeUtcMs >= bounds.startUtcMs && timeUtcMs <= bounds.endUtcMs;
    if (!this.#drawn) return;
    const offset = sceneOffsetKm(placement, group.center, timeUtcMs);
    this.#centreKm = [offset?.[0] ?? 0, offset?.[1] ?? 0, offset?.[2] ?? 0];
    this.#centre = eqjToRenderVector(policy.mapPosition(this.#centreKm));
    this.#unitsPerKm = policy.linearUnitsPerKm;
    const n = this.count;
    for (let m = 0; m < n; m += 1) this.#sources[m].positionInto(timeUtcMs, this.#headKm, 3 * m);
    const whole = policy.id !== this.#policyId;
    this.#policyId = policy.id;
    let budget = ORBITS_PER_FRAME;
    const start = this.#cursor;
    for (let k = 0; k < n; k += 1) {
      const m = (start + k) % n;
      const built = this.#builtAt[m];
      const span = this.#spanMs[m];
      const moved = timeUtcMs - built;
      const jumped = !(Math.abs(moved) <= Math.max(JUMP_SHARE * span, MIN_STEP_MS)) || moved < 0;
      if (whole || jumped) {
        this.#sample(m, timeUtcMs, policy);
      } else if (budget > 0 && moved >= Math.max(span / (this.samples - 1), MIN_STEP_MS)) {
        this.#sample(m, timeUtcMs, policy);
        budget -= 1;
        this.#cursor = (m + 1) % n;
      }
    }
    this.#writeHeads(policy);
  }

  /** Samples one path over one period ending at `timeUtcMs` (shorter where the loaded data begin later), and maps it for drawing. */
  #sample(m: number, timeUtcMs: number, policy: ScalePolicy): void {
    const source = this.#sources[m];
    const from = source.loadedFrom(timeUtcMs) ?? timeUtcMs;
    const span = Math.max(0, Math.min(source.periodMs(timeUtcMs), timeUtcMs - from));
    const s = this.samples;
    for (let i = 0; i < s; i += 1) source.positionInto(i === s - 1 ? timeUtcMs : Math.round(timeUtcMs - span + (span * i) / (s - 1)), this.#pathKm, 3 * (m * s + i));
    this.#builtAt[m] = timeUtcMs;
    this.#spanMs[m] = span;
    this.computed += 1;
    this.#mapPath(m, policy);
  }

  /** Scaled render-axis position, relative to the mapped centre, of a point given in km about the centre. */
  #mapped(policy: ScalePolicy, km: Float64Array, at: number, out: Float32Array, to: number): void {
    const linear = this.#unitsPerKm;
    if (linear !== undefined) {
      // A policy that only scales: the mapped centre cancels, and the render axes are (x, z, -y) of EQJ (eqjToRenderVector).
      out[to] = km[at] * linear;
      out[to + 1] = km[at + 2] * linear;
      out[to + 2] = -km[at + 1] * linear;
      return;
    }
    const [cx, cy, cz] = this.#centreKm;
    const render = eqjToRenderVector(policy.mapPosition([km[at] + cx, km[at + 1] + cy, km[at + 2] + cz]));
    out[to] = render[0] - this.#centre[0];
    out[to + 1] = render[1] - this.#centre[1];
    out[to + 2] = render[2] - this.#centre[2];
  }

  /** The path's size for the zoom brightening: its farthest sample from the centre, scaled. */
  #sizeOf(m: number, policy: ScalePolicy): number {
    let widest = 0;
    const s = this.samples;
    for (let i = 0; i < s; i += 1) {
      const at = 3 * (m * s + i);
      widest = Math.max(widest, Math.hypot(this.#pathKm[at], this.#pathKm[at + 1], this.#pathKm[at + 2]));
    }
    return policy.mapPosition([widest, 0, 0])[0];
  }

  #mapPath(m: number, policy: ScalePolicy): void {
    const s = this.samples;
    const segments = s - 1;
    const out = this.#pathPositions.array as Float32Array;
    const sizes = this.#pathSizes.array as Float32Array;
    const size = this.#sizeOf(m, policy);
    for (let i = 0; i < segments; i += 1) {
      const v = 2 * (m * segments + i);
      this.#mapped(policy, this.#pathKm, 3 * (m * s + i), out, 3 * v);
      this.#mapped(policy, this.#pathKm, 3 * (m * s + i + 1), out, 3 * v + 3);
      sizes[v] = size;
      sizes[v + 1] = size;
    }
    this.#pathPositions.addUpdateRange(3 * 2 * m * segments, 3 * 2 * segments);
    this.#pathPositions.needsUpdate = true;
    this.#pathSizes.addUpdateRange(2 * m * segments, 2 * segments);
    this.#pathSizes.needsUpdate = true;
  }

  #writeHeads(policy: ScalePolicy): void {
    const s = this.samples;
    const out = this.#headPositions.array as Float32Array;
    const sizes = this.#headSizes.array as Float32Array;
    const pathSizes = this.#pathSizes.array as Float32Array;
    for (let m = 0; m < this.count; m += 1) {
      this.#mapped(policy, this.#pathKm, 3 * (m * s + s - 1), out, 6 * m);
      this.#mapped(policy, this.#headKm, 3 * m, out, 6 * m + 3);
      sizes[2 * m] = sizes[2 * m + 1] = pathSizes[2 * m * (s - 1)];
    }
    this.#headPositions.needsUpdate = true;
    this.#headSizes.needsUpdate = true;
  }

  /** Moves the batch with the floating origin and applies the live look (colours and opacities are uniforms: no buffer is rewritten). */
  place(origin: FloatingOrigin, look: BodySetLook, trueScale: boolean): void {
    this.#paths.visible = this.#drawn;
    this.#heads.visible = this.#drawn;
    if (!this.#drawn) return;
    const local = origin.toLocal(this.#centre);
    this.#paths.position.set(local[0], local[1], local[2]);
    this.#heads.position.set(local[0], local[1], local[2]);
    const uniforms = this.#material.uniforms;
    (uniforms.uCentre.value as Vector3).set(local[0], local[1], local[2]);
    uniforms.uBase.value = look.orbitOpacity;
    uniforms.uBoost.value = look.orbitZoomBoost;
    uniforms.uFar.value = look.orbitZoomFarRatio;
    this.layer.families.forEach((family, index) => {
      (uniforms.uColors.value as Color[])[index].set(familyColorOf(this.layer, look, family.id));
      (uniforms.uGains.value as number[])[index] = look.familyGains[family.id] ?? 1;
    });
    this.#material.depthTest = trueScale;
  }

  /**
   * For the checks: for the lines whose bodies are in view (the nearest `limit` to the camera), the on-screen distance from each body to the
   * nearest point of its own drawn line (the sampled path and the head segment), and the line's extent on screen. Reads the drawn vertices.
   */
  gapReadout(camera: Camera, widthPx: number, heightPx: number, limit = 12): OrbitGap[] {
    if (!this.#drawn) return [];
    camera.updateMatrixWorld();
    const offset = this.#paths.position;
    const point = new Vector3();
    const toScreen = (array: ArrayLike<number>, at: number): [number, number, number] => {
      point.set(array[at] + offset.x, array[at + 1] + offset.y, array[at + 2] + offset.z).project(camera);
      return [((point.x + 1) / 2) * widthPx, ((1 - point.y) / 2) * heightPx, point.z];
    };
    const heads = this.#headPositions.array as Float32Array;
    const paths = this.#pathPositions.array as Float32Array;
    const candidates: { m: number; distance: number; screen: [number, number, number] }[] = [];
    for (let m = 0; m < this.count; m += 1) {
      const screen = toScreen(heads, 6 * m + 3);
      if (screen[2] < -1 || screen[2] > 1 || screen[0] < 0 || screen[0] > widthPx || screen[1] < 0 || screen[1] > heightPx) continue;
      const distance = Math.hypot(heads[6 * m + 3] + offset.x - camera.position.x, heads[6 * m + 4] + offset.y - camera.position.y, heads[6 * m + 5] + offset.z - camera.position.z);
      candidates.push({ m, distance, screen });
    }
    candidates.sort((a, b) => a.distance - b.distance);
    const segments = this.samples - 1;
    return candidates.slice(0, limit).map(({ m, screen }) => {
      const ends: [number, number][] = [];
      for (let i = 0; i < segments; i += 1) {
        const a = toScreen(paths, 3 * 2 * (m * segments + i));
        const b = toScreen(paths, 3 * (2 * (m * segments + i) + 1));
        if (a[2] >= -1 && a[2] <= 1 && b[2] >= -1 && b[2] <= 1) ends.push([a[0], a[1]], [b[0], b[1]]);
      }
      const head = toScreen(heads, 6 * m);
      ends.push([head[0], head[1]], [screen[0], screen[1]]);
      let gap = Number.POSITIVE_INFINITY;
      for (let k = 0; k + 1 < ends.length; k += 2) gap = Math.min(gap, segmentDistance(screen[0], screen[1], ends[k], ends[k + 1]));
      // The head segment always ends at the body; the gap that matters is to the sampled path, so measure it without the head too.
      let pathGap = Number.POSITIVE_INFINITY;
      for (let k = 0; k + 1 < ends.length - 2; k += 2) pathGap = Math.min(pathGap, segmentDistance(screen[0], screen[1], ends[k], ends[k + 1]));
      const xs = ends.map((e) => e[0]);
      const ys = ends.map((e) => e[1]);
      return { id: this.#sources[m].id, gapPx: Number(Math.min(gap, pathGap).toFixed(3)), pathGapPx: Number(pathGap.toFixed(3)), lineSpanPx: Math.round(Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys))) };
    });
  }

  /** The colour family `family`'s lines are drawn in now (for tests and the browser readout). */
  colorOfFamily(index: number): string {
    return `#${(this.#material.uniforms.uColors.value as Color[])[index].getHexString()}`;
  }

  dispose(): void {
    this.#paths.geometry.dispose();
    this.#heads.geometry.dispose();
    this.#material.dispose();
  }
}

/** Distance (px) from a point to a segment on screen. */
function segmentDistance(x: number, y: number, a: [number, number], b: [number, number]): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const length2 = dx * dx + dy * dy;
  const t = length2 === 0 ? 0 : Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / length2));
  return Math.hypot(x - (a[0] + t * dx), y - (a[1] + t * dy));
}
