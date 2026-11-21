// Part: the menu's container, a phone's swipe drawer or a wide bar's drop-down, holding what the fit rule put in the menu.
// Must not: set a position, layer, raw colour or raw size (areas/ places it, look.css holds the values), or open or close another part; a chosen item is reported (`onItemChosen`) and the panel rule closes the menu.
import type { ReactNode } from "react";
import { MENU_HOST, POPUP_HOST_ATTRIBUTE } from "./panels/usePanels";
import { useDrawerSwipe } from "./useDrawerSwipe";

interface Props {
  /** The id the bar's menu button names in `aria-controls`; made once per viewer by the shell. */
  readonly id: string;
  readonly open: boolean;
  /** A phone's drawer closes by a swipe up or a tap on its handle; a wide drop-down has no handle. */
  readonly phone: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly swipeThresholdPx: number;
  /** An item inside the menu was chosen (anything marked `data-closes-drawer`): the panel rule closes it. */
  readonly onItemChosen: () => void;
  /** What the fit rule put in the menu (`BarMenu`). */
  readonly children: ReactNode;
}

/**
 * The menu's panel, in the `menu` area: a drawer dropping from the bar on a phone, a drop-down under the bar's right end on a wide screen. The bar's menu button opens it
 * (a tap or a swipe down) and the handle closes it (a tap or a swipe up). The controls stay mounted while it is closed (state survives) but are hidden from sight and focus.
 */
export function ControlsDrawer({ id, open, phone, onOpenChange, swipeThresholdPx, onItemChosen, children }: Props) {
  const closing = useDrawerSwipe({ thresholdPx: swipeThresholdPx, onTap: () => onOpenChange(false), onSwipe: (direction) => { if (direction === "up") onOpenChange(false); } });
  return (
    <div
      id={id}
      className="controls-drawer"
      role="region"
      aria-label="Controls"
      data-open={open}
      {...{ [POPUP_HOST_ATTRIBUTE]: MENU_HOST }}
      // A dropdown closes the drawer on its change, not on the tap that opens it (owner bug, 2026-10-18: the drawer shut as the picker opened).
      onClick={(event) => { const closer = (event.target as Element).closest("[data-closes-drawer]"); if (closer !== null && closer.tagName !== "SELECT") onItemChosen(); }}
      onChange={(event) => { if ((event.target as Element).closest("[data-closes-drawer]") !== null) onItemChosen(); }}
    >
      {children}
      {phone && <button type="button" className="drawer-handle drawer-handle-bottom ui-bare" aria-label="Hide controls" {...closing}><span /></button>}
    </div>
  );
}
