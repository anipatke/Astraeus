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
  PointsMaterial,
  RGBAFormat,
  SphereGeometry,
  type Camera,
  type Vector3,
} from "three";
import type { ScalePolicy } from "../core/scalePolicy";
import type { FloatingOrigin } from "./floatingOrigin";
import { anchorLabelsOf, markerRadiusUnits, sampleTrackedPositions, stateClampedToBounds, stateIfInBounds, travelledCount, type TrackedBody } from "./mission";
import { mapOrbitPath } from "./orbitPath";
import { eqjToRenderVector, type RenderVector } from "./renderCoordinates";
import { trackedAbsolute } from "./sceneLayout";

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

/**
 * Marker, travelled/future path and anchor dots for one tracked body. Every position goes through
 * stateAt -> ScalePolicy -> render axes -> floating origin, exactly like Earth and the Moon.
 */
export class TrackedBodyView {
  readonly group = new Group();
  readonly #marker: Mesh;
  readonly #travelled: Line;
  readonly #future: Line;
  readonly #anchors: Points;
  readonly #samples: ReturnType<typeof sampleTrackedPositions>;
  readonly #anchorKm: Float64Array;
  #mappedFor = "";
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
      new PointsMaterial({
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
  absolute(timeUtcMs: number, policy: ScalePolicy): RenderVector {
    return trackedAbsolute(stateClampedToBounds(this.body, timeUtcMs), policy);
  }

  update(timeUtcMs: number, policy: ScalePolicy, origin: FloatingOrigin, camera: Camera): void {
    this.#remap(policy);
    // Mapped positions are not consistent with body radii in ReadableScale, so only TrueScale occludes.
    const occlude = policy.id === "true-scale";
    for (const material of this.#materials) material.depthTest = occlude;
    const state = stateIfInBounds(this.body, timeUtcMs);
    const current = state === null ? null : trackedAbsolute(state, policy);
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

  #remap(policy: ScalePolicy): void {
    if (this.#mappedFor === policy.id) return;
    this.#mappedPath = mapOrbitPath(this.#samples, policy);
    this.#mappedAnchors = mapOrbitPath({ timesUtcMs: this.body.anchorTimesUtcMs, positionsKm: this.#anchorKm }, policy);
    this.#mappedFor = policy.id;
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
