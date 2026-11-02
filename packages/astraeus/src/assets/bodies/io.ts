import { IO } from "../../core/bodies/io";
import type { BodyMaterialConfig, BodyVisual } from "../visual";

/** Donor material (src/entities/io.ts), used as the flat colour while the texture loads and as the shell colour. */
export const IO_MATERIAL: BodyMaterialConfig = Object.freeze({ color: "#d4b840", roughness: 0.92, metalness: 0 });

/** Io's picture (and its licence) ships in astraeus-data under the name "io". */
export const IO_VISUAL: BodyVisual = Object.freeze({
  kind: "sphere",
  picture: "io",
  material: IO_MATERIAL,
  textureYawRad: 0,
  light: Object.freeze({ ambient: 0.08, directional: 1.4 }),
});

export const IO_ENTRY = Object.freeze({ body: IO.id, visual: IO_VISUAL });
