import { Scene, explainer, panel } from "astraeus";
import { madeUpScene } from "../madeUpScene";

/** The scene the catalogue runs for `explainer`: a heading, paragraphs and a small note in a panel. */
export function buildScene(): Scene {
  const scene = madeUpScene();
  scene.addParts([
    panel({
      id: "how-it-moves",
      button: { label: "How it moves", shortLabel: "Moves" },
      title: "How it moves",
      blocks: [
        explainer({
          id: "moves-text",
          heading: "A lap in 740 days",
          paragraphs: ["Lantern swings closer to the Sun at one end of its orbit and farther at the other.", "Press play to watch it speed up near the Sun."],
          notes: ["Invented orbit, not measured."],
        }),
      ],
    }),
  ]);
  return scene;
}
