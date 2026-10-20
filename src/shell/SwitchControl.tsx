/** A choice an experience offers between versions of itself (for example which of two related stories to show). Names come from the experience's data, never from the shell. */
export interface ExperienceSwitch {
  /** The accessible name of the group. */
  readonly label: string;
  /** The address parameter that carries the choice. */
  readonly param: string;
  /** Address parameters the switch carries over to the new version (the clock's `t`, for versions that share one timeline); the camera `view` and the rest are dropped. */
  readonly keep?: readonly string[];
  /** The clock's time now, in UTC ms: when `keep` names `t`, the switch carries this time, not the one the address was opened with. Given by the app, which owns the clock. */
  readonly currentTimeUtcMs?: () => number;
  readonly options: readonly { readonly label: string; readonly value: string; readonly active: boolean }[];
}

/** The address a choice leads to: the current one with the parameter set, and the camera view and time dropped (each version opens on its own) unless `keep` names the time; a kept time is `timeUtcMs` (the clock now) when given. */
export function switchAddress(href: string, param: string, value: string, keep: readonly string[] = [], timeUtcMs?: number): string {
  const url = new URL(href);
  url.searchParams.set(param, value);
  // The clock's time at the press (whole seconds, as the view link writes it) replaces whatever `t` the address was opened with.
  if (keep.includes("t") && timeUtcMs !== undefined) url.searchParams.set("t", new Date(Math.round(timeUtcMs / 1000) * 1000).toISOString());
  for (const own of ["view", "t"]) if (!keep.includes(own)) url.searchParams.delete(own);
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
          onClick={() => { if (!option.active) window.location.assign(switchAddress(window.location.href, choice.param, option.value, choice.keep, choice.currentTimeUtcMs?.())); }}
        >
          <span>{option.label}</span>
        </button>
      ))}
    </section>
  );
}
