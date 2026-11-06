import type { BodyId } from "../core/body";
import { createOrbTwoBodyAdapter } from "../core/twoBodyAdapter";
import { NotLoadedError } from "../core/planetSeries";
import { createEphemerisGroup, type EphemerisGroup } from "../core/ephemerisGroup";
import { createElementsGroup } from "../core/elementsGroup";
import { MOON_SYSTEMS } from "../core/bodies/listedMoonBodies";
import { listedMoon } from "../core/bodies/listedMoons";
import { createProvenance, type Provenance } from "../core/provenance";
import type { State } from "../core/state";
import type { TimeBounds } from "../core/trajectory";
import type { BalancePoint } from "../core/orbitPeriod";
import type { BodyCatalogue } from "../assets/catalogue";
import { familiesWithPalette } from "../core/bodySetFamilies";
import type { ExperienceDefinition } from "../app/experienceDefinition";

type BodySetLayer = NonNullable<ExperienceDefinition["bodySets"]>[number];
type BodySetMember = BodySetLayer["members"][number];
import type { ExperienceObject } from "../shell/experience";
import type { BodySetInput, BodySetMemberInput } from "./bodySetInput";
import { bad, checkInput, idOf } from "./bodySetChecks";
import type { DataSource } from "./data";
import { SceneError } from "./errors";
import { frozenList, type SceneBodySetRead } from "./sceneReads";
import { toUtcMs } from "./time";


/** The words on the orbit lines of bodies drawn elsewhere, whose lines this batch draws: kept as one planner constant. */
const EXTRA_ORBITS_PROVENANCE = { accuracy: "As each moon's own record.", notes: "Orbit lines only: each moon's own path over about one orbit, ending where it is now." } as const;

/** A validated set; its layer is built once the finished scene's centre, window and opening time are known. */
export interface PlannedBodySet {
  readonly input: BodySetInput;
  /** Whether the members are listed moons (positions through `data`) or made-up ones on two-body motion. */
  readonly kind: "listed" | "elements";
}

/** What the finished scene tells a set. */
export interface BodySetContext {
  /** The scene's bodies, in order added; the first is the scene's centre. */
  readonly ids: readonly BodyId[];
  readonly catalogue: BodyCatalogue;
  /** The bodies that asked for an orbit line of their own (`addBody` `orbit`). */
  readonly orbits: ReadonlySet<BodyId>;
  readonly window: TimeBounds;
  readonly startUtcMs: number;
}

/** What `installData` loads for the sets: every listed member with the planet it circles, and how far back each planet's lines reach. */
export interface BodySetLoad {
  readonly moons: readonly { readonly id: BodyId; readonly parent: BodyId }[];
  readonly historyMs: ReadonlyMap<BodyId, number>;
}

/** What a `Scene` has planned for its body sets. */
export class BodySetPlan {
  readonly sets = new Map<string, PlannedBodySet>();
  readonly #catalogue: () => BodyCatalogue;
  readonly #taken: (id: string) => boolean;

  /** `catalogue` gives the scene's catalogue as it stands; `taken` says whether the scene already holds an id (sets and members included). */
  constructor(catalogue: () => BodyCatalogue, taken: (id: string) => boolean) {
    this.#catalogue = catalogue;
    this.#taken = taken;
  }

  /** Whether `id` is a set or one of its members. */
  has(id: string): boolean {
    return this.sets.has(id) || this.memberIds().includes(id);
  }

  memberIds(): readonly string[] {
    return [...this.sets.values()].flatMap(({ input }) => input.members.map((member) => member.id));
  }

  add(input: BodySetInput): void {
    const kind = checkInput(input);
    for (const id of [input.id, ...input.members.map((member) => member.id)]) {
      if (this.#taken(id) || this.#catalogue().has(id) && kind === "elements") throw new SceneError("duplicate-id", `addBodySet("${input.id}"): "${id}" is already in the scene${this.#catalogue().has(id) ? " or the catalogue" : ""}`);
    }
    if (input.center !== undefined && !this.#catalogue().has(idOf(input.center))) throw new SceneError("unknown-body", `addBodySet("${input.id}"): centre "${String(idOf(input.center))}" is not a catalogued body`);
    this.sets.set(input.id, { input, kind });
  }

  centerOf(set: PlannedBodySet, first: BodyId): BodyId {
    return set.input.center === undefined ? first : idOf(set.input.center);
  }

  /** The gravity of a set's centre: stated, else the centre's moon system, else its catalogue record. */
  #gmOf(set: PlannedBodySet, center: BodyId, catalogue: BodyCatalogue): number {
    const gm = set.input.centerGmKm3S2 ?? MOON_SYSTEMS[center]?.config.centreGmKm3S2 ?? (catalogue.has(center) ? catalogue.get(center).definition.gmKm3S2 : undefined);
    if (gm === undefined) throw bad(set.input.id, `the centre "${center}" has no gravitational parameter (no moon system, no catalogue record); pass centerGmKm3S2`);
    return gm;
  }

  /** The listed moons the set draws as dots, in member order. */
  #dotsOf(set: PlannedBodySet, center: BodyId): readonly string[] {
    for (const member of set.input.members) {
      if (set.kind === "listed" && listedMoon(member.id)!.parent !== center) throw bad(set.input.id, `member "${member.id}" is a moon of "${listedMoon(member.id)!.parent}", not of the centre "${center}"`);
    }
    return set.input.members.map((member) => member.id);
  }

  /** Checks the sets against the finished scene: the centre, the listed moons of it, its gravity, the bodies and the balance point. */
  check(ctx: Pick<BodySetContext, "ids" | "catalogue" | "orbits">): void {
    for (const set of this.sets.values()) {
      const center = this.centerOf(set, ctx.ids[0]!);
      if (!ctx.ids.includes(center)) throw bad(set.input.id, `the members circle "${center}", which has not been added to the scene`);
      this.#dotsOf(set, center);
      this.#gmOf(set, center, ctx.catalogue);
      this.#bodiesOf(set, center, ctx);
      this.#balanceOf(set, center, ctx);
    }
  }

  /** The set's bodies, checked: in the scene, circling the centre; the ones without an orbit of their own are listed moons of it. */
  #bodiesOf(set: PlannedBodySet, center: BodyId, ctx: Pick<BodySetContext, "ids" | "catalogue" | "orbits">): { readonly id: BodyId; readonly family: string; readonly own: boolean }[] {
    return (set.input.bodies ?? []).map(({ id: ref, family }) => {
      const id = idOf(ref);
      if (!ctx.ids.includes(id)) throw bad(set.input.id, `body "${id}" has not been added to the scene`);
      if (ctx.catalogue.get(id).definition.parentId !== center) throw bad(set.input.id, `body "${id}" does not circle the centre "${center}"`);
      const own = ctx.orbits.has(id);
      if (!own && (listedMoon(id) === undefined || MOON_SYSTEMS[center] === undefined)) throw bad(set.input.id, `body "${id}" has no orbit of its own (addBody orbit) and is not a listed moon of "${center}", so this batch cannot draw its line`);
      return { id, family, own };
    });
  }

  /** The balance point: stated (its body is a member or a body without an orbit of its own), else the centre's moon system's when its body is one of those. */
  #balanceOf(set: PlannedBodySet, center: BodyId, ctx: Pick<BodySetContext, "ids" | "catalogue" | "orbits">): BalancePoint | undefined {
    const drawn = new Set([...set.input.members.map((member) => member.id), ...this.#bodiesOf(set, center, ctx).filter((body) => !body.own).map((body) => body.id)]);
    const stated = set.input.balancePoint;
    if (stated !== undefined) {
      const body = idOf(stated.body);
      if (!drawn.has(body)) throw bad(set.input.id, `balancePoint.body "${body}" must be a member or a body without an orbit of its own`);
      return { body, gmKm3S2: stated.gmKm3S2 };
    }
    const own = MOON_SYSTEMS[center]?.config.balancePoint;
    return own !== undefined && drawn.has(own.body) ? own : undefined;
  }

  /** The draw layers, one per set. */
  layers(ctx: BodySetContext): readonly BodySetLayer[] {
    return [...this.sets.values()].map((set) => this.#layer(set, ctx));
  }

  #layer(set: PlannedBodySet, ctx: BodySetContext): BodySetLayer {
    const { input } = set;
    const center = this.centerOf(set, ctx.ids[0]!);
    const gm = this.#gmOf(set, center, ctx.catalogue);
    const palette = familiesWithPalette(input.families);
    const families = palette.map((family, index) => ({ ...family, color: input.families[index].color ?? family.color, ...(input.families[index].brightness === undefined ? {} : { brightness: input.families[index].brightness }) }));
    const bodies = this.#bodiesOf(set, center, ctx);
    const extra = bodies.filter((body) => !body.own);
    const members: BodySetMember[] = input.members.map((member) => {
      const moon = listedMoon(member.id);
      return { id: member.id, label: member.label ?? moon!.label, radiusKm: member.radiusKm ?? moon!.meanRadiusKm, family: member.family };
    });
    const balance = this.#balanceOf(set, center, ctx);
    const group = set.kind === "listed"
      ? createEphemerisGroup({ id: input.id, center, ephemeris: MOON_SYSTEMS[center]!.ephemeris, members: members.map(({ id }) => id), bounds: ctx.window, provenance: input.provenance })
      : this.#elementsGroup(set, center, gm, ctx, input.id, input.provenance, input.members);
    return {
      id: input.id,
      group,
      members,
      families,
      bodyFamilies: Object.fromEntries(bodies.map(({ id, family }) => [id, family])),
      ...(extra.length === 0 ? {} : { extraOrbits: {
        group: createEphemerisGroup({ id: `${input.id}-orbits`, center, ephemeris: MOON_SYSTEMS[center]!.ephemeris, members: extra.map(({ id }) => id), bounds: ctx.window, provenance: createProvenance({ sourceType: "ephemeris", sources: input.provenance.sources, ...EXTRA_ORBITS_PROVENANCE }) }),
        families: extra.map(({ family }) => family),
      } }),
      centreGmKm3S2: gm,
      ...(balance === undefined ? {} : { balancePoint: balance }),
    };
  }

  #elementsGroup(set: PlannedBodySet, center: BodyId, gm: number, ctx: BodySetContext, id: string, provenance: Provenance, members: readonly BodySetMemberInput[]): EphemerisGroup {
    try {
      return createElementsGroup({
        id,
        center,
        bounds: ctx.window,
        provenance,
        members: members.map((member) => {
          const elements = member.elements!;
          return { id: member.id, elements, epochUtcMs: elements.time === undefined ? ctx.startUtcMs : toUtcMs(elements.time, `addBodySet("${id}") member "${member.id}" elements.time`), plane: elements.plane ?? "EQJ" };
        }),
      }, createOrbTwoBodyAdapter([{ id: center, gmKm3S2: gm }]));
    } catch (error) {
      if (error instanceof SceneError) throw error;
      throw bad(set.input.id, error instanceof Error ? error.message : String(error));
    }
  }

  /** The shell items of the members, in order: selectable, unlisted unless asked, with their own words or the set's provenance. */
  objects(ctx: Pick<BodySetContext, "ids" | "catalogue">): readonly ExperienceObject[] {
    return [...this.sets.values()].flatMap((set) => {
      const { input } = set;
      const center = this.centerOf(set, ctx.ids[0]!);
      const centreLabel = ctx.catalogue.has(center) ? ctx.catalogue.get(center).definition.label : center;
      return input.members.map((member): ExperienceObject => {
        const family = input.families.find(({ id }) => id === member.family)!;
        return {
          id: member.id,
          label: member.label ?? listedMoon(member.id)!.label,
          listed: member.listed ?? false,
          description: member.description ?? `A member of ${family.label} about ${centreLabel}.`,
          ...(member.facts === undefined ? {} : { facts: member.facts.map(({ label, value }) => Object.freeze({ label, value })) }),
          provenance: member.provenance ?? input.provenance,
          ...(member.knownLimitations === undefined ? {} : { knownLimitations: member.knownLimitations }),
        };
      });
    });
  }

  /** The data packages the listed members need that `data` does not provide. */
  missingData(data: readonly DataSource[]): readonly string[] {
    const have = new Set(data.flatMap((source) => source.provides));
    const named = new Set(data.map((source) => source.name));
    return [...new Set(this.#listed().filter(({ id, requires }) => !have.has(id) && !named.has(requires)).map(({ requires }) => requires))];
  }

  #listed(): readonly { readonly id: string; readonly requires: string }[] {
    return [...this.sets.values()].filter(({ kind }) => kind === "listed").flatMap(({ input }) => input.members.map((member) => ({ id: member.id, requires: listedMoon(member.id)!.dataPackage })));
  }

  /** Throws `missing-data` naming the members whose data package was not passed. */
  checkData(data: readonly DataSource[]): void {
    const missing = this.missingData(data);
    if (missing.length === 0) return;
    const names = this.#listed().filter(({ requires }) => missing.includes(requires)).map(({ id }) => id);
    throw new SceneError("missing-data", `${names.join(", ")} needs the ${missing.join(", ")} package: install it and pass it as mount(element, scene, { data: [...] })`);
  }

  /** What `installData` loads for the sets (see `BodySetLoad`). */
  load(): BodySetLoad {
    const listed = [...this.sets.values()].filter(({ kind }) => kind === "listed");
    const historyMs = new Map<BodyId, number>();
    for (const { input } of listed) {
      const parent = listedMoon(input.members[0].id)!.parent;
      historyMs.set(parent, Math.max(historyMs.get(parent) ?? 0, input.orbitHistoryMs ?? 0));
    }
    return { moons: listed.flatMap(({ input }) => input.members.map(({ id }) => ({ id, parent: listedMoon(id)!.parent }))), historyMs };
  }

  /** The sets in the order added, as the public list states them. */
  reads(first: BodyId): readonly SceneBodySetRead[] {
    return frozenList([...this.sets.values()].map(({ input }): SceneBodySetRead => ({
      id: input.id,
      center: this.centerOf({ input, kind: "listed" }, first),
      count: input.members.length,
      families: Object.freeze(input.families.map(({ id }) => id)),
    })));
  }

  /** The set a member belongs to. */
  setOf(memberId: string): PlannedBodySet | undefined {
    return [...this.sets.values()].find(({ input }) => input.members.some((member) => member.id === memberId));
  }

  /** A member's centre-relative state: the layer's group answers, so the number is the one the viewer draws. */
  stateOf(memberId: string, timeUtcMs: number, ctx: BodySetContext): State {
    const set = this.setOf(memberId)!;
    const { window } = ctx;
    if (timeUtcMs < window.startUtcMs || timeUtcMs > window.endUtcMs) throw new SceneError("bad-time", `stateOf("${memberId}"): ${new Date(timeUtcMs).toISOString()} is outside the scene's window (${new Date(window.startUtcMs).toISOString()} to ${new Date(window.endUtcMs).toISOString()})`);
    const layer = this.#layer(set, ctx);
    try {
      return layer.group.memberStateAt(layer.group.members.indexOf(memberId), timeUtcMs);
    } catch (error) {
      if (error instanceof NotLoadedError) throw new SceneError("missing-data", `stateOf("${memberId}"): its data is not loaded yet; await scene.load({ data }) first (or mount the scene and await ready)`);
      throw error;
    }
  }

  /** A member's position provenance as its card shows it. */
  provenanceOf(memberId: string): Provenance {
    const set = this.setOf(memberId)!;
    return set.input.members.find((member) => member.id === memberId)!.provenance ?? set.input.provenance;
  }
}
