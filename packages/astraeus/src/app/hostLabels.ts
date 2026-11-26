// The labels a host placed (`Scene.addLabels`): where each stands this frame, and what a tap on it does.
// A label joins the one label layer as an object-like entry (SceneLabels.ts); this file only answers its place, its cover rule and its tap.
import type { ExperienceObject } from "../shell/experience";
import { createOrbTwoBodyAdapter } from "../core/twoBodyAdapter";
import type { ExperienceLabel } from "./experienceDefinition";
import { GroupSetTarget } from "./GroupSetTarget";
import type { Vec3 } from "./groupLabelPoint";
import { PointsView } from "./PointsView";
import { eqjToRenderVector, type RenderVector } from "./renderCoordinates";
import { sceneOffsetKm } from "./sceneLayout";
import type { SceneTargets } from "./sceneTargets";

/** The camera step a host label's tap takes: select one group exactly as the Object list does, or open one panel. */
export type HostLabelTap = { readonly group: string } | { readonly panel: string };

/** The host labels as the label layer reads them. */
export interface HostLabelSet {
  /** One object-like entry per label: its id, text, own colour and priority. */
  readonly objects: readonly ExperienceObject[];
  /** For a label that selects one group: that group's id, so selecting the group lifts the label as selecting the label does. */
  readonly selectedFor: ReadonlyMap<string, string>;
  /** Every label id: an object that shares one (a label selecting several groups) is that label's entry, not a second. */
  readonly ids: ReadonlySet<string>;
  /** Every group some label is anchored on: it draws no name of its own. */
  readonly covered: ReadonlySet<string>;
}

export const NO_HOST_LABELS: HostLabelSet = { objects: [], selectedFor: new Map(), ids: new Set(), covered: new Set() };

/** What a tap on label `label` does; null when it is text only or selects several groups (that one is an object of its own, picked by its id). */
export function hostLabelTapOf(label: ExperienceLabel): HostLabelTap | null {
  const { selects } = label;
  if (selects === undefined) return null;
  if ("panel" in selects) return { panel: selects.panel };
  return selects.groups.length === 1 ? { group: selects.groups[0]! } : null;
}

/** The label layer's view of the host labels (computed once per set of labels). */
export function hostLabelSet(labels: readonly ExperienceLabel[] | undefined): HostLabelSet {
  if (labels === undefined || labels.length === 0) return NO_HOST_LABELS;
  const covered = new Set<string>();
  const selectedFor = new Map<string, string>();
  for (const label of labels) {
    if ("groups" in label.anchor) for (const group of label.anchor.groups) covered.add(group);
    const tap = hostLabelTapOf(label);
    if (tap !== null && "group" in tap) selectedFor.set(label.id, tap.group);
  }
  return {
    objects: labels.map((label): ExperienceObject => ({
      id: label.id,
      label: label.label,
      ...(label.color === undefined ? {} : { color: label.color }),
      labelPriority: label.labelPriority,
    })),
    selectedFor,
    ids: new Set(labels.map(({ id }) => id)),
    covered,
  };
}

/** The label ids that are tap targets (they select one group or a panel). */
export function hostLabelTargets(labels: readonly ExperienceLabel[] | undefined): readonly { readonly id: string }[] {
  return (labels ?? []).filter((label) => hostLabelTapOf(label) !== null).map(({ id }) => ({ id }));
}

/** The tap on label `id`, or null when no host label has that id or it is text only. */
export function hostLabelTapFor(labels: readonly ExperienceLabel[] | undefined, id: string): HostLabelTap | null {
  const label = labels?.find((candidate) => candidate.id === id);
  return label === undefined ? null : hostLabelTapOf(label);
}

/** What a tap's result is routed through: the controls' pick and panel calls, and the host's labels. */
export interface LabelPickControls {
  readonly hostLabels?: readonly ExperienceLabel[];
  onPickObject?: (id: string, options?: { readonly keepSky?: boolean }) => void;
  onLabelPanel?: (panelId: string) => void;
}

/**
 * What a tap that landed on `id` does. A host label that selects one group makes the pick request the group's own name or the Object list makes; one that selects a panel asks
 * for that panel; any other id is an object's, picked as before. (Host label ids are never an object's, so the two cannot meet.)
 */
export function routeLabelPick(
  controls: LabelPickControls,
  id: string,
  options?: { readonly keepSky?: boolean },
): void {
  const tap = hostLabelTapFor(controls.hostLabels, id);
  if (tap !== null && "panel" in tap) controls.onLabelPanel?.(tap.panel);
  else if (options === undefined) controls.onPickObject?.(tap === null ? id : tap.group);
  else controls.onPickObject?.(tap === null ? id : tap.group, options);
}

let eclipticToEqj: Float64Array | null = null;
function eclipticMatrix(): Float64Array {
  return (eclipticToEqj ??= createOrbTwoBodyAdapter().eclipticJ2000ToEqjMatrix());
}

/** The state of one label placed on groups: the direction held for when its members have no clear mean. */
interface PooledState {
  /** The direction the name was last placed toward, kept for when the pooled members have no clear mean direction (a ring). */
  direction: Vec3 | null;
}

/** Where each host label stands this frame. One per mounted scene: it remembers the direction each group label was placed toward. */
export class HostLabelPlacer {
  readonly #byId: ReadonlyMap<string, ExperienceLabel>;
  /** The labels a tap can land on (they select one group or a panel), fixed for the labels. */
  readonly tapTargets: readonly { readonly id: string }[];
  readonly #pooled = new Map<string, PooledState>();
  #hidden: ReadonlySet<string> | undefined;
  readonly #sets = new Map<string, GroupSetTarget>();
  #setViews: readonly PointsView[] | undefined;

  constructor(readonly labels: readonly ExperienceLabel[]) {
    this.#byId = new Map(labels.map((label) => [label.id, label]));
    this.tapTargets = hostLabelTargets(labels);
  }

  /** The ids the showing view and the shown spans hide this frame: a label whose every group is among them is not drawn. */
  hide(ids: ReadonlySet<string> | undefined): void {
    this.#hidden = ids;
  }

  has(id: string): boolean {
    return this.#byId.has(id);
  }

  /** The groups label `id` selects as one target (it selects two or more), or undefined for any other id; built once per set of group views. */
  groupSetOf(views: readonly PointsView[], id: string): GroupSetTarget | undefined {
    if (this.#setViews !== views) {
      this.#setViews = views;
      this.#sets.clear();
    }
    let set = this.#sets.get(id);
    if (set === undefined) {
      const selects = this.#byId.get(id)?.selects;
      if (selects === undefined || !("groups" in selects) || selects.groups.length < 2) return undefined;
      set = new GroupSetTarget(
        id,
        views.filter((view) => selects.groups.includes(view.id)),
      );
      this.#sets.set(id, set);
    }
    return set;
  }

  /** Where label `id` is, or null when it is not drawn now (its groups are out of their bounds or hidden). */
  positionOf(targets: SceneTargets, id: string): RenderVector | null {
    const label = this.#byId.get(id);
    if (label === undefined) return null;
    const { anchor } = label;
    if ("groups" in anchor) return this.#onGroups(targets, label.id, anchor.groups);
    // A fixed point: its plane's vector turned into EQJ, from its centre, then offset to the scene centre and scaled as a member is.
    let km: readonly number[] = anchor.positionKm;
    if (anchor.plane === "ecliptic-j2000") {
      const m = eclipticMatrix();
      km = [0, 3, 6].map((row) => m[row]! * km[0]! + m[row + 1]! * km[1]! + m[row + 2]! * km[2]!);
    }
    const offset = sceneOffsetKm(targets.placement, anchor.center, targets.timeUtcMs);
    if (offset !== null) km = km.map((value, axis) => value + offset[axis]!);
    return eqjToRenderVector(targets.policy.mapPosition(km));
  }

  #onGroups(targets: SceneTargets, id: string, groups: readonly string[]): RenderVector | null {
    const views = targets.groupViews.filter(
      (view) => groups.includes(view.id) && view.drawn && this.#hidden?.has(view.id) !== true,
    );
    if (views.length === 0) return null;
    let held = this.#pooled.get(id);
    if (held === undefined) this.#pooled.set(id, (held = { direction: null }));
    return PointsView.placeLabel(views, held, targets.policy);
  }
}
