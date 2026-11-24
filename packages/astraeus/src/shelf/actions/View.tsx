// Part: the actions' view, drawn inside a panel: one button per action. A press of an off button does nothing; any other turns the camera first (the same request path a story panel's camera takes), then reports to the host.
// It must not set a place, layer or raw colour or size, or open another part.
import { useSyncExternalStore } from "react";
import type { ShelfBlock, ShelfRuntime } from "../../app/shelfContract";
import type { ActionChange, ActionsData, ActionsState } from "./factory";
import { useCell } from "../useCell";

/** The block's buttons. */
export function ActionsView({ block, runtime }: { readonly block: ShelfBlock; readonly runtime: ShelfRuntime }) {
  const { actions } = block.data as ActionsData;
  const cell = useCell(runtime, block);
  const { disabled } = useSyncExternalStore(cell.subscribe, cell.get) as ActionsState;
  const press = (action: ActionsData["actions"][number]) => {
    if (disabled.includes(action.id)) return;
    if (action.camera !== undefined) runtime.moveCamera?.(action.camera);
    runtime.report?.(block.id, { part: block.id, action: action.id } satisfies ActionChange);
  };
  return (
    <div className="shelf-actions" data-shelf-block={block.id}>
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          className="shelf-action ui-pill"
          data-shelf-action={action.id}
          disabled={disabled.includes(action.id)}
          onClick={() => press(action)}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
