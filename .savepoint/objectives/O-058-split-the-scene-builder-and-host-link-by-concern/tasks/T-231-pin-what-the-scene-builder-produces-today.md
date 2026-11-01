---
id: T-231
title: Pin what the scene builder produces today
objective: O-058
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: o058-planning-20261101}
---

# Pin what the scene builder produces today

## Outcome

A characterisation test records exactly what today's `Scene` produces, so every later step of the split can show it changed nothing (O-058 Success Condition 1).

## User Check

Not owner-facing: an internal refactor with no change a host or visitor can see. The owner sees the result at the end of the Objective.

## Done When

- New `packages/astraeus/tests/scenePin.test.ts` builds a set of scenes through the public `Scene` (import from `astraeus`) that together use every concern: catalogue bodies with each `addBody` option, a listed moon, `addBodyFromElements`, moon and Sun orbit lines, `addTrajectory` from samples and from a provider, `plane: "ecliptic-j2000"`, anchors, every readout kind, `lineFixedTo` as a body, a stretch list and `"auto"`, `labelReach`, `provenanceSpans`, `addGroup` with and without a clump and with a rate readout, `addActivity`, `addEvents` with batch and own provenance, `addStoryPanels`, `setTimeline` (span, rates, pacing spans and event rules, loop, `{ none: true }`), `setScale` (each scale, `only`), `setSwitches`, `setViews` with each camera rule, `camera.follow`/`lookAt`/`setReach`/`fitOrbit`, `up: "ecliptic"`, plus a scene with no time set (opening time fixed with a faked clock, so the pin is deterministic) and the synthetic scenes in `packages/astraeus/src/synthetic/` that build on `Scene`.
- For each scene it records, as plain JSON in `packages/astraeus/tests/fixtures/scenePin.json` (`toMatchFileSnapshot`): the `toDefinition()` data fields (functions as a marker, the catalogue as its ids, each trajectory as its bounds and its states at its start, middle and end), the definition after `await prepare()` (the layers and lines `prepare` adds), `createMetrics` output for each object at two times, and `stateOf`/`provenanceOf` for each object. Both orders are covered: `toDefinition` before the planet series are loaded (deferred groups, Sun lines and `"auto"` stretches) and after.
- It also records the `SceneError` code and message for a list of bad builds, at least one per error each concern throws today (at the call and at `toDefinition`, including which error wins when a scene has two faults).
- The pin passes on the unchanged tree; shown failing once by a planted change (for example one message word in `scene.ts`), then reverted; both runs recorded. No file under `packages/astraeus/src/` changes in this step.
- **Gates:** `npm run lint`, `npm run typecheck`, `npm run build` and `npm test` pass; `git diff --exit-code main -- packages/astraeus/api-surface.lock.json packages/astraeus-site/tests/` is empty. No browser run.

## Context Files

`packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/api/index.ts`, `packages/astraeus/src/synthetic/syntheticJourneyScene.ts`, `packages/astraeus/src/synthetic/syntheticProbeDefinition.ts`, `packages/astraeus/src/synthetic/syntheticViewsDefinition.ts`, `packages/astraeus/tests/syntheticJourney.test.ts` (how a test loads the planet series), `packages/astraeus/src/app/experienceDefinition.ts` (the definition's fields).

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`, `Public API shape (G-016, owner 2026-11-01)` and `O-053 checks (Guardrails API-01 to API-07)`; the O-058 Objective under `Architectural Considerations` (planned module layout).

## Guardrails

TEST-01, TEST-03, API-01; STYLE rules (advisory).

## Implementation Plan

1. Mark this step `in_progress` before any work.
2. Write a small serialiser for a definition (data fields as they are; functions, trajectories, catalogue and resolver-bound parts reduced to stable values).
3. Build the scene list and the bad-build list; pin to the JSON file.
4. Prove it fails on a planted change; revert; run the gates.

## Boundaries

Test only: no source change. Do not edit existing tests. Keep it fast (target under 5 s) and offline: no data packages beyond what the engine tests already use, no network.

## Technical Verification

Focused tests while iterating (`npx vitest run <files>`); at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, `docs/agents/build.md`). No browser run; the one `npm run check:browser` belongs to the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution: each Done When item with its command and result, files read and changed, and limitations.

## Drift Notes

Record any architecture delta here and name the last Task of O-058 (Design.md reconciliation) as where it is accounted for (AGENTS.md, Deferred Design reconciliation).
