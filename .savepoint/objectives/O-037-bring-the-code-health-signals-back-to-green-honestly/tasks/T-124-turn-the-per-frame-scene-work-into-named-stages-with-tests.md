---
id: T-124
title: Turn the per-frame scene work into named stages with tests
objective: O-037
status: planned
depends_on: []
owner_validation: {required: true}
planned_by: {role: planner, session: o037-planning-20261021}
planned_reads: [src/app/AstraeusScene.tsx, src/app/sceneCamera.ts, src/app/sceneTargets.ts, src/app/sceneBodies.ts, src/app/sceneBodySets.ts, src/app/sceneDebug.ts, src/app/sceneHooks.ts, src/app/scenePicking.ts, src/app/CameraController.tsx, tests/scenePlacement.ts]
planned_writes: [src/app/AstraeusScene.tsx, src/app/sceneFrame.ts, src/app/scenePointer.ts, tests/sceneFrame.test.ts, tests/sceneCamera.test.ts, tests/sceneTargets.test.ts, tests/sceneBodies.test.ts]
---

# Turn the per-frame scene work into named stages with tests

## Outcome

The 80-line frame callback in `src/app/AstraeusScene.tsx` becomes a short call into `src/app/sceneFrame.ts`, where each stage of a frame is a named function over one frame context, testable in node; the pointer listeners live in `src/app/scenePointer.ts`; the three pure scene modules get tests. Nothing on screen changes.

## User Check

Open the preview (`localhost:5490`) on the Apollo 11, Showers and planets demos: the scene, labels, markers, hover, tap and camera behave as before. The owner looks once at the Objective's end (O-025 rule), not per Task.

## Done When

1. `src/app/sceneFrame.ts` exports stage functions in frame order: sync the views for the time, place the composition and update the span, step and pose the camera, place bodies and views about the origin, publish the canvas readouts, update the overlay layers and picking, place the lights and build the frame readout. Each takes the frame context (runtime, controls, refs, views, camera, size, origin, time) and returns what the next stage needs; none closes over React state.
2. The `useFrame` callback in `SceneContents` is the stage calls and nothing else; the hover and tap listener effect moves to `scenePointer.ts` as `attachScenePointer(canvas, ...)` returning its detach function.
3. ESLint's `complexity` rule (as the lint Task configures it) reports no function in `src/app/AstraeusScene.tsx`, `sceneFrame.ts` or `scenePointer.ts` over 20; the planner's count is about 45 branch points for today's callback, so expect six to eight stages.
4. Node tests: each stage with fakes (three.js `PerspectiveCamera`, `Vector3` and `Group` work in node) proving the order-sensitive facts: the policy rescale happens once per policy change, the first frame hides the boot loader and uses the start view, the loop wrap runs only with a loop window, the readouts carry the hover and pick targets. Tests for `sceneCamera.ts`, `sceneTargets.ts` and `sceneBodies.ts` (0% to 10% covered today, no DOM dependency) cover their branches (STYLE-03).
5. Behaviour evidence (TEST-03): the existing tests named in evidence pass unchanged, including `tests/scenePlacement.ts` users, `tests/sceneFraming*.test.ts`, `tests/scenePicking*.test.ts` and `tests/viewLink*.test.ts` or their actual names. No per-Task browser run (AGENTS.md rule); the engine set runs at the Full Objective Check.
6. Gates: `npm run typecheck`, `npm run build`, `npm test`.

## Context Files

`src/app/AstraeusScene.tsx`, `src/app/sceneCamera.ts`, `src/app/sceneTargets.ts`, `src/app/sceneBodies.ts`, `src/app/sceneBodySets.ts`, `src/app/sceneDebug.ts`, `src/app/sceneHooks.ts`, `src/app/scenePicking.ts`, `src/app/sceneFraming.ts`, `src/app/sceneLayout.ts`, `src/app/CameraController.tsx`, `tests/scenePlacement.ts`, `.savepoint/Guardrails.md`.

## Design References

Design: Components/Codebase Map row for `src/app/scene*.ts` (O-017's split, which this continues); "Shell layout (O-020)". O-037 Why (complexity cause), Planned Technical Decisions on the frame pipeline.

## Guardrails

ARCH-01, ARCH-02, ARCH-04; TEST-01, TEST-03; CODE-01; STYLE-01, STYLE-02, STYLE-03, STYLE-10.

## Implementation Plan

1. Write the frame context type and move the callback body into stage functions one stage at a time, running the tests after each move.
2. Move the pointer effect.
3. Add the stage tests and the three module tests.
4. Gates; record the lizard and ESLint readings for the touched files.

## Boundaries

Behaviour-preserving only: no new readouts, no change to draw order, camera limits, picking or labels; no change to `src/app/App.tsx`; no browser run.

## Technical Verification

Named existing tests plus the new stage and module tests; handoff gates per AGENTS.md's Verification Policy; engine browser set and owner look at the Full Objective Check (see `agent-skills/references/check-method.md`).

## Technical Evidence

Pending execution: stage list, test names and results, complexity readings before and after, files read and changed.

## Drift Notes

Record architecture deltas (the stage pipeline and the rule that new per-frame work is a stage) for the reconciliation Task.
