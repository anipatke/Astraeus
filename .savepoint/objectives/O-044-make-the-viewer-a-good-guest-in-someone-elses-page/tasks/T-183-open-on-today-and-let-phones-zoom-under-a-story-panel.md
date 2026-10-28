---
id: T-183
title: Open on today and let phones zoom under a story panel
objective: O-044
status: done
depends_on: []
owner_validation:
  required: true
  accepted_check: C-119
  scope: ['phone story sheet on localhost:5490 (app.html?experience=showers): wheel or pinch over the open sheet zooms the scene, the sheet stays open, drag down still closes it']
  accepted_by: {role: owner, session: o044-run-20261028}
  accepted_at: '2026-10-28T10:45:09Z'
  note: 'Owner look on the preview: "carry on"; recorded in the Task body by the coordinator and recorded against C-119 (CLEAR) under the O-044 run rules.'
planned_by: {role: planner, session: g012-planning-20261026}
check_waiver:
  task: T-183
  reason: 'Owner said "orchestrate O44"; under the standing run rules (no per-step checks, one Full Objective Check at the end), the optional Task Check is waived. Owner validation (phone look) is still owed before the Full Objective Check.'
  actor: {role: owner, session: o044-run-20261028}
  recorded_at: '2026-10-28T10:41:06Z'
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

- Default time: `spanOf` in `api/scene.ts` reads `Date.now()` once when no setTime, no timeline window and no tracked span exist; the month window is centred on it and the clock opens at it. Test `publicApiStory.test.ts` "the opening moment with nothing setting a span" (fake clock fixed at 2026-06-15T12:00Z): a Sun-less earth+moon scene opens at that instant, window = now +/- 15 days. Unchanged paths: same file's second test (trajectory span opens at T0, setTime opens at T0) and the existing setTime/setTimeline tests (TEST-03), all green.
- Phone panel: new `shell/useZoomThrough.ts`, used by `StoryPanelView`. On a phone (shell `data-phone="true"`) a wheel over the sheet, when it has nothing to scroll, is preventDefault-ed and re-dispatched as a wheel on the scene canvas, where `attachOrbitGestures` already zooms; a two-finger pinch (touch events) is forwarded as a wheel of 5x the spread change (matching the 0.006/0.0012 sensitivities), negative when spreading. `phone.css` sets `touch-action: pan-y` on the phone story sheet so the browser leaves the pinch to the page. Tests in `domStory.test.ts` "zoom through a phone sheet": wheel reaches the canvas and the sheet stays open; pinch spread/close gives -100/+150; a scrollable sheet keeps its wheel; wide screen forwards nothing. T-181's Escape-yield handler untouched.
- Overlap: no layout change (no new elements, sizes or positions); only `touch-action` added. 375x667 and 1280x720 geometry is as before, so no new collision (reasoned from CSS, not measured).
- Gates: lint, typecheck, build, npm test (142 files, 1871 passed, 1 skipped) all green.
- Owner validation pending: owner's phone look and `npm run check:browser` are owed at the Full Objective Check. Real-device pinch and wheel feel are unverified.

## Drift Notes

Defer Design notes to T-184 (the O-044 integration step), named in the note.

- For T-184: Design clock/timeline data flow should say a scene with no span and no setTime opens at now (window now +/- 15 days). `src/shell/` map: story sheet forwards phone zoom to the canvas via `useZoomThrough`.

### Owner validation

2026-10-28T10:45:09Z, owner (session o044-run-20261028), asked to try wheel and pinch over the open phone story sheet on localhost:5490 (app.html?experience=showers): "carry on". Recorded by the coordinator; the accepted Check is filled in at the Full Objective Check.
