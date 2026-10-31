---
id: T-221
title: Prove view switching on the packed package and write it up
objective: O-051
status: planned
depends_on: [{task: T-218, requires: clear}, {task: T-219, requires: clear}, {task: T-220, requires: clear}]
owner_validation: {required: true}
planned_by: {role: planner, session: o051-plan-20261101}
---

# Prove view switching on the packed package and write it up

## Outcome

The packed package shows a made-up scene with two probes and a "Both" view, switched from the bar and by the host, keeping time, speed and camera. Docs, CHANGELOG and Design match, and the owner has looked at it on the preview.

## User Check

On `localhost:5490`, open the synthetic views scene, play at a fast speed, and confirm: the view choice sits in the bar (and the phone drawer) without overlapping anything; switching keeps the time, speed and camera; the menu, timeline markers and panels show only the chosen view's things; following one probe then switching to the other probe's view does what that view's camera rule says.

## Done When

- `check:node-consumer` builds a scene on the packed package with two made-up probe paths, a shared body and three views (each probe, both), and asserts the resolved views and validation faults.
- A synthetic browser scene (a new synthetic experience or the synthetic journey gaining views; record which and why) shows the views with different camera rules; the browser check covers a visitor switch at 1280x720 and 375x667 (menu contents, markers, clock unchanged, no overlap) and a host `setView`. One `npm run check:browser` passes.
- README, API reference and example lines; CHANGELOG `Unreleased` with the first-download size change (`node tools/measure-example.mjs`); `check:pack` and `check:engine-alone` pass (report, do not raise, any pack or load limit it exceeds; limits are owner decisions).
- Every Drift Note from the O-051 steps is reflected in Design.md or marked non-architectural with a reason.
- Owner look recorded before the Full Objective Check.

## Context Files

`packages/astraeus/src/synthetic/syntheticJourneyScene.ts`, `packages/astraeus-site/src/main.tsx`, `tools/check-node-consumer.mjs`, `packages/astraeus-site/tools/validate/browser-smoke.mjs`, `packages/astraeus-site/tools/validate/driver.mjs`, `packages/astraeus/README.md`, `packages/astraeus/CHANGELOG.md`, `.savepoint/Design.md` under `Interfaces and Data Flow`, `docs/agents/browser-policy.md`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` and `Current Technical State`.

## Guardrails

ARCH-01, ARCH-03, ARCH-06, TEST-01, TEST-03, TEST-04; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Confirm the previous steps are in place; return REPLAN REQUIRED if not.
3. Packed-package consumer cases; synthetic scene and browser coverage.
4. Docs, CHANGELOG with size; Design reconciliation.
5. One `npm run check:browser`; ask the owner to look on the preview.

## Boundaries

No Voyager app, Apollo 11, showers or planets demo change; no release.

## Technical Verification

Full configured gates plus `check:pack`, `check:engine-alone`, `check:node-consumer` and one `check:browser` (browser policy). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Reconcile the steps' notes here.
