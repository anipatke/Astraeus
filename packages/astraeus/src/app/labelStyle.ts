// The label font and size: one look for every label in the viewer (body, path, sky, anchor). It reaches the labels through two CSS variables on the viewer root (`--label-font`, `--label-size`);
// a label that has its own (a sky figure) sets the same variables on itself, so there is one route and no per-label code path (STYLE-07).
import type { CSSProperties } from "react";

export interface LabelStyle { readonly fontFamily: string; readonly sizePx: number }

/** Today's label look: the page's own font (`inherit`) at 12 px. */
export const DEFAULT_LABEL_STYLE: Readonly<LabelStyle> = Object.freeze({ fontFamily: "inherit", sizePx: 12 });

export { LABEL_SIZE_LIMITS } from "../core/lookValues";

/** The label style in force: the look's `labels`, every part not named at its default. */
export function labelStyleOf(look: { readonly labels?: Partial<LabelStyle> }): LabelStyle {
  return { ...DEFAULT_LABEL_STYLE, ...look.labels };
}

/** The CSS variables that carry a label style on the viewer root. A part at its default sets nothing, so a viewer with the default look carries no variable and the stylesheet's own value (the same one) stands. */
export function labelStyleVars(style: { readonly fontFamily?: string; readonly sizePx?: number } = {}): CSSProperties {
  const font = style.fontFamily !== undefined && style.fontFamily !== DEFAULT_LABEL_STYLE.fontFamily;
  const size = style.sizePx !== undefined && style.sizePx !== DEFAULT_LABEL_STYLE.sizePx;
  return { ...(font ? { "--label-font": style.fontFamily } : {}), ...(size ? { "--label-size": `${style.sizePx}px` } : {}) } as CSSProperties;
}
