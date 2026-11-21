// Part: the colour key's view, drawn inside a panel: a swatch, a label, an optional count and note per row. It must not set a place, layer or raw colour or size
// (the swatch colour is the story's, passed as a custom property), or open another part.
import { useSyncExternalStore, type CSSProperties } from "react";
import type { ShelfBlock, ShelfRuntime } from "../../app/shelfContract";
import type { ColourKeyState } from "./factory";
import { useCell } from "../useCell";

/** The block's rows, read live from this viewer's cell. */
export function ColourKeyView({ block, runtime }: { readonly block: ShelfBlock; readonly runtime: ShelfRuntime }) {
  const cell = useCell(runtime, block);
  const { entries } = useSyncExternalStore(cell.subscribe, cell.get) as ColourKeyState;
  return (
    <ul className="shelf-colour-key" data-shelf-block={block.id}>
      {entries.map((entry, index) => (
        <li key={index} className="shelf-colour-row">
          <span
            className="shelf-colour-swatch"
            style={{ "--shelf-colour": entry.color } as CSSProperties}
            aria-hidden="true"
          />
          <span className="shelf-colour-label">{entry.label}</span>
          {entry.count === undefined ? null : (
            <span className="shelf-colour-count">{entry.count.toLocaleString("en-US")}</span>
          )}
          {entry.note === undefined ? null : <span className="shelf-colour-note">{entry.note}</span>}
        </li>
      ))}
    </ul>
  );
}
