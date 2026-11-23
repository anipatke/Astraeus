// O-099 T-446: the `data-orbit-line-gap` readout the browser check reads: the screen distance from a body's drawn centre to its orbit line, as a share of the view's height.
import { describe, expect, it } from "vitest";
import { PerspectiveCamera } from "three";
import { catalogue } from "../src/assets/catalogue";
import { sunOrbitLayer } from "../src/api/sunOrbit";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { PathView } from "../src/app/PathView";
import { eqjToRenderVector } from "../src/app/renderCoordinates";
import { publishOrbitLineGaps } from "../src/app/sceneFrame";
import { trueScale } from "../src/presentation/scalePolicy";
import { placementAbout } from "./scenePlacement";

const T0 = Date.UTC(2026, 0, 1);
const earthRadius = catalogue.get("earth").definition.radiusKm * (trueScale.mapPosition([1, 0, 0])[0] ?? 0);

function scene() {
  const layer = sunOrbitLayer(catalogue, "earth", T0, "")!;
  const view = new PathView(layer);
  view.sync(T0, placementAbout("sun"), trueScale, 0);
  const earth = eqjToRenderVector(
    trueScale.mapPosition(Array.from(layer.source.stateAt(T0, "sun").positionKm) as [number, number, number]),
  );
  const origin = new FloatingOrigin();
  origin.set(earth);
  view.place(origin);
  const camera = new PerspectiveCamera(50, 1.6, earthRadius / 10, earthRadius * 1000);
  camera.position.set(0, 0, earthRadius * 30);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  return { view, earth, origin, camera };
}

describe("publishOrbitLineGaps", () => {
  it("reads the line through the body as a tiny share of the view, and a point off the line as a larger one", () => {
    const { view, earth, origin, camera } = scene();
    const canvas = { dataset: {} as Record<string, string> } as unknown as HTMLCanvasElement;
    publishOrbitLineGaps(canvas, [view], () => earth, origin, camera);
    const on = (JSON.parse(canvas.dataset.orbitLineGap!) as Record<string, number | null>)["earth-orbit"];
    expect(on).not.toBeNull();
    expect(on! * 900).toBeLessThan(0.5);
    publishOrbitLineGaps(
      canvas,
      [view],
      () => [earth[0] + earthRadius * 5, earth[1] + earthRadius * 5, earth[2]],
      origin,
      camera,
    );
    const off = (JSON.parse(canvas.dataset.orbitLineGap!) as Record<string, number | null>)["earth-orbit"];
    expect(off!).toBeGreaterThan(on! + 0.01);
  });

  it("reads null when the body is behind the camera", () => {
    const { view, earth, origin, camera } = scene();
    camera.position.set(0, 0, -earthRadius * 30);
    camera.lookAt(0, 0, -earthRadius * 60);
    camera.updateMatrixWorld();
    const canvas = { dataset: {} as Record<string, string> } as unknown as HTMLCanvasElement;
    publishOrbitLineGaps(canvas, [view], () => earth, origin, camera);
    expect(JSON.parse(canvas.dataset.orbitLineGap!)).toEqual({ "earth-orbit": null });
  });
});
