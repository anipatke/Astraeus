import { chooseSwitch, type SwitchEntry } from "astraeus/app/listSwitch";

/** The address parameter that names the shower (`?experience=showers&shower=<name>`). */
export const SHOWER_PARAM = "shower";
/** The label the switch carries as its accessible name. */
export const SHOWER_SWITCH_LABEL = "Shower";

/** One shower the experience can open: its settings file's name, its label, and its place in the switch (the lowest `order` is the default). */
export type ShowerEntry = SwitchEntry;

/** The shower to open (the requested one when it exists, else the first by `order`, then name) and the switch listing every shower. Undefined when there are no showers. */
export function chooseShower(entries: readonly ShowerEntry[], requested: string | null) {
  return chooseSwitch(entries, requested, { label: SHOWER_SWITCH_LABEL, param: SHOWER_PARAM });
}

/** The key an entry finds a settings file under: its file name without folder or extension. */
export function showerEntryName(path: string): string {
  const file = path.slice(path.lastIndexOf("/") + 1);
  return file.endsWith(".json") ? file.slice(0, -".json".length) : file;
}
