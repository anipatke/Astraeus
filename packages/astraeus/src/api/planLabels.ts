import { createProvenance } from "../core/provenance";
import type { BodyId } from "../core/body";
import type { ExperienceLabel } from "../app/experienceDefinition";
import { SceneError } from "./errors";
import { frozenCopy } from "./frozenCopy";
import { HEX } from "./group";
import type { LabelInput } from "./labelInput";

const DEFAULT_PRIORITY = 80;
const bad = (id: unknown, message: string): SceneError =>
  new SceneError("bad-label", `addLabels("${String(id)}"): ${message}`);
const isText = (value: unknown): value is string => typeof value === "string" && value !== "";
const isNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

/** A non-empty list of distinct non-empty texts, or a `bad-label` naming `field`. */
function checkIds(id: string, field: string, list: unknown): void {
  if (!Array.isArray(list) || list.length === 0) throw bad(id, `${field} must be a non-empty list of group ids`);
  list.forEach((entry: unknown, index) => {
    if (!isText(entry)) throw bad(id, `${field}[${index}] must be a non-empty text, got ${JSON.stringify(entry)}`);
    if (list.indexOf(entry) !== index) throw bad(id, `${field}[${index}] repeats "${entry}"`);
  });
}

function checkAnchor(id: string, anchor: unknown): void {
  if (!isObject(anchor)) throw bad(id, "anchor must be { positionKm, plane } or { groups }");
  const point = "positionKm" in anchor || "plane" in anchor || "center" in anchor;
  const groups = "groups" in anchor;
  if (point === groups) throw bad(id, "anchor must be exactly one of { positionKm, plane } or { groups }");
  if (groups) return checkIds(id, "anchor.groups", anchor.groups);
  const { positionKm, plane, center } = anchor;
  if (!Array.isArray(positionKm) || positionKm.length !== 3 || !positionKm.every(isNumber))
    throw bad(id, `anchor.positionKm must be three finite numbers, got ${JSON.stringify(positionKm)}`);
  if (plane !== "ecliptic-j2000" && plane !== "EQJ")
    throw bad(id, `anchor.plane must be "ecliptic-j2000" or "EQJ", got ${JSON.stringify(plane)}`);
  if (center !== undefined && !isText(center))
    throw bad(id, `anchor.center must be a body id, got ${JSON.stringify(center)}`);
}

function checkSelects(id: string, selects: unknown): void {
  if (!isObject(selects)) throw bad(id, "selects must be { groups } or { panel }");
  const groups = "groups" in selects;
  if (groups === "panel" in selects) throw bad(id, "selects must be exactly one of { groups } or { panel }");
  if (groups) return checkIds(id, "selects.groups", selects.groups);
  if (!isText(selects.panel))
    throw bad(id, `selects.panel must be a non-empty text, got ${JSON.stringify(selects.panel)}`);
}

/** The card fields: only with a selection of two or more groups. */
function checkCard(id: string, label: LabelInput): void {
  const card =
    label.description !== undefined || label.provenance !== undefined || label.knownLimitations !== undefined;
  const several = "groups" in (label.selects ?? {}) && (label.selects as { groups: unknown[] }).groups.length >= 2;
  const field =
    label.description !== undefined
      ? "description"
      : label.provenance !== undefined
        ? "provenance"
        : "knownLimitations";
  if (card && !several) throw bad(id, `${field} is only for a label that selects two or more groups`);
  if (label.description !== undefined && !isText(label.description))
    throw bad(id, `description must be a non-empty text, got ${JSON.stringify(label.description)}`);
  if (label.provenance !== undefined) {
    try {
      createProvenance(label.provenance);
    } catch (error) {
      throw bad(id, `provenance is malformed (${error instanceof Error ? error.message : String(error)})`);
    }
  }
  const limits = label.knownLimitations;
  if (limits !== undefined && !(Array.isArray(limits) && limits.length > 0 && limits.every(isText)))
    throw bad(id, "knownLimitations must be a non-empty list of non-empty texts");
}

/** Checks one label's shape; throws `bad-label` naming the field. */
function checkShape(label: LabelInput): void {
  if (!isObject(label)) throw bad(label, "give a { id, label, anchor } object");
  const { id } = label;
  if (!isText(id)) throw bad(id, "id must be a non-empty text");
  if (typeof label.label !== "string" || label.label.trim() === "") throw bad(id, "label must be a non-blank text");
  if (label.color !== undefined && !(typeof label.color === "string" && HEX.test(label.color)))
    throw bad(id, `color must be a CSS hex colour such as "#9de3a8", got ${JSON.stringify(label.color)}`);
  if (label.labelPriority !== undefined && !isNumber(label.labelPriority))
    throw bad(id, `labelPriority must be a finite number, got ${JSON.stringify(label.labelPriority)}`);
  checkAnchor(id, label.anchor);
  if (label.selects !== undefined) checkSelects(id, label.selects);
  checkCard(id, label);
}

/** The scene's own labels (`addLabels`): checked at the call, then against the scene's groups, panels and bodies at build. */
export class LabelPlan {
  readonly labels = new Map<string, LabelInput>();

  constructor(private readonly taken: (id: string) => boolean) {}

  /** Checks every label (shape, then ids against the scene and each other) and adds them all, or none. */
  add(labels: readonly LabelInput[]): void {
    if (!Array.isArray(labels) || labels.length === 0) throw bad("", "give a non-empty list of labels");
    const copies = labels.map((label) => {
      checkShape(label);
      return frozenCopy(label);
    });
    const seen = new Set<string>();
    for (const { id } of copies) {
      if (this.labels.has(id) || seen.has(id) || this.taken(id))
        throw new SceneError("duplicate-id", `addLabels("${id}"): that id is already in the scene`);
      seen.add(id);
    }
    for (const copy of copies) this.labels.set(copy.id, copy);
  }

  has(id: string): boolean {
    return this.labels.has(id);
  }

  /**
   * Build-time checks against the scene: groups, panel and centre exist, the id is clear of every other id. Returns the checked labels with each centre resolved (`defaultCenter` when absent), or none.
   * `otherIds` are every id of the scene but the labels' own; `panelIds` the story and shelf panels'.
   */
  check(scene: LabelScene): readonly ExperienceLabel[] {
    return [...this.labels.values()].map((input) => {
      const { id } = input;
      if (scene.otherIds.has(id) || scene.panelIds.has(id))
        throw new SceneError("duplicate-id", `addLabels("${id}"): that id is already in the scene`);
      checkNames(input, scene);
      return resolved(input, scene.bodyIds[0]!);
    });
  }
}

/** What the scene holds, for the build-time checks of its labels. */
export interface LabelScene {
  readonly groupIds: ReadonlySet<string>;
  readonly panelIds: ReadonlySet<string>;
  readonly bodyIds: readonly BodyId[];
  /** Every id of the scene but the labels' own and the panels'. */
  readonly otherIds: ReadonlySet<string>;
}

/** Every group, the panel and the centre a label names is one the scene holds. */
function checkNames({ id, anchor, selects }: LabelInput, scene: LabelScene): void {
  const lists: readonly (readonly [string, readonly string[] | undefined])[] = [
    ["anchor.groups", "groups" in anchor ? anchor.groups : undefined],
    ["selects.groups", selects !== undefined && "groups" in selects ? selects.groups : undefined],
  ];
  for (const [field, groups] of lists)
    groups?.forEach((group, index) => {
      if (!scene.groupIds.has(group)) throw bad(id, `${field}[${index}] "${group}" is not a group of the scene`);
    });
  if (selects !== undefined && "panel" in selects && !scene.panelIds.has(selects.panel))
    throw bad(id, `selects.panel "${selects.panel}" is not a story or shelf panel of the scene`);
  if ("positionKm" in anchor && anchor.center !== undefined && !scene.bodyIds.includes(anchor.center))
    throw bad(id, `anchor.center "${anchor.center}" is not a body of the scene`);
}

/** The label as the definition holds it: the default priority, and a fixed point's centre resolved (`defaultCenter` when absent). */
function resolved(input: LabelInput, defaultCenter: BodyId): ExperienceLabel {
  const { anchor, selects } = input;
  const where: ExperienceLabel["anchor"] =
    "groups" in anchor
      ? { groups: anchor.groups }
      : {
          positionKm: [anchor.positionKm[0], anchor.positionKm[1], anchor.positionKm[2]],
          plane: anchor.plane,
          center: anchor.center ?? defaultCenter,
        };
  return {
    id: input.id,
    label: input.label,
    ...(input.color === undefined ? {} : { color: input.color }),
    labelPriority: input.labelPriority ?? DEFAULT_PRIORITY,
    anchor: where,
    ...(selects === undefined ? {} : { selects }),
    ...(input.description === undefined ? {} : { description: input.description }),
    ...(input.provenance === undefined ? {} : { provenance: input.provenance }),
    ...(input.knownLimitations === undefined ? {} : { knownLimitations: input.knownLimitations }),
  };
}
