// Scene pointer: the hover and tap listeners on the canvas, separate from React.
import { attachOrbitGestures, type DistanceLimits, type OrbitCameraState } from "./CameraController";
import { pickTarget, type PickCandidate } from "./scenePicking";

/** The slice of the frame state the pointer listeners read and write. */
export interface PointerState {
  readonly pickables: readonly PickCandidate[];
  hoverPoint: { x: number; y: number } | null;
}

/**
 * Wires orbit gestures, the mouse hover point and tap picking to the canvas. `state` is read live (the frame rebuilds `pickables`);
 * returns the detach function, which also clears the cursor and the hover readout.
 */
export function attachScenePointer(canvas: HTMLCanvasElement, orbit: OrbitCameraState, state: PointerState, limits: () => DistanceLimits, onPickObject: ((id: string) => void) | undefined): () => void {
  const onTap = (x: number, y: number, pointer: "mouse" | "touch") => {
    const id = pickTarget(state.pickables, x, y, pointer);
    if (id === null) return;
    canvas.dataset.pickTarget = id;
    onPickObject?.(id);
  };
  const onHoverMove = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") { state.hoverPoint = null; return; }
    const box = canvas.getBoundingClientRect();
    state.hoverPoint = event.buttons === 0 ? { x: event.clientX - box.left, y: event.clientY - box.top } : null;
  };
  const onHoverLeave = () => { state.hoverPoint = null; };
  canvas.addEventListener("pointermove", onHoverMove);
  canvas.addEventListener("pointerleave", onHoverLeave);
  const detach = attachOrbitGestures(canvas, orbit, limits, onTap);
  return () => {
    detach();
    canvas.removeEventListener("pointermove", onHoverMove);
    canvas.removeEventListener("pointerleave", onHoverLeave);
    canvas.style.cursor = "";
    delete canvas.dataset.pickHover;
  };
}
