/** A collapsible list of sources, closed until tapped (O-020 Decision 4). The credits stay complete and one tap away (PROV-01). Shared by the information and story panels. */
export function Sources({ sources }: { readonly sources: readonly string[] }) {
  return (
    <details className="sources-section">
      <summary className="ui-button ui-row">
        <span>Sources <span className="sources-count">· {sources.length}</span></span>
        <svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" focusable="false"><path d="M2 4l4 4 4-4" /></svg>
      </summary>
      <ul>{sources.map((source) => <li key={source}>{source}</li>)}</ul>
    </details>
  );
}
