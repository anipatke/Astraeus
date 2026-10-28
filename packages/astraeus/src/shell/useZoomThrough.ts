import { useEffect, type RefObject } from "react";

/** A pinch's spread change (px) counts as this many wheel units, matching the camera's pinch (0.006) and wheel (0.0012) sensitivities. */
const PINCH_TO_WHEEL = 5;

/**
 * Lets a phone bottom sheet pass zoom input to the scene beneath it: a wheel, or a two-finger pinch, over the sheet is forwarded to the canvas as a
 * wheel event, which the camera control already turns into a zoom. A sheet with something to scroll keeps its wheel (reading wins); a pinch always zooms.
 * Does nothing on a wide screen, where the panel sits beside the scene.
 */
export function useZoomThrough(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const sheet = ref.current;
    if (sheet === null) return undefined;
    const shell = sheet.closest<HTMLElement>(".astraeus-shell");
    const forward = (deltaY: number): void => {
      shell?.querySelector("canvas")?.dispatchEvent(new WheelEvent("wheel", { deltaY, bubbles: true, cancelable: true }));
    };
    const phone = (): boolean => shell?.dataset.phone === "true";
    const onWheel = (event: WheelEvent): void => {
      if (!phone() || sheet.scrollHeight > sheet.clientHeight) return;
      event.preventDefault();
      forward(event.deltaY);
    };
    let spread: number | null = null;
    const spreadOf = (touches: TouchList): number | null => {
      const [a, b] = [touches[0], touches[1]];
      return touches.length === 2 && a !== undefined && b !== undefined ? Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) : null;
    };
    const onTouch = (event: TouchEvent): void => {
      const next = phone() ? spreadOf(event.touches) : null;
      if (next !== null && spread !== null) {
        event.preventDefault();
        forward(-(next - spread) * PINCH_TO_WHEEL);
      }
      spread = next;
    };
    sheet.addEventListener("wheel", onWheel, { passive: false });
    sheet.addEventListener("touchstart", onTouch, { passive: true });
    sheet.addEventListener("touchmove", onTouch, { passive: false });
    sheet.addEventListener("touchend", onTouch, { passive: true });
    sheet.addEventListener("touchcancel", onTouch, { passive: true });
    return () => {
      sheet.removeEventListener("wheel", onWheel);
      sheet.removeEventListener("touchstart", onTouch);
      sheet.removeEventListener("touchmove", onTouch);
      sheet.removeEventListener("touchend", onTouch);
      sheet.removeEventListener("touchcancel", onTouch);
    };
  }, [ref]);
}
