---
id: T-209
objective: O-048
title: Prove the fixes on a graphics card and write them up
status: planned
depends_on: [{task: T-204, requires: clear}, {task: T-205, requires: clear}, {task: T-206, requires: clear}, {task: T-208, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: probe-feedback-2-20261031}
---

# Prove the fixes on a graphics card and write them up

## Outcome

The synthetic journey shows Saturn, its rings and moons when the camera is near Saturn with the whole-path reach, every catalogued moon's orbit can be drawn, Go to frames an event's object, and labels stay steady at fast playback; checked in a browser and by the owner in a GPU browser; docs and Design reconciled.

## User Check

Open `localhost:5490/app.html?experience=synthetic-journey` in your normal browser: pick Saturn and zoom in close; Saturn, its rings and moons stay visible (before, they vanished). Zoom right out; the whole path still shows. Press Go to on a flyby; the view jumps to that moon. Play fast; labels don't flicker.

## Done When

- The synthetic journey (`?experience=synthetic-journey`) gains: rings on the ringed planets (by default), orbit lines for a few moons beyond Io, events naming their objects; a browser case zooms near Saturn with the whole-path reach and reads that Saturn and its rings draw (depth mode recorded).
- `npm run check:node-consumer` covers rings in a public definition and a moon orbit beyond Io.
- One `npm run check:browser` passes.
- README, CHANGELOG `Unreleased`, API reference agree; every earlier drift note reflected in `.savepoint/Design.md` or marked non-architectural with a reason.
- Owner look on `localhost:5490` in a GPU browser, recorded before the Full Objective Check.

## Context Files

`packages/astraeus/src/synthetic/syntheticJourneyScene.ts`, `packages/astraeus-site/src/journeyData.ts`, `packages/astraeus-site/tools/validate/browser-smoke.mjs`, `tools/check-node-consumer.mjs`, `.savepoint/Design.md`, `docs/agents/browser-policy.md`.

## Design References

`.savepoint/Design.md` (sections touched by this Objective's drift notes).

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, ARCH-06, PROV-01, PROV-02, TEST-01, TEST-02, TEST-03, TEST-04; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Extend the journey fixture (ARCH-01: made-up names).
3. Extend browser and node-consumer checks; run the gates once.
4. Reconcile docs and Design; ask the owner to look.

## Boundaries

No real mission data; no publishing.

## Technical Verification

Full configured gate, `npm run check:node-consumer`, one `npm run check:browser`; then the Full Objective Check under `docs/agents/verification.md`.

## Technical Evidence

Pending execution: named cases, results, files read/changed, limitations.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.
