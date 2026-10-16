import { useId, useState } from "react";
import { SCALE_CHOICES, SCALE_NOTE, type ScaleChoice, type ScaleId } from "./scaleModel";

interface Props {
  readonly scaleId: ScaleId;
  readonly onScaleChange: (id: ScaleId) => void;
  /** The choices to offer; the engine's True and Readable pair when the application supplies none. */
  readonly choices?: readonly ScaleChoice[];
}

function joinLabels(choices: readonly ScaleChoice[]): string {
  const labels = choices.map((choice) => choice.label);
  return labels.length < 2 ? labels.join("") : `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
}

/** True/Readable choice with a plain-words explanation one tap away. */
export function ScaleControl({ scaleId, onScaleChange, choices = SCALE_CHOICES }: Props) {
  const [explained, setExplained] = useState(false);
  const explanationId = useId();
  return (
    <section className="scale-control" aria-label="Scale">
      <div className="scale-choices" role="group" aria-label="Scale">
        <span className="scale-control-label" aria-hidden="true">Scale</span>
        {choices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            aria-pressed={scaleId === choice.id}
            data-scale={choice.id}
            onClick={() => onScaleChange(choice.id)}
          >
            {choice.label}
          </button>
        ))}
        <button
          type="button"
          className="scale-explain"
          aria-label={`What do ${joinLabels(choices)} scale mean?`}
          aria-expanded={explained}
          aria-controls={explanationId}
          onClick={() => setExplained(!explained)}
        >
          ⓘ
        </button>
      </div>
      <div className="scale-explanation" id={explanationId} hidden={!explained}>
        <dl>
          {choices.map((choice) => (
            <div key={choice.id}><dt>{choice.label}</dt><dd>{choice.explanation}</dd></div>
          ))}
        </dl>
        <p>{SCALE_NOTE}</p>
      </div>
    </section>
  );
}
