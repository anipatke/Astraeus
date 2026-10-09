import { useId, useState } from "react";
import { SCALE_CHOICES, SCALE_NOTE, type ScaleId } from "./scaleModel";

interface Props {
  readonly scaleId: ScaleId;
  readonly onScaleChange: (id: ScaleId) => void;
}

/** True/Readable choice with a plain-words explanation one tap away. */
export function ScaleControl({ scaleId, onScaleChange }: Props) {
  const [explained, setExplained] = useState(false);
  const explanationId = useId();
  return (
    <section className="scale-control" aria-label="Scale">
      <div className="scale-choices" role="group" aria-label="Scale">
        <span className="scale-control-label" aria-hidden="true">Scale</span>
        {SCALE_CHOICES.map((choice) => (
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
          aria-label="What do True and Readable scale mean?"
          aria-expanded={explained}
          aria-controls={explanationId}
          onClick={() => setExplained(!explained)}
        >
          ⓘ
        </button>
      </div>
      <div className="scale-explanation" id={explanationId} hidden={!explained}>
        <dl>
          {SCALE_CHOICES.map((choice) => (
            <div key={choice.id}><dt>{choice.label}</dt><dd>{choice.explanation}</dd></div>
          ))}
        </dl>
        <p>{SCALE_NOTE}</p>
      </div>
    </section>
  );
}
