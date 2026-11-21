import { Scene, customBlock, panel } from "astraeus";
import { madeUpScene } from "../madeUpScene";

/** The scene the catalogue runs for `customBlock`: a panel whose one block is yours; `handle.part(block).element` is the box to fill. */
export function buildScene(): Scene {
  const scene = madeUpScene();
  scene.addParts([
    panel({
      id: "own-panel",
      button: { label: "Your own panel", shortLabel: "Own" },
      title: "Your own panel",
      blocks: [customBlock({ id: "own-block" })],
    }),
  ]);
  return scene;
}
