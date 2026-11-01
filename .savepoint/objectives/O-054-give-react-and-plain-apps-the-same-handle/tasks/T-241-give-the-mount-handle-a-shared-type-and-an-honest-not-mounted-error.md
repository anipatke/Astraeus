---
id: T-241
title: Give the mount handle a shared type and an honest not-mounted error
objective: O-054
status: done
depends_on: [{task: T-240, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-241, reason: 'Owner said "Mark it done and orchestrate the next one" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o054-run-20261101}, recorded_at: '2026-11-01T08:47:39Z'}
planned_by: {role: planner, session: o054-planning-20261101}
---

# Give the mount handle a shared type and an honest not-mounted error

## Outcome

A new exported `ViewerHandle` type holds every read, setter and signal of the mount handle, `MountedScene` is `ViewerHandle` plus `ready` and `unmount`, and `ready` always settles: a handle used before it is drawn or after `unmount` throws the new `not-mounted` code, and `ready` rejects with it when `unmount` comes first (O-054 Success Conditions 1 and 2, mount half; review F2, F8; C-136 O1).

## User Check

Not owner-facing: the change shows only to a host page's code and its tests. The owner sees the result at the end of the Objective.

## Done When

- `ViewerHandle` (name per the O-054 planned decisions) is declared in `src/api/` with the doc comments now on `MountedScene`'s members, exported from `packages/astraeus/src/api/index.ts`; `MountedScene extends ViewerHandle` adds only `ready` and `unmount`.
- New test file `packages/astraeus/tests/viewerHandleType.test.ts` asserts with `expectTypeOf` that `Omit<MountedScene, "ready" | "unmount">` equals `ViewerHandle`; `npm run typecheck` fails if they drift (shown once by a temporary edit, recorded).
- New `SceneErrorCode` `not-mounted` (doc comment: the viewer is not drawn yet, or has been unmounted). Every handle call before `ready` and after `unmount` throws it; reads stay undefined. `missing-data` keeps only its data causes.
- `ready` rejects with `SceneError` `not-mounted` when `unmount` comes (a) before the data load finishes and (b) after the load but before the viewer attaches; it never stays pending and never resolves unusable. A load failure still rejects with its own error. Named tests for (a), (b) and the load failure, outside `act` as in `viewerHostReady.test.ts`.
- Existing cases that expected `missing-data` for a not-drawn handle (`viewerHostReady`, `viewerHostDom`, `hostCameraDom`, `viewerLinkPin`) now expect `not-mounted`; each edited case is named in Technical Evidence; no other assertion is loosened.
- Handle doc comments and the README `mount` rows say `not-mounted`; `apiRules.test.ts` README-table case passes.
- **Surface recorded:** `npm run api:lock` regenerated `packages/astraeus/api-surface.lock.json`, the README error table regenerated with `npm run api:errors` (the new code has a doc comment in `errors.ts`); `packages/astraeus/CHANGELOG.md` Unreleased has one entry for this step ending in a one-line migration note for app makers (what to change in an app built on 0.7.0); `npx vitest run packages/astraeus-site/tests/apiSurface.test.ts packages/astraeus-site/tests/apiRules.test.ts packages/astraeus-site/tests/allowlistGrowth.test.ts packages/astraeus-site/tests/packageBoundaries.test.ts` passes.
- **Gates:** `npm run lint` (complexity at most 20, CODE-01), `npm run typecheck`, `npm run build` and `npm test` pass; results recorded in Technical Evidence. No browser run.

## Context Files

`packages/astraeus/src/api/mount.ts`, `packages/astraeus/src/api/viewerLink.ts`, `packages/astraeus/src/api/errors.ts`, `packages/astraeus/src/api/index.ts`, `packages/astraeus/tests/viewerHostReady.test.ts`, `packages/astraeus/tests/viewerHostDom.test.ts`, `packages/astraeus/tests/viewerLinkPin.test.ts`, `packages/astraeus/tests/hostCameraDom.test.ts`, `packages/astraeus/README.md` under the `mount` API section.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`, `Public API shape (G-016, owner 2026-11-01)` and `O-053 checks (Guardrails API-01 to API-07)`; the O-054 Objective under `Success Conditions` and `Architectural Considerations` (planned decisions); `docs/architecture/api-review-2026-11-01.md` under `Findings (ranked)` (F2, F8).

## Guardrails

API-01, API-02, API-05, ARCH-02, TEST-01, TEST-03, CODE-01, STYLE-01, STYLE-02, STYLE-07, STYLE-10.

## Implementation Plan

1. Mark this step `in_progress` before any work.
2. Declare `ViewerHandle` and make `MountedScene` extend it; export the type.
3. Add `not-mounted`; make `LinkAccess.open` throw it (keep the `NOT_OPEN` wording).
4. Make `ready` settle on early unmount: reject when `unmount` precedes the load, and let `ViewerLink.close` settle a pending `whenAttached` so the wait after render cannot hang (the React path relies on `whenAttached` too: keep `onReady` from firing after close).
5. Add the type test and the ready cases; move the existing not-drawn expectations to `not-mounted`.
6. Update doc comments and README rows; `npm run api:errors`, `npm run api:lock`, CHANGELOG (migration: catch `not-mounted`, not `missing-data`, for calls before `ready` or after `unmount`; `ready` now rejects after an early `unmount`), O-053 tests, gates.

## Boundaries

Mount path and the shared link only. `AstraeusScene` gets the handle in the next step; no new reads, setters or signals here.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`). No browser run; the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

T-241 build evidence (stage audit).

Changed: packages/astraeus/src/api/viewerHandle.ts (new, ViewerHandle with the doc comments), mount.ts (MountedScene extends ViewerHandle; ready rejects not-mounted when unmounted before the load completes; an internal no-op catch so an unawaited ready is no unhandled rejection), viewerLink.ts (LinkAccess.open throws not-mounted, NOT_OPEN wording kept; close() rejects a pending whenAttached with not-mounted), AstraeusScene.tsx (whenAttached rejection swallowed so onReady stays unfired after close), errors.ts (new not-mounted code; missing-data doc no longer says "open the viewer first"), index.ts (export ViewerHandle), viewerViews.ts and viewerCamera.ts doc comments, README (mount rows, regenerated error table), CHANGELOG Unreleased entry with migration line, api-surface.lock.json regenerated (api:lock), tests/viewerHandleType.test.ts (new).

Edited existing cases (each missing-data -> not-mounted): viewerHostReady "a load failure still rejects ready" (setTime), viewerHostDom lines 47, 172, 185, 195 (setTime/setView), hostCameraDom "before ready and after unmount" (renamed, 3 calls), viewerLinkPin "reads undefined and refuses every setter" (4 messages) and "reads after attach and goes back to undefined" (1 message). Behaviour changes on purpose: viewerHostReady "unmount before the viewer is drawn" now expects ready to reject not-mounted (case a); viewerHostReady whenAttached "never resolves after close" now rejects not-mounted; viewerLinkPin "after close: a wait armed before it never resolves" now rejects not-mounted; publicApi "unmounted before the data loads, it never draws" now expects ready to reject not-mounted. New: case (b) unmount after load but before attach; viewerHandleType.test.ts. Temporary drift check: adding `readonly extraDrift: number` to MountedScene made npm run typecheck fail (TS2741 in mount.ts and TS2344 in viewerHandleType.test.ts); reverted.

Gates: lint, typecheck, build pass; npm test all pass except allowlistGrowth (below); check:pack and check:react-consumer pass.

RESOLVED by owner decision (2026-11-01, "Count per finding, not per name"); the text below is the original finding. allowlistGrowth.test.ts now counts growth per group (file + section + rule + finding + removedBy), so the re-key passes. Shown against the real file: a planted extra F4 entry in an existing group fails ("grew from 1 to 2"), a planted entry in a new group fails ("grew from 0 to 1"), a planted entry with an owner approval passes, the T-241 state passes; made-up-data unit test covers re-key, extra, new group, approved, agent-approved, public map. Recorded in Design.md "O-053 checks". Original:  ViewerHandle.time is now where apiTypeLint.allowlist.json's two F4 entries (time, unit; removedBy O-057) apply, so the entries were re-keyed from MountedScene.time to ViewerHandle.time (stale-entry + new-break tests require it). allowlistGrowth counts the re-key as new entries without an owner approval and fails. No approval was written.


## Drift Notes

Design.md should show ViewerHandle (shared handle type) and the not-mounted error code, and that ViewerLink.close rejects a pending whenAttached; accounted for in T-249 (Design.md reconciliation).

Drift: mount attaches a no-op catch to `ready`, so an unawaited load failure is silent (it used to be an unhandled rejection); whoever awaits `ready` still hears it. Accounted for in T-249 or the checker to judge whether to keep it.
