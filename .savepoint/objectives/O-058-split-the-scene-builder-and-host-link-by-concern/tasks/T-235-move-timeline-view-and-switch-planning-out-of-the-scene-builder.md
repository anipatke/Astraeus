---
id: T-235
title: Move timeline, view and switch planning out of the scene builder
objective: O-058
status: planned
depends_on: [{task: T-234, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o058-planning-20261101}
---

# Move timeline, view and switch planning out of the scene builder

## Outcome

The timeline and pacing (window, opening time, clock, rates, pacing) are planned in `packages/astraeus/src/api/planTimeline.ts`, and views and display switches in `packages/astraeus/src/api/planViews.ts` (O-058 Success Condition 2, timeline and pacing, views and switches).

## User Check

Not owner-facing: an internal refactor with no change a host or visitor can see. The owner sees the result at the end of the Objective.

## Done When

- `planTimeline.ts` holds `spanOf`, `windowOf`, `clockOf`, `pacingEntry`, the default rates and the opening-time state `setTime` and `setTimeline` store; `planViews.ts` holds the views and switches state `setViews` and `setSwitches` store and `#viewsEntry`, plus the switches entry of the definition. `story.ts`, `views.ts` and `switches.ts` are unchanged.
- `grep -nE "function (spanOf|windowOf|clockOf|pacingEntry)|#viewsEntry" packages/astraeus/src/api/scene.ts` finds nothing; each new module is at most 300 lines.
- **Nothing public moved:** `git diff --exit-code main -- packages/astraeus/api-surface.lock.json packages/astraeus-site/tests/` is empty (lock, every O-053 allowlist and `DEEP_IMPORT_COUNTS` unchanged), and `git diff --name-only --diff-filter=M main -- '*.test.ts' '*.test.tsx'` is empty (no existing test edited). `npx vitest run packages/astraeus-site/tests/apiSurface.test.ts packages/astraeus-site/tests/apiRules.test.ts packages/astraeus-site/tests/allowlistGrowth.test.ts packages/astraeus-site/tests/packageBoundaries.test.ts` passes.
- **Same output:** `npx vitest run packages/astraeus/tests/scenePin.test.ts` passes without `-u`, and `git status` shows `packages/astraeus/tests/fixtures/scenePin.json` unmodified.
- **Gates:** `npm run lint` (complexity at most 20, CODE-01), `npm run typecheck`, `npm run build` and `npm test` pass; results recorded in Technical Evidence. No browser run.

## Context Files

`packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/api/story.ts`, `packages/astraeus/src/api/views.ts`, `packages/astraeus/src/api/switches.ts`, `packages/astraeus/tests/scenePin.test.ts`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`, `Public API shape (G-016, owner 2026-11-01)` and `O-053 checks (Guardrails API-01 to API-07)`; the O-058 Objective under `Architectural Considerations` (planned module layout).

## Guardrails

API-01, API-04, API-05, ARCH-02, TEST-03, CODE-01, STYLE-01, STYLE-02, STYLE-07, STYLE-10.

## Implementation Plan

1. Mark this step `in_progress` before any work.
2. Move code as-is: same function bodies, same `SceneError` codes and message text, same order of checks and of definition fields. No new public member on `Scene` or `SceneCamera` (the lock records them); planners take what they need as arguments or through internal objects. Public input types, `TrajectoryBase` and `stateOf` stay in `scene.ts` (O-053 allowlist entries are keyed to that file). New modules sit flat in `packages/astraeus/src/api/` so the O-053 scans read them. No CHANGELOG entry.
3. Move timeline and pacing, then views and switches.
4. Run the pin, the O-053 tests and the gates.

## Boundaries

Timeline, views and switches only. The opening time with nothing set still reads `Date.now()` at the same point as today. No behaviour, message or public change.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`). No browser run; the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution: each Done When item with its command and result, files read and changed, and limitations.

## Drift Notes

Record any architecture delta here and name the last Task of O-058 (Design.md reconciliation) as where it is accounted for (AGENTS.md, Deferred Design reconciliation).
