import type { InfoView } from "./infoModel";
import type { Metric } from "./metrics";
import { MetricVisual } from "./MetricVisual";
import { ProvenanceBadge } from "./ProvenanceBadge";

interface Props {
  readonly view: InfoView;
  readonly metrics: readonly Metric[];
  readonly onClose: () => void;
}

/**
 * On-demand detail for one object or event. Non-modal: the canvas and controls stay usable around it, and
 * focus stays where the viewer is (choosing in the object picker must not jump into the panel).
 */
export function InfoPanel({ view, metrics, onClose }: Props) {
  const targetKey = `${view.target.kind}:${view.target.id}`;

  return (
    <aside
      id="info-panel"
      className="info-panel"
      aria-labelledby="info-panel-title"
      data-info-kind={view.target.kind}
      data-info-id={view.target.id}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.stopPropagation();
        onClose();
      }}
    >
      <header className="info-panel-header">
        <h2 id="info-panel-title">{view.title}</h2>
        <button type="button" className="info-panel-close" aria-label="Close information" onClick={onClose}>Close</button>
      </header>
      {view.subtitle !== undefined && <p className="info-panel-subtitle">{view.subtitle}</p>}
      {view.provenance !== null && <ProvenanceBadge key={targetKey} provenance={view.provenance} />}
      {view.description !== undefined && <p className="info-panel-description">{view.description}</p>}
      {metrics.length > 0 && (
        <div className="info-panel-metrics">
          {metrics.map((metric) => <MetricVisual key={metric.id} metric={metric} />)}
        </div>
      )}
    </aside>
  );
}
