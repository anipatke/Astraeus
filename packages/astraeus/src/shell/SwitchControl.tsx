// Part: the host's picker switch, as buttons (full or short labels) or the fit rule's compact drop-down.
// Must not: set a position, layer, raw colour or raw size (areas/ places it, look.css holds the values), or open or close another part; a press reports `choose` and never reads or writes the address.
/** A choice a host offers between versions of its scene (a host's picker, `Scene.setPicker`): the control only reports a press, it never reads or writes the address. Names come from the host's data, never from the shell. */
export interface ExperienceSwitch {
  /** The accessible name of the group. */
  readonly label: string;
  /** Names the choice; drawn as `data-switch-param`. */
  readonly param: string;
  /** A press of an option other than the pressed one calls this with the option's value and does nothing else. */
  readonly choose: (value: string) => void;
  readonly options: readonly {
    readonly label: string;
    readonly shortLabel?: string;
    readonly value: string;
    readonly active: boolean;
  }[];
}

/** The shapes a switch takes in the bar: full labels, short labels (`shortLabel`, else the label), or one drop-down. */
export type SwitchForm = "full" | "short" | "compact";

/** The compact switch: the current option and a chevron, the list in the browser's pop-up. Reports a choice exactly as the buttons do. */
export function CompactSwitch({
  label,
  active,
  options,
  choose,
  attributes,
}: {
  readonly label: string;
  readonly active: string;
  readonly options: readonly { readonly value: string; readonly label: string }[];
  readonly choose: (value: string) => void;
  readonly attributes: Readonly<Record<string, string>>;
}) {
  return (
    <select
      className="switch-compact"
      aria-label={label}
      value={active}
      data-closes-drawer=""
      {...attributes}
      onChange={(event) => {
        if (event.target.value !== active) choose(event.target.value);
      }}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

/** One button per option in the top bar (and the phone drawer); choosing one reports it to the host. Fewer than two options: nothing to choose, no control. */
export function SwitchControl({
  choice,
  form = "full",
}: {
  readonly choice: ExperienceSwitch;
  readonly form?: SwitchForm;
}) {
  if (choice.options.length < 2) return null;
  if (form === "compact") {
    return (
      <CompactSwitch
        label={choice.label}
        active={choice.options.find((option) => option.active)?.value ?? ""}
        options={choice.options}
        choose={choice.choose}
        attributes={{ "data-switch-param": choice.param }}
      />
    );
  }
  return (
    <section className="switch-control" role="group" aria-label={choice.label} data-switch-param={choice.param}>
      {choice.options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`switch-option top-bar-button ${option.active ? "ui-accent" : ""}`}
          aria-pressed={option.active}
          data-switch-value={option.value}
          onClick={() => {
            if (!option.active) choice.choose(option.value);
          }}
        >
          <span>{form === "short" ? (option.shortLabel ?? option.label) : option.label}</span>
        </button>
      ))}
    </section>
  );
}
