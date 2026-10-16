import { Vector3, type Camera } from "three";
import { projectToScreen } from "./AnchorLabels";
import type { FloatingOrigin } from "./floatingOrigin";
import type { RenderVector } from "./renderCoordinates";

/** The marker sits up and to the right of the object so it never hides the object or its label. */
const MARKER_OFFSET_PX = 16;

/** A story panel that names an object: the scene draws a marker on that object which reopens the panel. */
export interface StoryMarkerSpec {
  readonly panelId: string;
  readonly objectId: string;
  readonly title: string;
}

/**
 * App adapter that draws a tappable marker (after Planetary Explorer's HotspotMarker) on each object a story panel names.
 * The marker shows only while the object is placed and on screen; a pointer press on it never reaches the camera controls.
 */
export class StoryMarkerLayer {
  readonly #root = document.createElement("div");
  readonly #entries: readonly { readonly spec: StoryMarkerSpec; readonly element: HTMLButtonElement }[];
  readonly #local = new Vector3();

  constructor(host: HTMLElement, specs: readonly StoryMarkerSpec[], onOpen: (panelId: string) => void) {
    this.#root.className = "story-markers";
    this.#entries = specs.map((spec) => {
      const element = document.createElement("button");
      element.type = "button";
      element.className = "story-marker";
      element.dataset.panelId = spec.panelId;
      element.setAttribute("aria-label", `Open story panel: ${spec.title}`);
      element.title = spec.title;
      element.hidden = true;
      element.addEventListener("pointerdown", (event) => event.stopPropagation());
      element.addEventListener("click", (event) => { event.stopPropagation(); onOpen(spec.panelId); });
      this.#root.appendChild(element);
      return { spec, element };
    });
    host.appendChild(this.#root);
  }

  update(
    positionFor: (objectId: string) => RenderVector | null,
    camera: Camera,
    widthPx: number,
    heightPx: number,
    origin: FloatingOrigin,
    openPanelId: string | null,
  ): void {
    camera.updateMatrixWorld(true);
    for (const { spec, element } of this.#entries) {
      const absolute = positionFor(spec.objectId);
      const screen = absolute === null ? null : projectToScreen(this.#local.fromArray(origin.toLocal(absolute)), camera, widthPx, heightPx);
      element.hidden = screen === null;
      if (screen === null) continue;
      element.style.transform = `translate(${screen.x + MARKER_OFFSET_PX}px, ${screen.y - MARKER_OFFSET_PX}px) translate(-50%, -50%)`;
      element.setAttribute("aria-pressed", String(spec.panelId === openPanelId));
    }
  }

  dispose(): void {
    this.#root.remove();
  }
}
