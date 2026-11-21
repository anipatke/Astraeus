// Part: the shelf panel's view, drawn in the left place (a detail sheet on a phone): the title, a close button and the blocks. It must not set a place, layer or raw colour or size
// (areas/ places it, look.css holds the values), or open or close another part; the close button reports `onClose` and the panel rule decides.
import { useId, useRef } from "react";
import type { ShelfPanelViewProps } from "../../app/shelfContract";
import { useSwipeToDismiss } from "../../shell/useSwipeToDismiss";

/** The panel: its blocks draw themselves through their own `view`, so this names no part. */
export function PanelView({ panel, runtime, id, onClose }: ShelfPanelViewProps) {
  const titleId = `${useId()}-title`;
  const sheet = useRef<HTMLElement | null>(null);
  useSwipeToDismiss(sheet, onClose);
  return (
    <aside id={id} className="info-panel shelf-panel" ref={sheet} aria-labelledby={titleId} data-shelf-panel={panel.id}>
      <div className="sheet-handle" aria-hidden="true" />
      <header className="info-panel-header">
        <h2 id={titleId}>{panel.title}</h2>
        <button
          type="button"
          className="info-panel-close ui-pill"
          aria-label={`Close ${panel.title}`}
          onClick={onClose}
        >
          Close
        </button>
      </header>
      {panel.blocks.map((block) => (
        <block.view key={block.id} block={block} runtime={runtime} />
      ))}
    </aside>
  );
}
