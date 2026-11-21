---
id: T-347
title: Let the React component report its errors when no handler is given
objective: O-083
status: done
depends_on: []
check_waiver: {task: T-347, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T11:22:41Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: react
planned_reads: [packages/astraeus/src/api/prepared.ts, packages/astraeus/src/api/listeners.ts, packages/astraeus/tests/lifecycle.test.ts]
planned_writes: [packages/astraeus/src/api/AstraeusScene.tsx, packages/astraeus/tests/astraeusSceneConsole.test.ts]
---

# Let the React component report its errors when no handler is given

## Outcome

`<AstraeusScene>` without an `onError` prop reports every error it would have passed to `onError` to the console with `console.error`, so a missing data package or a bad prop no longer renders an empty element in silence (AH-24; Claude CQ-6).

## User Check

None visual. A React page rendering `<AstraeusScene scene={sceneNeedingAMoonPackage} />` with no `data` and no `onError` logs one `console.error` carrying the `missing-data` `SceneError`.

## Done When

- The three `latest.current.onError?.(…)` sites in `api/AstraeusScene.tsx` (the prop `apply` helper, the `ready` rejection, the synchronous `prepareScene` catch) go through one function: the host's `onError` when given, else `console.error(error)`. With `onError` given, nothing is logged (unchanged behaviour).
- The `onError` prop's doc comment says what happens without it.
- New `tests/astraeusSceneConsole.test.ts` (jsdom; copy the environment header and render helper of `tests/lifecycle.test.ts`): without `onError`, (a) a build fault (an empty scene, `empty-scene`; do not depend on the new `bad-scene` code, which another lane adds), (b) a load fault (a moon body without its data package, `missing-data`), (c) a bad `time` prop (`bad-time`) each produce exactly one `console.error` whose argument is a `SceneError` with that code; with `onError`, the same three call `onError` once each and `console.error` zero times. Show (a)–(c) failing first.
- Existing tests unchanged and green, including `lifecycle`, `developerToolsOption`, `hostCameraDom` and `viewerHandleType`.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/api/AstraeusScene.tsx` (lines ~20–30 props, ~85–120 `apply` and the build effect)
- `packages/astraeus/tests/lifecycle.test.ts` (render helper and jsdom header only)
- `packages/astraeus/src/api/listeners.ts` (how a throwing listener is reported, for consistent wording)

## Design References

`.savepoint/Design.md` under `Decisions`: `Public API shape (G-016, owner 2026-11-01)` (lifecycle and "the engine signals, the host decides"); under `Interfaces and Data Flow`: `One handle, one lifecycle`.

## Guardrails

API-02, API-05, STYLE-06, STYLE-07, TEST-01..04.

## Implementation Plan

1. Write the console test; show it failing.
2. Add the one reporting function and route the three sites through it.
3. Update the prop's doc comment.
4. Focused tests, then gates.

## Boundaries

No React error boundary, no change to `mount` (it already throws), no change to which errors reach `onError`, no new prop. README wording goes to the docs Task.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/astraeusSceneConsole.test.ts packages/astraeus/tests/lifecycle.test.ts`. Handoff: `quality_gates`. No browser run (no page uses the component without `onError` on a failing path).

## Technical Evidence

| Done When | Evidence |
|---|---|
| Three sites go through one function (`report`): host onError else console.error | `src/api/AstraeusScene.tsx` `report`, used in `apply`, the `ready` rejection and the sync catch; tests below |
| Doc comment says what happens without onError | onError prop comment in `AstraeusScene.tsx` |
| New console test (a) empty-scene (b) missing-data (saturn+titan, no data) (c) bad-time, with and without onError | `tests/astraeusSceneConsole.test.ts`, 6 cases; 3 without-onError cases failed first, then passed |
| Existing tests unchanged and green | `lifecycle` + new file: 79 passed; full run: only 2 failures, both from T-343 in-flight (see below) |
| Gates | lint, typecheck, build passed; `npm test` 4944 passed, 2 failed |

Failures (T-343 in flight, not fixed): `apiSurface` lock (SceneErrorCode doc comment changed) and `apiRules` API-05 allowlist (new `throw` in scene.ts). Reran apiSurface once: same.

Extra reads: none. Limitation: the bad-time case runs with the viewer mocked (the real viewer is not drawn), so the error comes from the link before attach.

## Drift Notes

None expected; optionally a Design line under `One handle, one lifecycle`: without `onError` the component reports to `console.error`.

Coordinator (orchestrate-g024-20261121): hand-off gates green for this Task's files (lint, typecheck, build; the two `npm test` failures are T-343's in-flight lock and API-05 changes, rechecked once it lands); `status: done` set by the coordinator under the standing orchestration rule ("I mark them as they pass", O-038) and G-024 decision 7.
