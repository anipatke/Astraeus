---
id: T-239
title: Bring the design notes in line with the split and run the full gate
objective: O-058
status: done
depends_on: [{task: T-238, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-239, reason: 'Owner said "Orchestrate the next one" under the standing run rules (no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o058-run-20261101}, recorded_at: '2026-11-01T07:35:48Z'}
planned_by: {role: planner, session: o058-planning-20261101}
---

# Bring the design notes in line with the split and run the full gate

## Outcome

Design.md describes the split as built, every deferred drift note of O-058 is accounted for, and the full gate passes, so the Full Objective Check (with its one browser run) can start (O-058 Success Conditions 5 and 6).

## User Check

Not owner-facing: an internal refactor with no change a host or visitor can see. The owner sees the result at the end of the Objective.

## Done When

- `.savepoint/Design.md` `Components/Codebase Map` (the `packages/astraeus/` row) and `Interfaces and Data Flow` name the per-concern planners, the assembler, the four host-link parts and the two parsers in `src/core/` with the re-exports at their old paths (and that O-059 removes the demos' deep imports to those paths); the `Public API shape` section's mention of O-058 is reconciled. Short, current-state wording, no progress narrative.
- Each drift note recorded by the earlier O-058 Tasks is listed in Design.md (or in this Task's evidence) as reflected or non-architectural, with a reason.
- Fresh full-gate evidence: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:full`, `npm run check:engine-alone`, `npm run check:pack`, `npm run check:node-consumer` and `npm run check:react-consumer` pass; results recorded.
- `wc -l packages/astraeus/src/api/scene.ts packages/astraeus/src/api/plan*.ts packages/astraeus/src/api/assembleScene.ts packages/astraeus/src/api/viewer*.ts` recorded: `scene.ts` under 450, every other at most 300 (viewer parts at most 150).
- **Nothing public moved:** `git diff --exit-code main -- packages/astraeus/api-surface.lock.json packages/astraeus-site/tests/` is empty (lock, every O-053 allowlist and `DEEP_IMPORT_COUNTS` unchanged), and `git diff --name-only --diff-filter=M main -- '*.test.ts' '*.test.tsx'` is empty (no existing test edited). `npx vitest run packages/astraeus-site/tests/apiSurface.test.ts packages/astraeus-site/tests/apiRules.test.ts packages/astraeus-site/tests/allowlistGrowth.test.ts packages/astraeus-site/tests/packageBoundaries.test.ts` passes.
- **Same output:** `npx vitest run packages/astraeus/tests/scenePin.test.ts` passes without `-u`, and `git status` shows `packages/astraeus/tests/fixtures/scenePin.json` unmodified.
- **Gates:** `npm run lint` (complexity at most 20, CODE-01), `npm run typecheck`, `npm run build` and `npm test` pass; results recorded in Technical Evidence. No browser run.

## Context Files

`.savepoint/Design.md` under `Components/Codebase Map`, `Interfaces and Data Flow` and `Public API shape (G-016, owner 2026-11-01)`; the O-058 Objective; the Drift Notes and Technical Evidence sections of the earlier O-058 Task files; `docs/agents/build.md`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`, `Public API shape (G-016, owner 2026-11-01)` and `O-053 checks (Guardrails API-01 to API-07)`; the O-058 Objective under `Architectural Considerations` (planned module layout).

## Guardrails

API-01, ARCH-04, TEST-01, TEST-03, STYLE-07; STYLE rules (advisory).

## Implementation Plan

1. Mark this step `in_progress` before any work.
2. Reconcile Design.md and account for each drift note.
3. Run the full gate and record it.

## Boundaries

Docs and evidence only; no source change unless a gate fails, and then only the smallest fix inside O-058's scope (else report). No browser run here: `npm run check:browser` runs once at the Full Objective Check.

## Technical Verification

The full gate above (`docs/agents/build.md`), run fresh. The Full Objective Check then runs `npm run check:browser` once and `savepoint health check O-058`. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Run 2026-11-01 (no browser run):
- Design.md: Codebase Map (`packages/astraeus/` row) names `src/api/` planners, assembler, four link parts and `core/` parsers with re-exports (`shell/storyPanels.ts`, `app/viewLink.ts`); new Interfaces paragraph "Scene and host-link split (O-058)" (mentions O-059 removing deep imports to the old paths); "Drift accounting for T-231 to T-238" lists every note as reflected or non-architectural with reason. Public API shape intro already lists O-058 as reconciled as it lands; the new paragraph is the reconciliation.
- `npm run lint`, `typecheck`, `build`: pass.
- `npm run test:full`: first run 3 failed (2 apiRules tests timed out at 5000 ms under full-suite load; showersMeasured frame-timing "indication only" test); those two files pass alone (37 tests); second full run: 186 files, 2258 passed, 1 skipped, 0 failed.
- `check:engine-alone`, `check:pack`, `check:node-consumer` (9 tests), `check:react-consumer` (react 19.3.1): pass.
- `wc -l`: scene.ts 350; planBodies 209, planCamera 124, planGroups 85, planPaths 204, planStory 49, planTimeline 65, planViews 30, assembleScene 173; viewerCamera 42, viewerClock 72, viewerLink 146, viewerViews 19, viewerZones 51.
- `git diff --exit-code main -- api-surface.lock.json packages/astraeus-site/tests/`: empty; `git diff --name-only --diff-filter=M main -- '*.test.ts' '*.test.tsx'`: empty. apiSurface/apiRules/allowlistGrowth/packageBoundaries + scenePin: 5 files, 41 tests pass without -u; `scenePin.json` unmodified.


## Drift Notes

None. Flaky under load: apiRules (5 s default timeout) and showersMeasured timing tests failed once in the full suite and passed on rerun; not caused by O-058.
