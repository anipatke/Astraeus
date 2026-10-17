import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { SCALE_CHOICES, SCALE_NOTE, type ScaleChoice, type ScaleId } from "./scaleModel";
import { ChevronIcon, ScaleIcon } from "./topBarIcons";

interface Props {
  readonly scaleId: ScaleId;
  readonly onScaleChange: (id: ScaleId) => void;
  /** The choices to offer; the engine's True and Readable pair when the application supplies none. */
  readonly choices?: readonly ScaleChoice[];
}

/**
 * One button for the scale. Two choices: a toggle that names the current scale and switches to the other. Three or more: a small menu
 * (arrow keys, Home and End, Escape, closes on an outside press). One choice: the same button, held still.
 */
export function ScaleControl({ scaleId, onScaleChange, choices = SCALE_CHOICES }: Props) {
  const current = choices.find((choice) => choice.id === scaleId) ?? choices[0];
  const options = choices.map((choice) => choice.id).join(",");
  const common = { className: "scale-control", "aria-label": "Scale", "data-scale-current": current?.id, "data-scale-options": options } as const;
  if (current === undefined) return null;
  if (choices.length >= 3) return <ScaleMenu choices={choices} current={current} onScaleChange={onScaleChange} {...common} />;
  const other = choices.find((choice) => choice.id !== current.id);
  const name = other === undefined ? `Scale: ${current.label}` : `Scale: ${current.label}. Switch to ${other.label}`;
  const hint = `${current.label}: ${current.explanation} ${SCALE_NOTE}`;
  return (
    <section {...common}>
      <button
        type="button"
        className="scale-toggle top-bar-button"
        aria-label={name}
        title={other === undefined ? `${name} (the only scale here). ${hint}` : `Scale: ${current.label} (tap for ${other.label}). ${hint}`}
        data-scale={current.id}
        data-scale-label={current.label}
        disabled={other === undefined}
        onClick={() => { if (other !== undefined) onScaleChange(other.id); }}
      >
        <ScaleIcon />
        <span>{current.label}</span>
      </button>
    </section>
  );
}

interface MenuProps extends Omit<Props, "scaleId"> {
  readonly choices: readonly ScaleChoice[];
  readonly current: ScaleChoice;
  readonly className: string;
  readonly "aria-label": string;
  readonly "data-scale-current": string | undefined;
  readonly "data-scale-options": string;
}

function ScaleMenu({ choices, current, onScaleChange, ...attributes }: MenuProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const root = useRef<HTMLElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const focusItem = (index: number) => items.current[(index + choices.length) % choices.length]?.focus();

  useEffect(() => {
    if (!open) return undefined;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  useEffect(() => {
    if (open) focusItem(choices.findIndex((choice) => choice.id === current.id));
    // Focus moves once, when the menu opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = (returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) trigger.current?.focus();
  };

  const onTriggerKey = (event: KeyboardEvent) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setOpen(true); }
  };

  const onMenuKey = (event: KeyboardEvent) => {
    const index = items.current.findIndex((item) => item === document.activeElement);
    if (event.key === "ArrowDown") focusItem(index + 1);
    else if (event.key === "ArrowUp") focusItem(index - 1);
    else if (event.key === "Home") focusItem(0);
    else if (event.key === "End") focusItem(choices.length - 1);
    else if (event.key === "Escape") { event.stopPropagation(); close(true); }
    else if (event.key === "Tab") close(false);
    else return;
    if (event.key !== "Tab") event.preventDefault();
  };

  return (
    <section ref={root} {...attributes}>
      <button
        ref={trigger}
        type="button"
        className="scale-toggle scale-menu-trigger top-bar-button"
        aria-label={`Scale: ${current.label}, choose another`}
        title={`Scale: ${current.label} (choose another). ${SCALE_NOTE}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        data-scale={current.id}
        data-scale-label={current.label}
        onClick={() => setOpen(!open)}
        onKeyDown={onTriggerKey}
      >
        <ScaleIcon />
        <span>{current.label}</span>
        <ChevronIcon />
      </button>
      <div className="scale-menu" id={menuId} role="menu" aria-label="Scale" hidden={!open} onKeyDown={onMenuKey}>
        {choices.map((choice, index) => (
          <button
            key={choice.id}
            ref={(element) => { items.current[index] = element; }}
            type="button"
            role="menuitemradio"
            aria-checked={choice.id === current.id}
            tabIndex={-1}
            title={choice.explanation}
            data-scale={choice.id}
            onClick={() => { onScaleChange(choice.id); close(true); }}
          >
            {choice.label}
          </button>
        ))}
      </div>
    </section>
  );
}
