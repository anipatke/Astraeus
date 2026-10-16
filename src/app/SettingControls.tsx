import type { ReactNode } from "react";

/** A titled group of developer settings. The title names the group for assistive technology too. */
export function SettingGroup({ id, title, children }: { readonly id: string; readonly title: string; readonly children: ReactNode }) {
  return (
    <div className="setting-group" role="group" aria-labelledby={`setting-group-${id}`}>
      <h4 id={`setting-group-${id}`}>{title}</h4>
      {children}
    </div>
  );
}

/** One slider setting on one row: label on the left, the control in the middle, the value on the right. */
export function SettingSlider({ label, ariaLabel, testId, display, min, max, step, value, onChange }: {
  readonly label: string;
  readonly ariaLabel: string;
  readonly testId: string;
  readonly display: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly value: number;
  readonly onChange: (value: number) => void;
}) {
  return (
    <label className="setting">
      <span className="setting-label">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} aria-label={ariaLabel} onChange={(event) => onChange(Number(event.target.value))} />
      <output data-testid={testId}>{display}</output>
    </label>
  );
}

/** A row of buttons, with an optional label on the left. */
export function SettingButtons({ label, children }: { readonly label?: string; readonly children: ReactNode }) {
  return label === undefined
    ? <div className="setting-buttons">{children}</div>
    : <div className="setting-buttons has-label"><span className="setting-label">{label}</span><div>{children}</div></div>;
}
