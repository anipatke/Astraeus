import type { Provenance } from "../core/provenance";
import type { BodyRef } from "./bodies";
import type { CardFactInput } from "./scene";
import type { TimeInput } from "./time";

/** One family of a body set: members that share an orbit colour and a place in the moon panel. */
export interface BodySetFamilyInput {
  /** The family's id; distinct within the set. */
  readonly id: string;
  readonly label: string;
  /** Orbit colour as a CSS hex colour; default: the palette in family order. */
  readonly color?: string;
  /** Orbit brightness multiplier, above 0; default 1 (the Developer drawer's family gain). */
  readonly brightness?: number;
}

/** The elements of a made-up member on two-body motion about the set's centre. Angles in degrees, length in km. */
export interface BodySetElementsInput {
  readonly semiMajorAxisKm: number;
  /** At least 0 and below 1: a bound orbit. */
  readonly eccentricity: number;
  readonly inclinationDeg: number;
  readonly raanDeg: number;
  readonly argumentOfPeriapsisDeg: number;
  readonly trueAnomalyDeg: number;
  /** The moment the elements hold; the scene's opening time when absent. */
  readonly time?: TimeInput;
  /** The plane the angles are given in: "ecliptic-j2000" or "EQJ" (default). */
  readonly plane?: "ecliptic-j2000" | "EQJ";
}

/** One member of a body set: a dot that is selectable, with an info card. */
export interface BodySetMemberInput {
  readonly id: string;
  /** The id of one of the set's families. */
  readonly family: string;
  /** Required with `elements`; a listed moon defaults to its own. */
  readonly label?: string;
  /** Required with `elements`; a listed moon defaults to its own. */
  readonly radiusKm?: number;
  /** Absent: `id` is a listed moon of the centre (positions come through `data`); present: a made-up member on two-body motion. All members of a set are one kind or the other. */
  readonly elements?: BodySetElementsInput;
  /** Info card words, as on `addBody`. */
  readonly description?: string;
  readonly facts?: readonly CardFactInput[];
  /** Where this member's position comes from; default: the set's. */
  readonly provenance?: Provenance;
  readonly knownLimitations?: readonly string[];
  /** Whether the Object menu offers it; default false, so a long list does not bury the menu. */
  readonly listed?: boolean;
}

/** A body added with `addBody` that belongs to one of the set's families. */
export interface BodySetBodyInput {
  readonly id: BodyRef | string;
  readonly family: string;
}

/** A member or body the centre circles with: orbit lines are drawn about the balance point. */
export interface BodySetBalanceInput {
  readonly body: BodyRef | string;
  readonly gmKm3S2: number;
}

/**
 * Many small bodies about one centre, each selectable, drawn as one batch: dots with a pixel floor, a ball at true size close up, names on hover, tap or near zoom,
 * and one batch of orbit lines coloured by family.
 */
export interface BodySetInput {
  /** The set's id; not shared with any body, path, group or member. */
  readonly id: string;
  /** The body the members circle; the scene's centre (its first body) when absent. It must be in the scene. */
  readonly center?: BodyRef | string;
  /** One to sixteen families, in order. */
  readonly families: readonly BodySetFamilyInput[];
  readonly members: readonly BodySetMemberInput[];
  /** Bodies added with `addBody` that belong to a family: their orbit lines take its colour, and one with no `orbit` of its own gets its line in this batch. */
  readonly bodies?: readonly BodySetBodyInput[];
  /** Where the positions come from, shown for the set. */
  readonly provenance: Provenance;
  /** Gravity of the centre, km^3/s^2, sizing each orbit line to one lap. Default: the centre's moon system, else its catalogue record; neither throws `bad-body-set`. */
  readonly centerGmKm3S2?: number;
  /** A member or body the centre circles with. Default: the centre's moon system's own when that body is in the set, else none. */
  readonly balancePoint?: BodySetBalanceInput;
  /** How far before the window's start to load positions, ms, so an orbit line can reach back. Default 0. Passed to the moon loader for every moon of the centre the scene holds. */
  readonly orbitHistoryMs?: number;
}
