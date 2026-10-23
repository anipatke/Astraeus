import { SWIFT_TUTTLE } from "../../core/bodies/swiftTuttle";
import type { BodyMaterialConfig, BodyVisual } from "../visual";

/** A pale icy blue; presentation only, chosen to read against the black sky and apart from the planets' warm colours. */
export const SWIFT_TUTTLE_MATERIAL: BodyMaterialConfig = Object.freeze({ color: "#9fe3ff", roughness: 1, metalness: 0 });

/**
 * A marker with no texture: the nucleus is 26 km across, under a pixel at any scale where its orbit is visible, so there is nothing
 * to texture. The marker is a drawing aid at the comet's real position, not its size.
 */
export const SWIFT_TUTTLE_VISUAL: BodyVisual = Object.freeze({
  kind: "marker",
  material: SWIFT_TUTTLE_MATERIAL,
  marker: Object.freeze({ sizePx: 7 }),
});

export const SWIFT_TUTTLE_ENTRY = Object.freeze({ body: SWIFT_TUTTLE.id, visual: SWIFT_TUTTLE_VISUAL });
