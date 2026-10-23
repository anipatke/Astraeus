/**
 * A collapsible section, closed until tapped (O-020 Decision 4). The credits stay complete and one tap away (PROV-01).
 * Shared by the information and story panels. With `details` it is "The details and sources" (O-015 Decision 5): the
 * details paragraphs first, then the sources; without, it is "Sources".
 */
export function Sources({ sources, details = [] }: { readonly sources: readonly string[]; readonly details?: readonly string[] }) {
  return (
    <details className="sources-section">
      <summary className="ui-button ui-row">
        {details.length > 0 ? <span>The details and sources</span> : <span>Sources <span className="sources-count">· {sources.length}</span></span>}
        <svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" focusable="false"><path d="M2 4l4 4 4-4" /></svg>
      </summary>
      {details.length > 0 && <div className="sources-details">{details.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>}
      <ul>{sources.map((source) => <li key={source}>{source}</li>)}</ul>
    </details>
  );
}
