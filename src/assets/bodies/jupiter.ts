import { JUPITER } from "../../core/bodies/jupiter";
import type { BodyMaterialConfig, BodyVisual } from "../visual";

/** Donor material (src/entities/jupiter.ts). */
export const JUPITER_MATERIAL: BodyMaterialConfig = Object.freeze({ color: "#d4a97a", roughness: 0.85, metalness: 0 });

/**
 * No texture: the donor's jupiter-2k.jpg has no recorded source or licence (its README lists only the file as an anomaly), so
 * Jupiter is drawn flat in its material colour, as a spheroid from its two radii. A texture waits for a sourced, licensed map.
 */
export const JUPITER_VISUAL: BodyVisual = Object.freeze({
  kind: "sphere",
  material: JUPITER_MATERIAL,
  light: Object.freeze({ ambient: 0.08, directional: 1.4 }),
});

export const JUPITER_ENTRY = Object.freeze({ body: JUPITER.id, visual: JUPITER_VISUAL });
