---
id: T-241
title: Give the mount handle a shared type and an honest not-mounted error
objective: O-054
status: planned
depends_on: [{task: T-240, requires: clear}]
owner_validation: {required: false}
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

Pending execution: named cases, results, files read and changed, and limitations, recorded after the work lands.

## Drift Notes

Record any architecture delta here and name T-249 (Design.md reconciliation) as where it is accounted for (AGENTS.md, Deferred Design reconciliation).
