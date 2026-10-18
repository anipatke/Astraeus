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
  /** The panel's moment, so a marker shared by several panels can pick the one the clock has reached. */
  readonly timeUtcMs: number;
}

/** One scene marker: an object and every panel that names it, in time order. */
export interface StoryMarkerGroup {
  readonly objectId: string;
  readonly panels: readonly StoryMarkerSpec[];
}

/**
 * Merges panels that name the same object into one marker (I-031), so markers never stack and hide each other.
 * Groups keep the order objects first appear in; each group's panels are in time order.
 */
export function groupStoryMarkers(specs: readonly StoryMarkerSpec[]): readonly StoryMarkerGroup[] {
  const groups = new Map<string, StoryMarkerSpec[]>();
  for (const spec of specs) {
    const list = groups.get(spec.objectId);
    if (list === undefined) groups.set(spec.objectId, [spec]);
    else list.push(spec);
  }
  return [...groups].map(([objectId, panels]) => ({ objectId, panels: [...panels].sort((a, b) => a.timeUtcMs - b.timeUtcMs) }));
}

/**
 * The panel a press on a shared marker opens. When one of the group's panels is open, the next one in time order
 * (wrapping round), so repeated presses reach every panel on the object; otherwise the latest panel the clock has
 * reached, or the first when the clock is before them all.
 */
export function panelForMarkerPress(group: StoryMarkerGroup, timeUtcMs: number, openPanelId: string | null): string {
  const { panels } = group;
  const openIndex = panels.findIndex((panel) => panel.panelId === openPanelId);
  if (openIndex >= 0) return panels[(openIndex + 1) % panels.length]!.panelId;
  let reached = 0;
  panels.forEach((panel, index) => { if (panel.timeUtcMs <= timeUtcMs) reached = index; });
  return panels[reached]!.panelId;
}

/**
 * App adapter that draws a tappable marker (after Planetary Explorer's HotspotMarker) on each object story panels name,
 * one marker per object however many panels name it. The marker shows only while the object is placed and on screen;
 * a pointer press on it never reaches the camera controls.
 */
export class StoryMarkerLayer {
  readonly #root = document.createElement("div");
  readonly #entries: readonly { readonly group: StoryMarkerGroup; readonly element: HTMLButtonElement }[];
  readonly #local = new Vector3();
  #timeUtcMs = Number.NEGATIVE_INFINITY;
  #openPanelId: string | null = null;

  constructor(host: HTMLElement, specs: readonly StoryMarkerSpec[], onOpen: (panelId: string) => void) {
    this.#root.className = "story-markers";
    this.#entries = groupStoryMarkers(specs).map((group) => {
      const element = document.createElement("button");
      const titles = group.panels.map((panel) => panel.title);
      element.type = "button";
      element.className = "story-marker";
      element.dataset.panelIds = group.panels.map((panel) => panel.panelId).join(" ");
      element.setAttribute("aria-label", titles.length === 1 ? `Open story panel: ${titles[0]}` : `Open story panels: ${titles.join("; ")}`);
      element.title = titles.join(" · ");
      element.hidden = true;
      element.addEventListener("pointerdown", (event) => event.stopPropagation());
      element.addEventListener("click", (event) => { event.stopPropagation(); onOpen(panelForMarkerPress(group, this.#timeUtcMs, this.#openPanelId)); });
      this.#root.appendChild(element);
      return { group, element };
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
    timeUtcMs: number,
  ): void {
    this.#timeUtcMs = timeUtcMs;
    this.#openPanelId = openPanelId;
    camera.updateMatrixWorld(true);
    for (const { group, element } of this.#entries) {
      const absolute = positionFor(group.objectId);
      const screen = absolute === null ? null : projectToScreen(this.#local.fromArray(origin.toLocal(absolute)), camera, widthPx, heightPx);
      element.hidden = screen === null;
      if (screen === null) continue;
      element.style.transform = `translate(${screen.x + MARKER_OFFSET_PX}px, ${screen.y - MARKER_OFFSET_PX}px) translate(-50%, -50%)`;
      element.setAttribute("aria-pressed", String(group.panels.some((panel) => panel.panelId === openPanelId)));
    }
  }

  dispose(): void {
    this.#root.remove();
  }
}
