---
id: T-350
title: Show each planet's known position limits on its card
objective: O-083
status: planned
depends_on: [{task: T-349, requires: clear}]
check_waiver: {task: T-350, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T11:22:41Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: provenance
planned_reads: [packages/astraeus/src/api/planBodies.ts, packages/astraeus/src/api/sceneReads.ts, packages/astraeus/src/shell/infoModel.ts, packages/astraeus/src/core/bodies/sun.ts, packages/astraeus/tests/scenePin.test.ts]
planned_writes: [packages/astraeus/src/core/body.ts, packages/astraeus/src/core/bodies/planetRecords.ts, packages/astraeus/src/core/bodies/mercury.ts, packages/astraeus/src/core/bodies/venus.ts, packages/astraeus/src/core/bodies/mars.ts, packages/astraeus/src/core/bodies/jupiter.ts, packages/astraeus/src/core/bodies/outerPlanets.ts, packages/astraeus/src/core/bodies/earth.ts, packages/astraeus/src/core/bodies/moon.ts, packages/astraeus/src/app/catalogueItem.ts, packages/astraeus/tests/fixtures/scenePin.json, packages/astraeus/tests/positionLimitations.test.ts]
---

# Show each planet's known position limits on its card

## Outcome

The known limits of each built-in body's position (for planets: no modelled velocity, the barycentre offset without the moon package, the pre-1972 time-label offset) reach its info card and `scene.bodies[].knownLimitations`, beside its orientation limits, instead of being dropped (AH-05 part 2; Gemini SCI-02; PROV-01).

## User Check

None visual. `scene.bodies` for Jupiter lists "No velocity is modelled for planets…", its without-package offset sentence and the pre-1972 sentence, followed by its orientation limit.

## Done When

- `CelestialBodyDefinition.accuracy` gains `positionLimitations` (optional, so existing test fakes keep their setup), filled for every built-in body from its `EphemerisRecord.knownLimitations` (planets via `planetEphemeris`; Earth and the Moon from their records). Earth stops passing its ephemeris limits as `orientationLimitations`; each sentence lives in one list only.
- `app/catalogueItem.ts` gives `knownLimitations` = position limits then orientation limits, no duplicates; a host's own `knownLimitations` from `addBody` still replaces them (documented behaviour).
- New `tests/positionLimitations.test.ts`: for every built-in catalogue body, every sentence of its ephemeris record's limitations appears in its card's `knownLimitations` (through `scene.bodies`), and `positionLimitations` is present (mechanised: a new built-in body without it fails); Jupiter's exact list as a worked row. It fails against today's code (show it).
- Regenerate `tests/fixtures/scenePin.json` (`npx vitest run packages/astraeus/tests/scenePin.test.ts -u`); the diff holds only the added limitation sentences and Earth's moved ones.
- Existing tests unchanged and green, including `planets`, `stateResolver`, `assets`, `compositionsContract`, `sunLook`, `publicApiPaths` and the planets demo's tests.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/core/body.ts` (`EphemerisRecord`, `CelestialBodyDefinition.accuracy`, lines ~10–48)
- `packages/astraeus/src/core/bodies/planetRecords.ts` (`planetEphemeris`)
- The `accuracy` block of each of: `packages/astraeus/src/core/bodies/mercury.ts`, `packages/astraeus/src/core/bodies/venus.ts`, `packages/astraeus/src/core/bodies/mars.ts`, `packages/astraeus/src/core/bodies/jupiter.ts`, `packages/astraeus/src/core/bodies/outerPlanets.ts`, `packages/astraeus/src/core/bodies/earth.ts`, `packages/astraeus/src/core/bodies/moon.ts` (the Moon's record repeats its rotation sentence in both lists today: show it once)
- `packages/astraeus/src/app/catalogueItem.ts`
- `packages/astraeus/src/api/planBodies.ts` (line ~271, where cards read `catalogueItem`)

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`: `Planet positions from Horizons` and `Core layers and demos`.

## Guardrails

PROV-01, ARCH-05, STYLE-07, TEST-01..04.

## Implementation Plan

1. Write `positionLimitations.test.ts`; show it failing.
2. Add the field; fill it from each body's ephemeris record; move Earth's.
3. Merge in `catalogueItem`; regenerate the scene pin and review its diff.
4. Focused tests, then gates.

## Boundaries

No new limitation wording (use the records' sentences as they are), no change to positions, to `provenanceOf`'s return shape, or to the card layout. Elements bodies and paths unchanged (they already carry their limits).

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/positionLimitations.test.ts packages/astraeus/tests/scenePin.test.ts packages/astraeus/tests/planets.test.ts packages/astraeus-demo-planets/tests`. Handoff: `quality_gates`. No browser run (longer card text only; owner look not needed).

## Technical Evidence

Pending execution.

## Drift Notes

Record for Design reconciliation: body definitions carry position limitations; cards show both lists.
