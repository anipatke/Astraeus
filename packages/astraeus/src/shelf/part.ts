// Shared base of the shelf's factories (viewer-interface note, section 11). Job: the public descriptor types, the registry that tells a factory-made descriptor from any other
// object, and the checks every factory shares (`bad-part`). It must not draw anything or know one part's content: each part's own folder does that.
import { SceneError } from "../api/errors";
import { isPlainObject } from "../api/plainObject";
import type { PanelControl } from "./panel/factory";
import type { CustomBlockControl } from "./customBlock/factory";
import type { ExplainerControl } from "./explainer/factory";
import type { ActionsControl } from "./actions/factory";
import type { FilterChipsControl } from "./filterChips/factory";
import type { ColourKeyControl } from "./colourKey/factory";
import type { ChartControl } from "./chart/factory";
import type { ReadoutTileControl } from "./readoutTile/factory";
import { isCssColour } from "../presentation/lookValues";
import type { ShelfBlock, ShelfPanel, ShelfTile } from "../app/shelfContract";

/** A panel: a story button in the bar and the panel it opens. Made with `panel`. */
export interface PanelPart {
  readonly kind: "panel";
  readonly id: string;
  readonly button: { readonly label: string; readonly shortLabel?: string };
  readonly title: string;
  readonly blocks: readonly PanelBlock[];
}

/** A custom block (`customBlock`): the escape hatch, an empty element the host fills. */
export type CustomBlockPart = BlockPart<"customBlock">;

/** A block a factory made: `kind` names the factory. Frozen; give it to a panel and to `handle.part`. */
export interface BlockPart<K extends string = string> {
  readonly kind: K;
  readonly id: string;
}

/** The blocks a panel holds. */
export type PanelBlock = CustomBlockPart | BlockPart<"explainer" | "actions" | "filterChips" | "colourKey" | "chart">;

/** A readout tile: a label and a live value with its own place on screen (not in a panel). Made with `readoutTile`; add it with `scene.addParts`. */
export interface TilePart {
  readonly kind: "readoutTile";
  readonly id: string;
  readonly label: string;
}

/** Any part a factory makes. */
export type AnyPart = PanelPart | PanelBlock | TilePart;

/** The control `handle.part` gives for the part `P`. */
export type ControlFor<P extends AnyPart> = { panel: PanelControl; customBlock: CustomBlockControl; explainer: ExplainerControl; actions: ActionsControl; filterChips: FilterChipsControl; colourKey: ColourKeyControl; chart: ChartControl; readoutTile: ReadoutTileControl }[P["kind"]];

/** The descriptors the factories made, so a value that only looks like one is refused. A descriptor is frozen and names no viewer, so one may be shared between scenes. */
const made = new WeakSet<object>();

/** Marks a descriptor a factory built. */
export function registered<T extends object>(descriptor: T): T {
  made.add(descriptor);
  return Object.freeze(descriptor);
}

/** True for a descriptor a factory made. */
export const isMade = (value: unknown): boolean => typeof value === "object" && value !== null && made.has(value);

/** The internal block shape of a block descriptor a factory made. */
export const blockOf = (value: PanelBlock): ShelfBlock => value as unknown as ShelfBlock;

/** The internal part shape of a panel or tile descriptor a factory made. */
export const partOf = <P extends PanelPart | TilePart>(value: P): P extends PanelPart ? ShelfPanel : ShelfTile => value as unknown as P extends PanelPart ? ShelfPanel : ShelfTile;

/** The `bad-part` error for the call `who`. */
export const badPart = (who: string, message: string): SceneError => new SceneError("bad-part", `${who}: ${message}`);

/** Checks the id every part has: a non-empty string. */
export function checkedId(input: Record<string, unknown>, who: string): string {
  const id = input.id;
  if (typeof id !== "string" || id === "") throw badPart(who, "id must be a non-empty string");
  return id;
}

/** Checks a factory's input is a plain object. */
export function checkedInput(input: unknown, who: string, shape: string): Record<string, unknown> {
  if (!isPlainObject(input)) throw badPart(who, `give ${shape}`);
  return input as Record<string, unknown>;
}

/** A non-empty string field. */
export function checkedText(value: unknown, who: string, field: string): string {
  if (typeof value !== "string" || value === "") throw badPart(who, `${field} must be a non-empty string`);
  return value;
}

/** A list of non-empty strings (may be empty when `allowEmpty`). */
export function checkedStrings(value: unknown, who: string, field: string, allowEmpty = true): readonly string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item === "") || (!allowEmpty && value.length === 0)) {
    throw badPart(who, `${field} must be a${allowEmpty ? "" : " non-empty"} list of non-empty strings`);
  }
  return Object.freeze([...(value as string[])]);
}

/** A CSS colour text (the forms the look takes). */
export function checkedColour(value: unknown, who: string, field: string): string {
  if (!isCssColour(value)) throw badPart(who, `${field} must be a CSS colour text such as "#8fb4ff", rgb(143, 180, 255), hsl(...) with commas, or a colour name`);
  return (value as string).trim();
}

/** A list of plain objects, each checked by `item`; the result is frozen. */
export function checkedItems<T>(value: unknown, who: string, field: string, shape: string, item: (record: Record<string, unknown>, at: string) => T, allowEmpty = false): readonly T[] {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) throw badPart(who, `${field} must be a${allowEmpty ? "" : " non-empty"} list of ${shape}`);
  return Object.freeze(value.map((entry, index) => {
    if (!isPlainObject(entry)) throw badPart(who, `${field}[${index}] must be ${shape}`);
    return item(entry as Record<string, unknown>, `${field}[${index}]`);
  }));
}
