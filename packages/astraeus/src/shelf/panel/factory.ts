// The panel part. Job: check its input and build the descriptor that carries its view. It must not place the button or the panel: the bar rule and the panel rule do.
import type { ShelfPanel } from "../../app/shelfContract";
import { badPart, blockOf, checkedId, checkedInput, checkedText, isMade, registered, type PanelBlock, type PanelPart } from "../part";
import { PanelView } from "./View";

/** What `panel` takes. */
export interface PanelInput {
  /** Unique among part and block ids in the scene; `ViewInput.panels` lists it to show it in some views only. */
  readonly id: string;
  /** The bar button; `shortLabel` shows when tight. */
  readonly button: { readonly label: string; readonly shortLabel?: string };
  readonly title: string;
  /** The blocks it holds, in order; at least one. */
  readonly blocks: readonly PanelBlock[];
}

/** One change of a panel a visitor made (`PanelControl.onOpen`). */
export interface PanelOpenChange {
  readonly part: string;
  readonly open: boolean;
}

/** What `handle.part(panel)` gives for one viewer. */
export interface PanelControl {
  /** Whether the panel is open now. */
  readonly open: boolean;
  /** Opens or closes the panel as its button does (About or a card, which share its place, close), silently. A panel the showing view does not show stays closed. */
  setOpen(open: boolean): void;
  /** Calls `listener` when a visitor opens or closes the panel (button, Close, Escape, or something taking its place), never for `setOpen`; returns the function that stops it. */
  onOpen(listener: (change: PanelOpenChange) => void): () => void;
}

/**
 * A button in the bar and the panel it opens in the left place (a sheet on a phone), holding blocks; the engine places both.
 * @shelf
 * @example
 * scene.addParts([panel({ id: "gaps", button: { label: "Kirkwood gaps", shortLabel: "Gaps" }, title: "The Kirkwood gaps", blocks: [customBlock({ id: "gaps-body" })] })]);
 */
export function panel(input: PanelInput): PanelPart {
  const who = "panel";
  const fields = checkedInput(input, who, "a { id, button, title, blocks } object");
  const id = checkedId(fields, who);
  const button = checkedInput(fields.button, who, "button as { label, shortLabel? }");
  const label = checkedText(button.label, who, "button.label");
  const shortLabel = button.shortLabel === undefined ? undefined : checkedText(button.shortLabel, who, "button.shortLabel");
  const title = checkedText(fields.title, who, "title");
  const blocks = fields.blocks;
  if (!Array.isArray(blocks) || blocks.length === 0) throw badPart(who, "blocks must be a non-empty list of blocks, such as [explainer({ id, paragraphs })]");
  blocks.forEach((block, index) => { if (!isMade(block)) throw badPart(who, `blocks[${index}] is not a block made by a shelf factory such as explainer or customBlock`); });
  if (blocks.some((block) => (block as { kind: string }).kind === "panel")) throw badPart(who, "a panel cannot hold a panel; add panels with scene.addParts");
  if (blocks.some((block) => (block as { kind: string }).kind === "readoutTile")) throw badPart(who, "a panel cannot hold a readoutTile; it has its own place, add it with scene.addParts");
  const shelf: ShelfPanel = {
    kind: "panel", id, button: Object.freeze({ label, ...(shortLabel === undefined ? {} : { shortLabel }) }), title,
    blocks: Object.freeze((blocks as readonly PanelBlock[]).map(blockOf)), view: PanelView,
  };
  return registered(shelf) as unknown as PanelPart;
}
