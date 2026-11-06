// List switch: which entry of a list an experience opens (a shower, a planet), and the switch that offers the others. Pure; the names come from the experience's settings files.
import type { ExperienceSwitch } from "../shell/SwitchControl";

/** One entry the experience can open: its settings file's name, its label, and its place in the switch (the lowest `order` is the default). */
export interface SwitchEntry {
  readonly name: string;
  readonly label: string;
  readonly order: number;
}

/** The entry to open (the requested one when it exists, else `preferred`, else the first by `order`, then name) and the switch listing every entry. Undefined when there are none. */
export function chooseSwitch<T extends SwitchEntry>(entries: readonly T[], requested: string | null, switchOf: { readonly label: string; readonly param: string; readonly keep?: readonly string[] }, preferred?: string): { readonly name: string; readonly switcher: ExperienceSwitch } | undefined {
  const sorted = [...entries].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  const chosen = sorted.find((entry) => entry.name === requested) ?? sorted.find((entry) => entry.name === preferred) ?? sorted[0];
  if (chosen === undefined) return undefined;
  return {
    name: chosen.name,
    switcher: { label: switchOf.label, param: switchOf.param, ...(switchOf.keep === undefined ? {} : { keep: switchOf.keep }), options: sorted.map((entry) => ({ label: entry.label, value: entry.name, active: entry === chosen })) },
  };
}

/** The control for a host's picker (`Scene.setPicker`) with `pressed` as the pressed option: a press calls `choose(value)` and does nothing else (no address, no navigation). */
export function pickerSwitch(picker: { readonly id: string; readonly label: string; readonly options: readonly { readonly value: string; readonly label: string }[] }, pressed: string, choose: (value: string) => void): ExperienceSwitch {
  return { label: picker.label, param: picker.id, choose, options: picker.options.map((option) => ({ label: option.label, value: option.value, active: option.value === pressed })) };
}
