import { Vector3, type Camera } from "three";
import type { ExperienceObject } from "../shell/experience";
import { createLabelElement } from "../shell/Label";
import { projectToScreen } from "./AnchorLabels";
import type { FloatingOrigin } from "./floatingOrigin";
import type { RenderVector } from "./renderCoordinates";
import type { SkyLabelSpec } from "./SkyFiguresView";
import type { SkyLineSwitches } from "./skyFigures";

interface ProjectedEntry {
  readonly object: ExperienceObject;
  readonly element: HTMLSpanElement;
}

interface Rect {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

/** Added to the selected object's label priority; larger than any labelPriority, so it is never the label hidden by an overlap. */
export const SELECTED_PRIORITY = 1_000;

/** Screen gap (px) a label keeps from a higher-priority label it is not hiding behind. */
export const LABEL_PADDING_PX = 6;

/**
 * Hysteresis (I-121): a label the last layout hid by overlap needs this much more clearance (px, on top of LABEL_PADDING_PX) before it shows again,
 * while a label already shown keeps its place at the plain padding. So a pair crossing at fast playback swaps winner once per crossing, not every frame.
 * One rule for every label; the selected label is placed first and never loses a collision (I-108).
 */
export const LABEL_REAPPEAR_MARGIN_PX = 14;

/** Sky labels rank below every object label, so a name on the sky never hides a body's (figures above outlines). */
export const SKY_LABEL_PRIORITY = { figure: -10, boundary: -20 } as const;

/** Where the sky labels stand this frame: which kinds show, and the distance (render units) from the camera they are projected at. */
export interface SkyLabelFrame {
  readonly on: Readonly<SkyLineSwitches>;
  readonly distance: number;
  /** The look's colour for a sky label that has no colour of its own. */
  readonly labelColor: string;
  /** The look's colour for the selected sky figure's name. */
  readonly selectedColor?: string;
  /** How much of a sky label shows, 0 (not drawn) to 1; absent: all show. */
  readonly opacity?: (id: string) => number;
}

/** How much of a sky label shows, 0 to 1 (1 for an object label and where the frame names no rule). */
const skyOpacity = (spec: SkyLabelSpec | undefined, sky: SkyLabelFrame | undefined): number => (spec === undefined ? 1 : sky?.opacity?.(spec.id) ?? 1);

/** App adapter that places configured labels; the label presentation itself stays generic. */
export class SceneLabelLayer {
  readonly #root = document.createElement("div");
  readonly #entries: readonly ProjectedEntry[];
  readonly #local = new Vector3();
  readonly #direction = new Vector3();
  readonly #shown = new Map<string, Rect>();
  /** Per object id, whether the latest layout showed it; absent when it was not a candidate (unplaced, out of reach or switched off). */
  readonly #lastShown = new Map<string, boolean>();
  readonly #sky: ReadonlyMap<string, SkyLabelSpec>;
  /** The colour last set on each sky label (by id), so a change of look or selection repaints only what changed. */
  readonly #skyColours = new Map<string, string>();

  constructor(host: HTMLElement, objects: readonly ExperienceObject[], skyLabels: readonly SkyLabelSpec[] = []) {
    this.#root.className = "scene-labels";
    // A sky label is an object-like entry (its id, text and colour) with a priority below every object's and a place at infinity; it joins the one layout below, so it collides and keeps its place by the same rule.
    const asObjects: readonly ExperienceObject[] = [...objects, ...skyLabels.map((spec): ExperienceObject => ({ id: spec.id, label: spec.label, ...(spec.color === undefined ? {} : { color: spec.color }), labelPriority: SKY_LABEL_PRIORITY[spec.kind] }))];
    this.#sky = new Map(skyLabels.map((spec) => [spec.id, spec]));
    this.#entries = asObjects.map((object) => {
      const element = createLabelElement(object.label, object.color, "scene-object-label");
      element.dataset.labelId = object.id;
      // A figure's own font and size go on its label through the same variables the viewer root sets for every label.
      const own = this.#sky.get(object.id);
      if (own?.font !== undefined) element.style.setProperty("--label-font", own.font);
      if (own?.sizePx !== undefined) element.style.setProperty("--label-size", `${own.sizePx}px`);
      element.hidden = true; // not shown until the first layout places it (I-108: unplaced labels all showed for a moment, so a reader could see a label the settled layout then hides)
      this.#root.appendChild(element);
      return { object, element };
    });
    host.appendChild(this.#root);
  }

  /** The page rectangles of the labels shown after the latest update, by object id: the targets a tap on a name can hit. */
  get shownRects(): ReadonlyMap<string, Rect> {
    return this.#shown;
  }

  /** Brightens the name of the hovered object by `gain` (1 leaves it alone); null clears it. */
  setHover(id: string | null, gain: number): void {
    for (const entry of this.#entries) entry.element.style.filter = entry.object.id === id && gain !== 1 ? `brightness(${gain})` : "";
  }

  update(
    positionFor: (objectId: string) => RenderVector | null,
    camera: Camera,
    widthPx: number,
    heightPx: number,
    origin: FloatingOrigin,
    selectedObjectId: string,
    hiddenIds?: ReadonlySet<string>,
    sky?: SkyLabelFrame,
  ): void {
    camera.updateMatrixWorld(true);
    if (sky !== undefined) {
      // A sky label takes its figure's own colour, else the look's; the selected figure's name takes the look's selected colour.
      for (const entry of this.#entries) {
        const spec = this.#sky.get(entry.object.id);
        if (spec === undefined) continue;
        const colour = entry.object.id === selectedObjectId ? sky.selectedColor ?? sky.labelColor : spec.color ?? sky.labelColor;
        if (this.#skyColours.get(spec.id) !== colour) { this.#skyColours.set(spec.id, colour); entry.element.style.setProperty("--label-color", colour); }
      }
    }
    this.#shown.clear();
    const previous = new Map(this.#lastShown);
    this.#lastShown.clear();
    const candidates = this.#entries.flatMap((entry) => {
      if (hiddenIds?.has(entry.object.id) === true) {
        entry.element.hidden = true;
        return [];
      }
      const spec = this.#sky.get(entry.object.id);
      const absolute = spec === undefined ? positionFor(entry.object.id) : null;
      const opacity = skyOpacity(spec, sky);
      const skyShown = spec !== undefined && sky !== undefined && opacity > 0 && sky.on[spec.kind === "figure" ? "figures" : "boundaries"];
      if (spec === undefined ? absolute === null : !skyShown) {
        entry.element.hidden = true;
        return [];
      }
      if (spec !== undefined) entry.element.style.opacity = String(opacity);
      // A sky label is projected from the camera's own place, at a fixed distance along its direction: it never moves with the scene, only with the camera's turn.
      if (spec !== undefined) this.#local.copy(camera.position).addScaledVector(this.#direction.fromArray(spec.direction), sky!.distance);
      else this.#local.fromArray(origin.toLocal(absolute!));
      const screen = projectToScreen(this.#local, camera, widthPx, heightPx);
      const distance = this.#local.distanceTo(camera.position);
      const maxDistance = entry.object.labelMaxDistance ?? Number.POSITIVE_INFINITY;
      if (screen === null || distance > maxDistance) {
        entry.element.hidden = true;
        return [];
      }
      // The selected (and so followed) object's label wins every collision: the bonus outranks any labelPriority (I-108).
      const selectedPriority = entry.object.id === selectedObjectId ? SELECTED_PRIORITY : 0;
      return [{ ...entry, screen, priority: (entry.object.labelPriority ?? 0) + selectedPriority }];
    }).sort((a, b) => b.priority - a.priority || a.object.id.localeCompare(b.object.id));

    const occupied: Rect[] = [];
    for (const candidate of candidates) {
      candidate.element.hidden = false;
      let placed: Rect | null = null;
      const padding = LABEL_PADDING_PX + (previous.get(candidate.object.id) === false ? LABEL_REAPPEAR_MARGIN_PX : 0);
      for (const [dx, dy] of [[8, 0], [-8, 0], [0, -20]] as const) {
        candidate.element.style.transform = `translate(${candidate.screen.x + dx}px, ${candidate.screen.y + dy}px) translate(${dx < 0 ? "-100%" : "0"}, -50%)`;
        const bounds = candidate.element.getBoundingClientRect();
        const rect = { left: bounds.left, top: bounds.top, right: bounds.right, bottom: bounds.bottom };
        if (occupied.every((other) => !overlapsWithPadding(rect, other, padding))) {
          placed = rect;
          break;
        }
      }
      this.#lastShown.set(candidate.object.id, placed !== null);
      if (placed === null) {
        candidate.element.hidden = true;
      } else {
        occupied.push(placed);
        this.#shown.set(candidate.object.id, placed);
      }
    }
  }

  dispose(): void {
    this.#root.remove();
  }
}

function overlapsWithPadding(a: Rect, b: Rect, padding: number): boolean {
  return a.left < b.right + padding && a.right + padding > b.left
    && a.top < b.bottom + padding && a.bottom + padding > b.top;
}
