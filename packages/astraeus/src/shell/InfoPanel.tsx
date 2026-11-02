import { useId, useRef } from "react";
import type { InfoView } from "./infoModel";
import type { Metric } from "./metrics";
import { MetricVisual } from "./MetricVisual";
import { ProvenanceBadge } from "./ProvenanceBadge";
import { useSwipeToDismiss } from "./useSwipeToDismiss";

interface Props {
  readonly view: InfoView;
  readonly metrics: readonly Metric[];
  readonly onClose: () => void;
  /** The panel's id, made once per viewer by the shell so the buttons that open it can name it. */
  readonly id: string;
}

/**
 * On-demand detail for one object or event; on a phone a bottom sheet with swipe to dismiss. Non-modal: the canvas and controls stay usable around it, and
 * focus stays where the viewer is (choosing in the object picker must not jump into the panel).
 */
export function InfoPanel({ view, metrics, onClose, id }: Props) {
  const titleId = `${useId()}-title`;
  const targetKey = `${view.target.kind}:${view.target.id}`;
  const sheet = useRef<HTMLElement | null>(null);
  useSwipeToDismiss(sheet, onClose);

  return (
    <aside
      id={id}
      className="info-panel"
      ref={sheet}
      aria-labelledby={titleId}
      data-info-kind={view.target.kind}
      data-info-id={view.target.id}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.stopPropagation();
        onClose();
      }}
    >
      <div className="sheet-handle" aria-hidden="true" />
      <header className="info-panel-header">
        <h2 id={titleId}>{view.title}</h2>
        <button type="button" className="info-panel-close ui-pill" aria-label="Close information" onClick={onClose}>Close</button>
      </header>
      {view.subtitle !== undefined && <p className="info-panel-subtitle"><span className="info-panel-badge">{view.subtitle}</span></p>}
      {view.provenance !== null && <ProvenanceBadge key={targetKey} provenance={view.provenance} />}
      {view.description !== undefined && <p className="info-panel-description">{view.description}</p>}
      {view.facts !== undefined && (
        <dl className="info-panel-facts">
          {view.facts.map((fact) => <div key={fact.label} className="info-panel-fact"><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}
        </dl>
      )}
      {metrics.length > 0 && (
        <div className="info-panel-metrics">
          {metrics.map((metric) => <MetricVisual key={metric.id} metric={metric} />)}
        </div>
      )}
    </aside>
  );
}
