// Which experience the page address asks for: the entry's one decision, kept pure so every address form can be held with a table.
import { choosePlanet, type PlanetEntry } from "./planetChoice";
import { chooseShower, type ShowerEntry } from "./showerSwitch";

/** What the address opens. `planets` and `showers` carry the entry chosen and the switch listing the others; `synthetic` names a made-up scene; `apollo` is the default. */
export type EntryChoice =
  | { readonly kind: "planets"; readonly choice: NonNullable<ReturnType<typeof choosePlanet>> }
  | { readonly kind: "showers"; readonly choice: NonNullable<ReturnType<typeof chooseShower>> }
  | { readonly kind: "synthetic"; readonly name: string }
  | { readonly kind: "apollo" };

/** The lists an address chooses from: the planets and showers the build offers, and the made-up scenes it mounts (none in a public build). */
export interface EntryLists {
  readonly planets: readonly PlanetEntry[];
  readonly showers: readonly ShowerEntry[];
  readonly synthetic: readonly string[];
}

/**
 * `?experience=planets` (and the old `?experience=jupiter-io`, with `&planet=<name>`) opens a planet, `?experience=showers` a shower (`&shower=<name>`), a made-up name its made-up scene
 * where the build mounts it, and anything else, or an empty list, Apollo 11. Read from the address each time, so a switch inside the page builds the new one.
 */
export function chooseEntry(search: string, lists: EntryLists): EntryChoice {
  const query = new URLSearchParams(search);
  const requested = query.get("experience") ?? "";
  const planet = requested === "planets" || requested === "jupiter-io" ? choosePlanet(lists.planets, query.get("planet")) : undefined;
  if (planet !== undefined) return { kind: "planets", choice: planet };
  const shower = requested === "showers" ? chooseShower(lists.showers, query.get("shower")) : undefined;
  if (shower !== undefined) return { kind: "showers", choice: shower };
  if (lists.synthetic.includes(requested)) return { kind: "synthetic", name: requested };
  return { kind: "apollo" };
}
