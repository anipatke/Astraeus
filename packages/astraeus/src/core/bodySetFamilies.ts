// The families of a body set and the colours they take: pure data and one helper, shared by the viewer's body sets and the scene builder.

/** Shader uniform arrays hold at most this many families. */
export const MAX_BODY_SET_FAMILIES = 16;

export interface BodySetFamily {
  readonly id: string;
  readonly label: string;
  /** Default orbit colour, #rrggbb; the live settings may change it. */
  readonly color: string;
  /** Orbit brightness multiplier of the family before the live look changes it; absent: 1. */
  readonly brightness?: number;
}

/**
 * Default orbit colours, in family order: the Okabe and Ito colour-blind-safe set (Okabe and Ito 2008, "Color Universal Design"), without
 * its black and its dark blue (both vanish on the night sky), preceded by the cream of the existing orbit lines and followed by a neutral grey.
 */
export const DEFAULT_FAMILY_PALETTE: readonly string[] = Object.freeze(["#f0e6da", "#f0e442", "#e69f00", "#56b4e9", "#cc79a7", "#009e73", "#d55e00", "#bbbbbb"]);

/** Families in data order with the default palette's colours, cycling past its end. */
export function familiesWithPalette(families: readonly { readonly id: string; readonly label: string }[], palette: readonly string[] = DEFAULT_FAMILY_PALETTE): readonly BodySetFamily[] {
  if (families.length > MAX_BODY_SET_FAMILIES) throw new RangeError(`a body set holds at most ${MAX_BODY_SET_FAMILIES} families, got ${families.length}`);
  return Object.freeze(families.map((family, index) => Object.freeze({ id: family.id, label: family.label, color: palette[index % palette.length] })));
}

