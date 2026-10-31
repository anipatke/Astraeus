---
id: T-219
title: Show the view choice and hide what other views own
objective: O-051
status: planned
depends_on: [{task: T-218, requires: clear}]
owner_validation: {required: false}
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

Pending execution.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.
