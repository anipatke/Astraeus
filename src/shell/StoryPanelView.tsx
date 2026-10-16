import { useEffect, useRef, type RefObject } from "react";
import { BADGE_LABELS, type PanelBadge, type StoryPanel } from "./storyPanels";

/** A downward drag longer than this (px) on the phone sheet dismisses it. */
const DISMISS_THRESHOLD_PX = 80;
/** The sheet follows the finger no further than this (px). */
const MAX_FOLLOW_PX = 120;

/**
 * Swipe-down-to-dismiss for the bottom sheet, after Planetary Explorer's useSwipeToDismiss.
 * Only a drag that starts with the sheet scrolled to its top counts, so reading a long panel never closes it.
 */
export function useSwipeToDismiss(ref: RefObject<HTMLElement | null>, onDismiss: () => void): void {
  const dismiss = useRef(onDismiss);
  dismiss.current = onDismiss;
  useEffect(() => {
    const element = ref.current;
    if (element === null) return undefined;
    let startY: number | null = null;
    const start = (event: TouchEvent) => { startY = element.scrollTop <= 0 ? event.touches[0]?.clientY ?? null : null; };
    const move = (event: TouchEvent) => {
      if (startY === null) return;
      const dy = (event.touches[0]?.clientY ?? startY) - startY;
      if (dy > 0) element.style.transform = `translateY(${Math.min(dy, MAX_FOLLOW_PX)}px)`;
    };
    const end = (event: TouchEvent) => {
      if (startY === null) return;
      const dy = (event.changedTouches[0]?.clientY ?? startY) - startY;
      element.style.transform = "";
      startY = null;
      if (dy > DISMISS_THRESHOLD_PX) dismiss.current();
    };
    element.addEventListener("touchstart", start, { passive: true });
    element.addEventListener("touchmove", move, { passive: true });
    element.addEventListener("touchend", end);
    element.addEventListener("touchcancel", end);
    return () => {
      element.removeEventListener("touchstart", start);
      element.removeEventListener("touchmove", move);
      element.removeEventListener("touchend", end);
      element.removeEventListener("touchcancel", end);
    };
  }, [ref]);
}

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
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <aside className="story-panel" ref={sheet} role="dialog" aria-modal="false" aria-labelledby="story-panel-title" data-panel-id={panel.id}>
      <div className="story-panel-handle" aria-hidden="true" />
      <header className="story-panel-header">
        <StoryBadge badge={panel.badge} />
        <button type="button" className="story-panel-close" aria-label="Close story panel" onClick={onClose}>×</button>
      </header>
      <h2 id="story-panel-title">{panel.title}</h2>
      <div className="story-panel-body">{panel.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
      <section className="story-panel-sources" aria-label="Sources">
        <h3>Sources</h3>
        <ul>{panel.sources.map((source) => <li key={source}>{source}</li>)}</ul>
      </section>
      {holding && <button type="button" className="story-panel-continue" onClick={onContinue}>Continue playback</button>}
    </aside>
  );
}
