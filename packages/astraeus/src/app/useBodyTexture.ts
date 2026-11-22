// Adapted from planetary-explorer src/features/moon/usePlanetTexture.ts (owner's donor checkout).
import { useEffect, useMemo } from "react";
import { useLoader, useThree } from "@react-three/fiber";
import { SRGBColorSpace, Texture, TextureLoader } from "three";

type LoadedTexture = ReturnType<TextureLoader["load"]>;

/**
 * Resolves with an empty Texture on load failure so a missing asset never breaks Suspense. The signature is taken from `TextureLoader.load` itself
 * rather than written out, so it matches every three.js the peer range admits (0.181 made the loaded texture generic, I-195).
 */
class SafeTextureLoader extends TextureLoader {
  override load(...[url, onLoad, onProgress]: Parameters<TextureLoader["load"]>): LoadedTexture {
    return super.load(url, onLoad, onProgress, () => {
      console.warn(`[useBodyTexture] texture not found: ${url}`);
      onLoad?.(new Texture() as LoadedTexture);
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
