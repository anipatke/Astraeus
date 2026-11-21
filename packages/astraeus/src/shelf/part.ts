// Shared base of the shelf's factories (viewer-interface note, section 11). Job: the public descriptor types, the registry that tells a factory-made descriptor from any other
// object, and the checks every factory shares (`bad-part`). It must not draw anything or know one part's content: each part's own folder does that.
import { SceneError } from "../api/errors";
import { isPlainObject } from "../api/plainObject";
import type { ShelfBlock, ShelfPart } from "../app/shelfContract";

/** A custom block: the one escape hatch, an empty element the host fills (`handle.part(block).element`). Made with `customBlock`. */
export interface CustomBlockPart {
  readonly kind: "customBlock";
  readonly id: string;
}

/** A panel: a story button in the bar and the panel it opens. Made with `panel`. */
export interface PanelPart {
  readonly kind: "panel";
  readonly id: string;
  /** The bar button's text. */
  readonly button: { readonly label: string; readonly shortLabel?: string };
  readonly title: string;
  /** The blocks in the order drawn. */
  readonly blocks: readonly PanelBlock[];
}

/** The blocks a panel holds. */
export type PanelBlock = CustomBlockPart;

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

/** The internal part shape of a panel descriptor a factory made. */
export const partOf = (value: PanelPart): ShelfPart => value as unknown as ShelfPart;

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
