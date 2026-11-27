---
id: T-468
title: Show Ceres in the local planets picker
objective: O-102
status: planned
check_waiver: {task: T-468, reason: 'Owner said "orchestrate O-102" (G-028, 2026-11-27): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o102-20261127}, recorded_at: '2026-11-27T00:00:58Z'}
depends_on: [{task: T-467, requires: clear}, {task: T-466, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: plan-g028-20261127}
lane: show
---

# Show Ceres in the local planets picker

## Outcome

On `npm run preview:owner` (localhost:5490) the planets demo's local picker has Ceres: the mapped globe with its 8 places from `astraeus-data/data/bodies/ceres/`, card facts from its overview, the Sun-centred orbit line. The public site stays Jupiter only. Provenance docs, the assets page and Design.md say Ceres is in the app; a short note tells the belt app how to switch to it.

## User Check

Owner opens localhost:5490, picks Ceres, flies in: the grey Dawn surface, Occator's bright spots and Ahuna Mons where their places say, compared side by side with Planetary Explorer's Ceres. Owner judges the look.

## Done When

- `packages/astraeus-demo-planets/src/experiences/planets/systems/ceres.ts` and `data/planets/ceres.json` in the pattern of the other systems (no moons; places and categories read from the body package as stored). Registered in the local picker only; the public-site build unchanged (its existing test proves Jupiter only).
- If the planets browser step lists the picker's systems, `driver.mjs` updated in this Task (orchestration lesson O-079).
- `docs/DONOR_PROVENANCE.md` and `docs/DONOR_TEXTURE_INVENTORY.md` Ceres rows: in the app with the USGS map; the donor file still not shipped. `packages/astraeus-site/assets.html` Ceres rows say shown, with the picture credit.
- Design.md reconciled from T-464..T-467 Drift Notes (Planet positions, Core layers and demos, Asset architecture headings), per reconcile-before-Full-Check.
- `docs/belt-ceres-note.md`: how a host swaps an elements Ceres for `addBody(ceres)` with `astraeus-data`, adds its places (`addPlaces` from the body package), and flies in; under 40 lines.
- Owner validation recorded after the owner's look.

## Context Files

`packages/astraeus-demo-planets/src/experiences/planets/systems/pluto.ts`, `packages/astraeus-demo-planets/src/experiences/planets/planetSystems.ts`, `packages/astraeus-demo-planets/data/planets/pluto.json`, `packages/astraeus-demo-planets/src/experiences/planets/planetScene.ts` (`placesOf` and the system type only), `docs/agents/browser-policy.md`; the Ceres rows of the three docs named above; T-464..T-467 Drift Notes.

## Design References

`.savepoint/Design.md` under `The planets demo and the site on the public way`, `Core layers and demos`.

## Guardrails

ARCH-01..06, PROV-02, DATA-01, TEST-01..04.

## Implementation Plan

1. Add the Ceres system and local registration.
2. Update docs, assets page, Design.md.
3. Write the belt note.
4. Owner look.

## Boundaries

No public-site change, no belt repo change, no new engine API.

## Technical Verification

Planets demo tests and site tests; browser steps per `docs/agents/browser-policy.md` at the Full Check.

## Technical Evidence

Pending execution.

## Drift Notes

None expected.
