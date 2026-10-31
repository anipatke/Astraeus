---
id: T-196
objective: O-047
title: Draw every planet's orbit line and fit the view to it
status: planned
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: probe-feedback-20261031}
---

# Draw every planet's orbit line and fit the view to it

## Outcome

`addBody(x, { orbit: true })` and `camera.fitOrbit(x)` work for every catalogued planet, Saturn, Uranus and Neptune included, because each planet's period is held once in the catalogue (one general rule, not a special case); and any setup error reaches the host once, at `toDefinition` or through `ready` / `onError`, never repeated per frame (I-111).

## User Check

Not owner-facing on its own; the owner looks once at the end of the Objective (last step).

## Done When

- The catalogue holds each planet's sidereal period with its source (PROV-01); `sunOrbitLayer` and `farthestSunDistanceKm` use a known period before any turn search (`src/api/sunOrbit.ts`), so `BUILT_IN_SAMPLING` or its replacement covers planets generally.
- A body that still cannot be drawn is refused at `toDefinition` with `no-orbit`, not at load.
- `fitOrbit`'s farthest distance is computed during setup, not lazily in the frame loop (`src/app/sceneFraming.ts:77`); a framing error is reported once and labels keep being placed (test).
- Tests: orbit line and `fitOrbit` for Saturn, Uranus and Neptune; a made-up long-period body without a period is refused at `toDefinition`; the Planets demo and existing orbit tests unchanged (name them).
- The `no-orbit` error texts and README rows say which bodies draw orbits.

## Context Files

`packages/astraeus/src/api/sunOrbit.ts`, `packages/astraeus/src/api/scene.ts`, `packages/astraeus/src/core/bodies/index.ts`, `packages/astraeus/src/core/bodies/planetRecords.ts`, `packages/astraeus/src/core/bodies/outerPlanets.ts`, `packages/astraeus/src/app/sceneFraming.ts`, `packages/astraeus/src/api/mount.ts`, `packages/astraeus/tests/publicApiSunOrbits.test.ts`, `packages/astraeus/tests/fitOrbit.test.ts`, `packages/astraeus/tests/longOrbitPaths.test.ts`.

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`.

## Guardrails

ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, ARCH-06, PROV-01, TEST-01, TEST-02, TEST-03, TEST-04; STYLE rules (advisory).

## Implementation Plan

1. Mark this step in_progress before any work.
2. Find where planet periods could live once in the catalogue (ARCH-05); return REPLAN REQUIRED if that needs a catalogue format change beyond an added field.
3. Use the period in the orbit line and farthest-distance paths.
4. Move the farthest-distance read into setup; validate at `toDefinition`.
5. Tests, doc comments, README rows, CHANGELOG `Unreleased` line.

## Boundaries

No change to orbit appearance; no new orbit styles.

## Technical Verification

Focused tests while iterating; at hand-off the configured lint, typecheck, build and test gates (`.savepoint/config.yml`, lite at hand-off). No browser run in this step (one `npm run check:browser` in the last step). Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Pending execution: named cases, results, files read/changed, limitations.

## Drift Notes

Record architecture deltas here; the last step reconciles them into Design.md.
