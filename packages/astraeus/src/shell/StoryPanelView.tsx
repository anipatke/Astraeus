import { useEffect, useId, useRef } from "react";
import { keyIsForViewer } from "./viewerKeys";
import { Sources } from "./Sources";
import { PROVENANCE_STATUS } from "./infoModel";
import type { ProvenanceSourceType } from "../core/provenance";
import type { StoryPanel, StoryStep } from "./storyPanels";
import { useSwipeToDismiss } from "./useSwipeToDismiss";
import { useZoomThrough } from "./useZoomThrough";

/** A small pill saying how far to trust a panel's facts, after Planetary Explorer's Badge. */
export function StoryBadge({ sourceType }: { readonly sourceType: ProvenanceSourceType }) {
  return <span className="story-badge" data-badge={sourceType}>{PROVENANCE_STATUS[sourceType]}</span>;
}

/** A step's place and its neighbours: `onBack` and `onNext` are absent at the first and last step. */
export interface StepNav {
  readonly number: number;
  readonly count: number;
  readonly onBack?: (() => void) | undefined;
  readonly onNext?: (() => void) | undefined;
}

interface Props {
  readonly panel: StoryPanel | StoryStep;
  /** Present when the panel is a step: shows "Step n of m", Back and Next. */
  readonly step?: StepNav | undefined;
  /** True while playback is held for this panel; shows the Continue button. */
  readonly holding: boolean;
  readonly onClose: () => void;
  readonly onContinue: () => void;
}

/**
 * One story panel: a side panel beside the scene on a wide screen, a bottom sheet with a grab handle on a phone
 * (the stylesheet chooses). Closing, Escape and a swipe down all dismiss it.
 */
export function StoryPanelView({ panel, step, holding, onClose, onContinue }: Props) {
  const titleId = `${useId()}-title`;
  const sheet = useRef<HTMLElement | null>(null);
  useSwipeToDismiss(sheet, onClose);
  useZoomThrough(sheet);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (!event.defaultPrevented && event.key === "Escape" && keyIsForViewer(event, sheet.current)) onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <aside className="story-panel" ref={sheet} role="dialog" aria-modal="false" aria-labelledby={titleId} data-panel-id={panel.id}>
      <div className="sheet-handle" aria-hidden="true" />
      <header className="story-panel-header">
        <StoryBadge sourceType={panel.provenance.sourceType} />
        <button type="button" className="story-panel-close ui-icon" aria-label="Close story panel" onClick={onClose}>×</button>
      </header>
      <h2 id={titleId}>{panel.title}</h2>
      <div className="story-panel-body">{panel.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
      <Sources sources={panel.provenance.sources} details={panel.details} accuracy={panel.provenance.accuracy} notes={panel.provenance.notes} />
      {step !== undefined && (
        <nav className="story-panel-steps" aria-label="Story steps">
          <button type="button" className="story-panel-back ui-icon" disabled={step.onBack === undefined} onClick={step.onBack}>Back</button>
          <span className="story-panel-step-count">Step {step.number} of {step.count}</span>
          <button type="button" className="story-panel-next ui-accent" disabled={step.onNext === undefined} onClick={step.onNext}>Next</button>
        </nav>
      )}
      {holding && <button type="button" className="story-panel-continue ui-accent" onClick={onContinue}>Continue playback</button>}
    </aside>
  );
}
