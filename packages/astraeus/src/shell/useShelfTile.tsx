// The readout tile's place on screen (viewer-interface note, sections 2 and 5). Job: from the parts the showing view shows, the layout and the panel rule, draw the `tile` area (the full tile on a wide viewer, the one-line strip on a phone) and
// the phone's expanded sheet. It must not decide what opens or closes (the panel rule does: the strip's tap is `toggle("tile")`) and never imports a shelf module: a tile draws itself through `view` and `strip`.
import { useEffect, useId, useRef, type ReactNode } from "react";
import type { ShelfPart, ShelfRuntime, ShelfTile } from "../app/shelfContract";
import { Area } from "./areas/Area";
import type { Panels } from "./panels/usePanels";
import { useSwipeToDismiss } from "./useSwipeToDismiss";

const NO_PARTS: readonly ShelfPart[] = [];
const NO_RUNTIME: ShelfRuntime = { element: () => undefined };

interface Input {
  /** The parts the showing view shows; the view's one tile (if any) is drawn here. */
  readonly parts: readonly ShelfPart[] | undefined;
  readonly runtime: ShelfRuntime | undefined;
  readonly panels: Panels;
  readonly phone: boolean;
}

/** The expanded tile on a phone: a detail sheet with a Close button, swipe to dismiss as the other sheets have. */
function TileSheet({
  tile,
  runtime,
  id,
  onClose,
}: {
  readonly tile: ShelfTile;
  readonly runtime: ShelfRuntime;
  readonly id: string;
  readonly onClose: () => void;
}) {
  const sheet = useRef<HTMLElement | null>(null);
  useSwipeToDismiss(sheet, onClose);
  return (
    <aside id={id} className="info-panel tile-sheet" ref={sheet} aria-label={tile.label} data-tile-sheet={tile.id}>
      <div className="sheet-handle" aria-hidden="true" />
      <header className="info-panel-header">
        <span />
        <button type="button" className="info-panel-close ui-pill" aria-label={`Close ${tile.label}`} onClick={onClose}>
          Close
        </button>
      </header>
      <tile.view block={tile} runtime={runtime} />
    </aside>
  );
}

/** The `tile` area (nothing when the showing view has no tile) and the phone's sheet (nothing unless the rule has the tile expanded). */
export function useShelfTile({ parts = NO_PARTS, runtime = NO_RUNTIME, panels, phone }: Input): {
  readonly tileArea: ReactNode;
  readonly tileSheet: ReactNode;
} {
  const sheetId = `${useId()}-tile-sheet`;
  const tile = parts.find((part): part is ShelfTile => part.kind === "readoutTile");
  const tileId = tile?.id;
  const expanded = panels.state.left === "tile";
  const { close, viewSwitch } = panels;
  // A wide viewer, or a view with no tile, has no sheet to show; a view switch to another view's tile closes the sheet (the new tile starts as a strip).
  useEffect(() => {
    if (expanded && (!phone || tileId === undefined)) close("tile");
  }, [expanded, phone, tileId, close]);
  const last = useRef(tileId);
  useEffect(() => {
    if (last.current !== tileId) {
      last.current = tileId;
      viewSwitch(false, false, false, true);
    }
  }, [tileId, viewSwitch]);
  if (tile === undefined) return { tileArea: null, tileSheet: null };
  const tileArea = (
    <Area name="tile">
      {phone ? (
        <button
          type="button"
          className="tile-strip-button"
          aria-expanded={expanded}
          aria-controls={expanded ? sheetId : undefined}
          onClick={() => panels.toggle("tile")}
        >
          <tile.strip block={tile} runtime={runtime} />
        </button>
      ) : (
        <section className="info-panel tile-card" aria-label={tile.label}>
          <tile.view block={tile} runtime={runtime} />
        </section>
      )}
      {tile.live === undefined ? null : <tile.live key={tile.id} block={tile} runtime={runtime} />}
    </Area>
  );
  const tileSheet =
    phone && expanded ? <TileSheet tile={tile} runtime={runtime} id={sheetId} onClose={() => close("tile")} /> : null;
  return { tileArea, tileSheet };
}
