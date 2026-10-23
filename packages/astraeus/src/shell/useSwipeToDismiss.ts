import { useEffect, useRef, type RefObject } from "react";

/** A downward drag longer than this (px) on the phone sheet dismisses it. */
const DISMISS_THRESHOLD_PX = 80;
/** The sheet follows the finger no further than this (px). */
const MAX_FOLLOW_PX = 120;

/**
 * Swipe-down-to-dismiss for a bottom sheet (the information and story panels), after Planetary Explorer's useSwipeToDismiss.
 * Only a drag that starts with the sheet scrolled to its top counts, so reading a long panel never closes it.
 */
export function useSwipeToDismiss(ref: RefObject<HTMLElement | null>, onDismiss: () => void): void {
  const dismiss = useRef(onDismiss);
  dismiss.current = onDismiss;
  useEffect(() => {
    const element = ref.current;
    if (element === null) return undefined;
    let startY: number | null = null;
    const start = (event: TouchEvent) => { startY = element.scrollTop <= 0 ? event.touches[0]?.clientY ?? null : null; };
    const move = (event: TouchEvent) => {
      if (startY === null) return;
      const dy = (event.touches[0]?.clientY ?? startY) - startY;
      if (dy > 0) element.style.transform = `translateY(${Math.min(dy, MAX_FOLLOW_PX)}px)`;
    };
    const end = (event: TouchEvent) => {
      if (startY === null) return;
      const dy = (event.changedTouches[0]?.clientY ?? startY) - startY;
      element.style.transform = "";
      startY = null;
      if (dy > DISMISS_THRESHOLD_PX) dismiss.current();
    };
    element.addEventListener("touchstart", start, { passive: true });
    element.addEventListener("touchmove", move, { passive: true });
    element.addEventListener("touchend", end);
    element.addEventListener("touchcancel", end);
    return () => {
      element.removeEventListener("touchstart", start);
      element.removeEventListener("touchmove", move);
      element.removeEventListener("touchend", end);
      element.removeEventListener("touchcancel", end);
    };
  }, [ref]);
}
