// The shelf contract (viewer-interface note, section 11): what the shell and the viewer read from a story part without knowing which part it is.
// Job: name the internal shape of a part descriptor (its public fields plus the `view` that draws it) and what a view is handed. It holds types only;
// the shell renders `part.view` and never imports a shelf module, and the factories in `src/shelf/` build values of these types.
import type { ComponentType } from "react";

/** What a block's view is handed. */
export interface ShelfRuntime {
  /** The element the engine made for the custom block `id` (alive from `ready` to `unmount`); undefined for an id that is not a custom block. */
  readonly element: (id: string) => HTMLElement | undefined;
}

/** A block drawn inside a panel. `kind` names the part; `view` draws it. */
export interface ShelfBlock {
  readonly kind: string;
  readonly id: string;
  readonly view: ComponentType<{ readonly block: ShelfBlock; readonly runtime: ShelfRuntime }>;
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
