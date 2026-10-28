---
id: T-183
title: Open on today and let phones zoom under a story panel
objective: O-044
status: planned
depends_on: []
owner_validation: {required: true}
planned_by: {role: planner, session: g012-planning-20261026}
---

# Open on today and let phones zoom under a story panel

## Outcome

A scene with no `setTime` and nothing that sets its own span (no trajectory, activity or timeline window) opens at the current time, with the month window kept around it; today it opens 15 days back because the clock starts at the window's start (`windowOf` and `clockOf` in `api/scene.ts`; showers finding G5). On a phone, wheel or pinch input over an open story-panel sheet zooms the scene instead of being swallowed (finding G8).

## User Check

On the `localhost:5490` preview at phone size, open a story panel on a shower and zoom with the wheel or a pinch over the sheet: the scene zooms and the panel stays readable. One look at the end of O-044, per the browser policy.

## Done When

- Default time: a node test builds a scene with only `sun` and `earth` and no `setTime` (fake clock fixed to a known instant) and finds the clock opening at that instant within the window; a scene with `setTime`, a trajectory or `setTimeline` opens exactly as before (existing tests named in evidence, TEST-03).
- Phone panel: a DOM test dispatches a `wheel` over the open phone sheet and shows it reaches the camera control (or is forwarded to it) without closing or scrolling the sheet when it has nothing to scroll; desktop panel behaviour unchanged.
- No collision or overlap introduced at 375x667 or 1280x720 (owner standing rule for panels).
- Hand-off gates green; owner validation recorded after the Objective's browser run.

## Context Files

`packages/astraeus/src/api/scene.ts` under `windowOf` and `clockOf`, `packages/astraeus/src/app/openClock.ts`, `packages/astraeus/src/shell/StoryPanelView.tsx`, `packages/astraeus/src/shell/phone.css`, `packages/astraeus/src/app/CameraController.tsx`, `packages/astraeus/tests/publicApiStory.test.ts`, `packages/astraeus/tests/domStory.test.ts`, `packages/astraeus/tests/cameraAndNamesDom.test.ts`, `docs/agents/browser-policy.md`.

## Design References

Design Interfaces and Data Flow (clock and timeline); Components/Codebase Map (`src/shell/` story panels).

## Guardrails

ARCH-02, TEST-01, TEST-02, TEST-03, STYLE-10.

## Implementation Plan

1. Start the clock at the chosen time (or now) when nothing sets a span; tests.
2. Let wheel and pinch over the phone sheet reach the camera control; tests.

## Boundaries

No change to the window length, timeline layout or panel wording; no new public option; no screenshots (project rule); no browser runs per step.

## Technical Verification

Focused node and DOM tests; hand-off gates. The owner's look and `npm run check:browser` happen once at the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Defer Design notes to T-184 (the O-044 integration step), named in the note.
