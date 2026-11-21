import { Scene, explainer, panel } from "astraeus";
import { madeUpScene } from "../madeUpScene";

/** The scene the catalogue runs for `panel`: a story button in the bar that opens a panel in the left place (a sheet on a phone). */
export function buildScene(): Scene {
  const scene = madeUpScene();
  scene.addParts([
    panel({
      id: "about-lantern",
      button: { label: "About Lantern", shortLabel: "About" },
      title: "About Lantern",
      blocks: [explainer({ id: "about-text", paragraphs: ["Lantern is an invented object on an invented orbit."] })],
    }),
  ]);
  return scene;
}
