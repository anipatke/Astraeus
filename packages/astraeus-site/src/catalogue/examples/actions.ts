import { Scene, actions, panel } from "astraeus";
import { madeUpScene } from "../madeUpScene";

/** The scene the catalogue runs for `actions`: buttons in a panel that turn the camera, as a story panel's camera does. */
export function buildScene(): Scene {
  const scene = madeUpScene();
  scene.addParts([
    panel({
      id: "go-to",
      button: { label: "Fly to", shortLabel: "Fly" },
      title: "Fly to",
      blocks: [actions({ id: "fly", actions: [{ id: "lantern", label: "Fly to Lantern", camera: { focus: "lantern" } }, { id: "wide", label: "Show everything" }] })],
    }),
  ]);
  return scene;
}
