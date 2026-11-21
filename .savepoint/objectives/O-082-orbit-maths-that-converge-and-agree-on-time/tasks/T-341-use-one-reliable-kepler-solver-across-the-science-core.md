---
id: T-341
title: Use one reliable Kepler solver across the science core
objective: O-082
status: planned
depends_on: []
check_waiver: {task: T-341, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T11:00:13Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: plan-g024-20261121}
lane: solver
planned_reads: [packages/astraeus/src/core/satelliteMeanElements.ts, packages/astraeus/src/core/bodies/io.ts, packages/astraeus/src/app/keplerShader.ts, packages/astraeus-demo-showers/tests/keplerShader.test.ts, packages/astraeus/tests/longOrbitPaths.test.ts, packages/astraeus/tests/jupiterIo.test.ts, packages/astraeus/tests/listedOrbitGroup.test.ts, packages/astraeus/tests/pointsKepler.test.ts]
planned_writes: [packages/astraeus/src/core/keplerAnomaly.ts, packages/astraeus/src/core/listedOrbitGroup.ts, packages/astraeus/src/core/sunCentredSources.ts, packages/astraeus/src/core/keplerElements.ts, packages/astraeus/tests/keplerSolver.test.ts]
---

# Use one reliable Kepler solver across the science core

## Outcome

Every CPU Kepler solve in `src/core/` goes through one convergent solver, so a body, a group member or a long-orbit path is placed correctly for every eccentricity from 0 up to (not including) 1, including near-parabolic comets (AH-01).

## User Check

None visual. A body with e = 0.999 and a small mean anomaly lands where an independent bisection puts it; the full suite stays green.

## Done When

- `core/keplerAnomaly.ts` holds one elliptic solve (mean anomaly wrapped to [-π, π], a start that cannot overshoot near periapsis, a residual-based stop, a bounded iteration count, `e < 0 || e >= 1` refused with a named error) and `trueAnomalyFromMean` built on it.
- `listedOrbitGroup.eccentricAnomalyRad`/`trueAnomalyFromMeanRad` and `sunCentredSources.eccentricAnomalyFromMean` delegate to it (unwrapped anomaly preserved where the caller needs it); `eccentricAnomalyRad` stays exported from `listedOrbitGroup`.
- `keplerElements.fillKeplerRangeKm` uses it only if a measured 110,000-member fill is not more than 5% slower (record both timings); otherwise it stays inline and is covered by the table test.
- New `tests/keplerSolver.test.ts`: one table over e ∈ {0, 0.5, 0.9, 0.99, 0.995, 0.999, 0.9999} × many mean anomalies (including near 0, near ±π and large unwrapped values) for every solver entry point, against an independent bisection of E − e sin E = M; residual and E agree to a stated tolerance; e ≥ 1 and e < 0 refused. The table fails against the current `keplerAnomaly.ts` (show it).
- Existing tests unchanged and green, including Horizons fits, `jupiterIo`, `longOrbitPaths`, `listedOrbitGroup`, `pointsKepler` and the showers `keplerShader` CPU-twin agreement.
- Gates per `docs/agents/verification.md`; also run `vitest` for the new and touched files on Node 22.

## Context Files

- `packages/astraeus/src/core/keplerAnomaly.ts`
- `packages/astraeus/src/core/listedOrbitGroup.ts` (around `eccentricAnomalyRad`, `trueAnomalyFromMeanRad`)
- `packages/astraeus/src/core/sunCentredSources.ts` (around `eccentricAnomalyFromMean`)
- `packages/astraeus/src/core/keplerElements.ts` (around `fillKeplerRangeKm`)
- `packages/astraeus-demo-showers/tests/keplerShader.test.ts`
- `.savepoint/objectives/O-082-orbit-maths-that-converge-and-agree-on-time/Objective.md`

## Design References

`.savepoint/Design.md` under `Architecture` (science core boundary).

## Guardrails

ARCH-04, ARCH-05, STYLE-07, CODE-01, TEST-01..04.

## Implementation Plan

1. Write the bisection table test first and show it failing on the current solver at high e.
2. Rewrite the solve in `keplerAnomaly.ts`; keep `trueAnomalyFromMean`'s signature.
3. Delegate the `listedOrbitGroup` and `sunCentredSources` solvers; keep their exported names.
4. Measure the 110,000-member fill before and after routing `fillKeplerRangeKm`; keep the faster-enough option.
5. Run the suites named above, then the gates.

## Boundaries

No change to the GLSL solver or its Float32 twin, the Apollo tool's propagator, public API, scientific tolerances or existing test setup. Hyperbolic orbits stay refused.

## Technical Verification

Focused tests while iterating; Task handoff gates from `.savepoint/config.yml`. No browser run.

## Technical Evidence

Pending execution.

## Drift Notes

Record any change to which solver a subsystem uses for Design reconciliation.
