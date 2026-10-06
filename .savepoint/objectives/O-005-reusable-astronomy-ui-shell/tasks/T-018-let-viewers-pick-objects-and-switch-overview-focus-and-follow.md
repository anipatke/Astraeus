---
id: T-018
title: Let viewers pick objects and switch overview, focus and follow
objective: O-005
status: planned
depends_on: [{task: T-017, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: g002-replan-2026-10-06}
---

# Let viewers pick objects and switch overview, focus and follow

## Outcome

A generic object picker and camera control let a viewer choose Earth, Moon, Columbia or Eagle (from configuration) and switch between overview, focus and follow with plain labels such as "Focus Earth", "Follow Columbia" and "Earth–Moon overview". Camera transitions are smooth, manual drag/zoom resumes after scripted movement, and a generic label primitive names bodies, spacecraft and event markers.

## User Check

Select each object; use Overview, Focus and Follow; drag and zoom after a transition; confirm labels are readable, do not obviously overlap at the overview, and hide when unsuitable. Confirm range and speed readouts in developer mode do not change when the camera changes at a fixed time.

## Done When

1. Selection is generic shell state; objects, display names and camera presets come from configuration.
2. Camera modes reuse `CameraRequest` / `OrbitCameraState`; transitions ease per the audit's donor pattern and restore manual control.
3. Camera and selection changes leave scientific State identical at a fixed time (named test, extending the existing focus-independence evidence).
4. A generic label primitive serves bodies, spacecraft and event markers, avoids obvious overlap where practical and can hide by zoom; `AnchorLabels` is either built on it or kept as a developer-mode diagnostic, as the audit decided.
5. Objects outside their trajectory bounds are shown as unavailable rather than selectable into an empty view.
6. No mission naming in `src/shell/`; core and data unchanged; configured gates pass.

## Context Files

`docs/ASTRAEUS_SPIKE_03_BRIEF.md`, `.savepoint/objectives/O-005-reusable-astronomy-ui-shell/Objective.md`, `docs/PLANETARY_EXPLORER_UI_AUDIT.md`, `src/app/CameraController.tsx`, `src/app/EarthMoonScene.tsx`, `src/app/TrackedBodyView.ts`, `src/app/AnchorLabels.ts`, `src/app/mission.ts`, `src/app/sceneLayout.ts`, `src/mission/apollo11.ts`, `tests/sceneTransforms.test.ts`, `tests/missionScene.test.ts`.

## Design References

Design: Interfaces and Data Flow (camera, floating origin, tracked bodies). Brief sections 3 (object selector, camera), 7, 8.

## Guardrails

TEST-01, TEST-03, STYLE-02, STYLE-05, STYLE-09, ARCH-01, ARCH-02, PROV-01.

## Implementation Plan

1. Add generic selection state and wire the picker to configuration.
2. Map overview/focus/follow to existing camera requests; add eased transitions from the audit's pattern.
3. Build the label primitive and apply it to bodies, spacecraft and event markers.
4. Handle out-of-bounds objects.
5. Tests for State independence, preset resolution and out-of-bounds handling; run gates.

## Boundaries

No info panel, provenance or scale UI (next Task). No floating-origin or `ScalePolicy` changes.

## Technical Verification

Focused tests; configured gates at handoff; browser script with 0 console errors covering each camera mode.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas and reconcile through the planner before Check.
