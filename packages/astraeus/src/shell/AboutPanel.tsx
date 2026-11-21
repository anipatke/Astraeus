// Part: the About panel (title, status, credits, links, Built with Astraeus and version), drawn in the left place.
// Must not: set a position, layer, raw colour or raw size (areas/ places it, look.css holds the values), or open or close another part; its close button reports `onClose` and the panel rule decides.
import { useId, useRef } from "react";
import type { AboutInput } from "../api/aboutInput";
import { BUILT_WITH_URL, ENGINE_VERSION } from "../app/engineVersion";
import { useSwipeToDismiss } from "./useSwipeToDismiss";

interface Props {
  readonly about: AboutInput;
  readonly onClose: () => void;
  /** The panel's id, made once per viewer by the shell so the title that opens it can name it. */
  readonly id: string;
}

/** An external link: it opens in a new tab and gives the page no handle on this one. */
function Link({ url, children }: { readonly url: string; readonly children: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

/**
 * The About panel: the app's status, credits and links, ending with the engine's "Built with Astraeus" link and version. It is drawn in the left place (a detail sheet on a phone);
 * where it sits and when it closes are the panel rule's (panels/), Escape included. It sets no position or layer itself.
 */
export function AboutPanel({ about, onClose, id }: Props) {
  const titleId = `${useId()}-title`;
  const sheet = useRef<HTMLElement | null>(null);
  useSwipeToDismiss(sheet, onClose);
  const credits = about.credits ?? [];
  const links = about.links ?? [];
  return (
    <aside id={id} className="info-panel about-panel" ref={sheet} aria-labelledby={titleId} data-about="">
      <div className="sheet-handle" aria-hidden="true" />
      <header className="info-panel-header">
        <h2 id={titleId}>{about.title}</h2>
        <button type="button" className="info-panel-close ui-pill" aria-label="Close About" onClick={onClose}>
          Close
        </button>
      </header>
      {about.status !== undefined && about.status !== "" && (
        <p className="about-status" data-about-status="">
          {about.status}
        </p>
      )}
      {credits.length > 0 && (
        <section className="about-section" aria-label="Credits">
          <h3>Credits</h3>
          <ul data-about-credits="">
            {credits.map((credit, index) => (
              <li key={index}>
                {credit.text}
                {credit.url !== undefined && (
                  <>
                    {" "}
                    (<Link url={credit.url}>Source</Link>)
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
      {links.length > 0 && (
        <section className="about-section" aria-label="Links">
          <h3>Links</h3>
          <ul data-about-links="">
            {links.map((link, index) => (
              <li key={index}>
                <Link url={link.url}>{link.text}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="about-built-with" data-about-built-with="">
        <Link url={BUILT_WITH_URL}>Built with Astraeus</Link> <span data-about-version="">{ENGINE_VERSION}</span>
      </p>
    </aside>
  );
}
