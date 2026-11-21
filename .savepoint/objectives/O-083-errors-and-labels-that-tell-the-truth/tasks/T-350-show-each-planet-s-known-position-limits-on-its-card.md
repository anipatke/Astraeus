---
id: T-350
title: Show each planet's known position limits on its card
objective: O-083
status: done
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

| Done When | Evidence |
|---|---|
| `positionLimitations` optional on `accuracy`, filled for planets, Earth, Moon from their records; Earth's moved | `body.ts`, each planet file, `outerPlanets.ts`, `earth.ts` (orientationLimitations now `[]`), `moon.ts` (record minus the rotation sentence, which orientationLimitations holds); `positionLimitations.test.ts` first two tests |
| `catalogueItem`: position then orientation, no duplicates; host's own still replaces | `catalogueItem.ts` (Set merge); tests "once, position limits before orientation limits" and "a host's own knownLimitations still replace them" |
| New test, fails before, Jupiter worked row | `tests/positionLimitations.test.ts` (23 tests). Before the change: 21 of 23 failed (run against HEAD src with the new test). After: 23 pass. Also reads `scene.bodies` per body. |
| scenePin regenerated, diff only added sentences | `npx vitest run .../scenePin.test.ts -u`; diff is 111 insertions, 0 deletions (planet velocity/barycentre/pre-1972 sentences, Moon velocity sentence). Earth added nothing in the pin (its sentence was already listed). |
| Existing tests unchanged and green | Mostly green; TWO existing assertions encode the old card and now fail (see Limitations): `publicApiPaths.test.ts` "give every added body its catalogue provenance and limits" and `astraeus-demo-showers/tests/rebuildComparison.test.ts` (perseids and geminids "keeps the catalogue's own known limits"). Not edited (builder rule 5). |
| Gates | lint clean; typecheck clean after fixing a possibly-undefined in the new test; build ok; full test run: 3 failed (the two files above), 5017 passed, 2 skipped. |

Sources of wording: none new; sentences are the records' own (`planetRecords.ts` `planetEphemeris`, `earth.ts`, `moon.ts`), whose accuracy figures come from the Horizons comparisons (O-063 T-290).

Extra reads: `packages/astraeus/src/core/bodies/sun.ts`, `io.ts`, `moonSystem.ts` (grep only) to decide which bodies have ephemeris records; `tests/orientationLabels.test.ts` head for style.

Limitations: the Sun and the planets' moons have no EphemerisRecord (own provenance), so `positionLimitations` stays absent there and the test lists them as exempt; a new moon without it will not fail the test. `positionLimitations` is a new optional public type field: the API lock may change (coordinator regenerates; not edited). The two failing assertions need the coordinator or owner: publicApiPaths expects Earth's card to equal `orientationLimitations` (now `[]`; should expect position then orientation), and rebuildComparison compares against a frozen pre-rebuild fixture's list, which lacks the planets' new position sentences. No site browser script asserts any of these sentences (grep found none; driver.mjs not touched).

Coordinator decision 2026-11-21 (items 1-3), applied after the first audit:
- Earth: its record's one sentence is an orientation limit, so it stays in `orientationLimitations` (as before the Task) and `positionLimitations` is `[]`; Earth's card is unchanged. `positionLimitations.test.ts` still passes (23).
- `publicApiPaths.test.ts` "give every added body its catalogue provenance and limits": passes UNCHANGED after item 1 (before: failed, Earth's orientation list was `[]`; after: green). Not edited.
- `astraeus-demo-showers/tests/rebuildComparison.test.ts` "keeps the catalogue's own known limits": only the assertion changed, fixture file untouched. Before: `expect(now.knownLimitations, was.id).toEqual(was.knownLimitations.slice(0, -1));` After: `const position = catalogue.get(was.id).definition.accuracy.positionLimitations ?? [];` then `expect(now.knownLimitations, was.id).toEqual([...new Set([...position, ...was.knownLimitations.slice(0, -1)])]);`.
- Gates rerun under the flock: lint clean, typecheck clean, build ok, tests 5022 passed, 2 skipped, 1 failed: `astraeus-site/tests/migrationTable.test.ts` (`ScalePolicy.id` missing a migration row), which is T-346's change, not this Task.

## Drift Notes

Record for Design reconciliation: body definitions carry position limitations; cards show both lists.

Coordinator (orchestrate-g024-20261121): after the send-back (Earth's polar-motion sentence kept as orientation; `rebuildComparison` "keeps the catalogue's own known limits" assertion extended by coordinator decision, fixture untouched) hand-off gates green for this Task (lint, typecheck, build; `npm test` 5022 passed; the one failure, `migrationTable`, is T-346's in-flight `ScalePolicy.id` change; the API lock test passed, so the optional field did not change the lock). `status: done` set by the coordinator under the standing orchestration rule ("I mark them as they pass", O-038) and G-024 decision 7.
