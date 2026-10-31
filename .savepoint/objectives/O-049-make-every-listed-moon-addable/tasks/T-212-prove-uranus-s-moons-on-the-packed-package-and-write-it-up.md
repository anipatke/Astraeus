---
id: T-212
title: Prove Uranus's moons on the packed package and write it up
objective: O-049
status: planned
depends_on: [{task: T-211, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: probe-feedback-3-20261031}
---

# Prove Uranus's moons on the packed package and write it up

## Outcome

The packed package adds Miranda, Ariel, Umbriel, Titania and Oberon in a 1986 Sun-first scene with `astraeus-data-uranus` and draws them and their orbit lines; checked in a browser and by the owner; docs and Design reconciled (I-122).

## User Check

Open `localhost:5490/app.html?experience=synthetic-journey` (or the synthetic Uranus scene the step names): pick Uranus in January 1986 and zoom in; its five main moons show as grey spheres with orbit lines; labels read Miranda, Ariel, Umbriel, Titania, Oberon.

## Done When

- A synthetic scene (made-up path, no mission data; ARCH-01, ARCH-03) near Uranus in 1986 adds the five moons with `{ orbit: true }`; a browser case reads that they draw (driver readouts, no screenshots).
- `npm run check:node-consumer` adds Miranda and Titania with `{ orbit: true }` on the packed package.
- One `npm run check:browser` passes.
- README, CHANGELOG `Unreleased`, API reference agree; every earlier drift note reflected in `.savepoint/Design.md` or marked non-architectural with a reason.
- Owner look on `localhost:5490`, recorded before the Full Objective Check.

## Context Files

`packages/astraeus/src/synthetic/syntheticJourneyScene.ts`, `packages/astraeus-site/tools/validate/browser-smoke.mjs`, `tools/check-node-consumer.mjs`, `.savepoint/Design.md`, `docs/agents/browser-policy.md`.

## Design References

`.savepoint/Design.md` (sections touched by this Objective's drift notes).

## Guardrails

ARCH-01, ARCH-03, ARCH-05, ARCH-06, PROV-01, PROV-02, TEST-01, TEST-02, TEST-03, TEST-04; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Synthetic 1986 Uranus scene; browser case; node-consumer case.
3. Docs; Design reconciliation.
4. One `npm run check:browser`; leave the owner look to the coordinator.

## Boundaries

No new pictures or mission data.

## Technical Verification

Lint, typecheck, build, test gates, `check:node-consumer`, then one `npm run check:browser`. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution: named cases, results, files read/changed, limitations.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.
