---
id: T-302
title: Show a three-step sky story on a made-up scene and write it up
objective: O-066
status: planned
depends_on: [{task: T-301, requires: clear}]
owner_validation: {required: true}
check_waiver: {task: T-302, reason: 'Owner said "orchestrate O66" under the standing run rules (one builder at a time, no per-step checks, coordinator marks done once gates pass and any owner look is given, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o066-run-20261110}, recorded_at: '2026-11-10T06:15:12Z'}
planned_by: {role: planner, session: o066-planning-20261110}
---

# Show a three-step sky story on a made-up scene and write it up

## Outcome

The site's made-up look-out scene tells a three-step story about its invented figures (turn, select, trace, card), with clickable figures, so the owner can judge it on `localhost:5490`; a browser script checks it; Design is reconciled for the Full Objective Check.

## User Check

On `localhost:5490`, open the made-up look-out scene: tap a figure's name and a line to see its card; tap inside the outline and see nothing selected; step through the three-step story with Back and Next and see the view turn, the figure selected and traced, and the trace cleared on leaving; try it at phone size and desktop size.

## Done When

- `syntheticLookOutScene.ts` (site code, public API only) gives Lantern and Kettle cards (made-up facts, illustrative provenance, ARCH-01) and adds three story steps that turn the view, select and trace; at least one step starts from an orbit view to prove the camera target works from any view.
- The look-out browser step (shared driver; one browser job at a time) checks: name tap and line tap select the figure and open its card; an outline tap selects nothing; Back/Next move between steps; a step's camera reading, selection and trace line set match; leaving clears the trace; no collisions at 375x667 and 1280x720. It stays within its 50 s limit or the evidence states the measured time for the owner.
- Design.md reconciled from every drift note of this Objective's steps (each reflected or marked non-architectural with a reason), extending the "Sky figures" paragraph and the story description.
- The owner's look is recorded (`owner_validation`).

## Context Files

`packages/astraeus-site/src/synthetic/syntheticLookOutScene.ts`, `packages/astraeus-site/src/skyTraceControl.ts`, `packages/astraeus-site/src/main.tsx`, `packages/astraeus-site/tools/validate/journey-look-out.mjs`, `packages/astraeus-site/tools/validate/driver.mjs`, `docs/BROWSER_CHECKS.md`, `docs/agents/browser-policy.md`, `.savepoint/Design.md` under `Interfaces and Data Flow`, `.savepoint/objectives/O-066-click-sky-figures-and-tell-sky-stories/Objective.md`, and the Drift Notes of this Objective's earlier Tasks.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` (Sky figures, O-065; the sky view, O-064).

## Guardrails

ARCH-01, ARCH-03, API-01, TEST-01, TEST-03.

## Implementation Plan

1. Confirm steps 1 to 3 landed; return REPLAN REQUIRED if not.
2. Extend the made-up scene with cards and three steps.
3. Extend the browser step; run it focused; hand off without a full browser run.
4. Reconcile Design from the drift notes.
5. Leave owner validation pending for the coordinator to arrange the look.

## Boundaries

No engine change unless the owner's look finds a defect (then an Issue or an owner-directed change); no constellation data; no Orion example (O-067).

## Technical Verification

Hand-off gates `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`; the focused browser step only; `npm run check:browser` runs once at the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record any remaining delta here and in Design before the Full Check.
