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

export interface TextureRef {
  /** Bundler asset URL. */
  readonly url: string;
  readonly widthPx: number;
  readonly heightPx: number;
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
