// The custom block part: the shelf's one escape hatch. Job: check its input and build the descriptor that carries its view. It must not look up the page or fill the element:
// the host does, through `handle.part(block).element`.
import type { ShelfBlock } from "../../app/shelfContract";
import { checkedId, checkedInput, registered, type CustomBlockPart } from "../part";
import { CustomBlockView } from "./View";

/** What `customBlock` takes. */
export interface CustomBlockInput {
  /** Unique among part and block ids in the scene. */
  readonly id: string;
}

/** What `handle.part(customBlock)` gives for one viewer. */
export interface CustomBlockControl {
  /** The empty element made inside the panel for this viewer, alive from `ready` to `unmount` (out of the page while its panel is closed, its content kept); undefined outside that. Put the host's styles under its own class inside it. */
  readonly element: HTMLElement | undefined;
}

/**
 * An empty block in a panel for the host to fill: the one part that hands out an element. A panel holding only one is a custom panel.
 * @shelf
 * @example
 * const custom = customBlock({ id: "ring" });
 * scene.addParts([panel({ id: "ring-panel", button: { label: "Year ring" }, title: "Year ring", blocks: [custom] })]);
 * // after ready: handle.part(custom).element.append(myOwnSvg);
 */
export function customBlock(input: CustomBlockInput): CustomBlockPart {
  const who = "customBlock";
  const fields = checkedInput(input, who, "a { id } object");
  const block: ShelfBlock = { kind: "customBlock", id: checkedId(fields, who), view: CustomBlockView, control: (link) => ({ get element() { return link.element(); } } satisfies CustomBlockControl) };
  return registered(block) as unknown as CustomBlockPart;
}
