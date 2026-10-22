// A set of many small bodies drawn together (O-025 T-098): one batch of dots with a pixel floor, a ball at true size close up, names on
// hover, tap or near zoom, and one batch of orbit lines coloured by family. Generic: the members, families and colours are the experience's.
import type { BodyId } from "../core/body";
import type { EphemerisGroup } from "../core/ephemerisGroup";
import type { BalancePoint } from "../core/orbitPeriod";

export interface BodySetMember {
  readonly id: BodyId;
  readonly label: string;
  readonly radiusKm: number;
  /** One of the layer's family ids. */
  readonly family: string;
}

export interface BodySetFamily {
  readonly id: string;
  readonly label: string;
  /** Default orbit colour, #rrggbb; the live settings may change it. */
  readonly color: string;
}

/** Shader uniform arrays hold at most this many families. */
export const MAX_BODY_SET_FAMILIES = 16;

export interface BodySetLayer {
  readonly id: string;
  /** Positions (and, for the orbits, velocities) of the members, in member order. */
  readonly group: EphemerisGroup;
  readonly members: readonly BodySetMember[];
  readonly families: readonly BodySetFamily[];
  /** Catalogued bodies drawn elsewhere (full bodies with their own orbit lines) that belong to one of these families: their orbit lines take the family colour. */
  readonly bodyFamilies?: Readonly<Record<BodyId, string>>;
  /**
   * Orbit lines for bodies drawn elsewhere as full bodies (their dots are not drawn here), from their own group about the same centre,
   * each with its family: they join the one batch of orbit lines. Absent: none.
   */
  readonly extraOrbits?: { readonly group: EphemerisGroup; readonly families: readonly string[] };
  /** Gravitational parameter of the set's centre, km^3/s^2: it sizes each orbit line to about one orbital period of the member's own path. */
  readonly centreGmKm3S2: number;
  /**
   * A member (or extra-orbit body) the centre circles with: the other members' orbit lines are drawn about the balance point and each line's period
   * is worked out about it, so a line is one round lap. The line is moved to end at its body, so the body is always on it. Absent: about the centre.
   */
  readonly balancePoint?: BalancePoint;
}

/** The live look of a body set (Developer > Display settings). Presentation only. */
export interface BodySetLook {
  /** Dot colour, also the ball's. */
  readonly dotColor: string;
  /** The dot's size on screen, px: the floor below which a member never shrinks. */
  readonly dotPx: number;
  /** Names appear for members whose ball is at least this many px across on screen (near zoom), besides hover and tap. */
  readonly labelNearPx: number;
  /** At most this many near-zoom names at once (the nearest first). */
  readonly labelNearMax: number;
  readonly orbitsOn: boolean;
  /** Orbit line opacity close in (Planetary Explorer's ring, 0.18). */
  readonly orbitOpacity: number;
  /** Extra orbit opacity at full zoom-out (Planetary Explorer's 0.45). */
  readonly orbitZoomBoost: number;
  /** Camera distance, in orbit sizes, at which the brightening is complete. */
  readonly orbitZoomFarRatio: number;
  /** Family id to orbit colour, over each family's own. */
  readonly familyColors: Readonly<Record<string, string>>;
  /** Family id to brightness multiplier (a highlight brightens one family); 1 when absent. */
  readonly familyGains: Readonly<Record<string, number>>;
  /** The family lit up now (the moon panel's choice), or null: its dots, balls and orbit lines take the highlight look. */
  readonly highlightFamily: string | null;
  /** Dot and ball colour of the lit family, #rrggbb. */
  readonly highlightColor: string;
  /** Orbit-line brightness multiplier for the lit family. */
  readonly highlightOrbitGain: number;
}

/**
 * Default orbit colours, in family order: the Okabe and Ito colour-blind-safe set (Okabe and Ito 2008, "Color Universal Design"), without
 * its black and its dark blue (both vanish on the night sky), preceded by the cream of the existing orbit lines and followed by a neutral grey.
 */
export const DEFAULT_FAMILY_PALETTE: readonly string[] = Object.freeze(["#f0e6da", "#f0e442", "#e69f00", "#56b4e9", "#cc79a7", "#009e73", "#d55e00", "#bbbbbb"]);

export const DEFAULT_BODY_SET_LOOK: BodySetLook = Object.freeze({
  dotColor: "#9a9a9a",
  dotPx: 3,
  labelNearPx: 6,
  labelNearMax: 8,
  orbitsOn: true,
  orbitOpacity: 0.18,
  orbitZoomBoost: 0.45,
  orbitZoomFarRatio: 4,
  familyColors: Object.freeze({}),
  familyGains: Object.freeze({}),
  highlightFamily: null,
  highlightColor: "#fc6323",
  highlightOrbitGain: 4,
});

export const BODY_SET_LOOK_LIMITS = Object.freeze({
  dotPx: { min: 1, max: 12 },
  labelNearPx: { min: 1, max: 100 },
  orbitOpacity: { min: 0, max: 1 },
  orbitZoomBoost: { min: 0, max: 1 },
  orbitZoomFarRatio: { min: 1.5, max: 20 },
  highlightOrbitGain: { min: 1, max: 12 },
});

/** The orbit brightness multiplier of a family now: its own gain, else the highlight's when it is the lit one. */
export function familyGainOf(look: BodySetLook, family: string): number {
  return look.familyGains[family] ?? (look.highlightFamily === family ? look.highlightOrbitGain : 1);
}

/** Families in data order with the default palette's colours, cycling past its end. */
export function familiesWithPalette(families: readonly { readonly id: string; readonly label: string }[], palette: readonly string[] = DEFAULT_FAMILY_PALETTE): readonly BodySetFamily[] {
  if (families.length > MAX_BODY_SET_FAMILIES) throw new RangeError(`a body set holds at most ${MAX_BODY_SET_FAMILIES} families, got ${families.length}`);
  return Object.freeze(families.map((family, index) => Object.freeze({ id: family.id, label: family.label, color: palette[index % palette.length] })));
}

/** Checks a layer: members and families unique, every member in a family, a positive centre GM, members as the group's. */
export function validateBodySet(layer: BodySetLayer): BodySetLayer {
  const where = `body set "${layer.id}"`;
  if (layer.families.length === 0 || layer.families.length > MAX_BODY_SET_FAMILIES) throw new RangeError(`${where} needs 1 to ${MAX_BODY_SET_FAMILIES} families`);
  const families = new Set(layer.families.map((family) => family.id));
  if (families.size !== layer.families.length) throw new RangeError(`${where} lists a family twice`);
  if (layer.members.length !== layer.group.count) throw new RangeError(`${where} has ${layer.members.length} members but its group ${layer.group.count}`);
  layer.members.forEach((member, index) => {
    if (member.id !== layer.group.members[index]) throw new RangeError(`${where} member ${index} is "${member.id}" but the group's is "${layer.group.members[index]}"`);
    if (!families.has(member.family)) throw new RangeError(`${where} member "${member.id}" is in unknown family "${member.family}"`);
    if (!(member.radiusKm > 0)) throw new RangeError(`${where} member "${member.id}" needs a positive radius`);
  });
  for (const [body, family] of Object.entries(layer.bodyFamilies ?? {})) if (!families.has(family)) throw new RangeError(`${where} body "${body}" is in unknown family "${family}"`);
  const extra = layer.extraOrbits;
  if (extra !== undefined) {
    if (extra.families.length !== extra.group.count) throw new RangeError(`${where} extra orbits need one family per body`);
    if (extra.group.center !== layer.group.center) throw new RangeError(`${where} extra orbits must share the set's centre`);
    for (const family of extra.families) if (!families.has(family)) throw new RangeError(`${where} extra orbit in unknown family "${family}"`);
  }
  if (!(layer.centreGmKm3S2 > 0)) throw new RangeError(`${where} needs a positive centre GM`);
  return layer;
}

/** The colour each family's orbits are drawn in now: the live choice, else the family's own. */
export function familyColorOf(layer: BodySetLayer, look: BodySetLook, family: string): string {
  return look.familyColors[family] ?? layer.families.find((candidate) => candidate.id === family)?.color ?? "#ffffff";
}
