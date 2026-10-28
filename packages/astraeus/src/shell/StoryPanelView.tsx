import { useEffect, useRef } from "react";
import { Sources } from "./Sources";
import { BADGE_LABELS, type PanelBadge, type StoryPanel } from "./storyPanels";
import { useSwipeToDismiss } from "./useSwipeToDismiss";
import { useZoomThrough } from "./useZoomThrough";

/** A small pill saying how far to trust a panel's facts, after Planetary Explorer's Badge. */
export function StoryBadge({ badge }: { readonly badge: PanelBadge }) {
  return <span className="story-badge" data-badge={badge}>{BADGE_LABELS[badge]}</span>;
}

interface Props {
  readonly panel: StoryPanel;
  /** True while playback is held for this panel; shows the Continue button. */
  readonly holding: boolean;
  readonly onClose: () => void;
  readonly onContinue: () => void;
}

/**
 * One story panel: a side panel beside the scene on a wide screen, a bottom sheet with a grab handle on a phone
 * (the stylesheet chooses). Closing, Escape and a swipe down all dismiss it.
 */
export function StoryPanelView({ panel, holding, onClose, onContinue }: Props) {
  const sheet = useRef<HTMLElement | null>(null);
  useSwipeToDismiss(sheet, onClose);
  useZoomThrough(sheet);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (!event.defaultPrevented && event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <aside className="story-panel" ref={sheet} role="dialog" aria-modal="false" aria-labelledby="story-panel-title" data-panel-id={panel.id}>
      <div className="sheet-handle" aria-hidden="true" />
      <header className="story-panel-header">
        <StoryBadge badge={panel.badge} />
        <button type="button" className="story-panel-close ui-icon" aria-label="Close story panel" onClick={onClose}>×</button>
      </header>
      <h2 id="story-panel-title">{panel.title}</h2>
      <div className="story-panel-body">{panel.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
      <Sources sources={panel.sources} details={panel.details} />
      {holding && <button type="button" className="story-panel-continue ui-accent" onClick={onContinue}>Continue playback</button>}
    </aside>
  );
}
