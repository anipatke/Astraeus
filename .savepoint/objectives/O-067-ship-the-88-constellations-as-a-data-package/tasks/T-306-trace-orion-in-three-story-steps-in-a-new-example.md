---
id: T-306
title: Trace Orion in three story steps in a new example
objective: O-067
status: planned
depends_on: [{task: T-305, requires: clear}]
owner_validation: {required: true}
check_waiver: {task: T-306, reason: 'Owner said "orchestrate O67" under the standing run rules (one builder at a time, no per-step checks, coordinator marks done once gates pass and any owner look is given, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o067-run-20261110}, recorded_at: '2026-11-10T08:40:31Z'}
planned_by: {role: planner, session: o067-planning-20261110}
---

# Trace Orion in three story steps in a new example

## Outcome

A new example in `examples/` uses the packed engine and constellations package on the plain `mount` path to look out from Earth and tell Orion's story in three steps (turn, select, trace), checked by a browser step; Design and docs are reconciled for the Full Objective Check; the owner looks at it.

## User Check

Open the example on `localhost:5490` (or the command the evidence names), step through the three Orion steps with Back and Next, tap Orion's name to see its card, try phone and desktop sizes.

## Done When

- `examples/<name>/` (planner suggests `hello-sky`) built like `examples/hello-planets` from the packed tarballs (`tools/build-example.mjs`), importing only `astraeus`, `astraeus/style.css` and `astraeus-data-constellations`: Earth and the Sun, opening looking out from Earth toward Orion, Orion (and perhaps its neighbours) from the helper, hidden until traced, three steps with short made-for-example text and provenance (no myths needed), the ecliptic switch available.
- A browser step beside `check-hello-planets.mjs` (shared driver, no screenshots) checks: the three steps, the trace line set appearing and clearing, Orion selectable with its card, no collisions at 375x667 and 1280x720; added to `run-browser.mjs`, `docs/BROWSER_CHECKS.md` and `tools/gate-limits.json` with a measured time (an owner decision if it pushes the whole browser run over its 320 s limit).
- The example's first download measured; stated in its README.
- Design.md: the constellations package in the Components/Codebase Map and a short "Constellations" paragraph (data, helper, licences, example); every drift note of this Objective's steps accounted for in this Task's Drift Notes. CHANGELOG notes the new package.
- The owner's look recorded (`owner_validation`).

## Context Files

`examples/hello-planets/package.json`, `examples/hello-planets/src/main.ts`, `examples/hello-planets/index.html`, `tools/build-example.mjs`, `packages/astraeus-site/tools/validate/run-browser.mjs`, `packages/astraeus-site/tools/validate/check-hello-planets.mjs`, `packages/astraeus-site/tools/validate/driver.mjs`, `docs/BROWSER_CHECKS.md`, `tools/gate-limits.json`, `docs/agents/browser-policy.md`, `packages/astraeus-data-constellations/README.md`, `.savepoint/Design.md` under `Components/Codebase Map` and `Interfaces and Data Flow`, and the Drift Notes of this Objective's earlier Tasks.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` (Sky figures, O-065; Sky stories, O-066; the hello-planets example, O-056).

## Guardrails

API-01, API-07, ARCH-01, PROV-01, TEST-01, TEST-03.

## Implementation Plan

1. Confirm the package and helper landed; return REPLAN REQUIRED if not.
2. Scaffold the example from hello-planets; write the Orion story.
3. Add the browser step; run it focused; measure.
4. Reconcile Design and docs.
5. Leave owner validation pending for the coordinator to arrange the look.

## Boundaries

No engine change unless the owner's look finds a defect (then an Issue or an owner-directed change); no Zodiac app; no site page.

## Technical Verification

Hand-off gates `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`, plus `npm run check:pack`; the focused browser step only; `npm run check:browser` runs once at the Full Objective Check. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record any remaining delta here and in Design before the Full Check.
