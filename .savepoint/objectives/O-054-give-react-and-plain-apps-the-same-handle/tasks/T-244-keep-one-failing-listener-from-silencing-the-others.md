---
id: T-244
title: Keep one failing listener from silencing the others
objective: O-054
status: planned
depends_on: [{task: T-243, requires: clear}]
owner_validation: {required: false}
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

Pending execution: named cases, results, files read and changed, and limitations, recorded after the work lands.

## Drift Notes

Record any architecture delta here and name T-249 (Design.md reconciliation) as where it is accounted for (AGENTS.md, Deferred Design reconciliation).
