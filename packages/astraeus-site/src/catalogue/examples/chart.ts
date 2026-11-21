import { Scene, chart, panel, type MountedScene } from "astraeus";
import { madeUpScene } from "../madeUpScene";

const SIZES = {
  id: "sizes",
  axisLabel: "Size (invented units)",
  bins: [{ low: 0, high: 10, count: 40 }, { low: 10, high: 20, count: 25 }, { low: 20, high: 30, count: 9, color: "#8fb4ff" }],
  marks: [{ value: 20, label: "Limit" }],
  highlight: { low: 10, high: 30 },
};
const BARS = { id: "bars", button: { label: "Bar chart", shortLabel: "Chart" }, title: "Bar chart" };

/** The scene the catalogue runs for `chart`: bars of made-up counts with one mark and the bars outside a range dimmed. */
export function buildScene(): Scene {
  const scene = madeUpScene();
  scene.addParts([
    panel({ ...BARS, blocks: [chart(SIZES)] }),
  ]);
  return scene;
}

const RANGES = [{ low: 10, high: 30 }, { low: 0, high: 20 }, { low: 0, high: 30 }];

/** What the page does once the viewer is drawn: it opens the panel, then the lit range changes every few invented days as the viewer's time moves. Returns the function that stops it. */
export function live(viewer: MountedScene): () => void {
  viewer.part(panel({ ...BARS, blocks: [chart(SIZES)] })).setOpen(true);
  const bars = viewer.part(chart(SIZES));
  const start = viewer.timeUtcMs ?? 0;
  return viewer.onChange(({ timeUtcMs }) => {
    const step = Math.floor((timeUtcMs - start) / (3 * 86_400_000));
    bars.setHighlight(RANGES[((step % RANGES.length) + RANGES.length) % RANGES.length]);
  });
}
