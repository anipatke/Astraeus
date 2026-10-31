import type { ListedMoonBody } from "../../core/bodies/listedMoonBodies";
import { withPicture } from "../pictures";
import type { VisualEntry } from "../catalogue";

const LIGHT = Object.freeze({ ambient: 0.08, directional: 1.4 });

/** A listed moon's look (O-049 T-211): a grey sphere, or its picture when the picture pack holds one under the moon's id (read when asked for, so a pack registered later still shows). */
export const listedMoonEntry = ({ definition }: ListedMoonBody): VisualEntry => ({
  body: definition.id,
  visual: withPicture(definition.id, { kind: "sphere", material: Object.freeze({ color: "#a8a8a8", roughness: 0.95, metalness: 0 }), light: LIGHT }),
});
