---
id: G-005
title: Astraeus stories and launch
status: planned
---

## Outcome

The Apollo 11 and Perseids demos tell their stories in short panels, and the public site carries only shippable, exactly credited assets, including real catalogue stars.

## Why

Owner, 2026-10-16: "feel like we are missing the story telling part of this! ... or whats the point!" and "lets ensure we get a credited moon source before we go live". G-004 lists narration and publishing as out of scope, so this work needs its own Goal (owner decision, 2026-10-16: new Goal, build tonight).

## Launch Definition of Done (owner, 2026-10-18)

Owner: "Ok, definition of done for launch. Apollo tick, showers, we combine the Perseids and Geminis into a single demo and the user can switch between them. This will be the showers demo, we expand Jupiter to ALL its moons, objects for the ones we have skinned, either simple labels or small grey balls (or what we think they look like) for the rest. Drop earth and moon, it's covered by Apollo."

The public site launches with three demos:

1. **Apollo 11** — as it is (done).
2. **Showers** — one demo with a switch between the Perseids and the Geminids (O-024).
3. **Jupiter and its moons** — every known moon: Io, Europa, Ganymede and Callisto with their pictures and tagged places from Planetary Explorer; the rest as small grey dots (a grey ball up close) whose names show on hover, tap or zoom (owner chose); every position exact from NASA JPL Horizons tables, not approximate published orbits (owner chose) (O-025).

Also in the launch (owner chose all three): the interface work finished (O-020), tap a planet, moon or the Sun to focus (O-022). The Sun at true scale in the distance (O-023) was dropped by the owner on 2026-10-23 ("lets can this one O-023"); git history keeps it. The story panels work (O-015) and the public-site work (O-016) close as well.

Earth–Moon is dropped (covered by Apollo); its three new stories are dropped with it (owner chose; the text stays in history). The old addresses `?experience=shower-perseids`, `shower-geminids` and `earth-moon` are not redirected: they stop working and the owner updates the portfolio links at launch (owner chose "Let them break, update the portfolio").

**Last action of the launch** (owner, 2026-10-18: "Can we add updating the portfolio pages as the last action of our definition of done"): update the owner's portfolio site (`/home/user/code/main-portfolio`, Next.js; the demo list in `components/astraeus/AstraeusBridge.tsx`, plus the Astraeus page and hero tiles) to the three demos and their new addresses, build and look at it locally, and ask the owner before pushing (a push puts it live).

Not in the launch: the zodiac demo (G-006), and moons and orbits for other planets (O-018 and O-019 beyond what Jupiter needs).

## Success Conditions

Every member Objective is done: story panels in both demos driven by story settings files, and a public build whose every asset has a recorded source and licence and whose pictures match what visitors see.

## Boundaries

No chapters, narration audio or ground-observer view. No story wording in engine or generic shell code. Publishing and deployment are the owner's actions, not this Goal's.
