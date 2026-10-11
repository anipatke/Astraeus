import { SUN } from "../../core/bodies/sun";
import type { BodyVisual } from "../visual";

/** A marker at a fixed screen size, not to scale; the size is a drawing choice. */
export const SUN_VISUAL: BodyVisual = Object.freeze({
  kind: "marker",
  material: Object.freeze({ color: "#fff1b0", roughness: 1, metalness: 0 }),
  marker: Object.freeze({ sizePx: 9 }),
});

export const SUN_ENTRY = Object.freeze({ body: SUN.id, visual: SUN_VISUAL });
