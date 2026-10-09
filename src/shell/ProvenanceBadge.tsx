import { useId, useState } from "react";
import type { ProvenanceView } from "./infoModel";

/** A compact status button such as "Reconstructed ⓘ" that discloses source, accuracy, notes and limitations. */
export function ProvenanceBadge({ provenance }: { readonly provenance: ProvenanceView }) {
  const [open, setOpen] = useState(false);
  const detailId = useId();
  return (
    <div className="provenance">
      <button
        type="button"
        className="provenance-badge"
        data-source-type={provenance.sourceType}
        aria-expanded={open}
        aria-controls={detailId}
        onClick={() => setOpen(!open)}
      >
        {provenance.status} <span aria-hidden="true">ⓘ</span>
        <span className="visually-hidden">: data source and known limitations</span>
      </button>
      <dl className="provenance-detail" id={detailId} hidden={!open}>
        {provenance.knownLimitations.length > 0 && (
          <>
            <dt>Known limitations</dt>
            <dd><ul>{provenance.knownLimitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul></dd>
          </>
        )}
        <dt>Sources</dt>
        <dd><ul>{provenance.sources.map((source) => <li key={source}>{source}</li>)}</ul></dd>
        <dt>Accuracy</dt>
        <dd>{provenance.accuracy}</dd>
        {provenance.notes.length > 0 && <><dt>Notes</dt><dd>{provenance.notes}</dd></>}
      </dl>
    </div>
  );
}
