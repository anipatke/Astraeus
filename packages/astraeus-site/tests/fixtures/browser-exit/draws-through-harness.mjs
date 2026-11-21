// Test fixture for tests/browserDrawnControl.test.ts: one blank page through the real harness, given the canvas readouts the driver reads (data-points, data-body-screen, data-paths) for the case named in DRAWN_CASE,
// then the real driver reads and the real assertions. The attributes are written here, so the fixture does not depend on the app or on the diagnostics flag.
import * as ui from "../../../tools/validate/driver.mjs";
import { checkScript } from "../../../tools/validate/harness.mjs";
import { assertSceneDrawn, assertStreamDrawn } from "../../../tools/validate/stream-check.mjs";

const body = { id: "earth", as: "sphere", radiusPx: 20, x: 0.5, y: 0.5, inView: true };
const group = (inView) => ({ id: "stream", drawn: true, members: 500, inView, spanX: 0.4, spanY: 0.4 });
const readouts = {
  "zero-dots": { points: [group(0)], bodies: [body] },
  nothing: { points: [], bodies: [] },
  drawn: { points: [group(300)], bodies: [body] },
}[process.env.DRAWN_CASE ?? ""];
if (readouts === undefined) throw new Error(`unknown DRAWN_CASE ${process.env.DRAWN_CASE}`);

await checkScript(
  { name: `planted-${process.env.DRAWN_CASE}`, viewports: [{ width: 320, height: 240 }] },
  async (page) => {
    await page.setContent("<canvas></canvas>");
    await page.evaluate((r) => {
      const canvas = document.querySelector("canvas");
      canvas.setAttribute("data-points", JSON.stringify(r.points));
      canvas.setAttribute("data-body-screen", JSON.stringify(r.bodies));
      canvas.setAttribute("data-paths", "[]");
    }, readouts);
    const drawn = assertSceneDrawn(await ui.sceneDrawsSomething(page), "fixture-view");
    assertStreamDrawn(drawn.dots, "fixture-stream");
    return drawn;
  },
);
