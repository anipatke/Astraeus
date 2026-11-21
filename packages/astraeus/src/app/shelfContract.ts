// The shelf contract (viewer-interface note, section 11): what the shell and the viewer read from a story part without knowing which part it is.
// Job: name the internal shape of a part descriptor (its public fields plus the `view` that draws it) and what a view is handed. It holds types and one small helper;
// the shell renders `part.view` and never imports a shelf module, and the factories in `src/shelf/` build values of these types. `makeCell` is its one value.
import type { ComponentType } from "react";
import type { CameraRequest } from "./CameraController";

/** One block's changing content for one viewer: the view reads it, the host's setters and a visitor's press write it. Writing says nothing to the host; a visitor's press reports through `ShelfRuntime.report`. */
export interface ShelfCell<T = unknown> {
  get(): T;
  set(next: T): void;
  /** Calls `listener` after each `set`; returns the function that stops it. */
  subscribe(listener: () => void): () => void;
}

/** A cell holding `start`; its listeners hear each `set`. */
export function makeCell(start: unknown): ShelfCell {
  let value = start;
  const listeners = new Set<() => void>();
  return { get: () => value, set: (next) => { value = next; for (const listener of [...listeners]) listener(); }, subscribe: (listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; } };
}

/** What a block's view is handed. The members after `element` are the viewer's own; a bare runtime (a test of the shell) has none, and a view then keeps its own content and tells no one. */
export interface ShelfRuntime {
  /** The element the engine made for the custom block `id` (alive from `ready` to `unmount`); undefined for an id that is not a custom block. */
  readonly element: (id: string) => HTMLElement | undefined;
  /** The block's changing content for this viewer, starting from `block.initial`. */
  readonly cell?: (block: ShelfBlock) => ShelfCell;
  /** A visitor acted in the block `id`: the host's listeners for it hear `event`. */
  readonly report?: (id: string, event: unknown) => void;
  /** Turns the camera as a story panel's camera does when it opens (refused for an object the clock time does not show). */
  readonly moveCamera?: (request: CameraRequest) => void;
}

/** What a block's control is handed for one viewer (`handle.part(block)`). */
export interface ShelfBlockLink {
  /** Throws `not-mounted` (naming `what`) outside the viewer's lifecycle, then gives the block's cell. */
  readonly cell: (what: string) => ShelfCell;
  /** The element the viewer made for a custom block; undefined before the viewer is drawn and after it is gone (it never throws). */
  readonly element: () => HTMLElement | undefined;
  /** Calls `listener` with what a visitor did in the block; returns the function that stops it. */
  readonly listen: (listener: (event: unknown) => void) => () => void;
}

/** A block drawn inside a panel. `kind` names the part; `view` draws it; `control` builds what `handle.part` gives (a block with none gives nothing the host can change). */
export interface ShelfBlock {
  readonly kind: string;
  readonly id: string;
  /** What the part was given that does not change (its own shape; the view and the control read it). */
  readonly data?: unknown;
  /** The content the block starts with, copied into its cell for each viewer. */
  readonly initial?: unknown;
  readonly view: ComponentType<{ readonly block: ShelfBlock; readonly runtime: ShelfRuntime }>;
  readonly control?: (link: ShelfBlockLink, block: ShelfBlock) => unknown;
}

/** What a panel's view is handed: its descriptor, the viewer's runtime, the panel's DOM id (made once per viewer so its button can name it) and the close report. */
export interface ShelfPanelViewProps {
  readonly panel: ShelfPanel;
  readonly runtime: ShelfRuntime;
  readonly id: string;
  readonly onClose: () => void;
}

/** A panel part: a button in the bar's story group and the panel it opens in the left place. */
export interface ShelfPanel {
  readonly kind: "panel";
  readonly id: string;
  readonly button: { readonly label: string; readonly shortLabel?: string };
  readonly title: string;
  readonly blocks: readonly ShelfBlock[];
  readonly view: ComponentType<ShelfPanelViewProps>;
}

/** A part a scene adds with `addParts`: today the panel; later parts with their own place (the readout tile) join this union. */
export type ShelfPart = ShelfPanel;

/** The ids of a part and everything inside it (a panel and its blocks). */
export const idsOfPart = (part: ShelfPart): readonly string[] => [part.id, ...part.blocks.map((block) => block.id)];
