/**
 * A collapsible section, closed until tapped (O-020 Decision 4). The credits stay complete and one tap away (PROV-01).
 * Shared by the information and story panels. With `details` it is "The details and sources" (O-015 Decision 5); without, it is "Sources".
 * Inside: the details paragraphs, then the `accuracy` and `notes` when given, then the sources.
 */
export function Sources({ sources, details = [], accuracy, notes = "" }: { readonly sources: readonly string[]; readonly details?: readonly string[]; readonly accuracy?: string; readonly notes?: string }) {
  return (
    <details className="sources-section">
      <summary className="ui-button ui-row">
        {details.length > 0 ? <span>The details and sources</span> : <span>Sources <span className="sources-count">· {sources.length}</span></span>}
        <svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" focusable="false"><path d="M2 4l4 4 4-4" /></svg>
      </summary>
      {details.length > 0 && <div className="sources-details">{details.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>}
      {accuracy !== undefined && (
        <dl className="provenance-detail sources-trust">
          <dt>Accuracy</dt>
          <dd>{accuracy}</dd>
          {notes.length > 0 && <><dt>Notes</dt><dd>{notes}</dd></>}
        </dl>
      )}
      <ul>{sources.map((source) => <li key={source}>{source}</li>)}</ul>
    </details>
  );
}
