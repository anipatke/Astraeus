---
id: T-219
title: Show the view choice and hide what other views own
objective: O-051
status: done
depends_on: [{task: T-218, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-219, reason: 'Owner said "Let''s do the scene switching now" under the standing run rules (no per-step checks, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o051-run-20261101}, recorded_at: '2026-10-31T23:09:07Z'}
planned_by: {role: planner, session: o051-plan-20261101}
---

# Show the view choice and hide what other views own

## Outcome

A visitor picks a view in the viewer bar (or the switch panel, and in the phone drawer), and the viewer at once shows only that view's paths, bodies, labels, events, story panels and story markers, keeping time, speed and playing state (I-124, viewer half).

## User Check

Not owner-facing on its own; the owner looks once at the end of the Objective (last step).

## Done When

- The view choice renders where `place` says, with the look and keyboard behaviour of the existing switch buttons (reuse `SwitchControl`/`DisplaySwitches` presentation, not the address-navigation `switcher` behaviour), current view `aria-pressed`. Phone layout from the start: no overlap at 375x667 and 1280x720 (checked by DOM tests at those sizes now, browser in the last step).
- The current view is App state (like the display switches) feeding one per-id visibility set in `SceneControls`. Frame stages hide hidden paths and bodies (their groups, markers, labels, orbit lines and picking targets) without rebuilding `buildRuntime`; the object menu, `relatedObjects`, timeline events, `navigationStops`, the info card's events, story panels (auto-open included) and 3D story markers show only the view's items.
- Switching does not touch the clock: time, rate and playing state are the same before and after (test). A selected or followed object that leaves the view is deselected and the camera falls back as today's unavailable-object effect does (the per-view camera rule replaces this in the next step).
- A scene without views renders exactly as today (existing DOM tests pass unchanged).
- DOM/component tests on made-up configurations: two made-up paths in two views plus a shared body; switch; assert menu, markers, panels and the visibility set; clock unchanged.
- CHANGELOG `Unreleased` line.

## Context Files

`packages/astraeus/src/app/App.tsx`, `packages/astraeus/src/app/displaySwitches.ts`, `packages/astraeus/src/app/sceneFrame.ts`, `packages/astraeus/src/app/sceneHooks.ts`, `packages/astraeus/src/app/sceneContentsHooks.ts`, `packages/astraeus/src/shell/AstraeusShell.tsx`, `packages/astraeus/src/shell/TopBar.tsx`, `packages/astraeus/src/shell/DisplaySwitches.tsx`, `packages/astraeus/src/shell/SwitchControl.tsx`, `packages/astraeus/src/shell/ObjectControls.tsx`, `packages/astraeus/src/shell/objectModel.ts`, `packages/astraeus/src/shell/TimelineBar.tsx`, `packages/astraeus/src/shell/infoModel.ts`, `packages/astraeus/tests/displaySwitches.test.ts`, `packages/astraeus/tests/domShell.test.ts`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, TEST-01, TEST-02, TEST-03, TEST-04, CODE-01, CODE-02; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Confirm the previous step's resolved views exist on the definition; return REPLAN REQUIRED if not.
3. View state and the visibility set; hide in the frame stages; filter the shell lists in one place.
4. The bar control and phone drawer; DOM tests at both sizes.
5. CHANGELOG.

## Boundaries

No per-view camera rule and no host `setView` (next step); no runtime rebuild per switch; no change to the existing `switcher`, showers or planets demos; no State change (ARCH-02).

## Technical Verification

Focused tests while iterating; at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`). No browser run. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Per criterion:
- Control where `place` says, switch-option look, `aria-pressed`, phone drawer: `ViewButtons` (top bar, class `switch-control`/`switch-option`, so the existing desktop and phone drawer CSS applies) and panel rows in `SwitchPanel`; `tests/viewsDom.test.ts` (bar, panel, phone drawer). Pixel overlap at 375x667 and 1280x720 NOT measured here (DOM tests have no layout); left to the browser step. The group reuses `.switch-control` CSS, no new CSS.
- View is App state feeding one visibility set: `viewId` state in App; `controls.current.viewHidden = { objects, panels }` replaced on a switch; `applyViewVisibility` (sceneFrame stage 5b) sets each body, tracked, group, path and body-set group's `visible`; labels, pick candidates and story markers read the same set. No `buildRuntime` change. `tests/viewFrame.test.ts`.
- Shell lists in one place: `experienceInView` (app/viewHiding.ts) filters objects, events and story panels once; the shell, timeline, info card, auto-open and unavailable-object effect read it (a hidden selected or followed object falls back as an unavailable one). `tests/viewsDom.test.ts` (menu, events, panels).
- Clock untouched: switch handlers never touch the clock; test compares the clock readout, speed state and play control before and after two switches.
- Scene without views unchanged: `experienceInView` returns the same object; `viewHidden` empty; test asserts no choice and empty sets; full suite passes unchanged.
- Made-up configuration test: two paths in two views plus Both, shared bodies; hidden sets, menu, events, panels asserted per view.
- CHANGELOG Unreleased line added.

Repair evidence: new tests in `tests/viewFrame.test.ts` ("lines follow the body they belong to": hides a moon orbit line and a set orbit lines with their owner; shows them while the owner shows; hides a `partOf` object from lists/labels/taps) and `tests/viewsDom.test.ts` ("falls back when the selected object leaves the view"; "a moon and its orbit line": hidden only in the view without it, shown where shared). Rerun: lint, typecheck pass; `npm test` 170 files, 2110 passed, 1 skipped. Build and check:pack not rerun after the repair.

Commands (first run, all pass): `npm run lint`, `npm run typecheck`, `npm run build`, `npm test` (170 files, 2105 passed, 1 skipped), `npm run check:pack` (pass). No browser run.

Files read beyond Context Files: `packages/astraeus/src/app/views.ts` and `src/api/views.ts` (resolved view shape, universe of ids), `src/app/AstraeusScene.tsx` (SceneControls), `src/app/StoryMarkers.ts`, `src/app/scenePicking.ts`, `src/app/AnchorLabels.ts`, `src/shell/experience.ts`, `src/shell/storyPanels.ts`, `tests/appScreenDom.test.ts`, `tests/domSetup.ts` (patterns).

Files changed: src/app/viewHiding.ts (new), App.tsx, AstraeusScene.tsx, sceneFrame.ts, StoryMarkers.ts, shell/DisplaySwitches.tsx, TopBar.tsx, AstraeusShell.tsx, CHANGELOG.md, tests/viewsDom.test.ts (new), tests/viewFrame.test.ts (new).

Limitations: layout and overlap at both sizes unmeasured; no keyboard-event test beyond native buttons; hidden-object camera fallback relies on the existing unavailable-object effect (not separately tested); story-marker hiding tested at the layer, frame wiring by reading.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.

- Hiding rule: a view's hidden ids are the ids some view shows and this view does not (`hiddenByView`), not "everything outside the view's set", so objects no view set holds (sky, Sun-centred sun object, orbit lines with `partOf`) are never hidden by views. Reconcile into Design.md.
- New `SceneControls.viewHidden?: { objects, panels }` (presentation only, replaced on a switch); new frame stage `applyViewVisibility` between sync and placeViews outputs; `StoryMarkerLayer.update` takes the hidden sets.
- View choice shell types (`ViewChoice`) live in `shell/DisplaySwitches.tsx`; the choice reuses `.switch-control` CSS.
- Repair (coordinator, after hand-off): a line follows the visibility of the body it belongs to, from the link it already carries, so a view never names orbit lines. `hiddenByView` adds every experience object whose `partOf` is hidden (Sun-orbit lines: lists, labels, taps); `applyViewVisibility` hides a composition path (a moon orbit) with `layer.source.body` and an orbit set with its `layer.id`. This supersedes the earlier note that a hidden body kept its orbit line.
