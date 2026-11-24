// Part: the explainer's view, drawn inside a panel: a heading, paragraphs and notes. It must not set a place, layer or raw colour or size, or open another part.
import { useSyncExternalStore } from "react";
import type { ShelfBlock, ShelfRuntime } from "../../app/shelfContract";
import type { ExplainerData, ExplainerState } from "./factory";
import { useCell } from "../useCell";

/** The block's text, read live from this viewer's cell. */
export function ExplainerView({ block, runtime }: { readonly block: ShelfBlock; readonly runtime: ShelfRuntime }) {
  const cell = useCell(runtime, block);
  const { paragraphs } = useSyncExternalStore(cell.subscribe, cell.get) as ExplainerState;
  const { heading, notes } = block.data as ExplainerData;
  return (
    <section className="shelf-explainer" data-shelf-block={block.id}>
      {heading === undefined ? null : <h3 className="shelf-explainer-heading">{heading}</h3>}
      <div className="shelf-explainer-paragraphs" aria-live="polite" aria-atomic="true">
        {paragraphs.map((text, index) => (
          <p key={index} className="shelf-explainer-text">
            {text}
          </p>
        ))}
      </div>
      {notes.map((text, index) => (
        <p key={`note-${index}`} className="shelf-explainer-note">
          {text}
        </p>
      ))}
    </section>
  );
}
