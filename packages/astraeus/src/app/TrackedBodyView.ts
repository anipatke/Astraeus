import {
  BufferAttribute,
  BufferGeometry,
  DataTexture,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  Points,
  RGBAFormat,
  SphereGeometry,
  Vector3,
  type Camera,
} from "three";
import { dotMaterial } from "./dotMaterial";
import type { ScalePolicy } from "../core/scalePolicy";
import type { FloatingOrigin } from "./floatingOrigin";
import type { PathScreenReadout } from "./PathView";
import { anchorLabelsOf, markerRadiusUnits, sampleTrackedPositions, stateClampedToBounds, stateIfInBounds, travelledCount, type TrackedBody } from "./mission";
import { mapPathKm, relativeTrailKm, shiftedBy, type PathSamples } from "./pathRules";
import { eqjToRenderVector, type RenderVector } from "./renderCoordinates";
import type { PathRule } from "./experienceDefinition";
import { sceneOffsetKm, trackedAbsolute, type ScenePlacement } from "./sceneLayout";

/** Drawn after Earth and Moon so overlays are never swallowed by a body in a compressed scale. */
export const TRACK_LAYER = 3;

function lineWithCapacity(count: number, color: string, opacity: number): Line {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array((count + 1) * 3), 3));
  geometry.setDrawRange(0, 0);
  const line = new Line(geometry, new LineBasicMaterial({ color, transparent: true, opacity }));
  line.frustumCulled = false;
  line.layers.set(TRACK_LAYER);
  return line;
}

const ANCHOR_SPRITE_PX = 64;
let anchorSprite: DataTexture | null = null;

/**
 * Round sprite for source anchors: a crisp ring around a soft centre dot, so a data point reads as a
 * point rather than the square an untextured WebGL point draws. Built from pixels, not a canvas, so it
 * also works where there is no DOM.
 */
export function anchorSpriteTexture(): DataTexture {
  if (anchorSprite !== null) return anchorSprite;
  const size = ANCHOR_SPRITE_PX;
  const pixels = new Uint8Array(size * size * 4);
  const smooth = (edge0: number, edge1: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  };
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const r = Math.hypot(x + 0.5 - size / 2, y + 0.5 - size / 2) / (size / 2);
      const ring = smooth(0.6, 0.68, r) * (1 - smooth(0.86, 0.94, r));
      const dot = 1 - smooth(0.2, 0.3, r);
      const alpha = Math.max(ring, dot * 0.9);
      pixels.set([255, 255, 255, Math.round(alpha * 255)], (y * size + x) * 4);
    }
  }
  anchorSprite = new DataTexture(pixels, size, size, RGBAFormat);
  anchorSprite.needsUpdate = true;
  return anchorSprite;
}

/** Frees the shared anchor picture on every renderer that drew it (an unmounted scene's renderer must not stay reachable through it); the next anchor makes a new one. */
export function releaseAnchorSprite(): void {
  anchorSprite?.dispose();
  anchorSprite = null;
}

/**
 * Marker, travelled/future path and anchor dots for one tracked body. Every position goes through
 * stateAt -> ScalePolicy -> render axes -> floating origin, exactly like Earth and the Moon.
 */
export class TrackedBodyView {
  /** Every tracked body's path is one rule, a relative trail (`pathRules.ts`); the body it is drawn against is the path's own `lineFixedTo`, default the scene centre. */
  static readonly pathRule: PathRule = Object.freeze({ kind: "trail", frame: "relative" });
  readonly group = new Group();
  readonly #marker: Mesh;
  readonly #travelled: Line;
  readonly #future: Line;
  readonly #anchors: Points;
  readonly #samples: ReturnType<typeof sampleTrackedPositions>;
  readonly #anchorKm: Float64Array;
  #mappedFor = "";
  #mappedAt = 0;
  #placedFor: string | null = null;
  #mappedPath: Float64Array = new Float64Array(0);
  #mappedAnchors: Float64Array = new Float64Array(0);
  readonly #materials: readonly { depthTest: boolean }[];
  /** Anchor labels in anchor order, or null when the body has none. */
  readonly anchorLabels: readonly string[] | null;

  constructor(readonly body: TrackedBody) {
    this.anchorLabels = anchorLabelsOf(body);
    this.#samples = sampleTrackedPositions(body.trajectory, body.pathTimesUtcMs);
    this.#anchorKm = sampleTrackedPositions(body.trajectory, body.anchorTimesUtcMs).positionsKm;
    const count = body.pathTimesUtcMs.length;
    this.#travelled = lineWithCapacity(count, body.color, 0.95);
    this.#future = lineWithCapacity(count, body.color, 0.3);
    this.#marker = new Mesh(new SphereGeometry(1, 12, 8), new MeshBasicMaterial({ color: body.color }));
    this.#marker.layers.set(TRACK_LAYER);
    const anchorGeometry = new BufferGeometry();
    anchorGeometry.setAttribute("position", new BufferAttribute(new Float32Array(this.#anchorKm.length), 3));
    this.#anchors = new Points(
      anchorGeometry,
      dotMaterial({
        color: "#f0e6da",
        map: anchorSpriteTexture(),
        size: 9,
        sizeAttenuation: false,
        transparent: true,
        opacity: 0.85,
        alphaTest: 0.05,
        depthWrite: false,
      }),
    );
    this.#anchors.frustumCulled = false;
    this.#anchors.layers.set(TRACK_LAYER);
    this.#materials = [this.#travelled, this.#future, this.#anchors, this.#marker]
      .map((object) => object.material as { depthTest: boolean });
    this.group.add(this.#travelled, this.#future, this.#anchors, this.#marker);
  }

  /** Scaled absolute target for the camera; holds the nearest bound outside the trajectory. */
  absolute(timeUtcMs: number, policy: ScalePolicy, placement: ScenePlacement): RenderVector {
    return trackedAbsolute(stateClampedToBounds(this.body, timeUtcMs), policy, placement);
  }

  update(timeUtcMs: number, policy: ScalePolicy, origin: FloatingOrigin, camera: Camera, placement: ScenePlacement): void {
    this.#remap(policy, placement, timeUtcMs);
    // Mapped positions are not consistent with body radii in ReadableScale, so only TrueScale occludes.
    const occlude = policy.id === "true-scale";
    for (const material of this.#materials) material.depthTest = occlude;
    const state = stateIfInBounds(this.body, timeUtcMs);
    const current = state === null ? null : trackedAbsolute(state, policy, placement);
    const split = travelledCount(this.#samples.timesUtcMs, timeUtcMs);
    const total = this.#samples.timesUtcMs.length;
    this.#fillPath(this.#travelled, 0, split, null, current, origin);
    this.#fillPath(this.#future, split, total, current, null, origin);
    this.#fillAnchors(origin);

    this.#marker.visible = current !== null;
    if (current !== null) {
      const local = origin.toLocal(current);
      this.#marker.position.set(local[0], local[1], local[2]);
      this.#marker.scale.setScalar(markerRadiusUnits(this.#marker.position.distanceTo(camera.position)));
    }
  }

  /**
   * A relative trail (`pathRules.ts`): each sample is the body's position from `lineFixedTo` (default the scene centre) at that sample's own time.
   * A line fixed to a body other than the scene centre is carried to where that body is from the centre at the display time, so it
   * is remapped as the clock moves; a line against the scene centre depends on the centre and scale alone.
   */
  #remap(policy: ScalePolicy, placement: ScenePlacement, timeUtcMs: number): void {
    const placed = placement.center;
    const moves = this.#against(placement) !== placed;
    if (this.#mappedFor === policy.id && this.#placedFor === placed && (!moves || this.#mappedAt === timeUtcMs)) return;
    this.#mappedPath = mapPathKm(this.#relative(this.#samples, placement, timeUtcMs), policy);
    this.#mappedAnchors = mapPathKm(this.#relative({ timesUtcMs: this.body.anchorTimesUtcMs, positionsKm: this.#anchorKm }, placement, timeUtcMs), policy);
    this.#mappedFor = policy.id;
    this.#placedFor = placed;
    this.#mappedAt = timeUtcMs;
  }

  #against(placement: ScenePlacement): string {
    return this.body.lineFixedTo ?? placement.center;
  }

  #relative(samples: PathSamples, placement: ScenePlacement, timeUtcMs: number): Float64Array {
    if (samples.timesUtcMs.length === 0) return samples.positionsKm;
    const against = this.#against(placement);
    const drawn = relativeTrailKm(samples, this.body.trajectory.stateAt(samples.timesUtcMs[0]).center, placement, against);
    const carry = sceneOffsetKm(placement, against, timeUtcMs);
    return carry === null ? drawn : shiftedBy(drawn, carry);
  }

  /** Writes [leading?] samples [from, to) [trailing?] into the line and sets how much of it is drawn. */
  #fillPath(
    line: Line,
    from: number,
    to: number,
    leading: RenderVector | null,
    trailing: RenderVector | null,
    origin: FloatingOrigin,
  ): void {
    const positions = line.geometry.getAttribute("position") as BufferAttribute;
    const local: [number, number, number] = [0, 0, 0];
    let written = 0;
    const push = (render: ArrayLike<number>) => {
      origin.toLocal(render, local);
      positions.setXYZ(written, local[0], local[1], local[2]);
      written += 1;
    };
    if (leading !== null) push(leading);
    for (let i = from; i < to; i += 1) push(eqjToRenderVector(this.#mappedPath.subarray(i * 3, i * 3 + 3)));
    if (trailing !== null) push(trailing);
    positions.needsUpdate = true;
    line.geometry.setDrawRange(0, written >= 2 ? written : 0);
  }

  /**
   * Diagnostic for the browser checks (`data-paths`, O-046 T-193): whether the path is drawn, the vertices of its two lines (travelled and future) in front of the camera and inside the view, and the box they cover
   * as shares of the view. Both lines together are the whole path, so a line fixed to the Sun reads the same at any time. The line box repeats the vertex box.
   */
  screenReadout(camera: Camera): PathScreenReadout {
    camera.updateMatrixWorld();
    const point = new Vector3();
    let [vertices, inView, minX, maxX, minY, maxY] = [0, 0, 1, 0, 1, 0];
    for (const line of [this.#travelled, this.#future]) {
      const positions = line.geometry.getAttribute("position") as BufferAttribute;
      const drawn = line.geometry.drawRange.count;
      vertices += drawn;
      for (let i = 0; i < drawn; i += 1) {
        point.fromBufferAttribute(positions, i).applyMatrix4(camera.matrixWorldInverse);
        if (point.z >= 0) continue;
        point.applyMatrix4(camera.projectionMatrix);
        if (Math.abs(point.x) > 1 || Math.abs(point.y) > 1) continue;
        const [x, y] = [(point.x + 1) / 2, (1 - point.y) / 2];
        inView += 1;
        minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
    }
    return { id: this.body.id, visible: this.group.visible && vertices > 0, vertices, inView, minX, maxX, minY, maxY, lineMinX: minX, lineMaxX: maxX, lineMinY: minY, lineMaxY: maxY, axisDeg: 0, aspect: (camera as { aspect?: number }).aspect ?? 1, look: null };
  }

  /** Local (floating-origin) render position of anchor `index` as last drawn. */
  anchorLocalPosition(index: number, out: Vector3): Vector3 {
    return out.fromBufferAttribute(this.#anchors.geometry.getAttribute("position") as BufferAttribute, index);
  }

  #fillAnchors(origin: FloatingOrigin): void {
    const positions = this.#anchors.geometry.getAttribute("position") as BufferAttribute;
    const local: [number, number, number] = [0, 0, 0];
    for (let i = 0; i < this.#mappedAnchors.length / 3; i += 1) {
      origin.toLocal(eqjToRenderVector(this.#mappedAnchors.subarray(i * 3, i * 3 + 3)), local);
      positions.setXYZ(i, local[0], local[1], local[2]);
    }
    positions.needsUpdate = true;
  }
}
