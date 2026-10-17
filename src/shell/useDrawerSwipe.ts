import { useRef, type PointerEvent as ReactPointerEvent } from "react";

/** Which way a swipe on a handle moves its drawer: up or down the screen. */
export type SwipeDirection = "up" | "down";

interface Options {
  /** Called on a tap (the press moved less than a swipe). */
  readonly onTap: () => void;
  /** Called on a swipe of at least `thresholdPx` px, with the way it went. */
  readonly onSwipe: (direction: SwipeDirection) => void;
  readonly thresholdPx: number;
}

/**
 * Tap and swipe for a drawer handle. The gesture is read on the handle only, so a drag on the scene or the scrubber can never open
 * or close a drawer, and the handle's `touch-action: none` keeps the page from scrolling under the finger. Keyboard activation
 * (Enter, Space) arrives as a click with no pointer movement and counts as a tap.
 */
export function useDrawerSwipe({ onTap, onSwipe, thresholdPx }: Options) {
  const start = useRef<number | null>(null);
  const swiped = useRef(false);
  return {
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
      start.current = event.clientY;
      swiped.current = false;
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    onPointerUp: (event: ReactPointerEvent<HTMLElement>) => {
      if (start.current === null) return;
      const dy = event.clientY - start.current;
      start.current = null;
      if (Math.abs(dy) < thresholdPx) return;
      swiped.current = true;
      onSwipe(dy < 0 ? "up" : "down");
    },
    onPointerCancel: () => { start.current = null; },
    onClick: () => {
      if (swiped.current) { swiped.current = false; return; }
      onTap();
    },
  };
}
