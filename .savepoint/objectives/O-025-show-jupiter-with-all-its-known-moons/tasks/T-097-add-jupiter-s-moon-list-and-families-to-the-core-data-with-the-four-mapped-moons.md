---
id: T-097
title: Add Jupiter's moon list and families to the core data, with the four mapped moons
objective: O-025
status: in_progress
stage: audit
depends_on: [{task: T-096, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o020-orchestrator-20261018}
---

# Add Jupiter's moon list and families to the core data, with the four mapped moons

## Outcome

The core catalogue knows every Jupiter moon by id and name, its family (the big four, inner moons, Himalia, Ananke, Carme, Pasiphae, loners), its size and discovery, and links the four mapped moons (Io, Europa, Ganymede, Callisto) to their Planetary Explorer packages and tagged places.

## User Check

Read the catalogue entry list in the Task evidence: every moon with its family and source; Io, Europa, Ganymede and Callisto show their textures and tagged places when focused.

## Done When

1. O-025 Decisions 1, 6 and 8 (owner, 2026-10-18).
2. One core data file lists each moon: id, name or provisional designation, family, mean radius (or estimate, marked), discovery year, the curve-fit chunk index from T-096, and sources; family membership from a published source (JPL satellite pages, Sheppard's moons pages or a paper), recorded per moon; a moon in no published family is a loner.
3. The four mapped moons use the O-018 body packages (`data/bodies/<moon>/`) unchanged: verified coordinates and tagged places bit for bit (owner rule; `tests/bodyPackages.test.ts` stays green).
4. The catalogue page (`assets.html`) lists Jupiter's moons by family with their sources.
5. No story or demo wording in core data (ARCH-01). Tests: every moon in the fits has a catalogue entry and the other way round; families cover every moon. Configured gates pass.

## Context Files

`data/bodies/README.md`, `data/bodies/catalogue.json`, `data/bodies/io/overview.json`, `src/assets/catalogue.ts`, `tests/bodyPackages.test.ts`, `assets.html`, `.savepoint/objectives/O-025-show-jupiter-with-all-its-known-moons/Objective.md`.

## Design References

O-025 Decisions; Design.md catalogue and body packages.

## Guardrails

ARCH-01, PROV-01, PROV-02, TEST-01, STYLE-09.

## Implementation Plan

1. Moon list with families and sources.
2. Link the four packages; catalogue page; tests.

## Boundaries

Catalogue data and page; drawing is the next Task.

## Technical Verification

Configured gates; catalogue page through the shared driver. Evaluated under `agent-skills/references/check-method.md`.

## Evidence (executor, 2026-10-18, lane o025-t097)

- Data: `data/moons/jupiter.json` (format `astraeus.moon-catalogue/1`), built by `tools/import/jupiter-moon-catalogue.mjs` from the T-096 index. 115 moons: galilean 4, inner 4, himalia 11, ananke 29, carme 41, pasiphae 22, carpo 2, loner 2 (Themisto, Valetudo). Per moon: name, designation, NAIF id, family, mean radius with basis (measured 20, estimate 95), discovery year, ephemeris set/body (chunk index = the T-096 index entry), per-moon source ids (list, family, familyBasis, radius, discovery); source table with URLs.
- Four mapped moons: `bodyPackage: data/bodies/<moon>` links only; no package file touched (`tests/bodyPackages.test.ts` green).
- Catalogue page: generated "Jupiter's moons" section in `assets.html` (collapsible per family, count, source line, every moon with `data-moon`); driver function `catalogueMoonFamilies`; lite check "catalogue page lists Jupiter's moons by family".
- Tests: `tests/jupiterMoonCatalogue.test.ts` (entry for every fit and back, families cover all, sources resolve, four links, no story wording, page lists every moon once).
- Gates: tsc clean; vitest 70 files pass (1066 passed, 1 skipped); npm run build ok; driver guard ok; browser-lite 28/28 (evidence `docs/evidence/t097-lite-20261018`). Full run deferred to the orchestrator's batch run.
- Drift Notes: (1) family membership read from Wikipedia's "Moons of Jupiter" table (which cites Sheppard); Sheppard's own page has the table as an image, so it was not re-derived. (2) Carpo group (2 moons) kept as its own family, so loners are only Themisto and Valetudo; owner brief listed Carpo as a loner. (3) Lite browser run started while other lanes' headless chrome was running (load 5.2).
