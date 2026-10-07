---
id: T-022
title: Prototype spacecraft range and motion instruments
objective: O-005
status: planned
depends_on: [{task: T-020, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: owner-instrumentation-2026-10-07}
---

# Prototype spacecraft range and motion instruments

## Outcome

The reusable shell presents configured spacecraft telemetry as compact instruments: a calibrated range tape, a signed closing/receding indicator, a distinct total-speed readout, and a small time-labelled trend trace. Their units, reference frame, tick marks and visual style are explicit and remain stable as simulation time advances.

## User Check

In Developer mode, inspect a spacecraft at several mission times. Read its range against the fixed reference marks, distinguish closing rate from total speed, and follow the trend's labelled time window. Confirm values and units are clear at 1280×800 and mobile portrait, with the selected spacecraft highlighted in Astraeus's dark, cream, lavender and orange visual style.

## Done When

1. Instrument components use generic shell interfaces and configured telemetry/reference data; `src/shell/` contains no mission or dataset names.
2. Range shows the exact numeric value, unit and reference centre beside fixed, labelled reference marks. Its calibration does not silently change during playback; any logarithmic mapping is visibly labelled and its ticks identify physical distances.
3. Relative range rate is derived only from position and velocity expressed in the same frame and centre. A zero-centred indicator labels negative values as closing and positive values as receding. Total speed remains a separate value with its frame stated.
4. A compact range or range-rate trend uses a fixed, labelled simulation-time window, identifies the current-time marker and handles unavailable trajectory intervals without implying data exists there.
5. Numeric values, accessible text alternatives, units, reference frames and calibration are available without relying on colour or hover. The visual treatment follows the existing Astraeus palette and type hierarchy.
6. Camera and instrument changes leave scientific State unchanged; named tests cover range-rate sign and magnitude, calibration stability and independence from camera/selection changes.
7. Browser validation covers the instrument states at 1280×800 and mobile portrait with zero console errors; configured gates pass fresh.

## Context Files

`docs/ASTRAEUS_SPIKE_03_BRIEF.md`, `.savepoint/objectives/O-005-reusable-astronomy-ui-shell/Objective.md`, `.savepoint/objectives/O-005-reusable-astronomy-ui-shell/tasks/T-018-let-viewers-pick-objects-and-switch-overview-focus-and-follow.md`, `.savepoint/objectives/O-005-reusable-astronomy-ui-shell/tasks/T-019-show-object-information-data-trust-and-the-scale-choice-on-request.md`, `.savepoint/objectives/O-005-reusable-astronomy-ui-shell/tasks/T-020-make-the-shell-work-on-every-screen-size-and-hand-it-over-for-visual-review.md`, `src/shell/experience.ts`, `src/shell/objectModel.ts`, `src/shell/style.css`, `src/app/App.tsx`, `src/app/MissionPanel.tsx`, `src/app/mission.ts`, `src/app/DebugOverlay.tsx`, `src/app/EarthMoonScene.tsx`, `src/core/state.ts`, `src/core/trajectory.ts`, `src/mission/apollo11.ts`, `tests/missionScene.test.ts`, `tests/controls.test.ts`, `tools/validate/browser-shell.mjs`.

## Design References

Design: Interfaces and Data Flow (State, trajectory, scale and presentation); brief sections 3, 4 and 9.

## Guardrails

TEST-01, TEST-03, STYLE-01, STYLE-05, STYLE-07, ARCH-01, ARCH-02, PROV-01.

## Implementation Plan

1. Verify the available trajectory position and velocity share a frame and centre; return `REPLAN REQUIRED` if the data cannot support an honest relative range rate.
2. Define the generic telemetry and fixed-reference configuration needed by the reusable shell.
3. Add the calibrated range tape, signed range-rate instrument, distinct total-speed value and labelled trend trace.
4. Keep units, reference frame, scale calibration and out-of-bounds state visible and accessible.
5. Add named calculation and calibration tests, then browser scenarios at desktop and mobile sizes.

## Boundaries

Keep the prototype in the existing reusable Astraeus shell and diagnostics surface. No flight-control semantics, mission-specific code in `src/shell/`, changes to `src/core/` or generated data, automatic unlabeled rescaling, or separate design-system package/publishing work.

## Technical Verification

Run the configured quality gates fresh. Add focused tests for the range-rate calculation and calibration rules. Run browser validation through the project's configured headless Chromium at 1280×800 and mobile portrait with zero console errors. Include owner visual validation and a Full Objective Check per `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas and reconcile through the planner before Check.
