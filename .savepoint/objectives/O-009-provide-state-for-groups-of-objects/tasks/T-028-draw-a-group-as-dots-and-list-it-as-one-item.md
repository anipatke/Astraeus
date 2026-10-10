---
id: T-028
title: Draw a group as dots and list it as one item
objective: O-009
status: done
depends_on: [{task: T-027, requires: clear}]
owner_validation:
    required: false
    accepted_check: ""
planned_by: {role: planner, session: o009-plan-2026-10-11}
check_waiver:
    task: T-028
    reason: Owner completed this Task via the board without requesting a Task Check.
    actor:
        role: owner
        session: board-owner
    recorded_at: "2026-10-10T21:42:09Z"
---

# Draw a group as dots and list it as one item

## Outcome

An experience can switch on a dots layer and hand the app its groups. Each group is drawn as points at true or readable scale, hidden outside its valid time, and appears as one item the viewer can select, focus, follow and read the provenance of.

## Astraeus Hypothesis

- **Capability tested:** the presentation pipeline reused for a population without provider-specific logic.
- **Contract reused:** `ExperienceDefinition` and `SceneLayerId`, `ExperienceObject`, `FocusId`/`CameraRequest`, `ScalePolicy`, `FloatingOrigin`, `eqjToRenderVector`, centre composition (`referenceCenters.ts`), `createMetrics`.
- **Gap or hypothesis:** the scene draws only single tracked bodies. The hypothesis is that one generic `points` layer plus a group list in the plug-in contract is enough, with no shell change.
- **Generic change:** `points` in `SceneLayerId`, a `groups` list on `ExperienceDefinition`, a points scene view in `src/app/`, and group focus/follow in the camera path.
- **Perseids-independent evidence:** contract tests with a made-up group fixture inside the tests; the made-up experience in the next Task.

## User Check

Read the Technical Evidence: the layer list matrix (with and without `points`), the scale cases and the out-of-bounds case, all from tests.

## Done When

1. Objective SC4: `points` is an opt-in layer. Without it no group is drawn, and with it each group is drawn from one batch fill per frame into a reused buffer (no per-member State per frame).
2. Sun-centred groups are composed to the scene's Earth-centred placement through the existing centre composition. A test compares one member's render position with the composed single-member State.
3. True and readable scale both map group positions through `ScalePolicy`. A test shows the group's State is unchanged after a scale switch and a camera move (ARCH-02).
4. Outside the group's bounds nothing is drawn and no fill is called. At the boundary times it is drawn.
5. Each group appears once in the shell's object list. Select, focus and follow target its declared representative point, and the information panel shows its provenance and known limitations.
6. Layer matrix through the same App path: empty, tracked-only, points-only, earth-moon + points, all three, and duplicates. Apollo (no `points`) is unchanged: existing tests pass unmodified, and every changed test is named (TEST-03).
7. `src/shell/` and existing `src/core/` contracts are unchanged. The name check covers the new app files.

## Context Files

`.savepoint/objectives/O-009-provide-state-for-groups-of-objects/Objective.md`, `src/app/experienceDefinition.ts`, `src/app/App.tsx`, `src/app/EarthMoonScene.tsx`, `src/app/TrackedBodyView.ts`, `src/app/CameraController.tsx`, `src/app/sceneLayout.ts`, `src/app/renderCoordinates.ts`, `src/app/floatingOrigin.ts`, `src/app/SceneLabels.ts`, `src/app/metricReadouts.ts`, `src/core/referenceCenters.ts`, `src/shell/experience.ts`, `src/shell/objectModel.ts`, `tests/experiencePlugIn.test.ts`, `tests/experienceDefinition.test.ts`, `tests/sceneTransforms.test.ts`, `tests/missionScene.test.ts`, plus the group contract file created by T-027.

## Design References

Design: Interfaces and Data Flow, Experience plug-in boundary, its deferred notes (camera limits).

## Guardrails

ARCH-01, ARCH-02, ARCH-03, PROV-01, TEST-01, TEST-03, STYLE-01, STYLE-05, STYLE-07, STYLE-10.

## Implementation Plan

1. Confirm the T-027 group contract and its single-member read exist. If the contract needs changing to be drawn, return REPLAN REQUIRED.
2. Add `points` and `groups` to the plug-in contract with layer helpers like `trackedBodiesOf`.
3. Build a points view that owns a reused Float64 buffer, fills it once per frame, composes to Earth-centred when needed, applies scale and floating origin, and narrows to the GPU buffer.
4. Add each group as one shell object, and resolve focus/follow to its representative point.
5. Write the layer matrix, composition, scale/ARCH-02 and bounds tests with a small group fixture inside the tests.
6. Run the gates and all five existing browser scripts.

## Boundaries

No made-up experience entry or new browser script (next Task). No per-member picking, camera-limit changes, new metric kinds or shell component changes.

## Technical Verification

Focused tests while iterating. Handoff runs `npm run typecheck`, `npm run build`, `npm test`, and the scene-affecting fuller gate: `browser-shell.mjs`, `browser-spike03.mjs`, `browser-spike02.mjs`, `browser-anchor-labels.mjs` and `browser-synthetic.mjs` with zero console errors, writing to a fresh run directory under `docs/evidence/o009-<task>-run1/`. Optional Task Check per `agent-skills/references/check-method.md`.

## Technical Evidence

Run 2026-10-11 by the executor session (not a Check; these are claims for a fresh Check to verify).

**Per-criterion outcomes** (`tests/pointsLayer.test.ts`, 20 tests):
1. `points` is opt-in: the layer-matrix tests show no group and no shell item without it. With it, each group is one `PointsView` with one reused Float64 fill buffer, filled by one `fillPositionsKm` call per refill (no per-member `State`). Pass.
2. Sun-centred composition: a test compares member 7's render position with `composeCenteredPositions(stateAt(7), sunPositionFromEarthAt)` mapped through ScalePolicy (float32 tolerance). Pass.
3. Scale and ARCH-02: a test switches true to readable scale and moves the floating origin. Positions follow `ScalePolicy` at both scales, `stateAt` is deep-equal before and after, and the fill count stays 1 (a scale switch remaps, never refills). Pass.
4. Bounds: before start and after end nothing is visible and the fill count is 0; at both boundary times the group is drawn. Pass.
5. Shell item: each group appears once even when listed twice, carries the group's provenance, bounds and limitations, and focus/follow presets resolve to its id. The scene resolves focus, follow and label to the centroid. Pass in tests; reading a group's info panel in a live browser is T-029's script (see Limitations).
6. Matrix: empty, tracked-only, points-only, earth-moon + points, all three, duplicates. Apollo: `groupsOf` is empty and `experienceWithGroups` returns the same config object. No existing test was edited by this Task (TEST-03); the only test file added is `tests/pointsLayer.test.ts`.
7. `src/shell/` and existing `src/core/` files were not edited. The existing generic-boundary name check over `src/app/*` passes with the new files.

**Commands run:** `npm run typecheck` pass; `npm run build` pass; `npm test` 14 files / 226 tests pass. Browser: dev server on port 5199, then `browser-shell.mjs`, `browser-spike03.mjs`, `browser-spike02.mjs`, `browser-anchor-labels.mjs` and `browser-synthetic.mjs` with `PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js`; all exit 0 with `errors: []`. Output is in the fresh directory `docs/evidence/o009-t028-run1/` (logs and per-script folders). Earlier spike evidence was not touched.

**Mitigation delivered:** the Objective's recorded owner decision (refill only after the clock moves a set amount) is built in as `GroupLayer.refillAfterMs`, default 60 000 simulation ms, tested forwards and backwards (seek). The Full Objective Check re-measures its effect.

**Extra reads (beyond Context Files):** `src/core/pointGroup.ts` and `src/core/orbitGroup.ts` (the T-027 contract the Task builds on), `src/core/provenance.ts` (fixture shape), `src/synthetic/syntheticDefinition.ts` (base for the test definition), `src/shell/ObjectControls.tsx` and `AstraeusShell.tsx` by search (to learn that camera presets come from the experience), `tools/validate/*.mjs` headers (output paths).
**Files changed:** `src/app/experienceDefinition.ts`, `src/app/EarthMoonScene.tsx`, `src/app/App.tsx` (additive); new `src/app/PointsView.ts`, `tests/pointsLayer.test.ts`, `docs/evidence/o009-t028-run1/`.

**Limitations:** no real WebGL pixels were drawn for a group yet (the made-up experience, its browser script and the owner's visual look are T-029). Groups centred on the Moon are rejected with a clear error; only Earth and Sun are composed. The 10^4 fill cost and the throttle's effect were not re-measured here (Full Objective Check). A centroid far from the camera can sit beyond the camera far plane; camera reach is the open gap carried to O-011.

## Drift Notes

Architecture deltas for T-029 to reconcile into Design.md (each either reflected there or marked non-architectural, with a reason):
- Plug-in contract: `points` in `SceneLayerId`; optional `groups: GroupLayer[]` on `ExperienceDefinition`; helpers `groupsOf` and `experienceWithGroups` (one shell item per group, deduplicated by id).
- New app file `PointsView.ts`: one reused Float64 buffer per group, throttled refill (`refillAfterMs`, presentation only), centre composition via `sunPositionFromEarthAt`, representative point = centroid, drawn in the tracked-body render pass.
- Camera path: a group id is a `FocusId`; focus and follow resolve to the centroid; default framing uses the group's extent (no limit change).
- Camera presets for a group are supplied by the experience, not generated by the app.
