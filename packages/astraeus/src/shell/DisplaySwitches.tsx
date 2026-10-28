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

/**
 * The switches a story placed. Top-bar ones are buttons in the bar (and in the phone drawer's grid); panel ones sit in one small panel opened by a "Display" button
 * beside them. Nothing placed: nothing drawn, so the bar is exactly as it was. The panel closes on an outside press or Escape.
 */
export function DisplaySwitches({ switches }: { readonly switches: readonly DisplaySwitchItem[] }) {
  const barSwitches = switches.filter((item) => item.place === "top-bar");
  const panelSwitches = switches.filter((item) => item.place === "panel");
  if (switches.length === 0) return null;
  return (
    <section className="display-switches" role="group" aria-label="Display switches">
      {barSwitches.map((item) => (
        <button key={item.id} type="button" className="display-switch top-bar-button ui-icon" aria-label={item.label} title={item.label} aria-pressed={item.on} data-display-switch={item.id} data-closes-drawer="" onClick={item.onToggle}>
          {item.id === "orbitLines" ? <OrbitIcon /> : <SwitchesIcon />}
          <ButtonText>{item.label}</ButtonText>
        </button>
      ))}
      {panelSwitches.length > 0 && <SwitchPanel switches={panelSwitches} />}
    </section>
  );
}

function SwitchPanel({ switches }: { readonly switches: readonly DisplaySwitchItem[] }) {
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
        {switches.map((item) => (
          <button key={item.id} type="button" className="switch-panel-row ui-row" aria-pressed={item.on} data-display-switch={item.id} onClick={item.onToggle}>{item.label}</button>
        ))}
      </div>
    </div>
  );
}
