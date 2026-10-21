---
id: O-033
title: Turn the Jupiter demo into a planets demo with every planet and its moons
status: done
depends_on: [O-018, O-019, O-025]
release: G-009
lanes:
  - {key: data, title: "Moon positions, lists and bodies"}
  - {key: demo, title: "The planet switcher"}
---

# O-033: Turn the Jupiter demo into a planets demo with every planet and its moons

## Outcome

The Jupiter demo becomes a planets demo: a switch in the top bar picks any planet from Mercury to Pluto (Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto). Each planet opens centred on itself with its tagged places from Planetary Explorer, and every known moon sits on its real orbit: the mapped moons (the Moon, Io, Europa, Ganymede, Callisto, Mimas, Enceladus, Tethys, Dione, Rhea, Titan, Iapetus, Triton, Charon) as textured globes with their tagged places, every other moon as a dot in family colours, as Jupiter's 111 small moons are today. Saturn, Uranus and Neptune carry their rings. Jupiter's view keeps today's opening, story panels and moons panel. The home-page shelf becomes one row of the Sun and the planets with "+N moons" links, and the assets catalogue lists every new body, its credits and its tagged places.

## Why

Owner, 2026-10-18: "We will do the same for the other planets, but post launch is ok", and the choice to shrink O-018 and O-019 to their finished groundwork and move the rest here. Owner, 2026-10-20, widened it to every planet in one switcher and folded it into the Jupiter demo (Decisions below).

## Owner Decisions — 2026-10-20

1. **Every planet, one switcher.** Asked about "all the other planets" when shown only Saturn, Neptune and Pluto; chose every planet Mercury to Pluto in one switcher (over adding only Uranus and Mars, or keeping the three). This extends the Goal's original boundary (Uranus, Mars's moons and small moons were out) the way O-025 extended Jupiter.
2. **Every known moon** as a dot in families where no map exists (over mapped moons only).
3. **Jupiter and the switcher share one setup**, then (owner, same session, superseding the first answer): "just extend the Jupiter demo to all planets, Juno will be a seperate project later not a demo". There is no separate Planets demo: the Jupiter demo is the planets demo. The Juno story is not part of this demo; O-032 needs the owner's decision (reported, not edited here). Owner, 2026-10-21: "Bin o32"; O-032 and its empty Goal G-008 were removed.
4. **Home shelf:** one row of the Sun and the planets, each planet with moons showing a "+N moons" link into its catalogue section (over globes grouped by planet).
5. **Apollo is unchanged**; Earth's and the Moon's tagged places show in the planets demo's Earth view.
6. **Dropped from the moved conditions, shown to the owner at confirmation:** side-by-side screenshots against Planetary Explorer (project rule: no screenshots; the owner judges looks on the preview), the USGS Gazetteer comparison report, and place filtering by category or turning a globe to face a place.

## Planning Decisions

- **Positions:** the O-025 Horizons curve-fit pipeline generalised to any planet system (barycentre-relative fits, the planet's own series subtracted), 2010-2030, fetched per system; Saturn, Uranus and Neptune join the planet fits (VSOP87A, as `planets.json`); Pluto's heliocentric position from a Horizons fit. The JPL mean elements in `data/orbits/` stay as the T-078 record, not a shown source.
- **Window:** every planet opens on Jupiter's current window (2016-11-04, two weeks), so the switch keeps one date and the build ships one year of chunks plus orbit history per system; a planet's settings may set its own window later.
- **One settings file per planet** feeds one experience builder (the Showers pattern); a planet is data, not code. The existing `ExperienceDefinition.switcher` and `SwitchControl` carry the switch. The old `?experience=jupiter-io` address keeps opening Jupiter.
- **Facing:** synchronous moons face their planet through the IAU rotation records T-078 saved, behind one generic tidal-lock wrapper (Design's "lift when a third moon arrives").
- **Rings:** Saturn, Uranus and Neptune from the NASA NSSDC ring fact sheets through `RingView`, labelled in provenance.
- **Planet places rule (coordinator, 2026-10-21, for I-048):** a planet shows every package entry that has a surface position. Entries carrying the donor's ring-plane fields (`ringRadius`, `moonRadius`: rings, ring gaps, inner and small moons, held at 0/0) are not surface places and stay out until rings get place markers; counts as measured: Saturn 3 of 20 shown, Uranus 9 of 19, Neptune 9 of 19, Pluto 12 of 16. Jupiter's own places stay out under Success Condition 6 (Jupiter unchanged), reported to the owner.

## Success Conditions

1. Each planet in the switcher opens centred on itself with its tagged places (package features carried bit for bit) and its moons; switching keeps the clock date; no planet, moon or demo names in generic code (ARCH-01); the builder is proven on a made-up planet first (ARCH-03).
2. Every moon Horizons lists for Mars, Saturn, Uranus, Neptune and Pluto is placed from a cited curve fit with its measured error against Horizons (PROV-01); the fit pipeline reruns Jupiter's data unchanged.
3. Mapped moons ship as globes with all their places, each map with a recorded licence (PROV-02) and within the load budget; synchronous moons keep the right face to their planet, proven by test from the rotation records.
4. Saturn, Uranus, Neptune and Pluto are real catalogued bodies (definition, map, orientation, Horizons comparison), defined once (ARCH-05); Io's duplicated constants are resolved to one source.
5. Moons are listed in families per planet in the moons panel, with sources, as Jupiter's are.
6. Jupiter's view is unchanged in opening, story panels, moons panel and tagged places.
7. Only the chosen planet's data downloads; the load budget passes with a stated limit per planet.
8. The home shelf and assets catalogue match Decision 4 and list every shipped body and its tagged places, generated from the packages, with `tests/assetsPageCredits.test.ts` checking each new row.
9. Checks: configured gates; at the Full Objective Check `npm run check:engine` and the planets demo set (`check:demo`) at phone and desktop sizes with zero console errors; the public build with the asset validator; the owner's look on the preview.

## Architectural Considerations

- ARCH-05 follow-up from T-078: Io's constants in `src/core/bodies/io.ts` duplicate `data/orbits/io.json`, and `src/core/satelliteMeanElements.ts` imports `trueAnomalyFromMean` from `io.ts`; the core-bodies Task makes one record the source.
- Feature placement reads each package's `map.json` `coordinates`, never assuming -180..180 or east-positive (T-077 drift note).
- The importer and fit tools need Node 22.18+ (type stripping) while `package.json` engines says `>=22.12` (T-077 drift note); the fit Task records the version it ran.
- Moon and planet data is core data (owner rule); the per-planet settings files and story panels are the demo's.
- Orbits are scientific State; system scale, layout and rings' look are presentation (ARCH-02).

## Boundaries

**In scope:**
- The Jupiter demo turned into the planets demo with the switcher; Mercury to Pluto with their tagged places; every known moon of Mars, Jupiter, Saturn, Uranus, Neptune and Pluto; rings for Saturn, Uranus and Neptune; the shelf, catalogue and checks that go with them.

**Out of scope:**
- A Juno story or year-long window (owner: a separate project later); maps for moons Planetary Explorer has not mapped (Phobos, Deimos, Uranus's moons stay balls at true size); place filtering and face-a-place focus; Gazetteer report; dwarf planets other than Pluto; changes to Apollo or Showers.
