/** A choice a host offers between versions of its scene (a host's picker, `Scene.setPicker`): the control only reports a press, it never reads or writes the address. Names come from the host's data, never from the shell. */
export interface ExperienceSwitch {
  /** The accessible name of the group. */
  readonly label: string;
  /** Names the choice; drawn as `data-switch-param`. */
  readonly param: string;
  /** A press of an option other than the pressed one calls this with the option's value and does nothing else. */
  readonly choose: (value: string) => void;
  readonly options: readonly { readonly label: string; readonly value: string; readonly active: boolean }[];
}

/** One button per option in the top bar (and the phone drawer); choosing one reports it to the host. Fewer than two options: nothing to choose, no control. */
export function SwitchControl({ choice }: { readonly choice: ExperienceSwitch }) {
  if (choice.options.length < 2) return null;
  return (
    <section className="switch-control" role="group" aria-label={choice.label} data-switch-param={choice.param}>
      {choice.options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`switch-option top-bar-button ${option.active ? "ui-accent" : ""}`}
          aria-pressed={option.active}
          data-switch-value={option.value}
          onClick={() => { if (!option.active) choice.choose(option.value); }}
        >
          <span>{option.label}</span>
        </button>
      ))}
    </section>
  );
}
