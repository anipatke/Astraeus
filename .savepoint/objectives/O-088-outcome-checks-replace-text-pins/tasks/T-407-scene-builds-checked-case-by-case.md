---
id: T-407
title: Scene builds checked case by case
objective: O-088
status: planned
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-407, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "I am remote now, add park the check and move on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-21T22:56:58Z'}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: scene-output
planned_reads: [packages/astraeus/tests/scenePin.test.ts, packages/astraeus/tests/fixtures/scenePin.json, packages/astraeus/tests/publicApi.test.ts, packages/astraeus/tests/publicApiPaths.test.ts, packages/astraeus/tests/publicApiGroup.test.ts, packages/astraeus/tests/publicApiStory.test.ts, packages/astraeus/tests/publicApiActivity.test.ts, packages/astraeus/tests/publicApiAutoStretches.test.ts, packages/astraeus/tests/publicApiSunOrbits.test.ts, packages/astraeus/tests/pacing.test.ts, packages/astraeus/tests/cameraChoices.test.ts, packages/astraeus/tests/fitOrbit.test.ts, packages/astraeus/tests/displaySwitches.test.ts]
planned_writes: [packages/astraeus/tests/sceneBuildContract.test.ts]
---

# Scene builds checked case by case

## Outcome

Each of the scene pin's good-scene cases (its `sceneCases` table, about 32 scenes: bodies and options, scales, paths, groups, activities, events, panels, timelines, switches, views, camera rules, the synthetic definitions) has named, focused outcome checks of what a host can observe, so nothing the pin catches is lost when it is retired (AH-33; Claude: "one 837 KB self-generated snapshot").

## User Check

None visual. `npx vitest run packages/astraeus/tests/sceneBuildContract.test.ts` passes.

## Done When

- A case-by-case map of `scenePin.test.ts` `sceneCases()` (~379 onward) is recorded in Technical Evidence: for each case, the observable facts it pins (from `fixtures/scenePin.json` `seriesLoaded.<case>`: the definition's objects and layers, metrics at the two times, `stateOf`, `provenanceOf`, `missingData`, the timeline, views, switches, camera) and, per fact group, either an exact existing case that asserts it (file and case name, TEST-03) or a new case in `sceneBuildContract.test.ts`.
- New `packages/astraeus/tests/sceneBuildContract.test.ts` covers the gaps with focused assertions on behaviour a host relies on (for example: a failed add leaves the scene as it was; a path added before any body follows the first body; activities set the window and a timeline span overrides it; panel times by event, UTC and anchor; pacing base rate with no rate set; path cover samples when the far point lies between samples). Numbers use stated tolerances or exact ids and counts, never a dumped object or `toMatchSnapshot`/`toMatchFileSnapshot`. No message text.
- Each new case uses the pin's made-up inputs (ARCH-03) through the public API, or the engine-only `definitionOf` route only where the fact is not public, named in a comment.
- Planted break, recorded then reverted: one deliberate behaviour change per two or three fact groups the new file covers (at least three in total, for example: drop the timeline span override, make `addBody` keep a half-added body on failure, shift a pacing default) each fails a named new case.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/tests/scenePin.test.ts` (`sceneCases`, `observe`, the constants at the top)
- `packages/astraeus/tests/fixtures/scenePin.json` (the `seriesLoaded` key, one case at a time with a JSON query; never whole)
- The `publicApi*.test.ts`, `pacing.test.ts`, `cameraChoices.test.ts`, `fitOrbit.test.ts`, `displaySwitches.test.ts` files in `planned_reads`: case names only (`grep -n "it(\|it.each\|describe("`), opening a case only to confirm what it asserts.

## Design References

`.savepoint/Design.md` under `Scene and host-link split`.

## Guardrails

ARCH-03, API-05, TEST-01, TEST-03, STYLE-07, STYLE-10.

## Implementation Plan

1. Walk the cases; build the map with existing coverage first (most fact groups are expected to be covered by the `publicApi*` files).
2. Write focused cases for the gaps only.
3. Planted breaks; record; revert.
4. Focused run, gates.

## Boundaries

New test file only; no production change; no edit to the pin, its fixture or other test files. Error rows are draft 05's; equality across load orders is draft 07's. If the map shows more than about 25 gap cases, stop and report the count to the coordinator before writing them (scope check).

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/sceneBuildContract.test.ts`. Handoff: `quality_gates`. No browser run.

## Technical Evidence

Pending execution.

## Drift Notes

A pinned fact that looks like a defect is recorded as an Issue candidate, not changed.
