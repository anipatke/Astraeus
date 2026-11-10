---
id: T-298
title: Show sky figures on a made-up scene and write them up
objective: O-065
status: planned
depends_on: [{task: T-297, requires: clear}]
owner_validation: {required: true}
check_waiver: {task: T-298, reason: 'Owner said "orchestrate O65" under the standing run rules (one builder at a time, no per-step checks, coordinator marks done once gates pass and any owner look is given, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o065-run-20261110}, recorded_at: '2026-11-10T03:16:41Z'}
planned_by: {role: planner, session: o065-planning-20261110}
---

# Show sky figures on a made-up scene and write them up

## Outcome

The site's made-up look-out scene shows two invented figures, a boundary outline, the ecliptic and the equator, with a way to trace a figure, so the owner can judge the look on `localhost:5490`; a browser script checks it; Design is reconciled for the Full Objective Check.

## User Check

On `localhost:5490`, open the made-up look-out scene: switch figures, boundaries, the ecliptic and the equator on and off; trace a figure and see it stay, fade and clear; check lines draw over the Sun's glow and labels never overlap, on a phone-sized window and a desktop one; change colours and the label font and size in the Developer drawer.

## Done When

- `syntheticLookOutScene.ts` (site code, public API only) gains invented figures (no real constellation names, ARCH-01) built from real star ids and positions, one boundary, and switches placed for the visitor; a site control (outside the engine) triggers a trace.
- A browser step (extend `journey-look-out.mjs` or add one beside it, using the shared driver) checks the switches, a trace reaching its end state, lines present over the Sun's glow, and no label collisions at 375x667 and 1280x720; it runs inside `npm run check:browser`.
- Design.md is reconciled from every drift note of this Objective's steps (each reflected or marked non-architectural with a reason), with the sky-figure contract added beside "The sky view".
- The owner's look is recorded (`owner_validation`).

## Context Files

`packages/astraeus-site/src/synthetic/syntheticLookOutScene.ts`, `packages/astraeus-site/src/main.tsx`, `packages/astraeus-site/tools/validate/journey-look-out.mjs`, `docs/agents/browser-policy.md`, `.savepoint/Design.md` under `Interfaces and Data Flow`, `.savepoint/objectives/O-065-draw-and-trace-figures-on-the-sky/Objective.md`, and the Drift Notes of this Objective's earlier Tasks.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` (the sky view, O-064; The planets demo and the site on the public way, O-059).

## Guardrails

ARCH-01, ARCH-03, API-01, TEST-01, TEST-03.

## Implementation Plan

1. Confirm steps 1 to 4 landed; return REPLAN REQUIRED if not.
2. Extend the made-up scene and its site control.
3. Extend the browser step; run it focused, then hand off without a full browser run.
4. Reconcile Design from the drift notes.
5. Ask the owner to look on `localhost:5490`; record the result.

## Boundaries

No engine change unless the owner's look finds a defect (then an Issue); no constellation data; no story steps.

## Technical Verification

Hand-off gates `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`; the focused browser step only (one browser job at a time); `npm run check:browser` runs once at the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record any remaining delta here and in Design before the Full Check.
