import { Vector3, type Camera } from "three";
import type { ExperienceObject } from "../shell/experience";
import { createLabelElement } from "../shell/Label";
import { projectToScreen } from "./AnchorLabels";
import type { FloatingOrigin } from "./floatingOrigin";
import type { RenderVector } from "./renderCoordinates";

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

/** App adapter that places configured labels; the label presentation itself stays generic. */
export class SceneLabelLayer {
  readonly #root = document.createElement("div");
  readonly #entries: readonly ProjectedEntry[];
  readonly #local = new Vector3();

  constructor(host: HTMLElement, objects: readonly ExperienceObject[]) {
    this.#root.className = "scene-labels";
    this.#entries = objects.map((object) => {
      const element = createLabelElement(object.label, object.color, "scene-object-label");
      element.dataset.labelId = object.id;
      this.#root.appendChild(element);
      return { object, element };
    });
    host.appendChild(this.#root);
  }

  update(
    positionFor: (objectId: string) => RenderVector | null,
    camera: Camera,
    widthPx: number,
    heightPx: number,
    origin: FloatingOrigin,
    selectedObjectId: string,
  ): void {
    camera.updateMatrixWorld(true);
    const candidates = this.#entries.flatMap((entry) => {
      const absolute = positionFor(entry.object.id);
      if (absolute === null) {
        entry.element.hidden = true;
        return [];
      }
      const screen = projectToScreen(this.#local.fromArray(origin.toLocal(absolute)), camera, widthPx, heightPx);
      const distance = this.#local.distanceTo(camera.position);
      const maxDistance = entry.object.labelMaxDistance ?? Number.POSITIVE_INFINITY;
      if (screen === null || distance > maxDistance) {
        entry.element.hidden = true;
        return [];
      }
      const selectedPriority = entry.object.id === selectedObjectId ? 1_000 : 0;
      return [{ ...entry, screen, priority: (entry.object.labelPriority ?? 0) + selectedPriority }];
    }).sort((a, b) => b.priority - a.priority || a.object.id.localeCompare(b.object.id));

    const occupied: Rect[] = [];
    for (const candidate of candidates) {
      candidate.element.hidden = false;
      let placed: Rect | null = null;
      for (const [dx, dy] of [[8, 0], [-8, 0], [0, -20]] as const) {
        candidate.element.style.transform = `translate(${candidate.screen.x + dx}px, ${candidate.screen.y + dy}px) translate(${dx < 0 ? "-100%" : "0"}, -50%)`;
        const bounds = candidate.element.getBoundingClientRect();
        const rect = { left: bounds.left, top: bounds.top, right: bounds.right, bottom: bounds.bottom };
        if (occupied.every((other) => !overlapsWithPadding(rect, other, 6))) {
          placed = rect;
          break;
        }
      }
      if (placed === null) {
        candidate.element.hidden = true;
      } else {
        occupied.push(placed);
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
