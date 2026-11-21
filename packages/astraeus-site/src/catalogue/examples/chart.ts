import { Scene, chart, panel } from "astraeus";
import { madeUpScene } from "../madeUpScene";

/** The scene the catalogue runs for `chart`: bars of made-up counts with one mark and the bars outside a range dimmed. */
export function buildScene(): Scene {
  const scene = madeUpScene();
  scene.addParts([
    panel({
      id: "bars",
      button: { label: "Bar chart", shortLabel: "Chart" },
      title: "Bar chart",
      blocks: [
        chart({
          id: "sizes",
          axisLabel: "Size (invented units)",
          bins: [{ low: 0, high: 10, count: 40 }, { low: 10, high: 20, count: 25 }, { low: 20, high: 30, count: 9, color: "#8fb4ff" }],
          marks: [{ value: 20, label: "Limit" }],
          highlight: { low: 10, high: 30 },
        }),
      ],
    }),
  ]);
  return scene;
}
