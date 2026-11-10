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
  /** Only the label answers: the body is not drawn in view (too small or off screen) while its name still shows. */
  readonly labelOnly?: boolean;
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
    const toDisc = candidate.labelOnly === true ? Number.POSITIVE_INFINITY : Math.hypot(candidate.x - x, candidate.y - y);
    let distance = toDisc <= Math.max(candidate.radiusPx, tolerance) ? toDisc : Number.POSITIVE_INFINITY;
    const label = candidate.label;
    if (label !== undefined && label !== null && x >= label.left && x <= label.right && y >= label.top && y <= label.bottom) {
      distance = Math.min(distance, Math.hypot((label.left + label.right) / 2 - x, (label.top + label.bottom) / 2 - y));
    }
    if (distance < bestDistance) { best = candidate.id; bestDistance = distance; }
  }
  return best;
}

/** A tap selects a sky figure within this many CSS px of one of its drawn lines (a finger's reach, for mouse and touch alike); farther, or inside a boundary outline, selects nothing. */
export const SKY_LINE_MARGIN_PX = 16;

/** One sky figure a tap can select: its drawn lines as screen segments `[x1, y1, x2, y2]` (CSS px from the canvas's top left) and the rectangle of its shown name, if any. */
export interface SkyPickFigure {
  readonly id: string;
  readonly lines: readonly (readonly [number, number, number, number])[];
  readonly label?: PickRect | null;
}

/**
 * The screen segment `[x1, y1, x2, y2]` (CSS px, ends may lie outside the canvas) of the 3D segment between two camera-space points (the camera looks along -z), or null when none of it is in front of the camera.
 * A segment with one end behind the camera is cut at the camera plane, so its visible part is kept. `tanHalfFov` is the tangent of half the vertical field of view; `aspect` is width over height.
 */
export function projectSegmentClipped(a: readonly [number, number, number], b: readonly [number, number, number], tanHalfFov: number, aspect: number, widthPx: number, heightPx: number): readonly [number, number, number, number] | null {
  const front = 1e-6 * Math.max(1, Math.abs(a[2]), Math.abs(b[2])); // how far in front of the camera a point must be
  const inFront = (p: readonly [number, number, number]) => -p[2] >= front;
  if (!inFront(a) && !inFront(b)) return null;
  const cut = (kept: readonly [number, number, number], lost: readonly [number, number, number]): readonly [number, number, number] => {
    const share = (-kept[2] - front) / (-kept[2] + lost[2]);
    return [kept[0] + (lost[0] - kept[0]) * share, kept[1] + (lost[1] - kept[1]) * share, -front];
  };
  const from = inFront(a) ? a : cut(b, a);
  const to = inFront(b) ? b : cut(a, b);
  const screen = (p: readonly [number, number, number]): readonly [number, number] => [(0.5 + (p[0] / -p[2]) / (2 * tanHalfFov * aspect)) * widthPx, (0.5 - (p[1] / -p[2]) / (2 * tanHalfFov)) * heightPx];
  const [x1, y1] = screen(from);
  const [x2, y2] = screen(to);
  return [x1, y1, x2, y2];
}

/** The distance from `(x, y)` to the segment from `(x1, y1)` to `(x2, y2)`. */
export function distanceToSegment(x: number, y: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;
  const along = lengthSquared === 0 ? 0 : Math.min(1, Math.max(0, ((x - x1) * dx + (y - y1) * dy) / lengthSquared));
  return Math.hypot(x - (x1 + along * dx), y - (y1 + along * dy));
}

/**
 * The sky figure under `(x, y)`: one whose shown name holds the point, else the one with a line nearest the point within `SKY_LINE_MARGIN_PX`; null when none. Only names and lines answer: the inside of
 * an outline never does. Callers try the bodies first (`pickTarget`), so a body in front of the sky wins where it is hit.
 */
export function pickSkyFigure(figures: readonly SkyPickFigure[], x: number, y: number): string | null {
  let best: string | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const figure of figures) {
    const label = figure.label;
    const named = label !== undefined && label !== null && x >= label.left && x <= label.right && y >= label.top && y <= label.bottom;
    const toLines = figure.lines.reduce((nearest, [x1, y1, x2, y2]) => Math.min(nearest, distanceToSegment(x, y, x1, y1, x2, y2)), Number.POSITIVE_INFINITY);
    const distance = named ? 0 : toLines <= SKY_LINE_MARGIN_PX ? toLines : Number.POSITIVE_INFINITY;
    if (distance < bestDistance) { best = figure.id; bestDistance = distance; }
  }
  return best;
}

/** A mouse hovering a target brightens its name by this factor (a live setting, Developer > Labels); touch never hovers. */
export const HOVER_BRIGHTNESS_DEFAULT = 1.4;
export const HOVER_BRIGHTNESS_LIMITS = Object.freeze({ min: 1, max: 3 });

export function clampHoverBrightness(value: number): number {
  return Number.isFinite(value) ? Math.min(HOVER_BRIGHTNESS_LIMITS.max, Math.max(HOVER_BRIGHTNESS_LIMITS.min, value)) : HOVER_BRIGHTNESS_DEFAULT;
}

/** The id a hovering pointer is over: the same hit rule as a tap, mouse only (any other pointer type yields no hover). */
export function hoverTarget(candidates: readonly PickCandidate[], x: number, y: number, pointerType: string): string | null {
  return pointerType === "mouse" ? pickTarget(candidates, x, y, "mouse") : null;
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
    if (body === null) continue;
    const screen = frame.bodyScreens.find((candidate) => candidate.id === body);
    const rect = frame.labelRects?.get(object.id);
    const label = rect === undefined ? null : { left: rect.left - box.left, top: rect.top - box.top, right: rect.right - box.left, bottom: rect.bottom - box.top };
    const drawn = screen !== undefined && screen.inView && screen.as !== "none";
    // A body not drawn in view can still show its name: the name stays a target.
    if (!drawn) {
      if (label !== null) out.push({ id: object.id, x: (label.left + label.right) / 2, y: (label.top + label.bottom) / 2, radiusPx: 0, label, labelOnly: true });
      continue;
    }
    out.push({ id: object.id, x: screen.x * frame.widthPx, y: screen.y * frame.heightPx, radiusPx: screen.radiusPx, label });
  }
  for (const view of frame.bodySetViews) {
    view.layer.members.forEach((member, index) => {
      const screen = view.screen[index];
      if (screen?.visible === true) out.push({ id: member.id, x: screen.x, y: screen.y, radiusPx: screen.radiusPx });
    });
  }
  return out;
}
