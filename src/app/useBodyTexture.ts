// Adapted from planetary-explorer src/features/moon/usePlanetTexture.ts (owner's donor checkout).
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
  if (!texture.image) return null;
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = gl.capabilities.getMaxAnisotropy();
  return texture;
}
