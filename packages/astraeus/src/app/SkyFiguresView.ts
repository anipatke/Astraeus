import { BufferAttribute, BufferGeometry, Group, LineBasicMaterial, LineSegments } from "three";
import type { PerspectiveCamera } from "three";
import { celestialEquatorSegments, eclipticSegments, SKY_LINE_COLOURS, type EqjDirection, type SkyFigureLayer, type SkyLineSwitches } from "./skyFigures";
import { eqjToRenderVector, type RenderVector } from "./renderCoordinates";
import { TRACK_LAYER } from "./TrackedBodyView";

type Segments = readonly (readonly [EqjDirection, EqjDirection])[];

/** One label to place on the sky: its text, colour and unit render-frame direction, and the kind (the switch that shows it). */
export interface SkyLabelSpec {
  readonly id: string;
  readonly label: string;
  readonly color: string;
  readonly kind: "figure" | "boundary";
  readonly direction: RenderVector;
}

function lines(segments: Segments, color: string, key: string): LineSegments {
  const positions = new Float32Array(segments.length * 6);
  segments.forEach(([from, to], i) => positions.set([...eqjToRenderVector(from), ...eqjToRenderVector(to)], i * 6));
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  // Depth is tested (a body in front of the sky hides the line) but never written. The lines are on the last render pass (TRACK_LAYER), after every body's pass, so the Sun's halo
  // (drawn earlier, without depth) never covers them (owner decision 3, O-065).
  const material = new LineBasicMaterial({ color, transparent: true, opacity: 0.85, depthTest: true, depthWrite: false });
  const object = new LineSegments(geometry, material);
  object.name = key;
  object.layers.set(TRACK_LAYER);
  object.frustumCulled = false;
  object.renderOrder = 1;
  return object;
}

/**
 * Figures, outlines and the two reference circles, drawn at infinity like the stars: the group stands on the camera every frame and is scaled to sit between the near and far planes,
 * so only the camera's orientation matters. Carries no State (ARCH-02). The ecliptic and the equator are built the first time they are switched on.
 */
export class SkyFiguresView {
  readonly group = new Group();
  readonly #figures: LineSegments | null;
  readonly #boundaries: LineSegments | null;
  #ecliptic: LineSegments | null = null;
  #equator: LineSegments | null = null;
  readonly labels: readonly SkyLabelSpec[];

  constructor(layers: readonly SkyFigureLayer[]) {
    const of = (kind: SkyFigureLayer["kind"]): Segments => layers.filter((layer) => layer.kind === kind).flatMap((layer) => layer.segments);
    const make = (kind: SkyFigureLayer["kind"], color: string, key: string): LineSegments | null => (of(kind).length === 0 ? null : lines(of(kind), color, key));
    this.#figures = make("figure", SKY_LINE_COLOURS.figure, "sky-figures");
    this.#boundaries = make("boundary", SKY_LINE_COLOURS.boundary, "sky-boundaries");
    for (const object of [this.#figures, this.#boundaries]) if (object !== null) this.group.add(object);
    this.labels = layers.map((layer) => ({ id: layer.id, label: layer.label, kind: layer.kind, color: layer.kind === "figure" ? SKY_LINE_COLOURS.figure : SKY_LINE_COLOURS.boundary, direction: eqjToRenderVector(layer.labelAt) }));
    this.group.name = "sky-figures";
  }

  /** Stands the group on the camera, sized between its planes, and shows the kinds the switches say (building a reference circle the first time it shows). */
  place(camera: PerspectiveCamera, on: Readonly<SkyLineSwitches>): void {
    this.group.position.copy(camera.position);
    this.group.scale.setScalar(0.5 * (camera.near + camera.far));
    if (on.ecliptic && this.#ecliptic === null) { this.#ecliptic = lines(eclipticSegments(), SKY_LINE_COLOURS.ecliptic, "sky-ecliptic"); this.group.add(this.#ecliptic); }
    if (on.celestialEquator && this.#equator === null) { this.#equator = lines(celestialEquatorSegments(), SKY_LINE_COLOURS.celestialEquator, "sky-celestial-equator"); this.group.add(this.#equator); }
    if (this.#figures !== null) this.#figures.visible = on.figures;
    if (this.#boundaries !== null) this.#boundaries.visible = on.boundaries;
    if (this.#ecliptic !== null) this.#ecliptic.visible = on.ecliptic;
    if (this.#equator !== null) this.#equator.visible = on.celestialEquator;
  }

  /** Which lines are shown now, by name (read by tests and the canvas data). */
  get shown(): readonly string[] {
    return this.group.children.filter((child) => child.visible).map((child) => child.name);
  }

  dispose(): void {
    for (const child of this.group.children) {
      const line = child as LineSegments;
      line.geometry.dispose();
      (line.material as LineBasicMaterial).dispose();
    }
    this.group.clear();
  }
}
