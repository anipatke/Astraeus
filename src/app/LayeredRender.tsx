import { useFrame } from "@react-three/fiber";
import { TRACK_LAYER } from "./TrackedBodyView";

/** Takes over rendering so each lit body is lit only by its own Sun direction, one pass per body. */
export function LayeredRender({ lightLayers }: { readonly lightLayers: readonly number[] }) {
  useFrame(({ gl, scene, camera }) => {
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
  }, 1);
  return null;
}
