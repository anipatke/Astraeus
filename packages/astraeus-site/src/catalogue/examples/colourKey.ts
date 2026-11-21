import { Scene, colourKey, panel } from "astraeus";
import { madeUpScene } from "../madeUpScene";

/** The scene the catalogue runs for `colourKey`: a key of colours with a count and a note per row. */
export function buildScene(): Scene {
  const scene = madeUpScene();
  scene.addParts([
    panel({
      id: "key",
      button: { label: "Colour key", shortLabel: "Key" },
      title: "Colour key",
      blocks: [
        colourKey({
          id: "regions",
          entries: [{ label: "Near the Sun", color: "#ffd59a", count: 120 }, { label: "Far from the Sun", color: "#8fb4ff", count: 45, note: "Invented numbers" }],
        }),
      ],
    }),
  ]);
  return scene;
}
