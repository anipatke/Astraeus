---
id: T-359
title: Stop the viewer reusing positions worked out before its moon data arrived
objective: O-084
status: planned
depends_on: [{task: T-358, requires: clear}]
check_waiver: {task: T-359, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T12:08:49Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: binding
planned_reads: [packages/astraeus/src/assets/catalogue.ts, packages/astraeus/src/core/bodies/moonSystem.ts, packages/astraeus/src/app/App.tsx, packages/astraeus/tests/stateResolver.test.ts, packages/astraeus/tests/sceneMoonBinding.test.ts]
planned_writes: [packages/astraeus/src/core/stateResolver.ts, packages/astraeus/src/core/moonData.ts, packages/astraeus/src/app/sceneLayout.ts, packages/astraeus/tests/resolverAfterLoad.test.ts]
---

# Stop the viewer reusing positions worked out before its moon data arrived

## Outcome

A state resolver bound to a scene's moon data cannot serve a remembered state computed before that scene's data finished loading. Its per-(body, time) memo is dropped whenever the scene's moon data changes, so a paused viewer whose moon package loads, or a scene loaded again while mounted, shows the planet's centre and the moons straight away (AH-03 success condition; Gemini SCI-08, second half).

## User Check

None visual. The new `resolverAfterLoad` tests pass.

## Done When

- `createSceneMoonData()`'s `revision()` (draft 04) goes up whenever one of its systems installs or finishes loading new chunks, or its source changes. A failed load does not change it.
- `createStateResolver(..., moonData?)` records the revision with its memo and clears the memo before an evaluation when the revision has moved. With no `moonData` the memo works exactly as today: same `MEMO_LIMIT`, and no extra work per call beyond one number compare.
- `createSceneResolver(adapter, source)` (`app/sceneLayout.ts`) passes the bound catalogue's `moonData`, so the viewer's one resolver gets this behaviour.
- New `packages/astraeus/tests/resolverAfterLoad.test.ts`. Rows:
  1. A resolver over the built-in catalogue bound to an empty scene moon data: Jupiter at T (barycentre). Load that scene's Jupiter system for T's year, then ask for Jupiter at T again: it equals a freshly made resolver's answer (centre, differing from the first by more than 100 km).
  2. The same for Io: `NotLoadedError` before the load, and an answer after it, at the same T.
  3. A load that fails leaves the remembered states in use (no needless clearing).
  4. An unbound resolver asked twice at one time evaluates its provider once (the memo still works; existing behaviour).

  Show rows 1 and 2 failing first, against draft 05's code.
- Existing tests unchanged and green, including `tests/stateResolver.test.ts`, `tests/sceneTransforms.test.ts`, `tests/twoViewers.test.ts`, `tests/sceneMoonBinding.test.ts` and `tests/sceneMoonScope.test.ts`.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/core/stateResolver.ts` (`MEMO_LIMIT`, `native`, `createStateResolver`; O-083 draft 09 changed `stateOf` here, so build on that version)
- `packages/astraeus/src/core/moonData.ts` (`createSceneMoonData`, `revision`)
- `packages/astraeus/src/core/bodies/moonSystem.ts` (`loadRequest`, `install`: where a load completes)
- `packages/astraeus/src/app/sceneLayout.ts` (`createSceneResolver`)
- `packages/astraeus/src/app/App.tsx` (`buildRuntime`, line ~151: one resolver per mount)
- `audits/2026-11-21_google_gemini-4-neon_auditfindings.md` under SCI-08 (line ~463)

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`: `One handle, one lifecycle`, `Planet positions from Horizons`.

## Guardrails

ARCH-02, ARCH-04, API-03, CODE-02 (no new per-frame stage; the check is inside the existing resolver call), TEST-01, TEST-02, TEST-03, STYLE-06.

## Implementation Plan

1. Write `resolverAfterLoad.test.ts` and show rows 1 and 2 failing.
2. Add the revision counter to the scene moon data, raised on a completed install or load.
3. Compare and clear the memo in `native`, and pass `moonData` from `createSceneResolver`.
4. Run the focused tests, then the gates.

## Boundaries

No change to what a state is, to `MEMO_LIMIT`, to the frame loop, or to the silent barycentre fallback outside a scene's loaded chunks (not in this Objective). No public API change.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/resolverAfterLoad.test.ts packages/astraeus/tests/stateResolver.test.ts packages/astraeus/tests/sceneTransforms.test.ts packages/astraeus/tests/twoViewers.test.ts packages/astraeus/tests/sceneMoonScope.test.ts`. Handoff: `quality_gates`. No browser run.

## Technical Evidence

Pending execution.

## Drift Notes

Record for Design reconciliation (`One handle, one lifecycle`): the viewer's resolver drops remembered states when its scene's moon data changes.
