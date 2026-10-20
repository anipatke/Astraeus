// Picking a body in the scene by a tap or click (O-022). Pure and generic: it works on screen-space candidates the scene builds each frame
// (a body's projected disc and its shown label) and never touches State, positions or the experience. The tap-versus-drag rule lives here too,
// shared with the orbit gestures so a drag that turns the view can never select.

/** A rectangle in the same CSS px space as the candidates (from the canvas's top left). */
export interface PickRect {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

/** One thing a tap can select: where it is on screen, how wide it draws, and the rectangle of its shown name, if any. */
export interface PickCandidate {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly radiusPx: number;
  readonly label?: PickRect | null;
}

export type PickPointer = "mouse" | "touch";

/** A body answers a press within at least this many CSS px of its centre, so a sub-pixel body is still easy to hit. */
export const MOUSE_TOLERANCE_PX = 10;
export const TOUCH_TOLERANCE_PX = 22;
/** A press that moves less than this is a tap, not a drag of the camera (a finger wobbles more than a mouse). */
export const MOUSE_TAP_SLOP_PX = 6;
export const TOUCH_TAP_SLOP_PX = 10;

/**
 * The id under `(x, y)`: a candidate's disc (grown to the pointer's tolerance) or its label rectangle. The hit whose centre is nearest wins;
 * null when nothing is hit.
 */
export function pickTarget(candidates: readonly PickCandidate[], x: number, y: number, pointer: PickPointer): string | null {
  const tolerance = pointer === "mouse" ? MOUSE_TOLERANCE_PX : TOUCH_TOLERANCE_PX;
  let best: string | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const candidate of candidates) {
    const toDisc = Math.hypot(candidate.x - x, candidate.y - y);
    let distance = toDisc <= Math.max(candidate.radiusPx, tolerance) ? toDisc : Number.POSITIVE_INFINITY;
    const label = candidate.label;
    if (label !== undefined && label !== null && x >= label.left && x <= label.right && y >= label.top && y <= label.bottom) {
      distance = Math.min(distance, Math.hypot((label.left + label.right) / 2 - x, (label.top + label.bottom) / 2 - y));
    }
    if (distance < bestDistance) { best = candidate.id; bestDistance = distance; }
  }
  return best;
}

/**
 * The tap rule: exactly one pointer, moved no further than the slop, and no second pointer at any time during the press (a pinch is never
 * a tap). Feed it the pointer events; `up` returns where the tap landed, or null when the press was a drag, a pinch or unknown.
 */
export class TapTracker {
  readonly #presses = new Map<number, { x: number; y: number; slop: number }>();
  #spoiled = false;

  down(id: number, x: number, y: number, pointer: PickPointer): void {
    if (this.#presses.size > 0) this.#spoiled = true;
    this.#presses.set(id, { x, y, slop: pointer === "mouse" ? MOUSE_TAP_SLOP_PX : TOUCH_TAP_SLOP_PX });
  }

  move(id: number, x: number, y: number): void {
    const press = this.#presses.get(id);
    if (press !== undefined && Math.hypot(x - press.x, y - press.y) > press.slop) this.#spoiled = true;
  }

  up(id: number, x: number, y: number): { readonly x: number; readonly y: number } | null {
    const press = this.#presses.get(id);
    if (press === undefined) return null;
    const tap = !this.#spoiled && Math.hypot(x - press.x, y - press.y) <= press.slop;
    this.cancel(id);
    return tap ? { x, y } : null;
  }

  /** The press ended without a release (a cancelled pointer): never a tap. */
  cancel(id: number): void {
    this.#presses.delete(id);
    if (this.#presses.size === 0) this.#spoiled = false;
  }
}

/** What `pickCandidatesOf` reads from one frame. */
export interface PickFrame {
  readonly objects: readonly { readonly id: string }[];
  /** The catalogued body an object id names, or null (spacecraft, comets, streams and orbit lines are not bodies). */
  readonly bodyIdFor: (id: string) => string | null;
  /** Each drawn body's place as a share of the canvas (0 to 1 from the top left) and its drawn radius. */
  readonly bodyScreens: readonly { readonly id: string; readonly x: number; readonly y: number; readonly radiusPx: number; readonly inView: boolean; readonly as: string }[];
  readonly widthPx: number;
  readonly heightPx: number;
  /** The page rectangles of the shown names, by object id. */
  readonly labelRects?: ReadonlyMap<string, PickRect>;
  /** The canvas whose top left the candidates are measured from. */
  readonly canvas: { getBoundingClientRect(): { readonly left: number; readonly top: number } };
  /** Body sets: each member that is on screen is a candidate. */
  readonly bodySetViews: readonly { readonly layer: { readonly members: readonly { readonly id: string }[] }; readonly screen: readonly { readonly x: number; readonly y: number; readonly radiusPx: number; readonly visible: boolean }[] }[];
}

/** The tap targets of one frame: listed objects that are catalogued bodies on screen (with their shown name) and visible body-set members. */
export function pickCandidatesOf(frame: PickFrame): PickCandidate[] {
  const box = frame.canvas.getBoundingClientRect();
  const out: PickCandidate[] = [];
  for (const object of frame.objects) {
    const body = frame.bodyIdFor(object.id);
    const screen = body === null ? undefined : frame.bodyScreens.find((candidate) => candidate.id === body);
    if (screen === undefined || !screen.inView || screen.as === "none") continue;
    const rect = frame.labelRects?.get(object.id);
    out.push({
      id: object.id,
      x: screen.x * frame.widthPx,
      y: screen.y * frame.heightPx,
      radiusPx: screen.radiusPx,
      label: rect === undefined ? null : { left: rect.left - box.left, top: rect.top - box.top, right: rect.right - box.left, bottom: rect.bottom - box.top },
    });
  }
  for (const view of frame.bodySetViews) {
    view.layer.members.forEach((member, index) => {
      const screen = view.screen[index];
      if (screen?.visible === true) out.push({ id: member.id, x: screen.x, y: screen.y, radiusPx: screen.radiusPx });
    });
  }
  return out;
}
