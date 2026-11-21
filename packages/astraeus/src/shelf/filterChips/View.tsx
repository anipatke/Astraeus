// Part: the filter chips' view, drawn inside a panel: a row of toggle buttons. A press lights or clears the chip at once (the view's own cell) and then reports the values lit to the host;
// a host's setter writes the same cell and reports nothing. It must not set a place, layer or raw colour or size, or open another part.
import { useId, useSyncExternalStore, type CSSProperties } from "react";
import type { ShelfBlock, ShelfRuntime } from "../../app/shelfContract";
import type { ChipSelection, FilterChipsData, FilterChipsState } from "./factory";
import { useCell } from "../useCell";

/** The block's chips, read live from this viewer's cell. */
export function FilterChipsView({ block, runtime }: { readonly block: ShelfBlock; readonly runtime: ShelfRuntime }) {
  const cell = useCell(runtime, block);
  const { choices, selected } = useSyncExternalStore(cell.subscribe, cell.get) as FilterChipsState;
  const { multiple, label } = block.data as FilterChipsData;
  const labelId = `${useId()}-label`;
  const press = (value: string) => {
    const lit = selected.includes(value);
    const next = multiple
      ? choices
          .map((choice) => choice.value)
          .filter((candidate) => (candidate === value ? !lit : selected.includes(candidate)))
      : lit
        ? []
        : [value];
    cell.set({ choices, selected: next } satisfies FilterChipsState);
    runtime.report?.(block.id, { part: block.id, values: next, cause: "visitor" } satisfies ChipSelection);
  };
  return (
    <div
      className="shelf-chips"
      data-shelf-block={block.id}
      role="group"
      aria-labelledby={label === undefined ? undefined : labelId}
    >
      {label === undefined ? null : (
        <span id={labelId} className="shelf-chips-label">
          {label}
        </span>
      )}
      <div className="shelf-chip-row">
        {choices.map((choice) => (
          <button
            key={choice.value}
            type="button"
            className="shelf-chip ui-pill"
            aria-pressed={selected.includes(choice.value)}
            data-shelf-chip={choice.value}
            onClick={() => press(choice.value)}
          >
            {choice.color === undefined ? null : (
              <span
                className="shelf-chip-dot"
                style={{ "--shelf-colour": choice.color } as CSSProperties}
                aria-hidden="true"
              />
            )}
            {choice.label}
          </button>
        ))}
      </div>
    </div>
  );
}
