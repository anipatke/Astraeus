---
id: T-190
title: Accept path positions in the ecliptic plane and say which frame they use
objective: O-046
status: done
depends_on: [{task: T-189, requires: clear}]
owner_validation: {required: false}
check_waiver:
  task: T-190
  reason: 'Owner said "orchestrate O-46"; under the standing run rules (no per-step checks, one Full Objective Check at the end), the optional Task Check is waived.'
  actor: {role: owner, session: o046-run-20261030}
  recorded_at: '2026-10-30T20:51:55Z'
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

Per criterion:
- Ecliptic rotated once at entry: `sampledBody` rotates each sample's position and velocity; `providerBody` wraps `stateAt` with `rotatedState` (src/api/scene.ts). The matrix is `createOrbTwoBodyAdapter().eclipticJ2000ToEqjMatrix()` (the engine's existing transform, the one `addGroup`'s plane uses); no new obliquity constant. Drawing, `stateOf` and readouts read the stored EQJ trajectory. Default stays EQJ.
- Bad `plane` throws `bad-trajectory: addTrajectory("id"): plane "x" must be ...` (test: galactic).
- Made-up test (packages/astraeus/tests/publicApiSunPaths.test.ts, new describe): ecliptic circle given with `plane: "ecliptic-j2000"` equals the pre-rotated EQJ path in `stateOf` position and velocity at 4 times; provider path rotates the same; orbit normal equals the ecliptic pole (inclination < 1e-3 deg) while z is non-zero in EQJ; default leaves numbers unrotated.
- Docs: `TrajectorySampleInput` and `plane` doc comments, README `addTrajectory` and `stateOf` rows, CHANGELOG Unreleased line.

Commands: `npm run lint` clean; `npm run typecheck` clean; `npm run build` ok (chunk-size warning only); `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml`: 145 files passed, 1897 passed, 1 skipped. No browser run.

Files read: Task, savepoint-task skill, Context Files (scene.ts, group.ts usage, README rows), plus src/core/twoBodyAdapter.ts, src/core/orbitGroup.ts, src/core/state.ts, src/core/sampledTrajectory.ts (extra reads: to find the existing transform and the State/sample shapes). Files changed: src/api/scene.ts, tests/publicApiSunPaths.test.ts (mirrors the T-189 style rather than publicApiPaths.test.ts), README.md, CHANGELOG.md (all under packages/astraeus), this Task.

Limitations: provider `stateAt` rotation covers position and velocity only (orientation passed through); a provider State with a non-3 vector passes through to createState's own refusal. Not independently checked (waived).

## Drift Notes

Record for the last step's Design reconciliation.

- Design.md `Interfaces and Data Flow` may want a line that `addTrajectory` input is EQJ by default with an optional ecliptic-j2000 rotation at entry; none was edited here.
