---
id: T-216
title: Pick the stretches automatically by sphere of influence
objective: O-050
status: planned
depends_on: [{task: T-213, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: probe-switch-20261101}
---

# Pick the stretches automatically by sphere of influence

## Outcome

`lineFixedTo: "auto"` builds a path's stretches from its own samples. Each sample's line is fixed to the innermost body in the scene whose sphere of influence holds the probe, else the scene centre. Any flyby or orbiter is then one path without the app working out switch times (I-125, automatic half).

## User Check

Not owner-facing on its own; the owner looks once at the end of the Objective (last step).

## Done When

- `"auto"` resolves to the same stretch list the previous step draws, so drawing, menu and follow need no second path.
- Sphere of influence of a body about its parent: `r = a (m / M)^(2/5)`, from the GM of the body and its parent in the one catalogue definition (ARCH-05). `a` is the body's distance from its parent at the sample time. Innermost wins (a moon inside its planet's sphere). Consecutive samples on one body merge.
- Bodies without a GM are skipped and the API comment says so. Where a body the rule needs is missing, a test records which built-in bodies lack a GM. Adding GMs for planets with a cited source is in scope; moons without a published GM are not.
- Stretches resolve once when body states are available (`prepare`/`mount`), never per frame. A scene that cannot resolve them (body data missing) fails with today's named error.
- No body is named in the rule (ARCH-01, ARCH-06). Tests on made-up configurations: a synthetic flyby enters and leaves a planet's sphere (boundary within one sample of the analytic crossing); a Moon orbit in an Earth-centred scene resolves to the Moon; a path far from everything stays on the scene centre.
- README and API comment; CHANGELOG `Unreleased` line.

## Context Files

`packages/astraeus/src/api/scene.ts` (TrajectoryBase, `#buildTracked`), `packages/astraeus/src/app/mission.ts`, `packages/astraeus/src/core/body.ts`, `packages/astraeus/src/core/bodies/earth.ts`, `packages/astraeus/src/api/mount.ts`, `packages/astraeus/README.md`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-05, ARCH-06, PROV-01, TEST-01, TEST-02, TEST-03, TEST-04; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Confirm the previous step's stretch list exists; return REPLAN REQUIRED if not.
3. Audit which catalogue bodies carry a GM; add missing planet GMs with sources.
4. Implement the sphere-of-influence resolution as one pure function with tests, then wire `"auto"`.
5. README, CHANGELOG.

## Boundaries

No per-frame frame switching, no hysteresis tuning beyond merging, no new moon GMs without a published source, no app or demo changes.

## Technical Verification

Focused tests while iterating; at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`). No browser run in this step. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.
