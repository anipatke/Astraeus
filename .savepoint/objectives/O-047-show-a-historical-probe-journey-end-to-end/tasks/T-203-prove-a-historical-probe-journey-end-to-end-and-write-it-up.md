---
id: T-203
objective: O-047
title: Prove a historical probe journey end to end and write it up
status: planned
depends_on: [{task: T-200, requires: clear}, {task: T-196, requires: clear}, {task: T-201, requires: clear}, {task: T-198, requires: clear}, {task: T-199, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: probe-feedback-20261031}
---

# Prove a historical probe journey end to end and write it up

## Outcome

A made-up probe journey from 1977 out to about 170 AU, with Jupiter and Saturn encounters in 1979-1980, runs on the packed packages: moons placed at their historical dates, Saturn's orbit line drawn and fitted, playback paced, provenance changing along the path, the opening path selected, and the camera and labels holding when zoomed out to 170 AU (I-114). Docs and Design reconciled; the owner looks once.

## User Check

Open `localhost:5490` on the made-up journey: at 1979-03-05 the four large Jupiter moons show; at 1980-11-12 Titan and the inner Saturn moons show with Saturn's orbit line; playback slows near each encounter and speeds up between; picking a speed overrides it until Auto; zoomed right out the whole path and its labels stay visible.

## Done When

- I-114: a test and a `check:browser` case frame a Sun-centred scene with a path reaching 170 AU whole; bodies, path and labels draw without clipping or jitter; record the camera reach and far plane used, and fix the rule if they clip.
- `npm run check:node-consumer` exercises a historical moon date, a Saturn orbit line, pacing and span provenance on the packed packages.
- One `npm run check:browser` run with the new case passes.
- README, CHANGELOG `Unreleased`, API reference and the example agree with the package; every drift note from earlier steps is reflected in `.savepoint/Design.md` or marked non-architectural with a reason.
- Owner look on `localhost:5490`, recorded before the Full Objective Check.

## Context Files

`packages/astraeus/README.md`, `packages/astraeus/CHANGELOG.md`, `tools/check-node-consumer.mjs`, `.savepoint/Design.md`, `docs/agents/browser-policy.md`.

## Design References

`.savepoint/Design.md` (all sections touched by this Objective's drift notes).

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, ARCH-06, PROV-01, TEST-01, TEST-02, TEST-03, TEST-04; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Build the made-up journey fixture (no mission names, ARCH-01).
3. Run the 170 AU case; fix framing or label reach if needed.
4. Extend node-consumer and browser checks; run the full gate once.
5. Reconcile docs and Design; ask the owner to look on `localhost:5490`.

## Boundaries

No real probe data; no publishing.

## Technical Verification

Full configured gate, `npm run check:node-consumer`, one `npm run check:browser`; then the Full Objective Check under `docs/agents/verification.md`.

## Technical Evidence

Pending execution: named cases, results, files read/changed, limitations.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.
