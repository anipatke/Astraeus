---
id: T-017
title: Put a timeline bar around the canvas and move diagnostics behind a toggle
objective: O-005
status: planned
depends_on: [{task: T-016, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: g002-replan-2026-10-06}
---

# Put a timeline bar around the canvas and move diagnostics behind a toggle

## Outcome

The app opens on a canvas-first viewer UI: a generic shell in `src/shell/` driven by an experience configuration, with a persistent timeline bar (play/pause, current UTC date/time, speed, scrub/seek, previous/next event, event markers where practical, compact current-event title and an expandable event list). The existing debug controls and overlay are reachable only through a developer toggle.

## User Check

Open the app at 1280×800: the canvas dominates, the timeline bar is the only persistent control strip, play/pause/seek/speed work, previous/next event jumps to the 30 Apollo events in order and the current event title updates. Turn on developer mode and find the previous diagnostics.

## Done When

1. An experience configuration type (grown from `MissionConfig` per the audit) carries objects, events, timeline window and rates; Apollo supplies it from `src/mission/apollo11.ts`.
2. The timeline bar drives the existing `SimulationClock`; seeking and rate changes produce the same clock states as the previous controls (named tests).
3. Previous/next event and the "where am I / what just happened / what next" readout are derived from `TimelineEvent` data without changing the event model (named tests for boundaries: before first, on an event, after last).
4. Developer mode exposes every diagnostic the current `DebugControls`/`DebugOverlay`/`MissionPanel` show; default viewer mode shows none of them.
5. `src/shell/` has no mission naming; a test greps it for `apollo`, `columbia` and `eagle` (case-insensitive).
6. `src/core/` and generated data are unchanged; configured gates pass.

## Context Files

`docs/ASTRAEUS_SPIKE_03_BRIEF.md`, `.savepoint/objectives/O-005-reusable-astronomy-ui-shell/Objective.md`, `docs/PLANETARY_EXPLORER_UI_AUDIT.md`, `src/app/App.tsx`, `src/app/mission.ts`, `src/app/DebugControls.tsx`, `src/app/DebugOverlay.tsx`, `src/app/MissionPanel.tsx`, `src/app/style.css`, `src/mission/apollo11.ts`, `src/core/clock.ts`, `src/core/events.ts`, `tests/controls.test.ts`, `tests/missionScene.test.ts`.

## Design References

Design: Components/Codebase Map, Interfaces and Data Flow (clock, events). Brief sections 2, 3 (timeline), 4, 9, 11, 14.

## Guardrails

TEST-01, TEST-03, STYLE-01, STYLE-05, STYLE-07, STYLE-09, ARCH-01, ARCH-02, PROV-01.

## Implementation Plan

1. Confirm the audit's configuration shape and primitive list; return REPLAN REQUIRED if the audit calls for a core change.
2. Introduce the experience configuration and Apollo's instance, keeping `MissionConfig` consumers working or migrating them.
3. Build the shell layout and timeline bar using the audit's KEEP/ADAPT patterns and tokens.
4. Derive event navigation from events and clock time.
5. Move existing diagnostics behind a developer toggle.
6. Add tests, including the no-mission-names grep; run gates.

## Boundaries

No object picker, camera, info or provenance UI yet (later Tasks). No changes to core, events, `ScalePolicy` or data.

## Technical Verification

Focused tests during iteration; configured typecheck, build and test gates at handoff. Browser smoke via a script under `tools/validate/` with 0 console errors.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas and reconcile through the planner before Check.
