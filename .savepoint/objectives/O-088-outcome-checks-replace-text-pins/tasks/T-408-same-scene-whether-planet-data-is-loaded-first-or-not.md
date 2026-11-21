---
id: T-408
title: Same scene whether planet data is loaded first or not
objective: O-088
status: planned
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-408, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "I am remote now, add park the check and move on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-21T22:56:58Z'}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: load-order
planned_reads: [packages/astraeus/tests/scenePin.test.ts, packages/astraeus/tests/fixtures/scenePin.json, packages/astraeus/tests/cold/sceneLoad.test.ts, vitest.config.ts]
planned_writes: [packages/astraeus/tests/sceneLoadOrder.test.ts]
---

# Same scene whether planet data is loaded first or not

## Outcome

The scene pin's second job, that a scene builds the same whether the planet series are already loaded (the test graph) or not (a consumer's first mount), is checked by comparing the two orders with each other on every good-scene case, instead of comparing each with a frozen file (AH-33).

## User Check

None visual. `npx vitest run packages/astraeus/tests/sceneLoadOrder.test.ts` passes.

## Done When

- New `packages/astraeus/tests/sceneLoadOrder.test.ts` builds each of the pin's good-scene cases (the same made-up inputs, ARCH-03; the synthetic journey excluded as the pin excludes it from the fresh order) twice: in the loaded graph and in a fresh module graph (`vi.resetModules()`, asserting the series are not loaded). After `load`, it asserts the two agree on: the definition after `prepare`, metrics at the two pin times, `stateOf` and `provenanceOf` of every object, and missing data. Comparison is of plain data (the pin's `plain`/`observe` turn a definition into plain data; copy only what is needed into this file, rounded as the pin rounds), with `toEqual` between the two orders, never against a file.
- Any field that legitimately differs between the orders (for example the pin's own `seriesLoadedAtBuild`, or the definition before `prepare`) is excluded by name with a one-line reason; the exclusion list is checked by a case that shows each excluded field does differ (so a stale exclusion fails).
- Before writing, a scratch diff of today's `fixtures/scenePin.json` `seriesLoaded` against `seriesNotLoaded` per case is recorded, showing which fields differ today; the test's exclusions match that list exactly.
- Planted break, recorded then reverted: make one build step read whether the series are loaded (for example a default that differs when not loaded) and show the case for an affected scene fails.
- Runs in the ordinary Vitest project (not `tests/cold/`), within the default per-test timeout or a named longer one with its measured time recorded.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/tests/scenePin.test.ts` (top constants, `plain` and helpers, `observe`, `loadGraph`, `freshGraph`, `sceneCases`)
- `packages/astraeus/tests/fixtures/scenePin.json` (keys `seriesLoaded` and `seriesNotLoaded`, compared by a scratch script, never read whole)
- `packages/astraeus/tests/cold/sceneLoad.test.ts` (header comment only, for the fresh-graph convention)
- `vitest.config.ts` (projects, ~1–60)

## Design References

`.savepoint/Design.md` under `Scene and host-link split`.

## Guardrails

ARCH-03, TEST-01, TEST-03, STYLE-07, STYLE-10.

## Implementation Plan

1. Scratch diff of the two orders in today's pin; record.
2. Copy the needed serialiser and the case table; write the two-order comparison per case.
3. Exclusions plus the stale-exclusion case.
4. Planted break; record; revert.
5. Focused run (record its time), gates.

## Boundaries

New test file only; no production change; the pin and its fixture untouched. The case table is a copy of the pin's inputs (the pin is deleted in draft 08, so there is no shared helper to extract); keep it in this file.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/sceneLoadOrder.test.ts`. Handoff: `quality_gates`. No browser run.

## Technical Evidence

Pending execution.

## Drift Notes

If the orders disagree today on a field that should not differ, that is a load-order defect: record it, raise an Issue candidate, and exclude nothing for it without a coordinator decision.
