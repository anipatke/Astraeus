/** A choice an experience offers between versions of itself (for example which of two related stories to show). Names come from the experience's data, never from the shell. */
export interface ExperienceSwitch {
  /** The accessible name of the group. */
  readonly label: string;
  /** The address parameter that carries the choice. */
  readonly param: string;
  readonly options: readonly { readonly label: string; readonly value: string; readonly active: boolean }[];
}

/** The address a choice leads to: the current one with the parameter set, and the camera view and time dropped (each version opens on its own). */
export function switchAddress(href: string, param: string, value: string): string {
  const url = new URL(href);
  url.searchParams.set(param, value);
  for (const own of ["view", "t"]) url.searchParams.delete(own);
  return url.toString();
}

/** One button per option in the top bar (and the phone drawer); choosing one opens the experience again at the new address. Fewer than two options: nothing to choose, no control. */
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
          onClick={() => { if (!option.active) window.location.assign(switchAddress(window.location.href, choice.param, option.value)); }}
        >
          <span>{option.label}</span>
        </button>
      ))}
    </section>
  );
}
