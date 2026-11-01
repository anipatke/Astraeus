---
id: T-227
title: Prove the views fixes on the packed package and write them up
objective: O-052
status: planned
depends_on: [{task: T-226, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: voyagers-feedback-20261101}
---

# Prove the views fixes on the packed package and write them up

## Outcome

The `examples/` projects show a made-up two-probe scene with A / B / Both views, view-aware pacing and a follow rule, built on the packed package; docs, CHANGELOG and Design are reconciled; the owner has looked on the preview (O-052 "Example", "Proof and docs").

## User Check

On `localhost:5490`, open the made-up views scene: in view A playback slows only at A's events, in Both at both probes' events and the camera moves to each probe at its encounter and back; switching mid-cruise eases the speed. Open the built example: the views switch works and the page address does not change.

## Done When

- `examples/hello-scene` (and `hello-react` if it stays small) gain the two-probe views scene with pacing and `camera: "follow"`, `await ready` then `setView`, built by `npm run build:example` from the packed tarballs; made-up data only (ARCH-03).
- The site's made-up views scene gains the pacing and follow rules for the owner look and the browser check.
- `check:pack`, `check:node-consumer` and one `npm run check:browser` pass.
- README reviewed end to end for the new rows; CHANGELOG `Unreleased` complete with the two behaviour changes for 0.7.0 users and the first-download size change; Design.md `Interfaces and Data Flow` reconciled with every Drift Note of this Objective (reflected or non-architectural, with reason).
- Owner look recorded before the Full Objective Check.

## Context Files

`examples/hello-scene/src/main.js`, `examples/hello-scene/package.json`, `examples/hello-react/src/main.jsx`, `tools/build-example.mjs`, `tools/check-node-consumer.mjs`, `packages/astraeus/src/synthetic/syntheticViewsDefinition.ts`, `packages/astraeus-site/src/main.tsx`, `packages/astraeus/README.md`, `packages/astraeus/CHANGELOG.md`, `.savepoint/Design.md` under `Interfaces and Data Flow`, `docs/agents/browser-policy.md`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`.

## Guardrails

ARCH-03, ARCH-06, TEST-01, TEST-03, TEST-04, CODE-01; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Extend the examples and the site's made-up views scene.
3. Run the pack, node-consumer and browser checks.
4. Docs, CHANGELOG, Design reconciliation; ask the owner for the look.

## Boundaries

No new demo; no real mission data; no release.

## Technical Verification

Configured gates plus `check:pack`, `check:node-consumer`, `npm run build:example` and one `npm run check:browser` (browser policy). Evaluated later under `agent-skills/references/check-method.md`; the Full Objective Check follows.

## Technical Evidence

Pending execution.

## Drift Notes

Reconcile every earlier step's notes here.
