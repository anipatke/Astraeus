---
id: T-248
title: Tell the host when the camera moves
objective: O-054
status: done
depends_on: [{task: T-247, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-248, reason: 'Owner said "Mark it done and orchestrate the next one" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o054-run-20261101}, recorded_at: '2026-11-01T09:24:11Z'}
planned_by: {role: planner, session: o054-planning-20261101}
---

# Tell the host when the camera moves

## Outcome

Both paths' handle can hear the camera pose change, as its own signal, so a host can follow what a visitor does with the camera (O-054 Success Condition 7, third part; review F10).

## User Check

Not owner-facing: the change shows only to a host page's code and its tests. The owner sees the result at the end of the Objective.

## Done When

- `src/api/viewerCamera.ts` gains `onCameraChange(listener)` returning a stop function; on each viewer publish (the existing 100 ms tick and host or visitor publishes) it reads the pose and reports it to listeners when any of `focus`, `azimuthDeg`, `elevationDeg`, `distance` differs from the last report (the pose is already rounded), so at most about ten reports a second. The opening pose is read, not reported; a camera that follows a moving object at a fixed pose reports nothing. Listeners run through the O-054 listener helper.
- `ViewerHandle` gains `onCameraChange(listener: (camera: CameraPose) => void): () => void` (name and payload per the O-054 planned decisions).
- Named tests with a fake control (as in `viewerLinkPin.test.ts`) and one DOM test: a `setCamera` that eases reports changes then stops when the pose settles; an unchanged pose reports nothing; nothing after unmount; a throwing listener does not stop others.
- The `it.todo` for `onCameraChange` in `lifecycle.test.ts` is a real case on both paths; the member table includes it.
- README handle rows list it.
- **Surface recorded:** `npm run api:lock` regenerated `packages/astraeus/api-surface.lock.json`; `packages/astraeus/CHANGELOG.md` Unreleased has one entry for this step ending in a one-line migration note for app makers (what to change in an app built on 0.7.0); `npx vitest run packages/astraeus-site/tests/apiSurface.test.ts packages/astraeus-site/tests/apiRules.test.ts packages/astraeus-site/tests/allowlistGrowth.test.ts packages/astraeus-site/tests/packageBoundaries.test.ts` passes.
- **Gates:** `npm run lint` (complexity at most 20, CODE-01), `npm run typecheck`, `npm run build` and `npm test` pass; results recorded in Technical Evidence. No browser run.

## Context Files

`packages/astraeus/src/api/viewerCamera.ts`, `packages/astraeus/src/api/viewerLink.ts`, `packages/astraeus/src/app/viewerPort.ts`, `packages/astraeus/tests/viewerLinkPin.test.ts`, `packages/astraeus/tests/hostCameraDom.test.ts`, `packages/astraeus/tests/lifecycle.test.ts`, `packages/astraeus/README.md` under the `mount` API section.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`, `Public API shape (G-016, owner 2026-11-01)` and `O-053 checks (Guardrails API-01 to API-07)`; the O-054 Objective under `Success Conditions` and `Architectural Considerations` (planned decisions); `docs/architecture/api-review-2026-11-01.md` under `Findings (ranked)` (F10).

## Guardrails

API-01, API-02, API-05, ARCH-02, TEST-01, TEST-03, CODE-01, STYLE-01, STYLE-02, STYLE-07, STYLE-10.

## Implementation Plan

1. Mark this step `in_progress` before any work.
2. Add the last-reported pose and `publish` to the camera part; call it from `ViewerLink.publish`.
3. Add `onCameraChange` to `ViewerHandle`.
4. Tests, README rows, `npm run api:lock`, CHANGELOG (new; no migration needed), O-053 tests, gates.

## Boundaries

Signal only; no change to how the camera moves, no new React prop, no per-frame work added to the 3D frame loop (CODE-02).

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`). No browser run; the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Built by a Sonnet builder, 2026-11-01. Changed: src/api/viewerCamera.ts (last pose, 80 ms gap, publish, onCameraChange), viewerLink.ts (reset on attach/detach, publish, clearListeners on close), viewerHandle.ts; tests lifecycle.test.ts (real onCameraChange case on mount and AstraeusScene; READS/LISTENERS tables; mock now captures scene controls), viewerLinkPin.test.ts (3 cases: each field alone, easing rate limit with fake timers, detach/close/stop/throwing listener), hostCameraDom.test.ts (DOM ease-then-settle, stop, unmount); README, CHANGELOG, api-surface.lock.json. No pin entries changed (fake control's readCamera became settable with the same default).
Gates: lint clean; typecheck clean; build ok; npm test 190 files, 2324 passed, 1 skipped; apiSurface/apiRules/allowlistGrowth/packageBoundaries 40 passed; check:pack pass; check:react-consumer pass. No browser run. No allowlist entry added or removed.
Limitations: rate limit is the viewer's 100 ms tick plus an 80 ms minimum gap between reports; a change inside the gap is reported on the next tick.

## Drift Notes

Record any architecture delta here and name T-249 (Design.md reconciliation) as where it is accounted for (AGENTS.md, Deferred Design reconciliation).

- ViewerCamera is now stateful (last pose, report time, listeners) and ViewerLink.publish calls it as its fourth part after clock, zones, selection; the camera signal rides the existing 100 ms viewer publish (no new frame-loop work). Accounted for in T-249.
