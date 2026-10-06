---
id: T-019
title: Show object information, data trust and the scale choice on request
objective: O-005
status: planned
depends_on: [{task: T-018, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: g002-replan-2026-10-06}
---

# Show object information, data trust and the scale choice on request

## Outcome

Selecting an object or event opens a compact, configuration-driven info panel (name, short description, current distance/speed, event information) that never covers a large part of the canvas. A compact provenance badge such as "Reconstructed ⓘ" reveals source, accuracy, notes and known limitations. A True/Readable control explains in plain words that Readable pulls bodies closer while keeping their true size, so nearby spacecraft are drawn on top.

## User Check

Select Columbia: see its info, open "Reconstructed ⓘ" and read the sources, accuracy and known limitations including smoothed joins, burn cutoff residuals and the post-TLI speed limitation. Select Eagle during the surface stay and read the landing-site offset. Select the Moon: see "Ephemeris". Switch True/Readable and read its explanation; confirm readouts are identical under both.

## Done When

1. Info content and known limitations live in configuration and data (STYLE-09); the panel renders any experience's objects and events.
2. The provenance badge reads the existing per-trajectory `Provenance` (and an equivalent for Earth/Moon ephemerides) plus configured known limitations; no core type changes.
3. Apollo's known limitations take their figures from the generated reconstruction data (`data/apollo11/generated/validation.json` and the report), not hand-copied numbers, and cover the smoothed joins, published burn cutoff residuals, I-008's accepted post-TLI speed limitation and I-004's landing-site offset.
4. The scale control states the Readable trade-off; `ScalePolicy` is unchanged and a test confirms identical State under both policies through the shell.
5. Nothing reconstructed or illustrative appears without a reachable provenance status (named test over configured objects).
6. No mission naming in `src/shell/`; core and data unchanged; configured gates pass.

## Context Files

`docs/ASTRAEUS_SPIKE_03_BRIEF.md`, `.savepoint/objectives/O-005-reusable-astronomy-ui-shell/Objective.md`, `docs/PLANETARY_EXPLORER_UI_AUDIT.md`, `src/core/provenance.ts`, `src/core/scalePolicy.ts`, `src/core/events.ts`, `src/app/mission.ts`, `src/mission/apollo11.ts`, `data/apollo11/generated/validation.json`, `docs/APOLLO11_RECONSTRUCTION.md`, `.savepoint/issues/I-003-propagated-misses-reach-tens-of-thousands-of-km.md`, `.savepoint/issues/I-004-landing-site-offset-from-runtime-moon-orientation.md`, `.savepoint/issues/I-005-hud-covers-canvas-and-readablescale-radii.md`, `.savepoint/issues/I-008-post-tli-coast-still-produces-impossible-speed.md`, `tests/missionScene.test.ts`.

## Design References

Design: Interfaces and Data Flow (provenance, ScalePolicy), Current Technical State (published residuals, landing offset). Brief sections 3 (scale, info, provenance), 4. Idea success criterion 4.

## Guardrails

TEST-01, TEST-03, STYLE-07, STYLE-09, ARCH-01, ARCH-02, PROV-01.

## Implementation Plan

1. Confirm the I-008 Issue path and the validation JSON fields for residuals and landing offset; log any extra read.
2. Build the info panel and provenance badge from configuration and `Provenance`.
3. Add Apollo info content and known limitations sourced from generated data.
4. Build the scale control with its explanation.
5. Tests for provenance reachability, data-sourced figures and scale independence; run gates.

## Boundaries

No time-ranged provenance, no ScalePolicy or radius change, no reconstruction changes, no encyclopaedia framework.

## Technical Verification

Focused tests; configured gates at handoff; browser script with 0 console errors opening info and provenance for each object.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas and reconcile through the planner before Check.
