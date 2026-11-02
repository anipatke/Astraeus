---
id: T-244
title: Keep one failing listener from silencing the others
objective: O-054
status: done
depends_on: [{task: T-243, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-244, reason: 'Owner said "Mark it done and orchestrate the next one" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o054-run-20261101}, recorded_at: '2026-11-01T08:57:57Z'}
planned_by: {role: planner, session: o054-planning-20261101}
---

# Keep one failing listener from silencing the others

## Outcome

A host listener that throws no longer stops the listeners after it: every host-link part calls its listeners through one helper that runs them all and reports a throw to the page afterwards (O-054 Success Condition 4; review F8; C-136 O5).

## User Check

Not owner-facing: the change shows only to a host page's code and its tests. The owner sees the result at the end of the Objective.

## Done When

- One internal helper in `src/api/` (for example `listeners.ts`) runs every listener with the value, catches each throw, and reports it with `globalThis.reportError` when present, else by rethrowing on a `setTimeout`; `viewerClock.ts` and `viewerZones.ts` use it and no part loops over its listeners by itself (a named test or scan fails if one does).
- Named tests: two `onChange` listeners, the first throws, the second still gets the change and `reportError` receives the error; the same for `onEventZone`; a listener that stops itself or adds one during a report behaves as today (`viewerLinkPin.test.ts` still passes unedited).
- The `it.todo` "a throwing listener does not stop the others" in `lifecycle.test.ts` is now a real case passing on both paths.
- `MountedScene.onChange` / `onEventZone` doc comments (on `ViewerHandle`) say a throwing listener is reported and does not stop the others.
- **Surface recorded:** `npm run api:lock` regenerated `packages/astraeus/api-surface.lock.json`; `packages/astraeus/CHANGELOG.md` Unreleased has one entry for this step ending in a one-line migration note for app makers (what to change in an app built on 0.7.0); `npx vitest run packages/astraeus-site/tests/apiSurface.test.ts packages/astraeus-site/tests/apiRules.test.ts packages/astraeus-site/tests/allowlistGrowth.test.ts packages/astraeus-site/tests/packageBoundaries.test.ts` passes.
- **Gates:** `npm run lint` (complexity at most 20, CODE-01), `npm run typecheck`, `npm run build` and `npm test` pass; results recorded in Technical Evidence. No browser run.

## Context Files

`packages/astraeus/src/api/viewerClock.ts`, `packages/astraeus/src/api/viewerZones.ts`, `packages/astraeus/src/api/viewerLink.ts`, `packages/astraeus/tests/viewerLinkPin.test.ts`, `packages/astraeus/tests/lifecycle.test.ts`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`, `Public API shape (G-016, owner 2026-11-01)` and `O-053 checks (Guardrails API-01 to API-07)`; the O-054 Objective under `Success Conditions` and `Architectural Considerations` (planned decisions); `docs/architecture/api-review-2026-11-01.md` under `Findings (ranked)` (F8).

## Guardrails

API-01, API-02, API-05, ARCH-02, TEST-01, TEST-03, CODE-01, STYLE-01, STYLE-02, STYLE-07, STYLE-10.

## Implementation Plan

1. Mark this step `in_progress` before any work.
2. Write the helper and its unit tests (including the no-`reportError` fallback, with fake timers).
3. Use it in the clock and zone parts.
4. Fill the lifecycle case; update the doc comments.
5. `npm run api:lock` (doc comments only), CHANGELOG (migration: none needed; a throwing listener no longer hides later ones), O-053 tests, gates.

## Boundaries

Listener calls only; no change to what or when a part reports.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`). No browser run; the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Changed: new `src/api/listeners.ts` (`callListeners`: runs a copy of the set, collects throws, reports each with `reportError` else a `setTimeout` rethrow); `viewerClock.ts`, `viewerZones.ts` use it; doc comments on `ViewerHandle.onChange`/`onEventZone`; CHANGELOG entry; new `tests/listeners.test.ts` (helper, no-reportError fallback with fake timers, self-stop/add during call, ViewerLink onChange and onEventZone throwing-first cases, source scan); `lifecycle.test.ts` T-244 todo replaced by two real cases on mount and AstraeusScene.
Gates: focused 3 files 43 passed; O-053 four tests 40 passed; lint clean; typecheck clean; build ok; npm test 190 files, 2300 passed, 1 skipped, 8 todo. `npm run api:lock` ran; the lock did not change (doc comments are not in it). No pin entries changed; viewerLinkPin unedited. No browser run.

## Drift Notes

New internal module `src/api/listeners.ts` (listener helper used by the clock and zones parts); no Design.md change yet. Accounted for in T-249 (Design.md reconciliation).
