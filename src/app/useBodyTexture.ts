// Adapted from planetary-explorer src/features/moon/usePlanetTexture.ts (owner's donor checkout).
import { useEffect } from "react";
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
  const texture = useLoader(SafeTextureLoader, url);
  // The loader keeps the picture for the next scene, and a renderer keeps its GPU copy in a table keyed by it, so an unmounted scene's renderer would stay
  // reachable through it (a switch inside the page, O-030). Disposing tells every renderer to forget it; the next scene uploads it again.
  useEffect(() => () => texture.dispose(), [texture]);
  if (!texture.image) return null;
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = gl.capabilities.getMaxAnisotropy();
  return texture;
}
