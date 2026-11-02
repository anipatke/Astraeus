import { useId, type ReactNode } from "react";

/** A titled group of developer settings. The title names the group for assistive technology too. */
export function SettingGroup({ name, title, children }: { readonly name: string; readonly title: string; readonly children: ReactNode }) {
  const titleId = `${useId()}-title`;
  return (
    <div className="setting-group" role="group" aria-labelledby={titleId} data-setting-group={name}>
      <h4 id={titleId}>{title}</h4>
      {children}
    </div>
  );
}

/** A developer-drawer section named by its own heading; the heading id is made per viewer. */
export function HudSection({ className = "hud-section", level, heading, testId, children }: { readonly className?: string; readonly level: 3 | 4; readonly heading: ReactNode; readonly testId?: string; readonly children: ReactNode }) {
  const headingId = `${useId()}-heading`;
  const Heading = level === 3 ? "h3" : "h4";
  return (
    <section className={className} aria-labelledby={headingId} data-testid={testId}>
      <Heading id={headingId}>{heading}</Heading>
      {children}
    </section>
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

/** One colour setting on one row: label on the left, the picker in the middle, the value on the right. */
export function SettingColor({ label, ariaLabel, testId, value, onChange }: {
  readonly label: string;
  readonly ariaLabel: string;
  readonly testId: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  return (
    <label className="setting">
      <span className="setting-label">{label}</span>
      <input type="color" value={value} aria-label={ariaLabel} onChange={(event) => onChange(event.target.value)} />
      <output data-testid={testId}>{value}</output>
    </label>
  );
}
