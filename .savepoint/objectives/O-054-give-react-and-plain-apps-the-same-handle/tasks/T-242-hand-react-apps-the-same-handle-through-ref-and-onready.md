---
id: T-242
title: Hand React apps the same handle through ref and onReady
objective: O-054
status: done
depends_on: [{task: T-241, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-242, reason: 'Owner said "Mark it done and orchestrate the next one" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o054-run-20261101}, recorded_at: '2026-11-01T08:52:18Z'}
planned_by: {role: planner, session: o054-planning-20261101}
---

# Hand React apps the same handle through ref and onReady

## Outcome

`AstraeusScene` gives a React app the same `ViewerHandle` a `mount` host gets, through `ref` and `onReady(handle)`, keeps its props as shortcuts, survives React StrictMode without an early `onReady`, and compares the `camera` prop by value whatever the key order (O-054 Success Conditions 1 and 3; review F2, F8; I-130; C-136 O2, O7).

## User Check

Not owner-facing: the change shows only to a host page's code and its tests. The owner sees the result at the end of the Objective.

## Done When

- `AstraeusSceneProps` gains `ref?: Ref<ViewerHandle>` (React 19 ref as a prop, no `forwardRef`) and `onReady?: (handle: ViewerHandle) => void`; the handle is one object for the component's life (the same object after a rebuild with a new `scene`), its reads undefined and calls throwing `not-mounted` until drawn and after unmount.
- `viewerHandleType.test.ts` also asserts the `ref` prop's handle type is `ViewerHandle` and `onReady`'s parameter is `ViewerHandle`.
- Named DOM tests: a React app reads `camera`, calls `setCamera` and `setTime`, and subscribes with `handle.onChange` through the ref after `onReady`; after a rebuild with a new `scene` the same handle works again and `onReady` fires again with it.
- **StrictMode:** a named test renders `<StrictMode><AstraeusScene …/></StrictMode>` outside `act`: `onReady` fires once per build and only after the link has attached (`handle.time` is defined inside it), and a listener added through the handle still fires after StrictMode's replayed effects; the same test fails on the old code (recorded).
- `camera` prop: a pose whose keys come in another order does not re-apply; a changed value does (named test). The comparison is by sorted keys, not `JSON.stringify` of the object as given.
- README `AstraeusScene` rows list `ref` and the new `onReady(handle)`; `apiRules.test.ts` README-table case passes.
- **Surface recorded:** `npm run api:lock` regenerated `packages/astraeus/api-surface.lock.json`; `packages/astraeus/CHANGELOG.md` Unreleased has one entry for this step ending in a one-line migration note for app makers (what to change in an app built on 0.7.0); `npx vitest run packages/astraeus-site/tests/apiSurface.test.ts packages/astraeus-site/tests/apiRules.test.ts packages/astraeus-site/tests/allowlistGrowth.test.ts packages/astraeus-site/tests/packageBoundaries.test.ts` passes.
- **Gates:** `npm run lint` (complexity at most 20, CODE-01), `npm run typecheck`, `npm run build` and `npm test` pass; results recorded in Technical Evidence. No browser run.

## Context Files

`packages/astraeus/src/api/AstraeusScene.tsx`, `packages/astraeus/src/api/mount.ts`, `packages/astraeus/src/api/viewerLink.ts`, `packages/astraeus/tests/viewerHostReady.test.ts`, `packages/astraeus/tests/viewerHostDom.test.ts`, `packages/astraeus/tests/viewerHandleType.test.ts`, `packages/astraeus/README.md` under the `AstraeusScene` API section.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`, `Public API shape (G-016, owner 2026-11-01)` and `O-053 checks (Guardrails API-01 to API-07)`; the O-054 Objective under `Success Conditions` and `Architectural Considerations` (planned decisions); `docs/architecture/api-review-2026-11-01.md` under `Findings (ranked)` (F2, F8).

## Guardrails

API-01, API-02, API-05, ARCH-02, TEST-01, TEST-03, CODE-01, STYLE-01, STYLE-02, STYLE-07, STYLE-10.

## Implementation Plan

1. Mark this step `in_progress` before any work.
2. Build the handle from the link in one shared helper used by both `mount` and `AstraeusScene`, so the two paths cannot drift (STYLE-07).
3. Wire `ref` and `onReady(handle)`; keep every existing prop.
4. Fix StrictMode: the effect cleanup that StrictMode replays must not close the link for good (reopen on the re-run, or close only on the real unmount); write the failing test first.
5. Compare the `camera` prop by sorted keys.
6. Tests, README rows, `npm run api:lock`, CHANGELOG (migration: React apps read and set through the handle from `ref` or `onReady(handle)`; `onReady` now receives the handle), O-053 tests, gates.

## Boundaries

React path and the shared handle helper only; no new reads, setters or signals; no new props beyond `ref` and the `onReady` argument.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`). No browser run; the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Changed: packages/astraeus/src/api/{AstraeusScene.tsx,mount.ts,viewerHandle.ts,viewerLink.ts}; tests viewerHostDom, viewerHostReady, viewerHandleType; README rows; CHANGELOG Unreleased entry (with migration line); api-surface.lock.json regenerated. Shared helper `viewerHandleOf(link)` used by `mount` (as prototype of the returned object, since a spread would freeze the getters) and `AstraeusScene`. `ViewerLink.reopen()` lets a StrictMode-replayed effect take a closed link back.
Tests: viewerHostDom "AstraeusScene hands React apps the handle" (ref/onReady reads, setTime, onChange; not-mounted before draw; rebuild keeps same handle and onReady fires again; unmount; camera prop key order vs changed value); viewerHostReady StrictMode case outside act (once per build, handle.time defined inside onReady, listener fires after replay; recorded failing, timing out with onReady never fired, with `link.reopen()` disabled); viewerHandleType ref/onReady types.
Gates: lint clean; typecheck clean; build ok; npm test 188 files, 2272 passed, 1 skipped; api:lock regenerated; apiSurface/apiRules/allowlistGrowth/packageBoundaries 40 passed; check:react-consumer pass. scenePin/viewerLinkPin unchanged. No allowlist entries touched. No browser run.

## Drift Notes

Record any architecture delta here and name T-249 (Design.md reconciliation) as where it is accounted for (AGENTS.md, Deferred Design reconciliation).

- T-249: Design.md should note `viewerHandleOf(link)` as the one handle builder for `mount` and `AstraeusScene`, and `ViewerLink.reopen()` (a closed link can be reopened by a replayed host effect; real unmount leaves it closed).
