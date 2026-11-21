// An area: a named place in the viewer's one grid (viewer-interface note, section 2). Job: draw the place and mark it `data-area`. It knows no part
// and must not set a position, layer or size itself; `areas.css` does that for the name.
import type { ReactNode } from "react";

/** The named places, in the note's order. */
export const AREA_NAMES = ["bar", "menu", "left", "right", "developer", "tile", "sheet", "timeline", "popover"] as const;
export type AreaName = (typeof AREA_NAMES)[number];

/** A raised place sits above its neighbours while it holds a drawer or a pop-up (`areas.css` gives the layer); the panel rule says when. */
export type AreaLayer = "drawer" | "popup";

export function Area({ name, layer, children }: { readonly name: AreaName; readonly layer?: AreaLayer | undefined; readonly children?: ReactNode }) {
  return <div className="astraeus-area" data-area={name} data-layer={layer}>{children}</div>;
}
