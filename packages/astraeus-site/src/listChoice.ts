import type { PickerInput } from "astraeus";
// List choice: which entry of a list the page opens (a shower, a planet), and the switch that offers the others. Pure; the names come from the settings files.
// Lifted as it was from the engine's `app/listSwitch` (O-059 T-270): only the site has these lists.

/** What the switch offers: its accessible name, the address parameter that carries the choice, the parameters it keeps, and one option per entry. */
export interface ListSwitch {
  readonly label: string;
  readonly param: string;
  readonly keep?: readonly string[];
  readonly options: readonly { readonly label: string; readonly value: string; readonly active: boolean }[];
}

/** One entry the page can open: its settings file's name, its label, and its place in the switch (the lowest `order` is the default). */
export interface SwitchEntry {
  readonly name: string;
  readonly label: string;
  readonly order: number;
}

/** The entry to open (the requested one when it exists, else `preferred`, else the first by `order`, then name) and the switch listing every entry. Undefined when there are none. */
export function chooseSwitch<T extends SwitchEntry>(entries: readonly T[], requested: string | null, switchOf: { readonly label: string; readonly param: string; readonly keep?: readonly string[] }, preferred?: string): { readonly name: string; readonly switcher: ListSwitch } | undefined {
  const sorted = [...entries].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  const chosen = sorted.find((entry) => entry.name === requested) ?? sorted.find((entry) => entry.name === preferred) ?? sorted[0];
  if (chosen === undefined) return undefined;
  return {
    name: chosen.name,
    switcher: { label: switchOf.label, param: switchOf.param, ...(switchOf.keep === undefined ? {} : { keep: switchOf.keep }), options: sorted.map((entry) => ({ label: entry.label, value: entry.name, active: entry === chosen })) },
  };
}

/** The picker a scene offers, from the switch the entry chose: the options are the entries, the pressed one is the entry opened. */
export function pickerOf(switcher: ListSwitch): PickerInput {
  return { id: switcher.param, label: switcher.label, options: switcher.options.map(({ value, label }) => ({ value, label })), value: switcher.options.find((option) => option.active)?.value ?? "" };
}
