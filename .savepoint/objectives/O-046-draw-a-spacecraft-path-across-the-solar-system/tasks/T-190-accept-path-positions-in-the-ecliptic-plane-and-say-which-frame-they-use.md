---
id: T-190
title: Accept path positions in the ecliptic plane and say which frame they use
objective: O-046
status: planned
depends_on: [{task: T-189, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o046-planning-20261030}
---

# Accept path positions in the ecliptic plane and say which frame they use

## Outcome

The docs state that `addTrajectory` positions and velocities are equatorial J2000 (EQJ) about `center`, and a path option `plane: "EQJ" | "ecliptic-j2000"` (default `"EQJ"`, today's behaviour; the same words as `addGroup`'s `plane`) takes JPL Horizons' ecliptic vectors as published (I-097).

## User Check

Not owner-facing on its own.

## Done When

- Ecliptic input is rotated once, where samples (or a `provider`'s states) are read into State, using the engine's existing ecliptic-to-equatorial transform (find it; do not add a second copy of the obliquity). Drawing, `stateOf` and readouts all see the same EQJ State (ARCH-02).
- A bad `plane` throws `bad-trajectory` naming the field.
- Made-up test: the same path given in ecliptic with `plane: "ecliptic-j2000"` and pre-rotated to EQJ gives the same `stateOf` (position and velocity) at several times, and lies in the planets' plane (inclination near 0 for an in-plane made-up orbit).
- `TrajectorySampleInput` doc comment, the README `addTrajectory` row and `stateOf` row name the frame; CHANGELOG `Unreleased` line.

## Context Files

`packages/astraeus/src/api/scene.ts` (`TrajectoryInput`, `sampledBody`, `providerBody`), `packages/astraeus/src/api/group.ts` (`plane`), `packages/astraeus/tests/publicApiPaths.test.ts`, `packages/astraeus/README.md` (`addTrajectory`, `stateOf` rows).

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, PROV-01, TEST-01, TEST-02, TEST-03, TEST-04; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Find the existing frame transform used by `addGroup`'s `plane`; reuse it.
3. Add `plane` to the path input and apply it where samples and provider states enter State.
4. Tests, doc comments, README, CHANGELOG.

## Boundaries

No change to the default frame; no interpolation changes (I-101 stays open).

## Technical Verification

Focused tests while iterating; configured gates at hand-off. No browser run. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution.

## Drift Notes

Record for the last step's Design reconciliation.
