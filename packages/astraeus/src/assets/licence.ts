/** Imagery rights are not scientific provenance; they get their own record (PROV-02). */
export interface AssetLicence {
  readonly source: string;
  readonly url: string;
  /** "public domain", "CC BY 4.0", and so on. */
  readonly licence: string;
  /** The credit line the licence requires, when it requires one. */
  readonly attribution?: string;
  /** ISO date the licence was read. */
  readonly accessed: string;
}

/** What a public build shows in place of a local-only texture. */
export type PublicReplacement = "material-colour" | { readonly url: string; readonly licence: AssetLicence };

/** Declares an unlicensed texture as local-only on purpose: why, and what the public build shows instead. */
export interface LocalOnlyDeclaration {
  readonly reason: string;
  readonly publicReplacement: PublicReplacement;
}

/** A picture the engine can wrap on a body: where it is, its size, and the rights to show it publicly. */
export interface TextureRef {
  /** Bundler asset URL. */
  readonly url: string;
  readonly widthPx: number;
  readonly heightPx: number;
  /** A larger file for wide viewports, chosen once at load by `textureUrlFor`. Same rights as the base file. */
  readonly desktop?: { readonly url: string; readonly widthPx: number; readonly heightPx: number; readonly minViewportWidth: number };
  /** Rights for public distribution. Required unless the texture is declared local-only. */
  readonly licence?: AssetLicence;
  readonly localOnly?: LocalOnlyDeclaration;
}

/** Why a texture fails the rights rule, or null when it has exactly one of licence and localOnly. */
export function textureRightsProblem(texture: TextureRef): string | null {
  const hasLicence = texture.licence !== undefined;
  const hasLocalOnly = texture.localOnly !== undefined;
  if (hasLicence && hasLocalOnly) return "has both a licence and a local-only declaration";
  if (!hasLicence && !hasLocalOnly) return "has neither a licence nor a local-only declaration";
  if (texture.localOnly !== undefined && texture.localOnly.reason.trim() === "") return "local-only declaration has no reason";
  return null;
}

/**
 * The file to load for a viewport width, as the donor's usePlanetTexture does: the desktop variant from its minimum width up, the base file
 * below it. No width (no window) means the widest, as in the donor.
 */
export function textureUrlFor(texture: TextureRef, viewportWidth: number = Number.POSITIVE_INFINITY): string {
  const { desktop } = texture;
  return desktop !== undefined && viewportWidth >= desktop.minViewportWidth ? desktop.url : texture.url;
}
