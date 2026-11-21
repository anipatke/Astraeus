// Part: the readout tile's views, drawn by the shell in the tile area (the full tile, also the phone sheet's content) and as the phone's one-line strip. Each draws the label, the live value, the line with a dot at the value and its
// marks, and the facts. They must not set a place, layer or raw colour or size, take a tap (the strip's tap is the shell's) or open another part.
import { useSyncExternalStore, type CSSProperties } from "react";
import type { ShelfBlock, ShelfRuntime } from "../../app/shelfContract";
import { scaleFraction, type ReadoutTileData, type ReadoutTileState } from "./factory";
import { useCell } from "../useCell";

const number = (value: number): string => value.toLocaleString("en-US", { maximumFractionDigits: 3 });
const percent = (fraction: number): CSSProperties =>
  ({ "--shelf-tile-at": Math.round(fraction * 10000) / 100 }) as CSSProperties;
/** Marks near an end hang inward so their text stays inside the tile. */
const edge = (fraction: number): "start" | "end" | "middle" =>
  fraction < 0.12 ? "start" : fraction > 0.88 ? "end" : "middle";

/** The short text a screen reader gets for the line. */
export function lineSummary(label: string, data: NonNullable<ReadoutTileData["scale"]>, at: number): string {
  return `${label} on a ${data.stretch === "log" ? "log " : ""}scale from ${number(data.low)} to ${number(data.high)}: ${number(at)}`;
}

/** The full tile, read live from this viewer's cell. */
export function ReadoutTileView({ block, runtime }: { readonly block: ShelfBlock; readonly runtime: ShelfRuntime }) {
  const cell = useCell(runtime, block);
  const state = useSyncExternalStore(cell.subscribe, cell.get) as ReadoutTileState;
  const { label, scale } = block.data as ReadoutTileData;
  return (
    <div className="shelf-tile" data-shelf-tile={block.id}>
      <p className="shelf-tile-label">{label}</p>
      <p className="shelf-tile-value" data-shelf-tile-value="">
        {state.value}
      </p>
      {scale === undefined || state.scaleValue === undefined ? null : (
        <div
          className="shelf-tile-line"
          role="img"
          aria-label={lineSummary(label, scale, state.scaleValue)}
          data-shelf-tile-line=""
        >
          <span className="shelf-tile-track" />
          <span
            className="shelf-tile-dot"
            data-shelf-tile-dot=""
            style={percent(scaleFraction(scale, state.scaleValue))}
          />
          {scale.marks.map((mark, index) => (
            <span
              key={index}
              className="shelf-tile-mark"
              data-shelf-tile-mark={index}
              data-edge={edge(scaleFraction(scale, mark.value))}
              style={percent(scaleFraction(scale, mark.value))}
            >
              <span className="shelf-tile-tick" />
              <span className="shelf-tile-mark-label">{mark.label}</span>
            </span>
          ))}
        </div>
      )}
      {state.facts.length === 0 ? null : (
        <dl className="shelf-tile-facts">
          {state.facts.map((fact, index) => (
            <div key={index} className="shelf-tile-fact">
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

/** The phone's one-line strip: the label and the value. The shell wraps it in the button that opens the sheet. */
export function ReadoutTileStrip({ block, runtime }: { readonly block: ShelfBlock; readonly runtime: ShelfRuntime }) {
  const cell = useCell(runtime, block);
  const state = useSyncExternalStore(cell.subscribe, cell.get) as ReadoutTileState;
  const { label } = block.data as ReadoutTileData;
  return (
    <span className="shelf-tile-strip" data-shelf-tile-strip={block.id}>
      <span className="shelf-tile-strip-label">{label}</span>
      <span className="shelf-tile-strip-value">{state.value}</span>
    </span>
  );
}
