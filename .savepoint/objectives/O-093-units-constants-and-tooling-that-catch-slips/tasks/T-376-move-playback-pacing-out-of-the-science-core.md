---
id: T-376
title: Move playback pacing out of the science core
objective: O-093
status: planned
depends_on: [{task: T-375, requires: clear}]
check_waiver: {task: T-376, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T19:19:52Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: layout
planned_reads: [packages/astraeus/tests/presentationLayer.test.ts]
planned_writes: [packages/astraeus/src/core/pacing.ts, packages/astraeus/src/presentation/pacing.ts, packages/astraeus/src/app/experienceDefinition.ts, packages/astraeus/src/api/story.ts, packages/astraeus/src/app/sceneFrame.ts, packages/astraeus/src/app/openClock.ts, packages/astraeus/src/app/AstraeusScene.tsx, packages/astraeus/src/api/planTimeline.ts, packages/astraeus/src/app/App.tsx, packages/astraeus/tests/pacingViews.test.ts, packages/astraeus/tests/pacingOverlaps.test.ts, packages/astraeus/tests/reversePacing.test.ts, packages/astraeus/tests/pacing.test.ts, packages/astraeus/tests/pacedAdvance.test.ts, packages/astraeus/tests/syntheticJourney.test.ts, packages/astraeus/tests/pacingRepairs.test.ts, packages/astraeus/api-surface.lock.json]
---

# Move playback pacing out of the science core

## Outcome

`core/pacing.ts` (242 lines: how fast playback runs near events, wall-clock and presentation only) moves to `src/presentation/pacing.ts`; the scientific state never depended on it and still does not (AH-22 part a, Claude section C).

## User Check

None visual.

## Done When

- `git mv src/core/pacing.ts src/presentation/pacing.ts`; its own imports (`./clock`, `./events`) become `../core/...`. Importers change only their import lines (list in `planned_writes`; the exact list is re-grepped first, since O-083 draft 10 may have added a test).
- `tests/presentationLayer.test.ts` (draft 06) passes unedited with pacing in the folder.
- `npm run api:lock` diff holds only module-path text, or nothing.
- Pacing tests green and unedited apart from import lines: `pacing.test.ts`, `pacingOverlaps.test.ts`, `pacingRepairs.test.ts`, `reversePacing.test.ts`, `pacedAdvance.test.ts`, `pacingViews.test.ts`. `tests/fixtures/scenePin.json` byte-identical.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/core/pacing.ts` (import block)
- `packages/astraeus/tests/presentationLayer.test.ts`

## Design References

`.savepoint/Design.md` under `Time windows and rates (O-010)` and `Core layers and demos`.

## Guardrails

ARCH-02, ARCH-04, STYLE-10, TEST-03.

## Implementation Plan

1. Re-grep importers; `git mv`; fix the module's own imports; scripted import-path replace in importers.
2. `npm run api:lock`; focused tests; gates.

## Boundaries

No behaviour change. `pacedAdvance.test.ts` and `pacingViews.test.ts` are also written by O-085 (drafts 01 and 05): this Task touches only their import line, so a later merge of a parked O-085 resolves by keeping both edits.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/pacing.test.ts packages/astraeus/tests/pacingOverlaps.test.ts packages/astraeus/tests/pacingRepairs.test.ts packages/astraeus/tests/reversePacing.test.ts packages/astraeus/tests/pacedAdvance.test.ts packages/astraeus/tests/pacingViews.test.ts packages/astraeus/tests/presentationLayer.test.ts packages/astraeus/tests/scenePin.test.ts`. Handoff: `quality_gates`. No browser run.

## Technical Evidence

Pending execution.

## Drift Notes

For Design reconciliation (`Time windows and rates (O-010)`): pacing lives in `src/presentation/`.
