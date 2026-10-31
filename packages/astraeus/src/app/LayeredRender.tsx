import { useFrame } from "@react-three/fiber";
import type { FrameState } from "./sceneFrame";
import { TRACK_LAYER } from "./TrackedBodyView";

/**
 * Takes over rendering so each lit body is lit only by its own Sun direction, one pass per body.
 * It draws every frame except the ones the scene's draw rule (`decideDraw`) marked as unchanged: paused and idle. The frame loop itself keeps
 * running (the names, markers and readouts are still updated each frame), so a tap, a setting or the clock wakes the next frame at once.
 * Chosen over React Three Fiber's `frameloop: "demand"` because the draws are the cost and the per-frame work is small; demand would need every
 * DOM overlay, hover and load to call `invalidate()`, where a missed one freezes the picture.
 */
export function LayeredRender({ lightLayers, state }: { readonly lightLayers: readonly number[]; readonly state: { readonly current: FrameState } }) {
  useFrame(({ gl, scene, camera }) => {
    if (!state.current.drawThisFrame) return;
    const previousAutoClear = gl.autoClear;
    const previousMask = camera.layers.mask;
    gl.autoClear = false;
    gl.clear();
    // Layer 0 (paths) is drawn with the first body's pass, then every later body's pass shares the depth buffer.
    lightLayers.forEach((layer, index) => {
      camera.layers.mask = (index === 0 ? 1 : 0) | (1 << layer);
      gl.render(scene, camera);
    });
    if (lightLayers.length === 0) {
      camera.layers.mask = 1;
      gl.render(scene, camera);
    }
    camera.layers.mask = 1 << TRACK_LAYER;
    gl.render(scene, camera);
    camera.layers.mask = previousMask;
    gl.autoClear = previousAutoClear;
    state.current.framesDrawn += 1;
    gl.domElement.dataset.framesDrawn = String(state.current.framesDrawn);
    gl.domElement.dataset.depthMode = gl.capabilities.logarithmicDepthBuffer ? "logarithmic" : "linear"; // read by the browser checks (O-048 T-209)
  }, 1);
  return null;
}
