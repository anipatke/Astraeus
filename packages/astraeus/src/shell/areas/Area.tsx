// An area: a named place in the viewer's one grid (viewer-interface note, section 2). Job: draw the place and mark it `data-area`. It knows no part
// and must not set a position, layer or size itself; `areas.css` does that for the name.
import type { ReactNode } from "react";

/** The named places, in the note's order. */
export const AREA_NAMES = ["bar", "menu", "left", "right", "developer", "tile", "sheet", "timeline", "popover"] as const;
export type AreaName = (typeof AREA_NAMES)[number];

export function Area({ name, children }: { readonly name: AreaName; readonly children?: ReactNode }) {
  return <div className="astraeus-area" data-area={name}>{children}</div>;
}
