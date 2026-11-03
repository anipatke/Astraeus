import type { BodyId } from "../core/body";
import type { TimeBounds } from "../core/trajectory";
import type { BodyCatalogue } from "../assets/catalogue";
import type { ExperienceDefinition, GroupLayer } from "../app/experienceDefinition";
import type { Metric } from "../shell/metrics";
import { planActivity, rateMetricOf, type ActivityInput, type PlannedActivity } from "./activity";
import { SceneError } from "./errors";
import { frozenList, type SceneGroupRead } from "./sceneReads";
import { buildGroupLayer, groupCardProvenance, groupDescription, groupLimitations, planGroup, type GroupInput, type PlannedGroup } from "./group";

/** Whether a group is built late, in `prepare`: a clump near a body reads its position, so needs the planet series, which are not in yet. */
export function lateGroups(seriesIn: boolean): (plan: PlannedGroup) => boolean {
  return (plan) => !seriesIn && plan.input.clump !== undefined;
}

/** The scene's layers: the points layer and the groups only when a group was added. */
export function groupLayersEntry(layers: readonly GroupLayer[], hasGroups: boolean, sunCentred: boolean): Pick<ExperienceDefinition, "sceneLayers" | "groups"> {
  const sceneLayers: ExperienceDefinition["sceneLayers"] = ["tracked-bodies", ...(hasGroups ? ["points" as const] : []), ...(sunCentred ? ["sun-centred" as const] : [])];
  return hasGroups ? { sceneLayers, groups: layers } : { sceneLayers };
}

/** What a `Scene` has planned for its groups and activities. */
export class GroupPlan {
  readonly groups = new Map<string, PlannedGroup>();
  readonly activities = new Map<string, PlannedActivity>();
  readonly #catalogue: () => BodyCatalogue;
  readonly #taken: (id: string) => boolean;

  /** `catalogue` gives the scene's catalogue as it stands; `taken` says whether the scene already holds an id. */
  constructor(catalogue: () => BodyCatalogue, taken: (id: string) => boolean) {
    this.#catalogue = catalogue;
    this.#taken = taken;
  }

  addGroup(input: GroupInput): void {
    const plan = planGroup(input, this.#catalogue());
    if (this.#taken(plan.id)) throw new SceneError("duplicate-id", `addGroup("${plan.id}"): that id is already in the scene`);
    this.groups.set(plan.id, plan);
  }

  addActivity(input: ActivityInput): void {
    const plan = planActivity(input);
    if (this.activities.has(plan.window.id)) throw new SceneError("duplicate-id", `addActivity("${plan.window.id}"): an activity with that id is already in the scene`);
    this.activities.set(plan.window.id, plan);
  }

  /** Checks the groups against the finished scene: each circles its centre (default the scene's first body), which and whose clump body the scene must hold. */
  check(ids: readonly BodyId[]): void {
    for (const plan of this.groups.values()) {
      const center = plan.input.center ?? ids[0]!;
      const clump = plan.input.clump;
      if (!ids.includes(center)) throw new SceneError("bad-group", `addGroup("${plan.id}"): the orbits circle "${center}", which has not been added to the scene`);
      if (clump !== undefined && !ids.includes(clump.near)) throw new SceneError("bad-group", `addGroup("${plan.id}"): clump.near "${clump.near}" has not been added to the scene`);
      if (clump !== undefined && clump.near === center) throw new SceneError("bad-group", `addGroup("${plan.id}"): the clump cannot be near the body the orbits circle ("${center}")`);
    }
  }

  /** The draw layers of the groups chosen by `which` (a clump near a planet reads its position, so needs the planet series). */
  layers(ids: readonly BodyId[], window: TimeBounds, openUtcMs: number, which: (plan: PlannedGroup) => boolean): readonly GroupLayer[] {
    return [...this.groups.values()].filter(which).map((plan) => buildGroupLayer(plan, this.#catalogue(), plan.input.center ?? ids[0]!, openUtcMs, window));
  }

  /** The groups in the order added, as the public list states them; `first` is the scene's first body (the centre of a group that names none). */
  reads(first: BodyId): readonly SceneGroupRead[] {
    return frozenList([...this.groups.values()].map(({ id, label, input }): SceneGroupRead => ({
      id,
      label,
      count: input.orbits.length,
      center: input.center ?? first,
      plane: input.plane ?? "ecliptic-j2000",
      provenance: groupCardProvenance(input),
      description: groupDescription(input, input.orbits.length),
      knownLimitations: Object.freeze(groupLimitations(input, this.#catalogue())),
    })));
  }

  /** The activity windows, when any were added. */
  windowsEntry(): Pick<ExperienceDefinition["experience"], "windows"> {
    return this.activities.size === 0 ? {} : { windows: [...this.activities.values()].map((activity) => activity.window) };
  }

  /** The bars of a group's info card at a moment. */
  metrics(id: string, timeUtcMs: number): readonly Metric[] {
    return (this.groups.get(id)?.input.readouts ?? []).map((spec) => rateMetricOf(id, this.activities.get(spec.activity ?? this.#firstActivity())!, timeUtcMs));
  }

  #firstActivity(): string {
    return this.activities.keys().next().value as string;
  }

  /** A group's rate readout names an activity the scene holds. */
  checkReadouts(): void {
    for (const { id, input } of this.groups.values()) {
      for (const spec of input.readouts ?? []) {
        const named = spec.activity ?? (this.activities.size > 0 ? this.#firstActivity() : undefined);
        if (named === undefined || !this.activities.has(named)) throw new SceneError("bad-readout", `addGroup("${id}"): readout rate ${named === undefined ? "needs an activity (addActivity)" : `names activity "${named}", which has not been added to the scene`}`);
      }
    }
  }
}
