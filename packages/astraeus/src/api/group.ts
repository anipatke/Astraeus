import type { BodyId } from "../core/body";
import { createOrbAstronomyAdapter } from "../core/astronomyAdapter";
import { createListedOrbitGroup, type ListedMember } from "../core/listedOrbitGroup";
import { createProvenance, type Provenance } from "../core/provenance";
import { createOrbTwoBodyAdapter } from "../core/twoBodyAdapter";
import type { TimeBounds } from "../core/trajectory";
import { catalogue } from "../assets/catalogue";
import type { GroupLayer } from "../app/experienceDefinition";
import { SceneError } from "./errors";
import { toUtcMs, type TimeInput } from "./time";

/** One listed orbit of a group: its own id (the record it came from) and its shape and orientation. Angles in degrees, length in km. The orbit carries no position along itself; the group chooses that. */
export interface GroupOrbitInput {
  /** The orbit's own id, such as the record it was listed under; distinct within the group. */
  readonly id: string;
  readonly semiMajorAxisKm: number;
  /** At least 0 and below 1: a bound orbit. */
  readonly eccentricity: number;
  readonly inclinationDeg: number;
  readonly raanDeg: number;
  readonly argumentOfPeriapsisDeg: number;
  /** The moment the record was measured, kept with the record; it does not place the dot. Defaults to the group's reference time. */
  readonly time?: TimeInput;
}

/** A stated share of the dots drawn near a body's position along its orbit: a model, not a measurement. */
export interface GroupClumpInput {
  /** A catalogued body in the scene to clump near. Only where it is along its orbit about the group's centre at the reference time is used. */
  readonly near: BodyId;
  /** Share of the dots, 0 to 1. */
  readonly fraction: number;
  /** Half-width of the clump in degrees along the orbit, above 0 and at most 180. */
  readonly widthDeg: number;
}

/**
 * A group of listed orbits drawn as one set of dots: one dot per orbit, on its own ellipse, one colour and dot size, one menu item and one info card.
 * The group's id joins the camera menu (`focus-<id>`, `follow-<id>`) and may be named by story panels. The orbits' shapes are as listed; where each dot sits
 * along its orbit is a drawing choice (an even spread, shuffled by `seed`) and the info card says so.
 */
export interface GroupInput {
  /** The group's id: its menu item, camera target and panel `object`. Not shared with any body, path or other group. */
  readonly id: string;
  /** The listed orbits; at least one, ids distinct. */
  readonly orbits: readonly GroupOrbitInput[];
  /** Name on the menu and info card; the id when absent. */
  readonly label?: string;
  /** The body the orbits circle; the scene's centre (its first body) when absent. It must be in the scene. */
  readonly center?: BodyId;
  /** The plane the elements are given in: "ecliptic-j2000" (default) or "EQJ" (the equator of J2000). */
  readonly plane?: "ecliptic-j2000" | "EQJ";
  /** The dots' colour as a CSS hex colour such as "#9de3a8"; default "#9de3a8". */
  readonly color?: string;
  /** Dot size in screen pixels; default 2.5. */
  readonly dotSizePx?: number;
  /** The moment each orbit's dot is placed from (then it moves by two-body motion); the scene's opening time when absent. */
  readonly referenceTime?: TimeInput;
  /** A whole number from 0 to 4294967295 that shuffles which orbit takes which place along its orbit; the same seed gives the same picture. Default 0. */
  readonly seed?: number;
  /** Draws a share of the dots near a body's position along its orbit. */
  readonly clump?: GroupClumpInput;
  /** How often, in simulated milliseconds, the dots are placed again exactly; between fills the picture blends the two nearest. Presentation only. Default five minutes. */
  readonly refillAfterMs?: number;
  /** Where the orbit list came from. The group still marks the position along each orbit as illustrative. Defaults to an "as supplied" notice. */
  readonly provenance?: Provenance;
  /** One or two plain sentences for the info card; a count and placement sentence when absent. */
  readonly description?: string;
  /** Limits of the list, shown first on the info card; the group adds its own placement and motion limits. */
  readonly knownLimitations?: readonly string[];
}

/** A validated group, built into a draw layer once the scene's centre and opening time are known. */
export interface PlannedGroup {
  readonly id: string;
  readonly label: string;
  readonly input: GroupInput;
}

const GROUP_COLOR = "#9de3a8";
const HEX = /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/;
const bad = (id: unknown, message: string): SceneError => new SceneError("bad-group", `addGroup("${String(id)}"): ${message}`);

/** Checks what can be checked before the scene is complete; the centre, the clump body and the id clash with other things are checked at build. */
export function planGroup(input: GroupInput): PlannedGroup {
  const id = input?.id;
  if (typeof id !== "string" || id === "") throw bad(id, "the group needs a non-empty id");
  checkOrbits(id, input.orbits);
  checkLook(id, input);
  if (input.clump !== undefined) checkClump(id, input.clump);
  if (input.center !== undefined && !catalogue.has(input.center)) throw new SceneError("unknown-body", `addGroup("${id}"): centre "${String(input.center)}" is not a catalogued body`);
  return { id, label: input.label ?? id, input };
}

function checkOrbits(id: string, orbits: readonly GroupOrbitInput[]): void {
  if (!Array.isArray(orbits) || orbits.length === 0) throw bad(id, "the group needs at least one orbit; the list is empty");
  const seen = new Set<string>();
  for (const orbit of orbits) {
    if (typeof orbit?.id !== "string" || orbit.id === "") throw bad(id, "every orbit needs a non-empty id");
    if (seen.has(orbit.id)) throw bad(id, `orbit "${orbit.id}" appears twice`);
    seen.add(orbit.id);
  }
}

const positive = (value: number | undefined): boolean => value === undefined || (Number.isFinite(value) && value > 0);

function checkLook(id: string, input: GroupInput): void {
  if (input.color !== undefined && !(typeof input.color === "string" && HEX.test(input.color))) throw bad(id, `color "${String(input.color)}" is not a hex colour such as "#9de3a8"`);
  if (!positive(input.dotSizePx)) throw bad(id, "dotSizePx must be above 0");
  if (!positive(input.refillAfterMs)) throw bad(id, "refillAfterMs must be above 0");
  const limits = input.knownLimitations;
  if (limits !== undefined && !(Array.isArray(limits) && limits.every((line) => typeof line === "string" && line !== ""))) throw bad(id, "knownLimitations must be a list of non-empty texts");
}

function checkClump(id: string, clump: GroupClumpInput): void {
  if (typeof clump.near !== "string" || !catalogue.has(clump.near) || catalogue.get(clump.near).source === undefined) throw bad(id, `clump.near "${String(clump?.near)}" is not a catalogued body with a position`);
  if (!(clump.fraction >= 0 && clump.fraction <= 1)) throw bad(id, `clump.fraction must be from 0 to 1, got ${String(clump.fraction)}`);
  if (!(clump.widthDeg > 0 && clump.widthDeg <= 180)) throw bad(id, `clump.widthDeg must be above 0 and at most 180, got ${String(clump.widthDeg)}`);
}

const PLACEMENT_LIMIT = "The position of each dot along its orbit is illustrative: the list gives the orbit's shape and orientation, and the dots are spread evenly along them.";
const MOTION_LIMIT = "Motion is unperturbed two-body motion about the centre.";
const CLUMP_LIMIT = (near: BodyId, fraction: number): string => `${Math.round(fraction * 100)}% of the dots are drawn near ${catalogue.get(near).definition.label}'s position along its orbit. That clump is a model, not a measurement.`;

const AS_SUPPLIED = createProvenance({ sourceType: "illustrative", sources: ["Supplied by the caller"], accuracy: "As supplied; the engine makes no claim.", notes: "The orbits were passed to addGroup." });

/** Builds the draw layer: the listed-orbit group and its one shell item. `center` and `openUtcMs` come from the finished scene; a group error from the engine is renamed `bad-group`. */
export function buildGroupLayer(plan: PlannedGroup, center: BodyId, openUtcMs: number, window: TimeBounds): GroupLayer {
  const { id, input } = plan;
  const referenceUtcMs = input.referenceTime === undefined ? openUtcMs : toUtcMs(input.referenceTime, `addGroup("${id}") referenceTime`);
  const members = input.orbits.map((orbit): ListedMember => ({
    recordId: orbit.id,
    epochUtcMs: orbit.time === undefined ? referenceUtcMs : toUtcMs(orbit.time, `addGroup("${id}") orbit "${orbit.id}" time`),
    elements: { semiMajorAxisKm: orbit.semiMajorAxisKm, eccentricity: orbit.eccentricity, inclinationDeg: orbit.inclinationDeg, raanDeg: orbit.raanDeg, argumentOfPeriapsisDeg: orbit.argumentOfPeriapsisDeg },
  }));
  const clump = input.clump;
  try {
    const group = createListedOrbitGroup({
      id,
      center,
      plane: input.plane ?? "ecliptic-j2000",
      members,
      phase: {
        referenceUtcMs,
        ...(input.seed === undefined ? {} : { seed: input.seed }),
        ...(clump === undefined ? {} : { concentration: { around: catalogue.get(clump.near).source!.create(createOrbAstronomyAdapter()), fraction: clump.fraction, widthDeg: clump.widthDeg } }),
      },
      bounds: window,
      provenance: input.provenance ?? AS_SUPPLIED,
    }, createOrbTwoBodyAdapter());
    const color = input.color ?? GROUP_COLOR;
    return {
      group,
      color,
      pointSizePx: input.dotSizePx ?? 2.5,
      ...(input.refillAfterMs === undefined ? {} : { refillAfterMs: input.refillAfterMs }),
      object: {
        id,
        label: plan.label,
        color,
        labelPriority: 80,
        description: input.description ?? `${group.count} listed orbit${group.count === 1 ? "" : "s"}, each drawn as one dot. One item stands for the whole group; its focus point is the centroid of the dots.`,
        knownLimitations: [...(input.knownLimitations ?? []), PLACEMENT_LIMIT, ...(clump === undefined ? [] : [CLUMP_LIMIT(clump.near, clump.fraction)]), MOTION_LIMIT],
      },
    };
  } catch (error) {
    if (error instanceof SceneError) throw error;
    throw bad(id, error instanceof Error ? error.message : String(error));
  }
}
