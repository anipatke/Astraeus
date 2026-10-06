---
id: T-012
title: Label source anchors in the scene with an on/off toggle
objective: O-002
status: done
depends_on: []
owner_validation:
    required: true
    accepted_check: ""
planned_by: {role: planner, session: t009-rework-2026-10-06}
check_waiver:
    task: T-012
    reason: Owner completed this Task via the board without requesting a Task Check.
    actor:
        role: owner
        session: board-owner
    recorded_at: "2026-10-06T04:38:08Z"
---

# Label source anchors in the scene with an on/off toggle

## Outcome

Each source-anchor dot can show a small text label with its ID (for example "A-33"), so discontinuities can be matched to anchors by eye. A HUD toggle turns the labels on and off; they start off.

## Owner Request

Requested by the owner on 2026-10-06 as a diagnostic aid for the I-006 investigation.

## User Check

Click "Anchor labels". Small labels appear beside the white anchor dots on Columbia's and Eagle's paths and stay attached while the camera moves and time plays. Click again and they disappear. Scientific readouts do not change.

## Done When

1. `TrackedBody` gains an optional label per anchor, with the same length as `anchorTimesUtcMs` and checked at construction. The mission module supplies the anchor IDs from the generated data. `src/core/` and the scene code stay mission-free.
2. Labels sit at the same mapped, floating-origin positions as the anchor dots, under both scales. They are presentation-only: nothing feeds back into State. Anchors behind the camera are not labelled.
3. A HUD toggle button turns the labels on and off (default off), with `aria-pressed` state like the other toggles.
4. Tests cover the label/anchor length check and the screen-projection helper (including the behind-camera case). Configured gates pass. A browser check confirms 0 console errors and a screenshot with labels on.

## Context Files

`src/app/mission.ts`, `src/app/TrackedBodyView.ts`, `src/app/EarthMoonScene.tsx`, `src/app/App.tsx`, `src/app/style.css`, `src/mission/apollo11.ts`, `tests/missionScene.test.ts`.

## Design References

Design: Components (src/app scene, tracked-body view).

## Guardrails

TEST-01, TEST-03, STYLE-07.

## Implementation Plan

1. Add the optional anchor labels to `TrackedBody` and supply them from the mission module.
2. Add a DOM label layer projected from the anchor dots' local positions.
3. Add the toggle to the HUD.
4. Write the tests and run the browser check.

## Boundaries

Presentation only. No change to State, trajectories, data or the reconstruction.

## Technical Verification

Configured gates plus a headless browser screenshot. A Check follows `agent-skills/references/check-method.md`.

## Technical Evidence

Executor evidence for a later Check; not a Check, and no `CLEAR` is claimed. Built in the same conversation as the T-009 rework and T-010.

**Per-criterion outcomes**

1. Met. `TrackedBody.anchorLabels?` (`src/app/mission.ts`) and `anchorLabelsOf()` return null when the field is absent and throw a RangeError on a count mismatch; `TrackedBodyView` calls it in its constructor. `src/mission/apollo11.ts` supplies `file.anchors[].id`. There are no mission names in `src/app/` or `src/core/` (the labels come from data).
2. Met. `src/app/AnchorLabels.ts` `AnchorLabelLayer` reads each dot's drawn local position (`TrackedBodyView.anchorLocalPosition`, which is the same buffer as the dot) and projects it with the camera. `projectToScreen` returns null behind the camera or off screen. It is a DOM layer with `pointer-events: none` that writes nothing back into State.
3. Met. The HUD has an "Anchor labels" button with `aria-pressed`, off by default, driving `SceneControls.showAnchorLabels`.
4. Met. 4 new tests in `tests/missionScene.test.ts` "anchor labels (presentation only)": IDs in anchor order; labels optional and mismatches rejected; projection on screen, behind the camera and off screen; label position equals the drawn dot and State is unchanged. Browser (`tools/validate/browser-anchor-labels.mjs`, headless SwiftShader at 1969-07-22 20:30 UTC): 0 errors; 0 labels while off; 40 labels after the toggle (27 Columbia + 13 Eagle); `aria-pressed` true; the layer is hidden after toggling off. Screenshot: `docs/evidence/spike02/anchor-labels-overview.png`.

**Commands:** `npm run typecheck` pass; `npm run build` pass; `npm test` 7 files / 120 tests pass. Lint: none configured.

**Files changed:** `src/app/mission.ts`, `src/app/TrackedBodyView.ts`, new `src/app/AnchorLabels.ts`, `src/app/EarthMoonScene.tsx`, `src/app/App.tsx`, `src/app/style.css`, `src/mission/apollo11.ts`, `tests/missionScene.test.ts`, new `tools/validate/browser-anchor-labels.mjs`, the new screenshot, this Task and `.savepoint/router.md`.

**Limitations:** Labels in dense clusters (for example lunar orbit, or A-33/A-34 eleven seconds apart) overlap; zoom in to separate them. There is no occlusion: a label stays visible when its dot is behind a body. Checked only in headless software GL.

