---
id: T-406
title: Which build fault wins, checked by code
objective: O-088
status: planned
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-406, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "I am remote now, add park the check and move on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-21T22:56:58Z'}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: scene-errors
planned_reads: [packages/astraeus/tests/scenePin.test.ts, packages/astraeus/tests/fixtures/scenePin.json, packages/astraeus/tests/publicErrorContract.test.ts, packages/astraeus/tests/errorRule.test.ts, packages/astraeus/src/api/definitionOf.ts]
planned_writes: [packages/astraeus/tests/sceneFaultOrder.test.ts]
---

# Which build fault wins, checked by code

## Outcome

Every bad build the scene pin records (its `badBuilds` table, about 80 rows, and the "two faults" rows that fix which error wins) is covered by a focused case that asserts the error `code` and the stage that throws (the call, the check, or the load), in both planet-series orders where the pin checks both, with no message text (API-05: the code, never the message). This replaces the error half of the scene pin (AH-33; Claude: "202 error messages pinned verbatim").

## User Check

None visual. `npx vitest run packages/astraeus/tests/sceneFaultOrder.test.ts` passes.

## Done When

- A row-by-row map of `scenePin.test.ts` `badBuilds()` (~772 onward) is recorded in Technical Evidence: each row is either "covered by" an exact existing case (`publicErrorContract.test.ts` row name, or another file and case name, TEST-03) or "new row in sceneFaultOrder.test.ts". Today's expected stage and code for each row are read from `fixtures/scenePin.json` (`errorsSeriesLoaded`, `errorsSeriesNotLoaded`).
- New `packages/astraeus/tests/sceneFaultOrder.test.ts`: one table (`it.each`) over the uncovered rows, each asserting `{ stage, code }` through the public API (`Scene` builders, `scene.check({ data })`, `scene.load({ data })`), using the pin's made-up inputs (ARCH-03). No `message` assertion and no message regex.
- The "two faults" rows (the order in which a build's checks run) are all in the table, each asserting the code of the fault that wins.
- The rows the pin also runs on a fresh module graph (its `DEFERRED` set, ~1326: out-of-span, Sun orbit, fitOrbit, clump, planet series) are asserted in both orders: series loaded, and a fresh graph (`vi.resetModules()` then dynamic `import("astraeus")`, asserting the series are not loaded, as the pin's `freshGraph` does).
- Planted break, recorded then reverted: swap the order of two of the checks the "two faults" rows cover (in the scene's build check) and show at least one row fails naming the wrong code.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/tests/scenePin.test.ts` (`outcome`, `badBuilds`, `freshGraph`, `DEFERRED` only)
- `packages/astraeus/tests/fixtures/scenePin.json` (the `errorsSeriesLoaded` and `errorsSeriesNotLoaded` keys only; read with a JSON query, not whole)
- `packages/astraeus/tests/publicErrorContract.test.ts` (row names and the table pattern)
- `packages/astraeus/src/api/definitionOf.ts` (read only, to locate the check order for the planted break)

## Design References

`.savepoint/Design.md` under `Errors and labels that tell the truth (O-083)`.

## Guardrails

API-05, ARCH-03, TEST-01, TEST-03, STYLE-07, STYLE-10.

## Implementation Plan

1. Extract the pin's expected `{stage, code}` per row with a scratch `node -e` over the JSON.
2. Map rows to existing cases; record.
3. Write the table for the uncovered rows and the two-order rows.
4. Planted break; record; revert.
5. Focused run, gates.

## Boundaries

New test file only. Do not edit `scenePin.test.ts`, its fixture or `publicErrorContract.test.ts` (no duplicated rows: a covered row stays where it is). No production change. Scene outputs are draft 06's; load-order equality is draft 07's.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/sceneFaultOrder.test.ts packages/astraeus/tests/publicErrorContract.test.ts`. Handoff: `quality_gates`. No browser run.

## Technical Evidence

Pending execution.

## Drift Notes

If a row's code in the pin looks wrong (a defect the pin froze), do not change it here: record it and raise an Issue candidate for the coordinator.
