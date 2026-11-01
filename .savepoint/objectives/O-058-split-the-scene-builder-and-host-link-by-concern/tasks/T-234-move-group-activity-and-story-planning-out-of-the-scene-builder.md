---
id: T-234
title: Move group, activity and story planning out of the scene builder
objective: O-058
status: planned
depends_on: [{task: T-233, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o058-planning-20261101}
---

# Move group, activity and story planning out of the scene builder

## Outcome

Groups and activities are planned in `packages/astraeus/src/api/planGroups.ts` and the story layer (events, their provenance, story panels) in `packages/astraeus/src/api/planStory.ts` (O-058 Success Condition 2, groups and activity, story layer).

## User Check

Not owner-facing: an internal refactor with no change a host or visitor can see. The owner sees the result at the end of the Objective.

## Done When

- `planGroups.ts` holds the scene's groups and activities and their checks and outputs: `#checkGroups`, `#groupLayers`, `#groupMetrics`, `#firstActivity`, `#checkGroupReadouts`, `#windowsEntry`, `groupLayersEntry`, and the late (clump) group split used by `prepare`. `addGroup` and `addActivity` delegate; `group.ts` and `activity.ts` are unchanged.
- `planStory.ts` holds the scene's events, batch and own event provenance and panels: what `addEvents` and `addStoryPanels` store, `#storyPanels`, `#eventProvenanceEntries`, and the event-object check `toDefinition` makes. `story.ts` is unchanged.
- `grep -nE "#checkGroups|#groupLayers|#groupMetrics|#storyPanels|#eventProvenanceEntries|function groupLayersEntry" packages/astraeus/src/api/scene.ts` finds nothing; each new module is at most 300 lines.
- **Nothing public moved:** `git diff --exit-code main -- packages/astraeus/api-surface.lock.json packages/astraeus-site/tests/` is empty (lock, every O-053 allowlist and `DEEP_IMPORT_COUNTS` unchanged), and `git diff --name-only --diff-filter=M main -- '*.test.ts' '*.test.tsx'` is empty (no existing test edited). `npx vitest run packages/astraeus-site/tests/apiSurface.test.ts packages/astraeus-site/tests/apiRules.test.ts packages/astraeus-site/tests/allowlistGrowth.test.ts packages/astraeus-site/tests/packageBoundaries.test.ts` passes.
- **Same output:** `npx vitest run packages/astraeus/tests/scenePin.test.ts` passes without `-u`, and `git status` shows `packages/astraeus/tests/fixtures/scenePin.json` unmodified.
- **Gates:** `npm run lint` (complexity at most 20, CODE-01), `npm run typecheck`, `npm run build` and `npm test` pass; results recorded in Technical Evidence. No browser run.

## Context Files

`packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/api/group.ts`, `packages/astraeus/src/api/activity.ts`, `packages/astraeus/src/api/story.ts`, `packages/astraeus/tests/scenePin.test.ts`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`, `Public API shape (G-016, owner 2026-11-01)` and `O-053 checks (Guardrails API-01 to API-07)`; the O-058 Objective under `Architectural Considerations` (planned module layout).

## Guardrails

API-01, API-05, TEST-03, CODE-01, STYLE-01, STYLE-02, STYLE-07, STYLE-10.

## Implementation Plan

1. Mark this step `in_progress` before any work.
2. Move code as-is: same function bodies, same `SceneError` codes and message text, same order of checks and of definition fields. No new public member on `Scene` or `SceneCamera` (the lock records them); planners take what they need as arguments or through internal objects. Public input types, `TrajectoryBase` and `stateOf` stay in `scene.ts` (O-053 allowlist entries are keyed to that file). New modules sit flat in `packages/astraeus/src/api/` so the O-053 scans read them. No CHANGELOG entry.
3. Move groups and activities, then the story layer; the anchors map the panels read comes from the path plan (pass it in).
4. Run the pin, the O-053 tests and the gates.

## Boundaries

Groups, activities and story only. No behaviour, message or public change.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`). No browser run; the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution: each Done When item with its command and result, files read and changed, and limitations.

## Drift Notes

Record any architecture delta here and name the last Task of O-058 (Design.md reconciliation) as where it is accounted for (AGENTS.md, Deferred Design reconciliation).
