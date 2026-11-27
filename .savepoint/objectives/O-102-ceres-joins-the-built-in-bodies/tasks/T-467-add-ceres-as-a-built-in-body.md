---
id: T-467
title: Add Ceres as a built-in body
objective: O-102
status: planned
check_waiver: {task: T-467, reason: 'Owner said "orchestrate O-102" (G-028, 2026-11-27): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o102-20261127}, recorded_at: '2026-11-27T00:00:58Z'}
depends_on: [{task: T-464, requires: clear}, {task: T-465, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: plan-g028-20261127}
lane: engine
planned_reads: [packages/astraeus/src/core/bodies/outerPlanets.ts, packages/astraeus/src/core/bodies/index.ts, packages/astraeus/src/api/bodies.ts, packages/astraeus/src/assets/catalogue.ts, packages/astraeus-data/src/index.ts, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md]
planned_writes: [packages/astraeus/src/core/bodies/ceres.ts, packages/astraeus/src/core/bodies/index.ts, packages/astraeus/src/api/bodies.ts, packages/astraeus-data/src/index.ts, packages/astraeus/tests/ceresBody.test.ts, packages/astraeus/api-surface.lock.json, packages/astraeus/CHANGELOG.md, packages/astraeus/README.md]
---

# Add Ceres as a built-in body

## Outcome

`import { ceres } from "astraeus"` (`ref("ceres", "Ceres", "astraeus-data")`) adds Ceres: a sphere of IAU mean radius 469.7 km with GM from the Horizons header, oriented by pck00011 (pole RA 291.418°, Dec 66.764°, W 170.650° + 952.1532°/day), placed Sun-centred from T-464's fit delivered by `astraeus-data`'s `dataSource` through T-465's member. `orbit: true` draws its line round the Sun. Without `astraeus-data`, `mount` throws `missing-data` naming it.

## User Check

None beyond the Objective's.

## Done When

- `core/bodies/ceres.ts` defines `CERES` and `CERES_ROTATION` in Pluto's pattern (`outerPlanets.ts`), with provenance for position (T-464's command, solution, measured error), radius, GM and rotation (PROV-02), and stated limits (e.g. outside 1950 to 2045 no position).
- `astraeus-data`'s `dataSource` provides `["ceres"]` and carries the series loader (lazy import of `data/positions/ceres.json`, so it is its own chunk); its doc comment updated (it now provides a body).
- Ceres is in the public body list, `catalogue`, and `orbitPeriod` if planets are listed there.
- New `packages/astraeus/tests/ceresBody.test.ts`: position at two archived Horizons dates within 1 km; orientation of the prime meridian at J2000 per pck00011; `missing-data` without the package; `orbit: true` accepted; the engine's first download unchanged (`measure:example`).
- README: Ceres added where ready-made bodies are listed (the heading that lists them only). API lock regenerated last; one CHANGELOG bullet.
- Existing tests unchanged and passing, plus `apiImports`/`packageBoundaries`.

## Context Files

`packages/astraeus/src/core/bodies/outerPlanets.ts`, `packages/astraeus/src/core/bodies/index.ts`, `packages/astraeus/src/api/bodies.ts`, `packages/astraeus/src/assets/catalogue.ts`, `packages/astraeus-data/src/index.ts`; T-464 and T-465 Drift Notes.

## Design References

`.savepoint/Design.md` under `Planet positions from Horizons`, `Every listed moon addable`.

## Guardrails

API-01..07, ARCH-01..06, PROV-01, PROV-02, DATA-01, TEST-01..04, STYLE-07.

## Implementation Plan

1. Mirror Pluto's definition for Ceres with T-465's package-positions hook.
2. Wire `astraeus-data` to provide Ceres.
3. Test, measure, docs, lock, changelog.

## Boundaries

No picture (T-466), no places wiring or demo (the showing step).

## Technical Verification

Focused tests plus boundary tests; handoff gates per `docs/agents/verification.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record any change to how catalogue bodies take package positions for T-468's Design reconciliation.
