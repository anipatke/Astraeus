// Planet choice: which planet the planets experience opens, and the switch that offers the others. Pure; the names come from the settings files.
import { chooseSwitch, type ShowerEntry } from "../../../../astraeus/src/experiences/showers/showerChoice";

/** The address parameter that names the planet (`?experience=planets&planet=<id>`). */
export const PLANET_PARAM = "planet";
/** The label the switch carries as its accessible name. */
export const PLANET_SWITCH_LABEL = "Planet";

/** Every planet shares one window, so the switch keeps the clock time (`t`); the camera view is the new planet's own. */
export const PLANET_SWITCH_KEEPS: readonly string[] = ["t"];

/** One planet the experience can open: its settings file's name, its label, its place in the switch, and whether it opens when the address names none. */
export interface PlanetEntry extends ShowerEntry {
  readonly isDefault: boolean;
}

/** The planet to open (the requested one when it exists, else the one that is the default, else the first) and the switch listing every planet. Undefined when there are none. */
export function choosePlanet(entries: readonly PlanetEntry[], requested: string | null) {
  return chooseSwitch(entries, requested, { label: PLANET_SWITCH_LABEL, param: PLANET_PARAM, keep: PLANET_SWITCH_KEEPS }, entries.find((entry) => entry.isDefault)?.name);
}
