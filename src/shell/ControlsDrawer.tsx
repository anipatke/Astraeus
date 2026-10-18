import type { ReactNode } from "react";
import { ChevronIcon } from "./topBarIcons";
import { useDrawerSwipe } from "./useDrawerSwipe";

interface Props {
  /** The picked object's name, shown on the pill. */
  readonly label: string;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly swipeThresholdPx: number;
  /** The full controls (the same top bar the larger screens show in a row). */
  readonly children: ReactNode;
}

/**
 * The phone's top drawer. Closed, the scene shows only a small name pill; the pill opens the drawer by a tap or a swipe down, and the handle
 * under it closes it by a tap or a swipe up. The controls stay mounted while it is closed (state survives) but are hidden from sight and focus.
 */
export function ControlsDrawer({ label, open, onOpenChange, swipeThresholdPx, children }: Props) {
  const opening = useDrawerSwipe({ thresholdPx: swipeThresholdPx, onTap: () => onOpenChange(true), onSwipe: (direction) => { if (direction === "down") onOpenChange(true); } });
  const closing = useDrawerSwipe({ thresholdPx: swipeThresholdPx, onTap: () => onOpenChange(false), onSwipe: (direction) => { if (direction === "up") onOpenChange(false); } });
  return (
    <>
      <button
        type="button"
        className="controls-pill ui-pill"
        aria-label={`Show controls: ${label}`}
        aria-expanded={open}
        aria-controls="controls-drawer"
        {...opening}
      >
        <span className="controls-pill-name">{label}</span>
        <ChevronIcon />
      </button>
      <div
        id="controls-drawer"
        className="controls-drawer"
        role="region"
        aria-label="Controls"
        data-open={open}
        // A dropdown closes the drawer on its change, not on the tap that opens it (owner bug, 2026-10-18: the drawer shut as the picker opened).
        onClick={(event) => { const closer = (event.target as Element).closest("[data-closes-drawer]"); if (closer !== null && closer.tagName !== "SELECT") onOpenChange(false); }}
        onChange={(event) => { if ((event.target as Element).closest("[data-closes-drawer]") !== null) onOpenChange(false); }}
      >
        {children}
        <button type="button" className="drawer-handle drawer-handle-bottom ui-bare" aria-label="Hide controls" {...closing}><span /></button>
      </div>
    </>
  );
}
