// Scene React hooks: host-layer lifetime, sky stars loading and the scene views.
import { useEffect, useMemo } from "react";
import type { WebGLRenderer } from "three";
import { loadStarCatalogue } from "../assets/sky";
import type { SceneRuntime } from "./AstraeusScene";
import { COMPOSITION_PATH_STYLE, PathView, compositionPathLayer, createPathViews } from "./PathView";
import { PointsView } from "./PointsView";
import { SkyView } from "./SkyView";
import { TrackedBodyView } from "./TrackedBodyView";

/**
 * Mounts a DOM layer (labels, markers) next to the canvas and keeps `ref` pointing at it; `create` returns null when there is nothing to
 * mount. The layer is disposed and the ref cleared when `deps` change or the scene goes.
 */
export function useHostLayer<L extends { dispose(): void }>(canvas: HTMLCanvasElement, ref: { current: L | null }, create: (host: HTMLElement) => L | null, deps: readonly unknown[]): void {
  useEffect(() => {
    const host = canvas.parentElement;
    if (host === null) return undefined;
    const layer = create(host);
    if (layer === null) return undefined;
    ref.current = layer;
    return () => {
      layer.dispose();
      ref.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** The stars load from the committed HYG file; without it the Milky Way is drawn alone. */
export function useSkyStars(canvas: HTMLCanvasElement, skyView: SkyView | null): void {
  useEffect(() => {
    if (skyView === null) return undefined;
    let cancelled = false;
    canvas.dataset.skyStars = "0";
    void loadStarCatalogue().then((loaded) => {
      if (cancelled || loaded === null) return;
      skyView.setStars(loaded.stars);
      canvas.dataset.skyStars = String(skyView.starCount);
    });
    return () => {
      cancelled = true;
      delete canvas.dataset.skyStars;
      delete canvas.dataset.skyPicture;
      delete canvas.dataset.skyStarBrightness;
      skyView.dispose();
    };
  }, [canvas, skyView]);
}

/** The scene's own views, built once per runtime: tracked bodies, point groups, the declared paths, the composition's paths and the sky. */
export function useSceneViews(runtime: SceneRuntime, gl: WebGLRenderer) {
  const trackedViews = useMemo(() => runtime.trackedBodies.map((body) => new TrackedBodyView(body)), [runtime.trackedBodies]);
  const groupViews = useMemo(() => runtime.groups.map((layer) => new PointsView(layer)), [runtime.groups]);
  const sunCentredViews = useMemo(() => createPathViews(runtime.paths ?? []), [runtime.paths]);
  const compositionPaths = useMemo(() => (runtime.composition?.paths ?? []).map((path) => new PathView(compositionPathLayer(path, runtime.resolver), COMPOSITION_PATH_STYLE)), [runtime.composition, runtime.resolver]);
  const skyView = useMemo(() => (runtime.sky?.visible ? new SkyView({ starBrightness: runtime.sky.starBrightness, milkyWayBrightness: runtime.sky.milkyWayBrightness, pixelRatio: gl.getPixelRatio(), maxAnisotropy: gl.capabilities.getMaxAnisotropy(), milkyWay: runtime.sky.milkyWay, picture: null }) : null), [runtime.sky, gl]);
  return { trackedViews, groupViews, sunCentredViews, compositionPaths, skyView };
}
