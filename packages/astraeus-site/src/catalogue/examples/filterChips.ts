import { Scene, filterChips, panel } from "astraeus";
import { madeUpScene } from "../madeUpScene";

/** The scene the catalogue runs for `filterChips`: chips that light on a press; the host hears the values and does the filtering. */
export function buildScene(): Scene {
  const scene = madeUpScene();
  scene.addParts([
    panel({
      id: "kinds",
      button: { label: "Kinds", shortLabel: "Kinds" },
      title: "Kinds",
      blocks: [
        filterChips({
          id: "kind-chips",
          label: "Show",
          choices: [{ value: "near", label: "Near", color: "#ffd59a" }, { value: "far", label: "Far", color: "#8fb4ff" }, { value: "all", label: "Everything" }],
          selected: ["all"],
        }),
      ],
    }),
  ]);
  return scene;
}
