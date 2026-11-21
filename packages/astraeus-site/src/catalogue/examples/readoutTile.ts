import { Scene, readoutTile, type MountedScene } from "astraeus";
import { madeUpScene } from "../madeUpScene";

const DISTANCE = {
  id: "distance",
  label: "Distance (invented)",
  value: "4.2 units",
  scale: { low: 1, high: 1000, value: 4.2, stretch: "log" as const, marks: [{ value: 10, label: "Ten" }] },
  facts: [{ label: "Speed", value: "7 units/s" }, { label: "Direction", value: "inbound" }],
};

/** The scene the catalogue runs for `readoutTile`: a tile that stands alone, with an invented value, a stretched line with one mark and two facts. */
export function buildScene(): Scene {
  const scene = madeUpScene();
  scene.addParts([
    readoutTile(DISTANCE),
  ]);
  return scene;
}

/** What the page does once the viewer is drawn: the tile follows the viewer's time with invented numbers (a distance that swings between 5 and 200 units). Returns the function that stops it. */
export function live(viewer: MountedScene): () => void {
  const tile = viewer.part(readoutTile(DISTANCE));
  const start = viewer.timeUtcMs ?? 0;
  return viewer.onChange(({ timeUtcMs }) => {
    const days = (timeUtcMs - start) / 86_400_000;
    const distance = 5 * 40 ** ((1 + Math.sin(days / 10)) / 2);
    tile.setValue(`${distance.toFixed(1)} units`, distance);
    tile.setFacts([{ label: "Speed", value: `${(7 + Math.cos(days / 10) * 3).toFixed(1)} units/s` }, { label: "Direction", value: Math.cos(days / 10) > 0 ? "inbound" : "outbound" }]);
  });
}
