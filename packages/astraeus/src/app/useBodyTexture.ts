// Adapted from planetary-explorer src/features/moon/usePlanetTexture.ts (owner's donor checkout).
import { useEffect, useMemo } from "react";
import { useLoader, useThree } from "@react-three/fiber";
import { SRGBColorSpace, Texture, TextureLoader } from "three";

/** Resolves with an empty Texture on load failure so a missing asset never breaks Suspense. */
class SafeTextureLoader extends TextureLoader {
  override load(
    url: string,
    onLoad?: (texture: Texture) => void,
    onProgress?: (event: ProgressEvent) => void,
  ): Texture {
    return super.load(url, onLoad, onProgress, () => {
      console.warn(`[useBodyTexture] texture not found: ${url}`);
      onLoad?.(new Texture());
    });
  }
}

export function useBodyTexture(url: string): Texture | null {
  const gl = useThree((state) => state.gl);
  const loaded = useLoader(SafeTextureLoader, url);
  const failed = !loaded.image;
  // The loader keeps the decoded picture for the page; each use draws its own clone, so one viewer's unmount disposes only its own copy and never
  // a picture another viewer draws (a fresh clone has version 0, so it is flagged for upload). A failed load is forgotten at unmount, never while mounted.
  const texture = useMemo(() => {
    if (failed) return null;
    const copy = loaded.clone();
    copy.needsUpdate = true;
    return copy;
  }, [loaded, failed]);
  useEffect(
    () => () => {
      texture?.dispose();
      if (failed) useLoader.clear(SafeTextureLoader, url);
    },
    [texture, failed, url],
  );
  if (texture === null) return null;
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = gl.capabilities.getMaxAnisotropy();
  return texture;
}
