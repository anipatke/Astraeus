// Every address form the page entry reads (O-059 T-272): which experience each opens, as one table. The planets and showers are the lists the settings files make; the made-up names are the ones the dev server mounts.
import { describe, expect, it } from "vitest";
import { chooseEntry, type EntryLists } from "../src/entryChoice";

const LISTS: EntryLists = {
  planets: [
    { name: "mars", label: "Mars", order: 4, isDefault: false },
    { name: "jupiter", label: "Jupiter", order: 5, isDefault: true },
  ],
  showers: [
    { name: "perseids", label: "Perseids", order: 1 },
    { name: "geminids", label: "Geminids", order: 2 },
  ],
  synthetic: ["synthetic", "synthetic-views"],
};

const summary = (search: string, lists: EntryLists = LISTS): string => {
  const entry = chooseEntry(search, lists);
  return entry.kind === "planets" || entry.kind === "showers" ? `${entry.kind}:${entry.choice.name}` : entry.kind === "synthetic" ? `synthetic:${entry.name}` : entry.kind;
};

describe("the page entry's address forms", () => {
  it.each([
    ["no address", "", "apollo"],
    ["an unknown experience", "?experience=nothing", "apollo"],
    ["the old Jupiter address", "?experience=jupiter-io", "planets:jupiter"],
    ["planets with no planet named", "?experience=planets", "planets:jupiter"],
    ["planets naming one", "?experience=planets&planet=mars", "planets:mars"],
    ["planets naming an unknown planet", "?experience=planets&planet=pluto", "planets:jupiter"],
    ["the old Jupiter address ignores a shower", "?experience=jupiter-io&shower=geminids", "planets:jupiter"],
    ["showers with no shower named", "?experience=showers", "showers:perseids"],
    ["showers naming one", "?experience=showers&shower=geminids", "showers:geminids"],
    ["showers naming an unknown shower", "?experience=showers&shower=nothing", "showers:perseids"],
    ["a made-up scene", "?experience=synthetic", "synthetic:synthetic"],
    ["the made-up views scene", "?experience=synthetic-views&view=b", "synthetic:synthetic-views"],
    ["a made-up name this build does not mount", "?experience=synthetic-ring", "apollo"],
    ["the view and time the viewer reads are not the entry's", "?t=2026-08-12T00:00:00Z&view=sun,1,2,3", "apollo"],
  ])("%s", (_name, search, expected) => {
    expect(summary(search)).toBe(expected);
  });

  it("a public build mounts no made-up scene: they open the default", () => {
    expect(summary("?experience=synthetic", { ...LISTS, synthetic: [] })).toBe("apollo");
  });

  it("an empty list falls through to the default", () => {
    expect(summary("?experience=planets", { ...LISTS, planets: [] })).toBe("apollo");
    expect(summary("?experience=showers", { ...LISTS, showers: [] })).toBe("apollo");
  });

  it("the planet switch keeps the clock time, the shower switch drops the view and the time", () => {
    const planet = chooseEntry("?experience=planets&planet=mars", LISTS);
    const shower = chooseEntry("?experience=showers", LISTS);
    expect(planet.kind === "planets" && planet.choice.switcher.keep).toEqual(["t"]);
    expect(shower.kind === "showers" && shower.choice.switcher.keep).toBeUndefined();
  });
});
