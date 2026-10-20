---
id: T-115
title: List every planet's moons in families with their sources
objective: O-033
status: done
depends_on: [{task: T-114, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o033-planning-20261020}
lane: data
planned_writes: []
check_waiver:
    task: T-115
    reason: "Owner waived the optional Task Checks for O-033 ('waive checks for tasks one big check at end'); the Full Objective Check covers it."
    actor:
        role: owner
        session: 827ddc8a-e534-43b0-98b9-9af4e2acda26
    recorded_at: '2026-10-20T13:01:24Z'
---

# List every planet's moons in families with their sources

## Outcome

The core data lists every moon of Mars, Saturn, Uranus, Neptune and Pluto with its name, size, discovery year, family and sources, in the same form as Jupiter's list, so the moons panel can group them.

## User Check

Read the Task evidence: each planet's families with their moon counts and the source each family comes from.

## Done When

1. `data/moons/<planet>.json` for mars, saturn, uranus, neptune and pluto in `data/moons/jupiter.json`'s format, parsed by `src/assets/moonCatalogue.ts` unchanged (or extended generically with tests); moon ids match the fit indexes from the previous Task.
2. Families cited (for example Saturn's Inuit, Gallic and Norse groups and its regular moons; Uranus's and Neptune's regular and irregular moons); where membership comes from a compilation, the compilation and its primary citation are recorded, as O-025 Decision 2026-10-18 did for Jupiter. Moons with a Planetary Explorer map are marked mapped.
3. Sizes marked estimate where brightness-based; tests load each list and check counts against the fit index.

## Context Files

`data/moons/jupiter.json`, `src/assets/moonCatalogue.ts`, `src/assets/bodies/jupiterMoonCatalogue.ts`, `tests/jupiterMoonCatalogue.test.ts`, `data/bodies/catalogue.json`, `.savepoint/objectives/O-025-show-jupiter-with-all-its-known-moons/tasks/T-097-add-jupiter-s-moon-list-and-families-to-the-core-data-with-the-four-mapped-moons.md`.

## Design References

Design: `data/moons` row, moons panel row.

## Guardrails

ARCH-01, PROV-01, TEST-01, STYLE-07, STYLE-09.

## Implementation Plan

1. Read each system's Horizons list (cached by the previous Task).
2. Source families and sizes; write the lists; extend the parser only if needed.
3. Tests.

## Boundaries

Data only; no panel or scene changes.

## Technical Verification

Configured gates; evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Built 2026-10-20 (UTC) by a builder session; stage audit; Task Check waived by the owner (frontmatter `check_waiver`).

Per criterion:
1. `data/moons/{mars,saturn,uranus,neptune,pluto}.json` written in `data/moons/jupiter.json`'s format by `tools/import/planet-moon-catalogues.mjs` (facts in `tools/import/planet-moon-facts.json`); parsed by `src/assets/moonCatalogue.ts` unchanged (no parser change; `tests/planetMoonCatalogues.test.ts` runs `parseMoonCatalogue` on all five). Moon ids equal the T-114 fit-index moon ids (Mars 2, Saturn 292, Uranus 28, Neptune 16, Pluto 5; Pluto itself, the centre series, is not a moon entry); the test checks id set, NAIF id and `ephemeris {set, body}` against each index.
2. Families and counts: Mars: Phobos and Deimos 2. Saturn: seven big moons 7, small regular moons 17, Inuit 39, Gallic 19, Norse 210. Uranus: five big moons 5, inner moons 13, Caliban group 3, other retrograde irregulars 6, loners (Margaret) 1. Neptune: Triton 1, inner moons 7, Sao group 3, Neso group 3, loners (Nereid, Halimede) 2. Pluto: Charon 1, four small moons 4. Sources per family are in each file's `families[].sources`: Saturn Inuit/Gallic/Norse from Gladman et al. 2001 (doi 10.1038/35084032), Grav & Bauer 2007, Ashton et al. 2025 (doi 10.3847/PSJ/ae1d62), tabulated by the Wikipedia "Moons of Saturn" table (compilation, read 2026-10-20; membership not re-derived); Uranus Caliban group and Neptune Sao/Neso groups from Sheppard, Jewitt & Kleyna 2005, Holman et al. 2004, Brozovic & Jacobson 2022 via the Wikipedia tables; regular-moon families from JPL SSD mean elements. Mapped (Planetary Explorer body package) moons carry `bodyPackage`: Saturn mimas, enceladus, tethys, dione, rhea, titan, iapetus; Neptune triton; Pluto charon (nine, tested to have `features.json`).
3. Radius `measured` where JPL SSD physical parameters list a mean radius (46 moons) or a published diameter (Thomas, Karkoschka, Grav et al. via the Wikipedia table); `estimate` for brightness-based sizes (Saturn 265 incl. one stand-in, Uranus 11, Neptune 8). Tests load each list and check counts against the fit index and per-family counts.

Commands: `node tools/import/planet-moon-catalogues.mjs` (writes the five files); `npx vitest run tests/planetMoonCatalogues.test.ts tests/jupiterMoonCatalogue.test.ts` (38 pass); gates `npm run typecheck` (clean), `npm run build` (ok, chunk-size warning only), `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml` (82 files, 1187 passed, 1 skipped).

Files read: Task context files other than `src/assets/bodies/jupiterMoonCatalogue.ts`, `data/bodies/catalogue.json` (read for which moons have maps) and the T-097 Task file (not read). Extra reads (logged): `tools/import/jupiter-moon-catalogue.mjs` (the generator to reuse), `data/ephemerides/<planet>-moons/index.json` (moon ids), `tools/import/planetary-explorer-map-sources.json` (map list), `data/bodies/*/` listing, and network reads on 2026-10-20 of https://ssd.jpl.nasa.gov/sats/phys_par/ and /sats/discovery.html, the Wikipedia raw text of Moons of Mars/Saturn/Uranus/Neptune/Pluto, and Crossref (DOI existence check only).

Files changed: created `data/moons/{mars,saturn,uranus,neptune,pluto}.json`, `tools/import/planet-moon-catalogues.mjs`, `tools/import/planet-moon-facts.json`, `tests/planetMoonCatalogues.test.ts`; this Task file.

Limitations: family membership and brightness sizes come from the Wikipedia compilation, not re-derived from the papers (stated in each source title). Saturn S/2009 S 2 (announced June 2026) has no published size; 0.15 km radius is a marked stand-in equal to half the 0.3 km S/2009 S 1 listed beside it. Uranus and Neptune inner-moon sizes marked measured include Karkoschka values that rest on assumed albedos for the faintest; Cupid, Perdita, Mab and Hippocamp are marked estimate. Saturn's Daphnis fit covers 2010-2018 only (noted in the Saturn file). Janus and Epimetheus discovery year is the first year JPL gives (1966, 1977). No browser runs, no screenshots; no catalogue page (`assets.html`) listing was added (out of scope).

## Drift Notes

Record architecture deltas and reconcile through the planner before Check.

## Owner Completion

Marked done by the coordinator on 2026-10-20T13:02:51Z under the owner's instruction for the O-033 overnight run (owner, 2026-10-20: "waive checks for tasks one big check at end"; chose "Yes, mark them done" once build and tests pass). Gates passed (typecheck, build, 1187 tests). For the owner: S/2009 S 2 has no published size and carries a 0.15 km stand-in marked estimate.
