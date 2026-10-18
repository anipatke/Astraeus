// Names for a body set's members, only on demand (O-025 Decision 2): the dot under the pointer (hover), the dot last tapped, and members
// close enough that their ball is several pixels across (near zoom, the nearest few). No wall of labels. A second tap on a named dot asks
// the camera to go to it.
import { createLabelElement } from "../shell/Label";
import type { BodySetView } from "./BodySetView";
import type { BodySetLook } from "./bodySet";

/** A dot answers the pointer within this many CSS px. */
export const PICK_RADIUS_PX = 12;
/** A press that moves less than this is a tap, not a drag of the camera. */
const TAP_SLOP_PX = 6;

/** The member nearest `(x, y)` on screen within `radiusPx`, among visible members; null for none. */
export function pickMember(view: Pick<BodySetView, "screen">, x: number, y: number, radiusPx = PICK_RADIUS_PX): number | null {
  let best: number | null = null;
  let bestDistance = radiusPx;
  view.screen.forEach((screen, index) => {
    if (!screen.visible) return;
    const d = Math.hypot(screen.x - x, screen.y - y);
    if (d <= bestDistance) { best = index; bestDistance = d; }
  });
  return best;
}

/** Members to name this frame: hovered, tapped, then the nearest whose ball is at least `labelNearPx` across, up to `labelNearMax`. */
export function membersToName(view: Pick<BodySetView, "screen">, look: Pick<BodySetLook, "labelNearPx" | "labelNearMax">, hovered: number | null, tapped: number | null): number[] {
  const named = new Set<number>();
  if (hovered !== null && view.screen[hovered]?.visible) named.add(hovered);
  if (tapped !== null && view.screen[tapped]?.visible) named.add(tapped);
  const near = view.screen
    .map((screen, index) => ({ screen, index }))
    .filter(({ screen, index }) => screen.visible && 2 * screen.radiusPx >= look.labelNearPx && !named.has(index))
    .sort((a, b) => a.screen.distance - b.screen.distance)
    .slice(0, look.labelNearMax);
  for (const { index } of near) named.add(index);
  return [...named];
}

export class BodySetLabelLayer {
  readonly #root = document.createElement("div");
  readonly #labels: HTMLSpanElement[];
  readonly #canvas: HTMLCanvasElement;
  #hovered: number | null = null;
  #tapped: number | null = null;
  #press: { x: number; y: number } | null = null;
  readonly #listeners: [string, (event: PointerEvent) => void][];

  constructor(host: HTMLElement, canvas: HTMLCanvasElement, readonly view: BodySetView, onFocus: (memberId: string) => void) {
    this.#canvas = canvas;
    this.#root.className = "scene-labels body-set-labels";
    this.#labels = view.layer.members.map((member) => {
      const element = createLabelElement(member.label, undefined, "scene-object-label body-set-label");
      element.dataset.bodySetLabel = member.id;
      element.hidden = true;
      this.#root.appendChild(element);
      return element;
    });
    host.appendChild(this.#root);
    const at = (event: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      return { x: event.clientX - box.left, y: event.clientY - box.top };
    };
    this.#listeners = [
      ["pointermove", (event) => {
        if (event.pointerType !== "mouse") return;
        const { x, y } = at(event);
        this.#hovered = pickMember(view, x, y);
      }],
      ["pointerleave", () => { this.#hovered = null; }],
      ["pointerdown", (event) => { this.#press = at(event); }],
      ["pointerup", (event) => {
        const press = this.#press;
        this.#press = null;
        if (press === null) return;
        const { x, y } = at(event);
        if (Math.hypot(x - press.x, y - press.y) > TAP_SLOP_PX) return;
        const picked = pickMember(view, x, y, event.pointerType === "mouse" ? PICK_RADIUS_PX : 2 * PICK_RADIUS_PX);
        if (picked !== null && picked === this.#tapped) onFocus(view.layer.members[picked].id);
        this.#tapped = picked;
      }],
    ];
    for (const [type, listener] of this.#listeners) canvas.addEventListener(type, listener as EventListener);
  }

  /** The member under the pointer, for the browser checks (`data-body-set-hover`). */
  get hovered(): string | null {
    return this.#hovered === null ? null : this.view.layer.members[this.#hovered].id;
  }

  update(look: BodySetLook): void {
    const named = new Set(this.view.drawn ? membersToName(this.view, look, this.#hovered, this.#tapped) : []);
    this.#labels.forEach((element, index) => {
      const show = named.has(index);
      if (element.hidden === !show && !show) return;
      element.hidden = !show;
      if (show) {
        const screen = this.view.screen[index];
        element.style.transform = `translate(${screen.x + Math.max(6, screen.radiusPx + 4)}px, ${screen.y}px) translate(0, -50%)`;
      }
    });
    this.#canvas.dataset.bodySetHover = this.hovered ?? "";
    this.#canvas.dataset.bodySetNamed = String(named.size);
  }

  dispose(): void {
    for (const [type, listener] of this.#listeners) this.#canvas.removeEventListener(type, listener as EventListener);
    this.#root.remove();
    delete this.#canvas.dataset.bodySetHover;
    delete this.#canvas.dataset.bodySetNamed;
  }
}
