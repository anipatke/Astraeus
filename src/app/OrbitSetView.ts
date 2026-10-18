// The orbit lines of a body set as one batch (one draw call): each member's osculating ellipse about the set's centre at the clock time,
// coloured by its family. The look is the faint ring of the composition orbit lines (Planetary Explorer's OrbitalTrail: opacity 0.18,
// brightening by 0.45 as the camera pulls back to four orbit sizes), done per vertex in the shader so 100+ orbits cost one draw.
// Named deviation from the composition lines: no trailing arc and no end fade (an osculating ellipse is closed and passes through the
// member at the clock time, so there is no end to fade).
import { BufferAttribute, BufferGeometry, Color, Group, LineSegments, ShaderMaterial, Vector3 } from "three";
import type { ScalePolicy } from "../core/scalePolicy";
import { familyColorOf, MAX_BODY_SET_FAMILIES, osculatingEllipseInto, type BodySetLayer, type BodySetLook } from "./bodySet";
import type { FloatingOrigin } from "./floatingOrigin";
import { eqjToRenderVector, type RenderVector } from "./renderCoordinates";
import { sceneOffsetKm, type ScenePlacement } from "./sceneLayout";
import { TRACK_LAYER } from "./TrackedBodyView";

/** Points per ellipse. */
export const ORBIT_SET_SAMPLES = 128;
/** At most this many ellipses are recomputed per frame while the clock plays, in turn, so no frame pays for all. */
export const ORBITS_PER_FRAME = 16;
/**
 * An ellipse is recomputed once the clock has moved this far (simulation ms) since it was last computed: osculating elements change
 * slowly, and the line still passes within a hair of the moon (a Metis-like inner moon drifts by well under a pixel at any framing that
 * shows its orbit). Keeps the work per real second bounded at fast playback.
 */
export const ORBIT_REFRESH_MS = 30 * 60_000;
/** A clock jump larger than this (simulation ms) recomputes every ellipse at once (a seek or a load). */
const JUMP_MS = 6 * 3_600_000;

const VERTEX = /* glsl */ `
attribute float aFamily;
attribute float aSize;
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
  vColor = vec4(uColors[family], min(1.0, (uBase + zoom * uBoost) * uGains[family]));
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const FRAGMENT = /* glsl */ `
varying vec4 vColor;
void main() {
  gl_FragColor = vColor;
  #include <colorspace_fragment>
}`;

export class OrbitSetView {
  readonly group = new Group();
  readonly #lines: LineSegments;
  readonly #material: ShaderMaterial;
  readonly #positions: BufferAttribute;
  readonly #sizes: BufferAttribute;
  /** Each ellipse's points (km about the centre) and its scaled copy relative to the mapped centre. */
  readonly #ellipseKm: Float64Array;
  readonly #semiMajorKm: Float64Array;
  readonly #computedAt: Float64Array;
  #cursor = 0;
  #lastTimeUtcMs = Number.NaN;
  #policyId = "";
  #centre: RenderVector = [0, 0, 0];
  #centreKm: [number, number, number] = [0, 0, 0];
  #drawn = false;
  /** Ellipses recomputed so far; tests and diagnostics read it. */
  computed = 0;
  /** Orbit lines in the batch: the set's members, then any extra bodies'. */
  readonly count: number;
  readonly #stateAt: (index: number, timeUtcMs: number) => ReturnType<BodySetLayer["group"]["memberStateAt"]>;

  constructor(readonly layer: BodySetLayer, readonly samples: number = ORBIT_SET_SAMPLES) {
    const extra = layer.extraOrbits;
    const memberFamilies = [...layer.members.map((member) => member.family), ...(extra?.families ?? [])];
    this.#stateAt = (m, t) => (m < layer.members.length ? layer.group.memberStateAt(m, t) : extra!.group.memberStateAt(m - layer.members.length, t));
    const n = memberFamilies.length;
    this.count = n;
    const vertices = n * samples * 2;
    this.#ellipseKm = new Float64Array(n * samples * 3);
    this.#semiMajorKm = new Float64Array(n);
    this.#computedAt = new Float64Array(n).fill(Number.NaN);
    const geometry = new BufferGeometry();
    this.#positions = new BufferAttribute(new Float32Array(vertices * 3), 3);
    this.#sizes = new BufferAttribute(new Float32Array(vertices), 1);
    const families = new Float32Array(vertices);
    const familyIndex = new Map(layer.families.map((family, index) => [family.id, index]));
    memberFamilies.forEach((family, m) => families.fill(familyIndex.get(family)!, m * samples * 2, (m + 1) * samples * 2));
    geometry.setAttribute("position", this.#positions);
    geometry.setAttribute("aSize", this.#sizes);
    geometry.setAttribute("aFamily", new BufferAttribute(families, 1));
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
    this.#lines = new LineSegments(geometry, this.#material);
    this.#lines.frustumCulled = false;
    this.#lines.layers.set(TRACK_LAYER);
    this.#lines.name = `${layer.id}-orbits`;
    this.group.add(this.#lines);
  }

  get id(): string {
    return `${this.layer.id}-orbits`;
  }

  /** Semi-major axis (km) of member `index`'s ellipse as last computed; 0 before. */
  semiMajorKm(index: number): number {
    return this.#semiMajorKm[index];
  }

  /** Point `sample` of member `index`'s ellipse, km about the centre, as last computed. */
  pointKm(index: number, sample: number): [number, number, number] {
    const at = 3 * (index * this.samples + sample);
    return [this.#ellipseKm[at], this.#ellipseKm[at + 1], this.#ellipseKm[at + 2]];
  }

  /** Recomputes ellipses: all of them after a jump, a scale change or at the start; otherwise the next few in turn. */
  sync(timeUtcMs: number, placement: ScenePlacement, policy: ScalePolicy, enabled: boolean): void {
    const { group } = this.layer;
    const bounds = group.bounds!;
    this.#drawn = enabled && timeUtcMs >= bounds.startUtcMs && timeUtcMs <= bounds.endUtcMs;
    if (!this.#drawn) return;
    const offset = sceneOffsetKm(placement, group.center, timeUtcMs);
    this.#centreKm = [offset?.[0] ?? 0, offset?.[1] ?? 0, offset?.[2] ?? 0];
    this.#centre = eqjToRenderVector(policy.mapPosition(this.#centreKm));
    const n = this.count;
    const whole = policy.id !== this.#policyId || !(Math.abs(timeUtcMs - this.#lastTimeUtcMs) <= JUMP_MS);
    if (whole) {
      for (let m = 0; m < n; m += 1) this.#compute(m, timeUtcMs);
      this.#remap(0, n, policy);
      this.#policyId = policy.id;
    } else if (timeUtcMs !== this.#lastTimeUtcMs) {
      // The next stale ellipses in turn, at most ORBITS_PER_FRAME of them, as one contiguous range for the upload.
      let from = this.#cursor;
      let scanned = 0;
      while (scanned < n && !(Math.abs(timeUtcMs - this.#computedAt[from]) >= ORBIT_REFRESH_MS)) { from = (from + 1) % n; scanned += 1; }
      if (scanned < n) {
        let to = from;
        while (to < n && to - from < ORBITS_PER_FRAME && Math.abs(timeUtcMs - this.#computedAt[to]) >= ORBIT_REFRESH_MS) { this.#compute(to, timeUtcMs); to += 1; }
        this.#remap(from, to, policy);
        this.#cursor = to === n ? 0 : to;
      }
    }
    this.#lastTimeUtcMs = timeUtcMs;
  }

  #compute(m: number, timeUtcMs: number): void {
    const state = this.#stateAt(m, timeUtcMs);
    this.#computedAt[m] = timeUtcMs;
    this.#semiMajorKm[m] = osculatingEllipseInto(state.positionKm, state.velocityKmS ?? [0, 0, 0], this.layer.centreGmKm3S2, this.samples, this.#ellipseKm, 3 * m * this.samples);
    this.computed += 1;
  }

  /** Members [from, to) through the policy (relative to the mapped centre), as segment pairs, and only that range sent to the GPU. */
  #remap(from: number, to: number, policy: ScalePolicy): void {
    if (to <= from) return;
    const out = this.#positions.array as Float32Array;
    const sizes = this.#sizes.array as Float32Array;
    const point = new Float64Array(3);
    const [cx, cy, cz] = this.#centreKm;
    const [mx, my, mz] = this.#centre;
    const s = this.samples;
    const mapped = new Float64Array(3 * s);
    const linear = policy.linearUnitsPerKm;
    for (let m = from; m < to; m += 1) {
      for (let i = 0; i < s; i += 1) {
        const at = 3 * (m * s + i);
        if (linear !== undefined) {
          // A policy that only scales: the mapped centre cancels, and the render axes are (x, z, -y) of EQJ (eqjToRenderVector).
          mapped[3 * i] = this.#ellipseKm[at] * linear;
          mapped[3 * i + 1] = this.#ellipseKm[at + 2] * linear;
          mapped[3 * i + 2] = -this.#ellipseKm[at + 1] * linear;
          continue;
        }
        point[0] = this.#ellipseKm[at] + cx;
        point[1] = this.#ellipseKm[at + 1] + cy;
        point[2] = this.#ellipseKm[at + 2] + cz;
        const render = eqjToRenderVector(policy.mapPosition(point));
        mapped[3 * i] = render[0] - mx;
        mapped[3 * i + 1] = render[1] - my;
        mapped[3 * i + 2] = render[2] - mz;
      }
      const size = linear !== undefined ? this.#semiMajorKm[m] * linear : policy.mapPosition([this.#semiMajorKm[m], 0, 0])[0];
      for (let i = 0; i < s; i += 1) {
        const j = (i + 1) % s;
        const at = 6 * (m * s + i);
        out[at] = mapped[3 * i];
        out[at + 1] = mapped[3 * i + 1];
        out[at + 2] = mapped[3 * i + 2];
        out[at + 3] = mapped[3 * j];
        out[at + 4] = mapped[3 * j + 1];
        out[at + 5] = mapped[3 * j + 2];
        const v = 2 * (m * s + i);
        sizes[v] = size;
        sizes[v + 1] = size;
      }
    }
    const first = 2 * from * s;
    const count = 2 * (to - from) * s;
    this.#positions.addUpdateRange(3 * first, 3 * count);
    this.#positions.needsUpdate = true;
    this.#sizes.addUpdateRange(first, count);
    this.#sizes.needsUpdate = true;
  }

  /** Moves the batch with the floating origin and applies the live look (colours and opacities are uniforms: no buffer is rewritten). */
  place(origin: FloatingOrigin, look: BodySetLook, trueScale: boolean): void {
    this.#lines.visible = this.#drawn;
    if (!this.#drawn) return;
    const local = origin.toLocal(this.#centre);
    this.#lines.position.set(local[0], local[1], local[2]);
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

  /** The colour family `family`'s lines are drawn in now (for tests and the browser readout). */
  colorOfFamily(index: number): string {
    return `#${(this.#material.uniforms.uColors.value as Color[])[index].getHexString()}`;
  }

  dispose(): void {
    this.#lines.geometry.dispose();
    this.#material.dispose();
  }
}
