// Shower choice: which shower the Showers experience opens, and the switch that offers the others. Pure; the names come from the settings files.
import type { ExperienceSwitch } from "../../shell/SwitchControl";

/** The address parameter that names the shower (`?experience=showers&shower=<name>`). */
export const SHOWER_PARAM = "shower";
/** The label the switch carries as its accessible name. */
export const SHOWER_SWITCH_LABEL = "Shower";

/** One shower the experience can open: its settings file's name, its label, and its place in the switch (the lowest `order` is the default). */
export interface ShowerEntry {
  readonly name: string;
  readonly label: string;
  readonly order: number;
}

/** The shower to open (the requested one when it exists, else the first by `order`, then name) and the switch listing every shower. Undefined when there are no showers. */
export function chooseShower(entries: readonly ShowerEntry[], requested: string | null): { readonly name: string; readonly switcher: ExperienceSwitch } | undefined {
  const sorted = [...entries].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  const chosen = sorted.find((entry) => entry.name === requested) ?? sorted[0];
  if (chosen === undefined) return undefined;
  return {
    name: chosen.name,
    switcher: { label: SHOWER_SWITCH_LABEL, param: SHOWER_PARAM, options: sorted.map((entry) => ({ label: entry.label, value: entry.name, active: entry === chosen })) },
  };
}
