---
id: T-217
title: Prove one-path probes on the packed package and write it up
objective: O-050
status: planned
depends_on: [{task: T-213, requires: clear}, {task: T-214, requires: clear}, {task: T-215, requires: clear}, {task: T-216, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: probe-switch-20261101}
---

# Prove one-path probes on the packed package and write it up

## Outcome

The packed package shows a made-up flyby followed as one path through every stretch, listed and automatic, with close timeline markers each reachable. Docs, CHANGELOG and Design match, and the owner has looked at it on the preview.

## User Check

On `localhost:5490`, open the synthetic journey scene, follow the probe from its start at fast playback, and confirm: the camera stays on it through each encounter, the menu shows it once with no "(Unavailable)", and each close timeline marker opens its own event on desktop and phone sizes.

## Done When

- `check:node-consumer` builds a scene on the packed package with a listed-stretch path, an `"auto"` path and a Moon-orbit stretch against the Moon, and asserts one menu object per path and the resolved stretches.
- The synthetic journey scene (`packages/astraeus/src/synthetic/syntheticJourneyScene.ts`) gains an encounter stretch and close events, and the browser check covers following across a stretch boundary. One `npm run check:browser` passes.
- README, API reference and example lines; CHANGELOG `Unreleased` with the first-download size change (`node tools/measure-example.mjs`); `check:pack` and `check:engine-alone` pass.
- Every Drift Note from the O-050 steps is reflected in Design.md or marked non-architectural with a reason.
- Owner look recorded before the Full Objective Check.

## Context Files

`packages/astraeus/src/synthetic/syntheticJourneyScene.ts`, `packages/astraeus/tests/syntheticJourney.test.ts`, `tools/check-node-consumer.mjs`, `packages/astraeus-site/tools/validate/browser-smoke.mjs`, `packages/astraeus/README.md`, `packages/astraeus/CHANGELOG.md`, `.savepoint/Design.md` under `Interfaces and Data Flow`, `docs/agents/browser-policy.md`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` and `Current Technical State`.

## Guardrails

ARCH-01, ARCH-03, ARCH-06, PROV-01, TEST-01, TEST-03, TEST-04; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Confirm the previous steps are in place; return REPLAN REQUIRED if not.
3. Packed-package consumer cases; synthetic scene and browser coverage.
4. Docs, CHANGELOG with size; Design reconciliation.
5. One `npm run check:browser`; ask the owner to look on the preview.

## Boundaries

No Voyager app or Apollo 11 demo change; no release.

## Technical Verification

Full configured gates plus `check:pack`, `check:engine-alone`, `check:node-consumer` and one `check:browser` (browser policy). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Reconcile the steps' notes here.
