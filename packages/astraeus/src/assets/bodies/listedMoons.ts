import type { ListedMoonBody } from "../../core/bodies/listedMoonBodies";
import type { VisualEntry } from "../catalogue";

const LIGHT = Object.freeze({ ambient: 0.08, directional: 1.4 });

/** A listed moon's look (O-049 T-211): a grey sphere, or its picture when the picture pack holds one under the moon's id (named here, resolved from the pictures the viewer is given). */
export const listedMoonEntry = ({ definition }: ListedMoonBody): VisualEntry => ({
  body: definition.id,
  visual: Object.freeze({ kind: "sphere", picture: definition.id, material: Object.freeze({ color: "#a8a8a8", roughness: 0.95, metalness: 0 }), light: LIGHT }),
});
