// The members of a body set as one batch of dots (one draw call, like the showers' points) and one batch of balls (an instanced sphere,
// one draw call). A dot has a pixel floor, so a member never vanishes; the ball is the member at its true size and is drawn with the depth
// test, so once it is wider on screen than the dot it covers the dot (the dot sits at the ball's centre, behind its near surface).
import {
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  Color,
  DirectionalLight,
  Group,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  MeshLambertMaterial,
  Points,
  type PointsMaterial,
  SphereGeometry,
  Vector3,
  type PerspectiveCamera,
} from "three";
import { dotMaterial } from "./dotMaterial";
import type { BodyId } from "../core/body";
import type { ScalePolicy } from "../core/scalePolicy";
import type { StateResolver } from "../core/stateResolver";
import { projectedRadiusPx } from "./bodyDraw";
import type { PointsScreenReadout } from "./PointsView";
import type { BodySetLayer, BodySetLook } from "./bodySet";
import type { FloatingOrigin } from "./floatingOrigin";
import { bodyLightDirections } from "./lighting";
import { eqjToRenderVector, type RenderVector } from "./renderCoordinates";
import { sceneOffsetKm, type ScenePlacement } from "./sceneLayout";
import { TRACK_LAYER } from "./TrackedBodyView";

/** Light on the balls: Io's own (ambient 0.08, directional 1.4), so a small moon is lit like the mapped moons beside it. */
const BALL_LIGHT = { ambient: 0.08, directional: 1.4 } as const;

/** Where a member is on screen this frame (CSS px from the canvas's top left), and how wide its ball is there. */
export interface MemberScreen {
  x: number;
  y: number;
  /** In front of the camera and inside the view. */
  visible: boolean;
  /** The ball's radius on screen, px. */
  radiusPx: number;
  /** Camera distance, scaled units. */
  distance: number;
}

export class BodySetView {
  readonly group = new Group();
  /** Scaled absolute positions (render axes, Float64), 3 per member, at the last sync. */
  readonly absolutes: Float64Array;
  readonly screen: MemberScreen[];
  readonly #km: Float64Array;
  readonly #positions: BufferAttribute;
  readonly #colours: BufferAttribute;
  readonly #dotColour = new Color();
  readonly #litColour = new Color();
  readonly #points: Points;
  readonly #pointMaterial: PointsMaterial;
  readonly #balls: InstancedMesh;
  readonly #ballMaterial: MeshLambertMaterial;
  readonly #sun: DirectionalLight;
  readonly #radiiUnits: Float64Array;
  readonly #index: ReadonlyMap<BodyId, number>;
  readonly #matrix = new Matrix4();
  readonly #projected = new Vector3();
  #policyId = "";
  #drawn = false;
  #widthPx = 1;
  #heightPx = 1;

  constructor(readonly layer: BodySetLayer) {
    const n = layer.members.length;
    this.absolutes = new Float64Array(3 * n);
    this.#km = new Float64Array(3 * n);
    this.#radiiUnits = new Float64Array(n);
    this.screen = layer.members.map(() => ({ x: 0, y: 0, visible: false, radiusPx: 0, distance: Infinity }));
    this.#index = new Map(layer.members.map((member, index) => [member.id, index]));
    const geometry = new BufferGeometry();
    this.#positions = new BufferAttribute(new Float32Array(3 * n), 3);
    geometry.setAttribute("position", this.#positions);
    // Each dot and ball carries its own colour, so a lit family can differ from the rest; the material colour stays white.
    this.#colours = new BufferAttribute(new Float32Array(3 * n), 3);
    geometry.setAttribute("color", this.#colours);
    this.#pointMaterial = dotMaterial({ size: 3, sizeAttenuation: false, depthWrite: true, vertexColors: true });
    this.#points = new Points(geometry, this.#pointMaterial);
    this.#points.frustumCulled = false;
    this.#points.layers.set(TRACK_LAYER);
    this.#points.name = `${layer.id}-dots`;
    this.#ballMaterial = new MeshLambertMaterial();
    this.#balls = new InstancedMesh(new SphereGeometry(1, 16, 12), this.#ballMaterial, n);
    this.#balls.frustumCulled = false;
    this.#balls.instanceColor = new InstancedBufferAttribute(new Float32Array(3 * n), 3);
    this.#balls.layers.set(TRACK_LAYER);
    this.#balls.name = `${layer.id}-balls`;
    this.#sun = new DirectionalLight(0xffffff, BALL_LIGHT.directional);
    this.#sun.layers.set(TRACK_LAYER);
    const ambient = new AmbientLight(0xffffff, BALL_LIGHT.ambient);
    ambient.layers.set(TRACK_LAYER);
    this.group.add(this.#points, this.#balls, this.#sun, ambient);
  }

  get id(): string {
    return this.layer.id;
  }

  get count(): number {
    return this.layer.members.length;
  }

  /** Whether the clock is inside the set's bounds at the last sync (outside, nothing is drawn). */
  get drawn(): boolean {
    return this.#drawn;
  }

  indexOf(id: BodyId): number | undefined {
    return this.#index.get(id);
  }

  /** A member's scaled absolute position at the last sync, or null for an id the set does not hold. */
  memberAbsolute(id: BodyId): RenderVector | null {
    const index = this.#index.get(id);
    if (index === undefined) return null;
    return [this.absolutes[3 * index], this.absolutes[3 * index + 1], this.absolutes[3 * index + 2]];
  }

  /** A member's drawn radius in scaled units under the last policy, or null. */
  memberRadiusUnits(id: BodyId): number | null {
    const index = this.#index.get(id);
    return index === undefined ? null : this.#radiiUnits[index];
  }

  /** Every member's position from the set's centre (km), then through the scale policy; the balls' light along the centre's Sun direction. */
  sync(timeUtcMs: number, placement: ScenePlacement, policy: ScalePolicy, resolver: StateResolver): void {
    const { group, members } = this.layer;
    const bounds = group.bounds!;
    this.#drawn = timeUtcMs >= bounds.startUtcMs && timeUtcMs <= bounds.endUtcMs;
    if (!this.#drawn) return;
    const km = this.#km;
    group.fillPositionsKm(timeUtcMs, km);
    const offset = sceneOffsetKm(placement, group.center, timeUtcMs);
    const member = new Float64Array(3);
    for (let i = 0; i < members.length; i += 1) {
      member[0] = km[3 * i] + (offset?.[0] ?? 0);
      member[1] = km[3 * i + 1] + (offset?.[1] ?? 0);
      member[2] = km[3 * i + 2] + (offset?.[2] ?? 0);
      const mapped = eqjToRenderVector(policy.mapPosition(member));
      this.absolutes[3 * i] = mapped[0];
      this.absolutes[3 * i + 1] = mapped[1];
      this.absolutes[3 * i + 2] = mapped[2];
    }
    if (policy.id !== this.#policyId) {
      members.forEach((entry, index) => { this.#radiiUnits[index] = policy.mapRadius(entry.radiusKm, entry.id); });
      this.#policyId = policy.id;
    }
    const toSun = bodyLightDirections([group.center], resolver, timeUtcMs).get(group.center)!;
    this.#sun.position.set(toSun[0], toSun[1], toSun[2]);
    this.#sun.target.position.set(0, 0, 0);
  }

  /**
   * Camera-relative positions for the dots and balls (subtracted in Float64, so a close-up of a 1 km moon is exact), the live look, and
   * each member's place on screen for names and picking.
   */
  place(origin: FloatingOrigin, camera: PerspectiveCamera, widthPx: number, heightPx: number, look: BodySetLook, trueScale: boolean): void {
    this.#points.visible = this.#drawn;
    this.#balls.visible = this.#drawn;
    if (!this.#drawn) {
      for (const screen of this.screen) screen.visible = false;
      return;
    }
    this.#widthPx = widthPx;
    this.#heightPx = heightPx;
    camera.updateMatrixWorld(true);
    const [ox, oy, oz] = origin.scaledCameraOrigin;
    const out = this.#positions.array as Float32Array;
    const camera0 = camera.position;
    for (let i = 0; i < this.screen.length; i += 1) {
      const x = this.absolutes[3 * i] - ox;
      const y = this.absolutes[3 * i + 1] - oy;
      const z = this.absolutes[3 * i + 2] - oz;
      out[3 * i] = x;
      out[3 * i + 1] = y;
      out[3 * i + 2] = z;
      const r = this.#radiiUnits[i];
      this.#matrix.makeScale(r, r, r).setPosition(x, y, z);
      this.#balls.setMatrixAt(i, this.#matrix);
      const distance = Math.hypot(x - camera0.x, y - camera0.y, z - camera0.z);
      this.#projected.set(x, y, z).project(camera);
      const visible = this.#projected.z > -1 && this.#projected.z < 1 && Math.abs(this.#projected.x) <= 1 && Math.abs(this.#projected.y) <= 1;
      const screen = this.screen[i];
      screen.x = ((this.#projected.x + 1) / 2) * widthPx;
      screen.y = ((1 - this.#projected.y) / 2) * heightPx;
      screen.visible = visible;
      screen.radiusPx = projectedRadiusPx(r, distance, camera.fov, heightPx);
      screen.distance = distance;
    }
    this.#positions.needsUpdate = true;
    this.#balls.instanceMatrix.needsUpdate = true;
    this.#pointMaterial.size = look.dotPx;
    this.#dotColour.set(look.dotColor);
    this.#litColour.set(look.highlightColor);
    const colours = this.#colours.array as Float32Array;
    const ballColours = this.#balls.instanceColor!;
    this.layer.members.forEach((member, i) => {
      const colour = look.highlightFamily === member.family ? this.#litColour : this.#dotColour;
      colours[3 * i] = colour.r; colours[3 * i + 1] = colour.g; colours[3 * i + 2] = colour.b;
      ballColours.setXYZ(i, colour.r, colour.g, colour.b);
    });
    this.#colours.needsUpdate = true;
    ballColours.needsUpdate = true;
    // Mapped positions and radii agree only at true scale, so only there may a ball or a body hide a dot.
    this.#pointMaterial.depthTest = trueScale;
  }

  /** How many members of the lit family are drawn (the dot readout the browser check reads); 0 when none is lit. */
  litCount(look: BodySetLook): number {
    return this.#drawn && look.highlightFamily !== null ? this.layer.members.filter((member) => member.family === look.highlightFamily).length : 0;
  }

  /** The dots as the scene's point readout reports a point group (`data-points`): drawn, members, members in view and the box they cover (shares of the view). */
  screenReadout(): PointsScreenReadout {
    const out: PointsScreenReadout = { id: this.id, drawn: this.#drawn, members: this.count, sampled: this.count, inView: 0, minX: 1, maxX: 0, minY: 1, maxY: 0 };
    if (!this.#drawn) return out;
    for (const screen of this.screen) {
      if (!screen.visible) continue;
      const sx = screen.x / this.#widthPx;
      const sy = screen.y / this.#heightPx;
      out.inView += 1;
      out.minX = Math.min(out.minX, sx); out.maxX = Math.max(out.maxX, sx); out.minY = Math.min(out.minY, sy); out.maxY = Math.max(out.maxY, sy);
    }
    return out;
  }

  dispose(): void {
    this.#points.geometry.dispose();
    this.#pointMaterial.dispose();
    this.#balls.geometry.dispose();
    this.#ballMaterial.dispose();
    this.#balls.dispose();
  }
}
