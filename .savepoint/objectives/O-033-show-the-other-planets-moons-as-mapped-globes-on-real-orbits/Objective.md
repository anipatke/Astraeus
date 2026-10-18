---
id: O-033
title: Show the other planets' moons as mapped globes on real orbits
status: planned
depends_on: [O-018, O-019, O-025]
release: G-009
---

# O-033: Show the other planets' moons as mapped globes on real orbits

## Outcome

The work moved out of O-018 and O-019 on 2026-10-18: Planetary Explorer's mapped moons beyond Jupiter (Mimas, Enceladus, Tethys, Dione, Rhea, Titan, Iapetus, Triton, Charon) shown as globes with their tagged places, on real orbits around Saturn, Neptune and Pluto as real bodies, following the Jupiter pattern O-025 builds; the home-page shelf and assets catalogue grow to match.

## Why

Owner, 2026-10-18: "We will do the same for the other planets, but post launch is ok", and the choice to shrink O-018 and O-019 to their finished groundwork and move the rest here.

## Success Conditions

Carried from the original O-018 and O-019 (see their `## Moved Out` sections for the full text), to be re-planned against O-025's outcome before any Task is written:

1. Surface features on a globe as a generic capability (O-018 original SC 4), unless O-025 or T-103 has already delivered it; the bodies Astraeus already draws gain their tagged places.
2. The remaining mapped moons ship as globes with all their features, each map within the load budget (O-018 original SC 5, 7(b) map registration, 7(c) visual parity, 7(d) Gazetteer report, 8).
3. The home-page shelf and the assets catalogue list every shipped body and its tagged locations (O-018 original SC 9, 10).
4. Each moon's state from a cited source good enough for its class; the seven Saturn moons need a source other than the JPL mean elements, which T-078 found "not usable as published" (O-019 original SC 1, 2), with O-025's Horizons-table approach the first candidate.
5. Correct facing from the IAU rotation records T-078 saved (O-019 original SC 3); Saturn, Neptune and Pluto as real parent bodies with maps and Horizons comparisons (O-019 original SC 4); system views (O-019 original SC 5).
6. Checks as O-018 SC 11 and O-019 SC 6.

## Architectural Considerations

- ARCH-05 follow-up from T-078: Io's constants in `src/core/bodies/io.ts` duplicate `data/orbits/io.json`, and `src/core/satelliteMeanElements.ts` imports `trueAnomalyFromMean` from `io.ts`; the first Task that places a moon from `data/orbits/` makes one record the source.
- Feature placement reads each package's `map.json` `coordinates`, never assuming -180..180 or east-positive (T-077 drift note).
- The importer needs Node 22.18+ (type stripping) while `package.json` engines says `>=22.12` (T-077 drift note).

## Boundaries

**In scope:**
- The moved O-018 and O-019 work for Saturn, Neptune and Pluto's systems and the shelf and catalogue rows that go with them.

**Out of scope:**
- Jupiter's moons (O-025, G-008); Uranus and its moons; Phobos, Deimos and small moons unless the owner extends this Goal the way O-025 did for Jupiter.
