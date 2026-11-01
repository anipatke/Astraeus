import { useEffect, useId, useRef, useState } from "react";
import { ButtonText, OrbitIcon, SwitchesIcon } from "./topBarIcons";

/** One display switch a story placed: where it shows, and whether it is on now. */
export interface DisplaySwitchItem {
  readonly id: string;
  readonly label: string;
  /** "top-bar": its own button in the bar; "panel": a row in the switch panel opened from the bar. */
  readonly place: "top-bar" | "panel";
  readonly on: boolean;
  readonly onToggle: () => void;
}

/** The views a scene names, as the bar shows them: one option each, exactly one active. Choosing never rebuilds the scene or touches the clock. */
export interface ViewChoice {
  readonly place: "top-bar" | "panel";
  readonly options: readonly { readonly id: string; readonly label: string; readonly active: boolean }[];
  readonly onSelect: (id: string) => void;
}

/** The view choice as a button group in the bar (and the phone drawer's grid), with the look of the experience switch's options. Fewer than two views: nothing to choose. */
export function ViewButtons({ choice }: { readonly choice: ViewChoice }) {
  if (choice.place !== "top-bar" || choice.options.length < 2) return null;
  return (
    <section className="switch-control view-choice" role="group" aria-label="View" data-view-choice="">
      {choice.options.map((option) => (
        <button key={option.id} type="button" className={`switch-option top-bar-button ${option.active ? "ui-accent" : ""}`} aria-pressed={option.active} data-view-id={option.id} onClick={() => { if (!option.active) choice.onSelect(option.id); }}>
          <span>{option.label}</span>
        </button>
      ))}
    </section>
  );
}

/** Whether the switch panel has anything to show: a panel-placed switch or the view choice placed there. */
export function viewChoiceInPanel(choice: ViewChoice | undefined): choice is ViewChoice {
  return choice !== undefined && choice.place === "panel" && choice.options.length > 1;
}

/**
 * The switches a story placed. Top-bar ones are buttons in the bar (and in the phone drawer's grid); panel ones sit in one small panel opened by a "Display" button
 * beside them. Nothing placed: nothing drawn, so the bar is exactly as it was. The panel closes on an outside press or Escape.
 */
export function DisplaySwitches({ switches, viewChoice }: { readonly switches: readonly DisplaySwitchItem[]; readonly viewChoice?: ViewChoice }) {
  const barSwitches = switches.filter((item) => item.place === "top-bar");
  const panelSwitches = switches.filter((item) => item.place === "panel");
  const viewsInPanel = viewChoiceInPanel(viewChoice) ? viewChoice : undefined;
  if (switches.length === 0 && viewsInPanel === undefined) return null;
  return (
    <section className="display-switches" role="group" aria-label="Display switches">
      {barSwitches.map((item) => (
        <button key={item.id} type="button" className="display-switch top-bar-button ui-icon" aria-label={item.label} title={item.label} aria-pressed={item.on} data-display-switch={item.id} data-closes-drawer="" onClick={item.onToggle}>
          {item.id === "orbitLines" ? <OrbitIcon /> : <SwitchesIcon />}
          <ButtonText>{item.label}</ButtonText>
        </button>
      ))}
      {(panelSwitches.length > 0 || viewsInPanel !== undefined) && <SwitchPanel switches={panelSwitches} viewChoice={viewsInPanel} />}
    </section>
  );
}

function SwitchPanel({ switches, viewChoice }: { readonly switches: readonly DisplaySwitchItem[]; readonly viewChoice?: ViewChoice }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return undefined;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (!event.defaultPrevented && event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);
  return (
    <div className="switch-panel-host" ref={root}>
      <button type="button" className="switch-panel-toggle top-bar-button ui-icon" aria-label="Switch panel" title="Switch panel" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(!open)}>
        <SwitchesIcon />
        <ButtonText>Display</ButtonText>
      </button>
      <div id={panelId} className="switch-panel" role="group" aria-label="Switches in the panel" hidden={!open}>
        {viewChoice?.options.map((option) => (
          <button key={`view-${option.id}`} type="button" className="switch-panel-row ui-row" aria-pressed={option.active} data-view-id={option.id} onClick={() => { if (!option.active) viewChoice.onSelect(option.id); }}>{option.label}</button>
        ))}
        {switches.map((item) => (
          <button key={item.id} type="button" className="switch-panel-row ui-row" aria-pressed={item.on} data-display-switch={item.id} onClick={item.onToggle}>{item.label}</button>
        ))}
      </div>
    </div>
  );
}
