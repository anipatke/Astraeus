---
id: T-022
title: Show common measurements as compact, reusable visuals
objective: O-005
status: planned
depends_on: [{task: T-018, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: owner-metric-visuals-2026-10-09}
---

# Show common measurements as compact, reusable visuals

## Outcome

The reusable shell has a small vocabulary of Metric Visuals: compact readouts where the number and unit come first and a minimal visual adds context. Three or four representative types are built first and replace text-heavy measurements in the current Apollo UI. Each has one configuration contract (type, value, unit, reference body/frame and, where it applies, a meaningful reference or range) and a numeric-only fallback. A second experience configuration with no Apollo naming renders the same components unchanged, which shows they can be reused.

Replaces the earlier T-022 scope (spacecraft range tape, signed range-rate and trend trace, planned 2026-10-07). Owner brief: `docs/ASTRAEUS_SPIKE_03_METRIC_VISUALS_BRIEF.md`.

## User Check

In the Apollo experience, compare the measurements before and after: speed, distances and lunar illumination, plus whichever other types were chosen. Read each value and unit at a glance. Confirm that each visual adds meaning (a real reference, a range or a phase shape) rather than decoration, and that the panel feels less text-heavy. Check at 1280×800 and mobile portrait. Record your verdict on each indicator.

## Done When

1. A short review of the current Spike 03 UI records which text-heavy measurements were chosen as the first 3–4 types and why, and which types were deferred for lack of demonstrated need. Speed, Distance and Phase are the expected first candidates because they already appear as text or ad-hoc cards.
2. Metric Visuals live in `src/shell/` as generic presentation components with one typed configuration contract. They contain no mission, experience or dataset names (ARCH-01) and no Apollo-specific branching. They are not a charting framework.
3. Values come from existing scientific State or experience-provided data. The components never change State and never repeat a scientific calculation (ARCH-02, STYLE-07). A named test shows State is identical at a fixed time with the visuals mounted, updated and removed.
4. A visual that needs a reference or range (a speed arc, a distance bar) draws it only from a configured or State-provided reference. Nothing is invented to fill a dial. When no meaningful reference exists, the component falls back to numeric-only, and named tests cover both paths.
5. Each readout states its units, plus its reference body and frame where that applies. Uncertainty, where configured, shows as a range or ± value without implying false precision (PROV-01). Values and labels are readable without colour or hover and have accessible text alternatives.
6. The same metric type looks the same everywhere it appears: same sizing, type scale and the existing Astraeus palette, with restrained colour and no unnecessary animation. Readouts fit small panels and mobile portrait without covering much of the canvas.
7. A non-Apollo fixture configuration (in tests, not a built experience) renders the chosen types through the same components without modification. This is the reuse evidence.
8. `docs/ASTRAEUS_METRIC_VISUALS.md` documents the component set, the configuration contract, the reference/fallback rule, and the deferred types with the need that would justify each one.
9. Browser validation covers the visuals at 1280×800 and mobile portrait with zero console errors. Configured gates pass fresh. Owner visual validation is recorded after that evidence.

## Context Files

`docs/ASTRAEUS_SPIKE_03_METRIC_VISUALS_BRIEF.md`, `docs/ASTRAEUS_SPIKE_03_BRIEF.md`, `docs/PLANETARY_EXPLORER_UI_AUDIT.md`, `.savepoint/objectives/O-005-reusable-astronomy-ui-shell/Objective.md`, `.savepoint/objectives/O-005-reusable-astronomy-ui-shell/tasks/T-018-let-viewers-pick-objects-and-switch-overview-focus-and-follow.md`, `.savepoint/objectives/O-005-reusable-astronomy-ui-shell/tasks/T-019-show-object-information-data-trust-and-the-scale-choice-on-request.md`, `src/shell/experience.ts`, `src/shell/objectModel.ts`, `src/shell/AstraeusShell.tsx`, `src/shell/style.css`, `src/app/App.tsx`, `src/app/MissionPanel.tsx`, `src/app/DebugOverlay.tsx`, `src/app/mission.ts`, `src/app/style.css`, `src/mission/apollo11.ts`, `tests/missionScene.test.ts`, `tools/validate/browser-shell.mjs`.

## Design References

Design: Interfaces and Data Flow (State, scale and presentation). Brief sections 3, 4 and 9; Metric Visuals brief in full.

## Guardrails

ARCH-01, ARCH-02, PROV-01, TEST-01, TEST-03, STYLE-01, STYLE-05, STYLE-07, STYLE-09.

## Implementation Plan

1. Review the current UI (MissionPanel telemetry and metric cards, DebugOverlay, timeline) and choose the first 3–4 types. Record the choice in the evidence.
2. Confirm that each chosen visual's reference or range exists in State or can honestly be configured. Where it cannot, plan that type as numeric-only. Return `REPLAN REQUIRED` only if no honest reference exists for any visual type.
3. Define the metric configuration contract in `src/shell/` and build the components with a shared visual grammar and numeric-only fallback.
4. Replace the chosen Apollo text readouts through configuration. Keep the existing browser selectors working or update them with named equivalents.
5. Add named tests (State independence, reference/fallback paths, non-Apollo fixture) and browser scenarios at desktop and mobile. Write the contract doc and run the gates.

## Boundaries

Stays within Spike 03. No redesign of the UI shell, no general charting or visualisation framework, no generic direction indicator, no new scientific calculations, and no changes to `src/core/`, `ScalePolicy` or generated data. Remaining metric types (Relative distance, Altitude, Progress, Uncertainty, Coordinates) are built only where this Task demonstrates a need; otherwise they are recorded as deferred. Range-rate and trend instruments from the superseded scope are not required.

## Technical Verification

Focused tests during iteration. At handoff, fresh configured gates plus the scene-affecting browser validation under `tools/validate/` at 1280×800 and mobile portrait with zero console errors. Owner visual validation follows.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas and reconcile through the planner before Check.
