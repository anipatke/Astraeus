---
id: T-297
title: Trace a figure line by line when the app asks
objective: O-065
status: planned
depends_on: [{task: T-296, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-297, reason: 'Owner said "orchestrate O65" under the standing run rules (one builder at a time, no per-step checks, coordinator marks done once gates pass and any owner look is given, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o065-run-20261110}, recorded_at: '2026-11-10T03:16:41Z'}
planned_by: {role: planner, session: o065-planning-20261110}
---

# Trace a figure line by line when the app asks

## Outcome

An app, through `mount` or `AstraeusScene`, asks the viewer to trace a sky figure line by line over a given time, then to keep it, fade it or clear it; reduced motion draws it at once.

## User Check

None for the owner at this step; the owner looks in the last step.

## Done When

- One handle call on both paths (planner suggests `handle.traceSkyFigure(id, { seconds?, after?: "stay" | "fade" | "clear" })`; final name follows the verb grammar table) draws the figure's segments in order, each growing from its first end, across `seconds` (a default and a checked range); `after` decides what follows; traced lines use the traced colour, faded lines the faded colour (previous step's looks).
- Unknown figure, bad seconds or bad `after` throw at the call (`unknown-sky-figure` or the matching bad-input code, API-05); calling again restarts; tracing a figure whose switch is off or that a view hides is defined and tested (planner default: it traces but stays hidden until shown).
- `prefers-reduced-motion: reduce` draws the whole figure at once and still applies `after`.
- Host calls land in order with the other host calls (O-061 rule); the trace runs on wall time, not the scene clock, so pause and rate do not change it (stated in the README).
- Trace progress is a named frame stage with a node test (CODE-02); `tests/lifecycle.test.ts` runs the call on both paths (API-02); made-up figures only (ARCH-03).
- API lock, README and CHANGELOG updated (API-01, API-07).

## Context Files

`packages/astraeus/src/api/viewerLink.ts`, `packages/astraeus/src/api/viewerHandle.ts`, `packages/astraeus/src/api/index.ts`, `packages/astraeus/src/app/viewerPort.ts`, `packages/astraeus/src/app/App.tsx`, `packages/astraeus/src/app/sceneFrame.ts`, `packages/astraeus/src/app/SkyView.ts`, `packages/astraeus/tests/sceneFrame.test.ts`, `packages/astraeus/tests/lifecycle.test.ts`, `packages/astraeus/README.md`, `packages/astraeus/CHANGELOG.md`, `.savepoint/objectives/O-065-draw-and-trace-figures-on-the-sky/Objective.md`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` (One handle, one lifecycle, O-054; Host calls land in order, O-061; Scene and host-link split, O-058).

## Guardrails

API-01, API-02, API-04, API-05, API-07, ARCH-02, ARCH-03, CODE-02, TEST-01, TEST-03, STYLE-02.

## Implementation Plan

1. Confirm the previous steps' figure drawing and colour looks exist; return REPLAN REQUIRED if not.
2. Add a per-figure trace state (start time, length, after) held in the sky drawing, advanced by a frame stage.
3. Add the handle call on the host link, its checks and its slot in the ordered host calls.
4. Reduced motion; tests; lock, README, CHANGELOG.

## Boundaries

No clock-timed traces (owner decision 1); no camera turn to the figure (O-066 stories); no clicking.

## Technical Verification

Focused Vitest runs while building; hand-off gates `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`, plus `npm run check:pack` and `npm run check:node-consumer`; no browser run. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas; Design is reconciled in the last step of this Objective.
