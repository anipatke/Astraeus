// Shared by the blocks' views: the block's changing content for this viewer. Job: read the viewer's cell, or keep a local one when the runtime is bare (a shell test).
import { useMemo } from "react";
import { makeCell, type ShelfBlock, type ShelfCell, type ShelfRuntime } from "../app/shelfContract";

/** The block's cell: the viewer's when the runtime has one, else a local one that starts from the block's own starting content. */
export function useCell(runtime: ShelfRuntime, block: ShelfBlock): ShelfCell {
  const fromViewer = runtime.cell?.(block);
  const local = useMemo(() => makeCell(block.initial), [block]);
  return fromViewer ?? local;
}
