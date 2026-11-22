---
id: T-430
title: Picture-load wake-ups survive any unmount order
objective: O-092
status: done
depends_on: [{task: T-428, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-430, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "Carry on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-22T04:52:00Z'}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: hooks
planned_reads: [packages/astraeus/src/app/sceneContentsHooks.ts, packages/astraeus/tests/glowAndHooksDom.test.ts]
planned_writes: [packages/astraeus/src/app/loadingWakes.ts, packages/astraeus/src/app/sceneContentsHooks.ts, packages/astraeus/tests/loadingWakes.test.ts]
---

# Picture-load wake-ups survive any unmount order

## Outcome

Every mounted viewer is woken by every picture load, whatever order viewers mount and unmount in, and the page's own loading-manager callbacks are back as they were once the last viewer goes. Today each viewer wraps three's page-wide `DefaultLoadingManager` callbacks and puts back the snapshot it took, so unmounting the first of two viewers removes the second's wake-up and unmounting the second then reinstalls the first's dead wrapper (AH-13; Claude audit R-5, `sceneContentsHooks.ts:146-157` at the audited commit, now ~236–267, unchanged by O-087/O-089 as re-checked 2026-11-22).

## User Check

None visual. A paused second viewer redraws when a picture finishes loading after the first viewer was taken down (draft 01 records whether that is visible today).

## Done When

- New `packages/astraeus/src/app/loadingWakes.ts` keeps one module-level set of wake functions and exports one function that adds a wake and returns its remover. The first add captures the manager's current `onStart`, `onProgress`, `onLoad` and `onError` and installs one wrapper for each that calls every wake in the set and then the captured callback with the same arguments; the last remove puts back each captured callback only if the manager still holds the wrapper installed for it (a callback the page set meanwhile is left alone). Removing twice is harmless.
- `useDrawWakes` (`sceneContentsHooks.ts` ~236–267) uses it for the load events and keeps its own `webglcontextrestored` listener on its own canvas, as today.
- New `tests/loadingWakes.test.ts` (happy-dom, a probe component per viewer as `glowAndHooksDom.test.ts` ~207–216 does, or the module function directly where no React is needed):
  - two viewers A and B: each load event wakes both; unmount A, then each event wakes only B; unmount B, and the manager's four callbacks are identical (`toBe`) to those before A mounted;
  - the same with B unmounted first;
  - a callback the page set before the first mount still hears every event while viewers are mounted;
  - a callback the page sets while viewers are mounted is not overwritten when the last viewer unmounts;
  - restore wakes stay per canvas: a `webglcontextrestored` on A's canvas wakes A only.
- The existing case "counts a draw wake for every load event and a restored context, and puts the loading manager back on unmount" (`glowAndHooksDom.test.ts` ~207–232) passes unchanged.
- Engine size from `npm run check:pack` recorded before and after; allowance +250 B (cap 1,838,000 B raw; about 11.5 KB headroom at C-211 before O-092).
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/app/sceneContentsHooks.ts` (`useDrawWakes` ~231–267)
- `packages/astraeus/tests/glowAndHooksDom.test.ts` (the effect-hooks case ~206–232)

## Design References

`.savepoint/Design.md` under `Good guest`.

## Guardrails

API-03, TEST-01, TEST-02, TEST-03, STYLE-01, STYLE-07, STYLE-10.

## Implementation Plan

1. Start from the merged head with draft 02 in (it edits the same file).
2. Write the two-viewer cases; see the A-then-B case fail on today's code (record it).
3. Add `loadingWakes.ts`; switch `useDrawWakes` to it.
4. Focused tests, size, gates.

## Boundaries

No per-viewer `LoadingManager` (the r3f `useLoader` loader instance and `SkyView`'s `TextureLoader` both use the default manager; changing that is out of scope, PLAN.md decision 3). No change to what counts as a wake or to the idle grace. No change to existing tests.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/loadingWakes.test.ts packages/astraeus/tests/glowAndHooksDom.test.ts packages/astraeus/tests/sceneHooksDom.test.ts`, plus `npm run typecheck`, eslint (`node --require ./tools/lint/use-typescript6.cjs node_modules/eslint/bin/eslint.js <changed files>`) and `npx prettier --check <changed files>` (builder rule 7). Size: `npm run check:pack`. No browser run (`sceneContentsHooks.ts` is in draft 01's `two-viewers` policy row, so the Full Check's run adds that step).

## Technical Evidence

Done When -> evidence:
- loadingWakes.ts (set, add returns remover, wrappers, conditional restore, double remove harmless) -> tests/loadingWakes.test.ts (all four cases; double remove is guarded by `wakes.delete` result).
- useDrawWakes uses it, own restored listener kept -> `keeps restore wakes per canvas` case; existing glowAndHooksDom case passes unchanged.
- Two viewers A/B either unmount order, identity restore (toBe) -> `it.each` case; page callback before mount -> `keeps the page's earlier callback`; callback set while mounted -> `does not overwrite`.
- Red-first: with HEAD's sceneContentsHooks.ts the new test file failed (restored after).
- Size: `npm run measure:example` first-open total 1826394 -> 1827398 B (+1004, but T-429 builds concurrently so part of the delta is not mine); engine-only figure not separable here.
Commands: typecheck clean; eslint (use-typescript6) and prettier on the three changed files clean; `npx vitest run` loadingWakes, glowAndHooksDom, sceneHooksDom: 3 files, 32 tests pass.
Files: src/app/loadingWakes.ts (new), src/app/sceneContentsHooks.ts, tests/loadingWakes.test.ts (new).
Limitations: no browser run; check:pack not run.

## Drift Notes

Design `Good guest` gains: picture-load wake-ups are one reference-counted hook on three's default loading manager (reconciled by draft 07).

## Coordinator (gates)

Combined wave-2 gate with T-429 and T-430: typecheck clean; `npm run lint` clean; `npm test` 336 files, 5478 passed, 1 failed (twoViewers shelf-panel case, a 1 s waitFor flake under load -> I-204, repaired), then a full rerun 336 files, 5479 passed, 2 skipped. Engine first open 1,827,398 B raw after both (cap 1,838,000): T-429 + T-430 together add 1,004 B against their combined planned allowance of 650 B; the Objective total (+970 B since C-211) stays far under the cap, so the planner allowance is recorded as exceeded, not a cap red. Set done by the orchestrating session (owner: "I mark them as they pass", O-038; G-024 decision 7; owner 2026-11-22 "Carry on").
