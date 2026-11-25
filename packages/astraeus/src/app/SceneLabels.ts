import { Vector3, type Camera } from "three";
import type { ExperienceObject } from "../shell/experience";
import { createLabelElement } from "../shell/Label";
import { projectToScreen } from "./AnchorLabels";
import type { FloatingOrigin } from "./floatingOrigin";
import { NO_HOST_LABELS, type HostLabelSet } from "./hostLabels";
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
const skyOpacity = (spec: SkyLabelSpec | undefined, sky: SkyLabelFrame | undefined): number =>
  spec === undefined ? 1 : (sky?.opacity?.(spec.id) ?? 1);

/** App adapter that places configured labels; the label presentation itself stays generic. */
export class SceneLabelLayer {
  readonly #root = document.createElement("div");
  readonly #entries: readonly ProjectedEntry[];
  readonly #byId: ReadonlyMap<string, ProjectedEntry>;
  readonly #local = new Vector3();
  readonly #direction = new Vector3();
  readonly #shown = new Map<string, Rect>();
  /** Per object id, whether the latest layout showed it; absent when it was not a candidate (unplaced, out of reach or switched off). */
  readonly #lastShown = new Map<string, boolean>();
  readonly #sky: ReadonlyMap<string, SkyLabelSpec>;
  /** For a host label that selects one group: that group's id, whose selection lifts the label as its own does. */
  readonly #selectedFor: ReadonlyMap<string, string>;
  /** The colour last set on each sky label (by id), so a change of look or selection repaints only what changed. */
  readonly #skyColours = new Map<string, string>();
  /** Each label's border-box size (padding and border in, as laid out), from a ResizeObserver or one measure; a size change re-measures only that label. */
  readonly #sizes = new Map<HTMLElement, { readonly width: number; readonly height: number }>();
  readonly #observer: ResizeObserver | undefined;

  constructor(
    host: HTMLElement,
    objects: readonly ExperienceObject[],
    skyLabels: readonly SkyLabelSpec[] = [],
    hostLabels: HostLabelSet = NO_HOST_LABELS,
  ) {
    this.#root.className = "scene-labels";
    this.#selectedFor = hostLabels.selectedFor;
    // A sky label is an object-like entry (its id, text and colour) with a priority below every object's and a place at infinity; it joins the one layout below, so it collides and keeps its place by the same rule.
    // A host label is the same kind of entry (its id, text, colour and priority) with its place from the host; a group one covers draws no name of its own.
    const asObjects: readonly ExperienceObject[] = [
      ...objects.filter((object) => !hostLabels.covered.has(object.id) && !hostLabels.ids.has(object.id)),
      ...hostLabels.objects,
      ...skyLabels.map((spec): ExperienceObject => ({
        id: spec.id,
        label: spec.label,
        ...(spec.color === undefined ? {} : { color: spec.color }),
        labelPriority: SKY_LABEL_PRIORITY[spec.kind],
      })),
    ];
    this.#observer = globalThis.ResizeObserver
      ? new ResizeObserver((changes) => {
          for (const c of changes) {
            // The border box, as the -50%/-100% translate and the page use it; contentRect leaves out padding and border (only where borderBoxSize is missing).
            const b = c.borderBoxSize?.[0];
            const size = b ? { width: b.inlineSize, height: b.blockSize } : c.contentRect;
            if (size.width) this.#sizes.set(c.target as HTMLElement, size); // a hidden label reports 0: keep its size
          }
        })
      : undefined;
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
      this.#observer?.observe(element, { box: "border-box" });
      return { object, element };
    });
    this.#byId = new Map(this.#entries.map((entry) => [entry.object.id, entry]));
    host.appendChild(this.#root);
  }

  /** Gives the object label `id` the colour `colour` (a group's live colour, `setGroupLook`); an id with no object label, or the colour it already has, changes nothing. */
  setColor(id: string, colour: string): void {
    const entry = this.#byId.get(id);
    if (entry === undefined || this.#sky.has(id) || entry.element.style.getPropertyValue("--label-color") === colour)
      return;
    entry.element.style.setProperty("--label-color", colour);
  }

  /** The page rectangles of the labels shown after the latest update, by object id: the targets a tap on a name can hit. */
  get shownRects(): ReadonlyMap<string, Rect> {
    return this.#shown;
  }

  /** Brightens the name of the hovered object by `gain` (1 leaves it alone); null clears it. */
  setHover(id: string | null, gain: number): void {
    for (const { element, object } of this.#entries) {
      const filter = object.id === id && gain !== 1 ? `brightness(${gain})` : "";
      if (element.style.filter !== filter) element.style.filter = filter;
    }
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
    page: { readonly left: number; readonly top: number } = { left: 0, top: 0 },
  ): void {
    camera.updateMatrixWorld(true);
    if (sky !== undefined) {
      // A sky label takes its figure's own colour, else the look's; the selected figure's name takes the look's selected colour.
      for (const entry of this.#entries) {
        const spec = this.#sky.get(entry.object.id);
        if (spec === undefined) continue;
        const colour =
          entry.object.id === selectedObjectId ? (sky.selectedColor ?? sky.labelColor) : (spec.color ?? sky.labelColor);
        if (this.#skyColours.get(spec.id) !== colour) {
          this.#skyColours.set(spec.id, colour);
          entry.element.style.setProperty("--label-color", colour);
        }
      }
    }
    this.#shown.clear();
    const previous = new Map(this.#lastShown);
    this.#lastShown.clear();
    const candidates = this.#entries
      .flatMap((entry) => {
        if (hiddenIds?.has(entry.object.id) === true) {
          entry.element.hidden = true;
          return [];
        }
        const spec = this.#sky.get(entry.object.id);
        const absolute = spec === undefined ? positionFor(entry.object.id) : null;
        const opacity = skyOpacity(spec, sky);
        const skyShown =
          spec !== undefined &&
          sky !== undefined &&
          opacity > 0 &&
          sky.on[spec.kind === "figure" ? "figures" : "boundaries"];
        if (spec === undefined ? absolute === null : !skyShown) {
          entry.element.hidden = true;
          return [];
        }
        if (spec !== undefined) entry.element.style.opacity = String(opacity);
        // A sky label is projected from the camera's own place, at a fixed distance along its direction: it never moves with the scene, only with the camera's turn.
        if (spec !== undefined)
          this.#local.copy(camera.position).addScaledVector(this.#direction.fromArray(spec.direction), sky!.distance);
        else this.#local.fromArray(origin.toLocal(absolute!));
        const screen = projectToScreen(this.#local, camera, widthPx, heightPx);
        const distance = this.#local.distanceTo(camera.position);
        const maxDistance = entry.object.labelMaxDistance ?? Number.POSITIVE_INFINITY;
        if (screen === null || distance > maxDistance) {
          entry.element.hidden = true;
          return [];
        }
        // The selected (and so followed) object's label wins every collision: the bonus outranks any labelPriority (I-108).
        const selected =
          entry.object.id === selectedObjectId || this.#selectedFor.get(entry.object.id) === selectedObjectId;
        const selectedPriority = selected ? SELECTED_PRIORITY : 0;
        return [{ ...entry, screen, priority: (entry.object.labelPriority ?? 0) + selectedPriority }];
      })
      .sort((a, b) => b.priority - a.priority || a.object.id.localeCompare(b.object.id));

    const occupied: Rect[] = [];
    for (const candidate of candidates) {
      candidate.element.hidden = false;
      let placed: Rect | null = null;
      let at = "";
      const padding = LABEL_PADDING_PX + (previous.get(candidate.object.id) === false ? LABEL_REAPPEAR_MARGIN_PX : 0);
      let size = this.#sizes.get(candidate.element);
      if (size === undefined) this.#sizes.set(candidate.element, (size = candidate.element.getBoundingClientRect()));
      for (const [dx, dy] of [
        [8, 0],
        [-8, 0],
        [0, -20],
      ] as const) {
        const x = candidate.screen.x + dx;
        const y = candidate.screen.y + dy;
        const back = dx < 0;
        const left = page.left + x - (back ? size.width : 0);
        const top = page.top + y - size.height / 2;
        const rect = { left, top, right: left + size.width, bottom: top + size.height };
        if (occupied.every((other) => !overlapsWithPadding(rect, other, padding))) {
          placed = rect;
          at = `translate(${x}px, ${y}px) translate(${back ? "-100%" : "0"}, -50%)`;
          break;
        }
      }
      this.#lastShown.set(candidate.object.id, placed !== null);
      if (placed === null) {
        candidate.element.hidden = true;
      } else {
        candidate.element.style.transform = at;
        occupied.push(placed);
        this.#shown.set(candidate.object.id, placed);
      }
    }
  }

  dispose(): void {
    this.#observer?.disconnect();
    this.#root.remove();
  }
}

function overlapsWithPadding(a: Rect, b: Rect, padding: number): boolean {
  return (
    a.left < b.right + padding && a.right + padding > b.left && a.top < b.bottom + padding && a.bottom + padding > b.top
  );
}
