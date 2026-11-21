import { Scene, explainer, panel, readoutTile } from "astraeus";
import { madeUpScene } from "../madeUpScene";

/** The scene the catalogue runs for `readoutTile`: a tile with an invented value, a stretched line with one mark and two facts, beside a panel of notes. */
export function buildScene(): Scene {
  const scene = madeUpScene();
  scene.addParts([
    panel({ id: "notes", button: { label: "Notes" }, title: "Notes", blocks: [explainer({ id: "about-tile", paragraphs: ["The tile on the left shows one live number."] })] }),
    readoutTile({
      id: "distance",
      label: "Distance (invented)",
      value: "4.2 units",
      scale: { low: 1, high: 1000, value: 4.2, stretch: "log", marks: [{ value: 10, label: "Ten" }] },
      facts: [{ label: "Speed", value: "7 units/s" }, { label: "Direction", value: "inbound" }],
    }),
  ]);
  return scene;
}
