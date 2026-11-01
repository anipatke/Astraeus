---
id: T-237
title: Move the story-panel and camera-pose parsers out of display code
objective: O-058
status: done
depends_on: [{task: T-236, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-237, reason: 'Owner said "Orchestrate the next one" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o058-run-20261101}, recorded_at: '2026-11-01T07:27:03Z'}
planned_by: {role: planner, session: o058-planning-20261101}
---

# Move the story-panel and camera-pose parsers out of display code

## Outcome

The input parsers the API uses live in `src/core/`, not in display code, and a test keeps `src/api/` from reaching into display code for anything but the viewer contract (O-058 Success Condition 4).

## User Check

Not owner-facing: an internal refactor with no change a host or visitor can see. The owner sees the result at the end of the Objective.

## Done When

- `packages/astraeus/src/core/storyPanels.ts` holds `parseStoryPanels`, `StoryPanelError`, `PanelLookup`, `StoryPanel`, `StoryPanelSet`, `PanelBadge`, `PANEL_BADGES` and the pause constants, moved as-is; `packages/astraeus/src/shell/storyPanels.ts` keeps its display parts (`panelsCrossed`, `CrossingTracker`, `BADGE_LABELS`) and re-exports the moved names, so every current importer (shell, `app/DeveloperSettings.tsx`, `synthetic/`, demos, site and tests) works unchanged.
- `packages/astraeus/src/core/startView.ts` holds `StartView` and `validateStartView` (with the azimuth wrap and elevation limit they use), moved as-is; `packages/astraeus/src/app/viewLink.ts` imports them and re-exports them.
- `src/api/story.ts`, `scene.ts` (or the planner that now needs them) and `viewerLink.ts` import these from `../core/…`; `grep -rnE "shell/storyPanels|app/viewLink" packages/astraeus/src/api/` finds nothing. `src/core/` imports nothing from `app/` or `shell/` (ARCH-04; the existing layer test passes).
- New `packages/astraeus/tests/apiImports.test.ts` lists every `app/` and `shell/` module a `src/api/` file imports and fails on one outside a short allowed list, each with its reason (the definition contract: `app/experienceDefinition`, `app/mission`, `app/bodyMetrics`, `app/trackedMetrics`, `app/catalogueItem`, `app/planetNeeds`, `app/displaySwitches`, `app/views`, `shell/metrics`, `shell/experience`; the viewer port: `app/viewerPort`, `app/CameraController`; the viewer: `app/App`, `app/style.css`). Shown failing on a planted import of `shell/storyPanels` into `src/api/story.ts`, then passing.
- **Nothing public moved:** `git diff --exit-code main -- packages/astraeus/api-surface.lock.json packages/astraeus-site/tests/` is empty (lock, every O-053 allowlist and `DEEP_IMPORT_COUNTS` unchanged), and `git diff --name-only --diff-filter=M main -- '*.test.ts' '*.test.tsx'` is empty (no existing test edited). `npx vitest run packages/astraeus-site/tests/apiSurface.test.ts packages/astraeus-site/tests/apiRules.test.ts packages/astraeus-site/tests/allowlistGrowth.test.ts packages/astraeus-site/tests/packageBoundaries.test.ts` passes.
- **Same output:** `npx vitest run packages/astraeus/tests/scenePin.test.ts` passes without `-u`, and `git status` shows `packages/astraeus/tests/fixtures/scenePin.json` unmodified.
- **Gates:** `npm run lint` (complexity at most 20, CODE-01), `npm run typecheck`, `npm run build` and `npm test` pass; results recorded in Technical Evidence. No browser run.

## Context Files

`packages/astraeus/src/shell/storyPanels.ts`, `packages/astraeus/src/app/viewLink.ts`, `packages/astraeus/src/api/story.ts`, `packages/astraeus/src/api/viewerLink.ts`, `packages/astraeus/src/api/planStory.ts`, `packages/astraeus-site/tests/packageBoundaries.test.ts` (layer rule and deep-import counts, read only), `tools/api-rules.mjs` (which folders the scans read).

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`, `Public API shape (G-016, owner 2026-11-01)` and `O-053 checks (Guardrails API-01 to API-07)`; the O-058 Objective under `Architectural Considerations` (planned module layout).

## Guardrails

ARCH-01, ARCH-04, API-01, API-05, TEST-01, TEST-03, STYLE-01, STYLE-07, STYLE-10.

## Implementation Plan

1. Mark this step `in_progress` before any work.
2. Move the parser code as-is to `src/core/` (core, not `api/`: they throw `RangeError` and `StoryPanelError`, which the `api/` plain-throw scan would add as new breaks); leave re-exports at the old paths so no importer outside `src/api/` changes and the deep-import counts stay put.
3. Point the `src/api/` imports at `core/`; add the import-rule test with its planted failure.
4. Run the pin, the O-053 tests and the gates; `npm run check:engine-alone`.

## Boundaries

Only the two parsers; `displaySwitches` and `views` constants stay in `app/` (they are the viewer's own settings shapes, listed in the allowed imports). No change to parser behaviour, messages or error classes.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`). No browser run; the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Built 2026-11-01 under the O-058 run (check waived). Changed: new `src/core/storyPanels.ts` and `src/core/startView.ts` (moved as-is; `MAX_ELEVATION_DEG` and `wrapAzimuth` are exported from core/startView because viewLink's `viewFromAngles` still uses them); `shell/storyPanels.ts` and `app/viewLink.ts` re-export the moved names; `api/story.ts`, `planStory.ts`, `planViews.ts`, `viewerLink.ts` import from `../core/`; new `tests/apiImports.test.ts`; `tools/api-rules.mjs` line 137 now reads the at.utc "Z" check from `core/storyPanels.ts` (the API-04 type lint scans the parser source by path; without this the allowlist entry went stale).
- Parsers moved, re-exports, api imports: `grep -rnE "shell/storyPanels|app/viewLink" packages/astraeus/src/api/` empty; typecheck passes.
- apiImports test: 4 pass; with `import type ... from "../shell/storyPanels"` planted in api/story.ts it failed ("api/story.ts: shell/storyPanels"), planted line removed, passes.
- Nothing public moved: `git diff --exit-code main -- packages/astraeus/api-surface.lock.json packages/astraeus-site/tests/` empty; no existing test file modified; apiSurface/apiRules/allowlistGrowth/packageBoundaries pass inside npm test.
- Same output: scenePin passes unmodified, fixture unchanged.
- Gates: lint, typecheck, build pass; `npm test` 185 files, 2244 passed, 1 skipped; `npm run check:engine-alone` pass.

## Drift Notes

Record any architecture delta here and name the last Task of O-058 (Design.md reconciliation) as where it is accounted for (AGENTS.md, Deferred Design reconciliation).

T-239 (Design.md reconciliation): `src/core/` now holds the story-panel and start-view parsers; `api/` display imports are test-limited to the listed allowlist; `tools/api-rules.mjs` reads `core/storyPanels.ts`.
