import { Vector3, type Camera } from "three";
import type { TrackedBodyView } from "./TrackedBodyView";

/** Pixel position of a local render point, or null when it is behind the camera or off screen. */
export function projectToScreen(
  local: Vector3,
  camera: Camera,
  widthPx: number,
  heightPx: number,
): { x: number; y: number } | null {
  const ndc = local.clone().project(camera);
  if (ndc.z < -1 || ndc.z > 1 || Math.abs(ndc.x) > 1 || Math.abs(ndc.y) > 1) return null;
  return { x: ((ndc.x + 1) / 2) * widthPx, y: ((1 - ndc.y) / 2) * heightPx };
}

/**
 * DOM text labels beside anchor dots. Presentation only: it reads the dots' drawn positions and
 * never touches State. One span per labelled anchor, created once and moved each frame.
 */
export class AnchorLabelLayer {
  readonly #root = document.createElement("div");
  readonly #spans: readonly { view: TrackedBodyView; index: number; span: HTMLSpanElement }[];
  readonly #scratch = new Vector3();

  constructor(host: HTMLElement, views: readonly TrackedBodyView[]) {
    this.#root.className = "anchor-labels";
    this.#root.hidden = true;
    this.#spans = views.flatMap((view) => (view.anchorLabels ?? []).map((text, index) => {
      const span = document.createElement("span");
      span.className = "anchor-label";
      span.textContent = text;
      span.style.color = view.body.color;
      this.#root.appendChild(span);
      return { view, index, span };
    }));
    host.appendChild(this.#root);
  }

  update(visible: boolean, camera: Camera, widthPx: number, heightPx: number): void {
    this.#root.hidden = !visible;
    if (!visible) return;
    for (const { view, index, span } of this.#spans) {
      const screen = view.group.visible
        ? projectToScreen(view.anchorLocalPosition(index, this.#scratch), camera, widthPx, heightPx)
        : null;
      span.hidden = screen === null;
      if (screen !== null) span.style.transform = `translate(${screen.x.toFixed(1)}px, ${screen.y.toFixed(1)}px)`;
    }
  }

  dispose(): void {
    this.#root.remove();
  }
}
