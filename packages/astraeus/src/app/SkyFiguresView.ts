import { BufferAttribute, BufferGeometry, Color, Group, LineBasicMaterial, LineSegments, Vector3 } from "three";
import type { PerspectiveCamera } from "three";
import { celestialEquatorSegments, eclipticSegments, type EqjDirection, type SkyColours, type SkyFigureLayer, type SkyClearRequest, type SkyLineSwitches, type SkyTraceRequest } from "./skyFigures";
import { stepHide, stepTrace, type SkyHideRun, type SkyTraceRun } from "../core/skyTrace";
import { eqjToRenderVector, type RenderVector } from "./renderCoordinates";
import { TRACK_LAYER } from "./TrackedBodyView";
import { projectSegmentClipped, type PickRect, type SkyPickFigure } from "./scenePicking";

type Segments = readonly (readonly [EqjDirection, EqjDirection])[];

/** One label to place on the sky: its text and unit render-frame direction, the kind (the switch that shows it) and the figure's own colour, font and size when it has them (else the looks apply). */
export interface SkyLabelSpec {
  readonly id: string;
  readonly label: string;
  readonly color?: string;
  readonly font?: string;
  readonly sizePx?: number;
  readonly kind: "figure" | "boundary";
  /** True: the label shows only while a trace of the figure runs or stays (`labelOpacity`). */
  readonly whenTraced?: boolean;
  readonly direction: RenderVector;
}

/** One drawn set of lines: which switch shows it and which look colour it takes (unless it has its own). */
interface Drawn {
  readonly object: LineSegments;
  readonly shows: keyof SkyLineSwitches;
  readonly colour: keyof SkyColours;
  readonly own: boolean;
}

/** One trace in progress: the lines drawn over the figure, the figure's full positions, and the run's timing. */
interface Overlay {
  readonly object: LineSegments;
  readonly full: Float32Array;
  readonly kind: SkyFigureLayer["kind"];
  readonly run: SkyTraceRun;
  /** Set when the host asked to clear the trace: it then holds its drawn share and eases out instead of following `run`. */
  hide?: SkyHideRun;
  /** The share of the figure drawn at the last step, 0 to 1. */
  drawn: number;
  /** How far the trace has faded, 0 to 1 (the label fades with it). */
  fade: number;
}

const FADED = new Color();
const TRACE_OPACITY = 0.85;

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
  readonly #drawn: Drawn[] = [];
  #applied: Readonly<SkyColours> | null = null;
  readonly labels: readonly SkyLabelSpec[];
  readonly #layers: ReadonlyMap<string, SkyFigureLayer>;
  readonly #traces = new Map<string, Overlay>();
  /** The emphasis lines over the selected figure (one set at most), built when the selection first names a figure. */
  #selected: { readonly id: string; readonly object: LineSegments } | null = null;
  readonly #point = new Vector3();

  constructor(layers: readonly SkyFigureLayer[]) {
    this.#layers = new Map(layers.map((layer) => [layer.id, layer]));
    const add = (segments: Segments, shows: Drawn["shows"], colour: Drawn["colour"], key: string, own?: string): void => {
      if (segments.length === 0) return;
      const object = lines(segments, own ?? "#ffffff", key);
      this.#drawn.push({ object, shows, colour, own: own !== undefined });
      this.group.add(object);
    };
    // Figures that take the look's colour share one set of lines per kind; a figure with its own colour is drawn on its own so a live look change leaves it alone.
    for (const [kind, shows, key] of [["figure", "figures", "sky-figures"], ["boundary", "boundaries", "sky-boundaries"]] as const) {
      const of = layers.filter((layer) => layer.kind === kind && layer.whenTraced !== true); // a figure shown only when traced has no lines of its own: its trace is the whole drawing
      add(of.filter((layer) => layer.color === undefined).flatMap((layer) => layer.segments), shows, kind, key);
      for (const layer of of) if (layer.color !== undefined) add(layer.segments, shows, kind, `${key}:${layer.id}`, layer.color);
    }
    this.labels = layers.map((layer) => ({
      id: layer.id, label: layer.label, kind: layer.kind, direction: eqjToRenderVector(layer.labelAt), ...(layer.whenTraced === true ? { whenTraced: true } : {}),
      ...(layer.labelColor === undefined ? {} : { color: layer.labelColor }), ...(layer.labelFont === undefined ? {} : { font: layer.labelFont }), ...(layer.labelSizePx === undefined ? {} : { sizePx: layer.labelSizePx }),
    }));
    this.group.name = "sky-lines";
  }

  /** Stands the group on the camera, sized between its planes, shows the kinds the switches say (building a reference circle the first time it shows) and paints the lines in the colours given. */
  place(camera: PerspectiveCamera, on: Readonly<SkyLineSwitches>, colours: Readonly<SkyColours>, selectedId = ""): void {
    this.group.position.copy(camera.position);
    this.group.scale.setScalar(0.5 * (camera.near + camera.far));
    for (const [shows, colour, make, key] of [["ecliptic", "ecliptic", eclipticSegments, "sky-ecliptic"], ["celestialEquator", "equator", celestialEquatorSegments, "sky-celestial-equator"]] as const) {
      if (on[shows] && !this.#drawn.some((entry) => entry.shows === shows)) {
        const object = lines(make(), "#ffffff", key);
        this.#drawn.push({ object, shows, colour, own: false });
        this.group.add(object);
        this.#applied = null;
      }
    }
    if (this.#applied === null || Object.keys(colours).some((name) => colours[name as keyof SkyColours] !== this.#applied![name as keyof SkyColours])) {
      for (const entry of this.#drawn) if (!entry.own) (entry.object.material as LineBasicMaterial).color.set(colours[entry.colour]);
      this.#applied = { ...colours };
    }
    for (const entry of this.#drawn) entry.object.visible = on[entry.shows];
    this.#emphasise(selectedId, on, colours);
  }

  /** Whether a tap or the emphasis can reach the figure now: its kind's switch is on and, for one shown only when traced, a trace shows it. */
  #tappable(layer: SkyFigureLayer, on: Readonly<SkyLineSwitches>): boolean {
    return on[layer.kind === "figure" ? "figures" : "boundaries"] && (layer.whenTraced !== true || this.labelOpacity(layer.id) > 0);
  }

  /** Draws the selected figure's lines over it in the look's `selected` colour (and removes them when the selection moves or is not a figure); the name takes the same colour in the label layer. */
  #emphasise(selectedId: string, on: Readonly<SkyLineSwitches>, colours: Readonly<SkyColours>): void {
    const layer = this.#layers.get(selectedId);
    if (this.#selected !== null && this.#selected.id !== layer?.id) {
      this.group.remove(this.#selected.object);
      this.#selected.object.geometry.dispose();
      (this.#selected.object.material as LineBasicMaterial).dispose();
      this.#selected = null;
    }
    if (layer === undefined) return;
    if (this.#selected === null) {
      const object = lines(layer.segments, colours.selected, `sky-selected:${layer.id}`);
      object.renderOrder = 3;
      this.group.add(object);
      this.#selected = { id: layer.id, object };
    }
    (this.#selected.object.material as LineBasicMaterial).color.set(colours.selected);
    this.#selected.object.visible = this.#tappable(layer, on);
  }

  /**
   * The figures a tap can select, as screen lines (CSS px from the canvas's top left) and the rectangle of each shown name (`labelRects` are page rectangles; `box` is the canvas's). A figure whose switch is off, or that is
   * shown only when traced and has no trace showing, is left out. A segment is kept whenever any part of it is in front of the camera (cut at the camera plane), even with both ends off screen. Worked out when asked, not each frame.
   */
  screenFigures(camera: PerspectiveCamera, widthPx: number, heightPx: number, on: Readonly<SkyLineSwitches>, labelRects: ReadonlyMap<string, PickRect> | undefined, box: { readonly left: number; readonly top: number }): readonly SkyPickFigure[] {
    camera.updateMatrixWorld(true);
    const reach = 0.5 * (camera.near + camera.far); // where the lines are drawn, as the names are placed
    const tanHalfFov = Math.tan((camera.fov * Math.PI) / 360);
    const aspect = widthPx / heightPx;
    const inCamera = (direction: EqjDirection): [number, number, number] => { const p = this.#point.fromArray(eqjToRenderVector(direction)).multiplyScalar(reach).add(camera.position).applyMatrix4(camera.matrixWorldInverse); return [p.x, p.y, p.z]; };
    return [...this.#layers.values()].filter((layer) => this.#tappable(layer, on)).map((layer): SkyPickFigure => {
      const rect = labelRects?.get(layer.id);
      const lines = layer.segments.flatMap(([from, to]) => { const line = projectSegmentClipped(inCamera(from), inCamera(to), tanHalfFov, aspect, widthPx, heightPx); return line === null ? [] : [line]; });
      return { id: layer.id, lines, label: rect === undefined ? null : { left: rect.left - box.left, top: rect.top - box.top, right: rect.right - box.left, bottom: rect.bottom - box.top } };
    });
  }

  /** Begins tracing the figure `request.id` (a trace already on it restarts). The trace is a separate set of lines drawn over the figure (the whole drawing of a figure shown only when traced); the figure itself is untouched. An id the view does not hold does nothing. */
  startTrace(request: SkyTraceRequest): void {
    const layer = this.#layers.get(request.id);
    if (layer === undefined) return;
    this.#removeTrace(request.id);
    const object = lines(layer.segments, "#ffffff", `sky-trace:${request.id}`);
    object.renderOrder = 2;
    object.geometry.setDrawRange(0, 0);
    const full = Float32Array.from(object.geometry.getAttribute("position").array);
    this.group.add(object);
    this.#traces.set(request.id, { object, full, kind: layer.kind, run: { seconds: request.seconds, after: request.after, reduced: request.reduced, elapsed: 0 }, drawn: 0, fade: 0 });
  }

  /** Removes the trace of `request.id` over `request.seconds` (at once for 0 or reduced motion), keeping what it had drawn; a figure with no trace, or an id the view does not hold, is left alone. */
  clearTrace(request: SkyClearRequest): void {
    const trace = this.#traces.get(request.id);
    if (trace === undefined) return;
    if (request.reduced || request.seconds <= 0) this.#removeTrace(request.id);
    else trace.hide = { seconds: request.seconds, from: trace.fade, elapsed: 0 };
  }

  /**
   * Moves every trace on by `deltaSeconds` of real time (the scene clock never enters): draws the segments reached so far, the last one part-grown from its first end, in the traced colour (the faded colour while fading),
   * shows each with its figure's switch, and removes finished ones. Returns true while anything changed, so the caller wakes the draw rule.
   */
  advanceTraces(deltaSeconds: number, colours: Readonly<SkyColours>, on: Readonly<SkyLineSwitches>): boolean {
    let moving = false;
    for (const [id, trace] of this.#traces) {
      const frame = trace.hide === undefined ? stepTrace(trace.run, deltaSeconds) : stepHide(trace.hide, deltaSeconds, trace.drawn);
      moving ||= frame.moving;
      trace.fade = frame.fade;
      trace.drawn = frame.drawn;
      if (frame.done) { this.#removeTrace(id); continue; }
      const count = trace.full.length / 6;
      const reached = frame.drawn * count;
      const last = Math.min(count - 1, Math.floor(reached));
      const grown = frame.drawn >= 1 ? 1 : reached - last;
      const positions = trace.object.geometry.getAttribute("position") as BufferAttribute;
      positions.array.set(trace.full.subarray(0, (last + 1) * 6));
      const at = last * 6;
      const end = [0, 1, 2].map((axis) => trace.full[at + axis]! + (trace.full[at + 3 + axis]! - trace.full[at + axis]!) * grown);
      const length = Math.hypot(end[0]!, end[1]!, end[2]!);
      end.forEach((value, axis) => { positions.array[at + 3 + axis] = length > 1e-9 ? value / length : value; });
      positions.needsUpdate = true;
      trace.object.geometry.setDrawRange(0, (last + 1) * 2);
      const material = trace.object.material as LineBasicMaterial;
      material.color.set(colours.traced).lerp(FADED.set(colours.faded), frame.fade);
      material.opacity = TRACE_OPACITY * (1 - frame.fade);
      trace.object.visible = on[trace.kind === "figure" ? "figures" : "boundaries"];
    }
    return moving;
  }

  /** How much of a label shows, 0 to 1: always 1 for a figure that is always shown; for one shown only when traced, 0 until a trace starts, then 1 (fading to 0 with a `fade` trace; 0 again once the trace is removed). */
  labelOpacity(id: string): number {
    if (this.#layers.get(id)?.whenTraced !== true) return 1;
    const trace = this.#traces.get(id);
    return trace === undefined ? 0 : 1 - trace.fade;
  }

  #removeTrace(id: string): void {
    const trace = this.#traces.get(id);
    if (trace === undefined) return;
    this.#traces.delete(id);
    this.group.remove(trace.object);
    trace.object.geometry.dispose();
    (trace.object.material as LineBasicMaterial).dispose();
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
