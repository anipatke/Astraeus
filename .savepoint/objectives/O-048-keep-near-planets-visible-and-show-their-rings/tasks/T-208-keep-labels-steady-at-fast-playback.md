---
id: T-208
objective: O-048
title: Keep labels steady at fast playback
status: planned
depends_on: [{task: T-207, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: probe-feedback-2-20261031}
---

# Keep labels steady at fast playback

## Outcome

A label that wins an overlap keeps it until it is clearly beaten, by a stated screen margin or hold time, so overlapping labels do not swap from frame to frame at fast playback (I-121); the selected object's label still always wins (I-108).

## User Check

Not owner-facing on its own; the owner looks once at the end of the Objective (last step).

## Done When

- Reproduce first with two made-up labels crossing at a fast rate; record the flicker (visibility changes per frame).
- `src/app/SceneLabels.ts` keeps which label won each overlap and needs a stated margin (pixels) or hold (ms) to change; the rule and numbers are in one place, documented.
- Tests: crossing labels change winner at most once per crossing; the selected label still wins at once; labels off still hides all.
- CHANGELOG `Unreleased` line.

## Context Files

`packages/astraeus/src/app/SceneLabels.ts`, `packages/astraeus/tests/publicApiPathLabels.test.ts`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, ARCH-06, PROV-01, PROV-02, TEST-01, TEST-02, TEST-03, TEST-04; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Reproduce.
3. Add the hysteresis; tests; docs.

## Boundaries

No change to label priorities or reach.

## Technical Verification

Focused tests while iterating; at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`). No browser run in this step (one `npm run check:browser` in the last step). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution: named cases, results, files read/changed, limitations.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.
