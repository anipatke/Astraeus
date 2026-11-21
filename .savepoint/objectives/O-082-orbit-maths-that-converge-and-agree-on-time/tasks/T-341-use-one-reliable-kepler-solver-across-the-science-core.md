---
id: T-341
title: Use one reliable Kepler solver across the science core
objective: O-082
status: done
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

Extra reads: none beyond Context Files and planned_reads (keplerElements.ts top for `KeplerElements`/`wrapAnomaly`).

Done When -> evidence:

| Done When | Evidence |
|---|---|
| One elliptic solve in `core/keplerAnomaly.ts` (wrap, non-overshooting start, residual stop, bounded loop, named refusal) and `trueAnomalyFromMean` on it | `eccentricAnomalyFromMean` (mean wrapped to (-pi, pi], cube-root start for e > 0.8, Newton inside bracket [0, pi] with bisection fallback, stops on zero residual or step at rounding, 100-step cap); `KeplerEccentricityError` (RangeError) for e < 0, e >= 1 or NaN; `trueAnomalyFromMean` calls it. Proved by `tests/keplerSolver.test.ts` (all entry points + refusal test). |
| `listedOrbitGroup` and `sunCentredSources` delegate; `eccentricAnomalyRad` stays exported | `listedOrbitGroup.eccentricAnomalyRad` is `export const = eccentricAnomalyFromMean`; `trueAnomalyFromMeanRad` calls `trueAnomalyFromMean`; `sunCentredSources.eccentricAnomalyFromMean` reduces by whole turns (same (-pi, pi] rule) and adds them back, so the unwrapped value is kept (`longOrbitPaths.test.ts` unwrapped test passes). Showers `keplerShader.test.ts` imports `eccentricAnomalyRad` from `listedOrbitGroup` and passes. |
| `fillKeplerRangeKm` uses shared solve only if not > 5% slower (record both timings) | Measured 110,000 members, median of 15 fills after warm-up, throwaway bench (removed): e up to 0.3: inline 14.58 ms, shared 21.29 ms (x1.46); e up to 0.9: inline 17.15 ms, shared 28.00 ms (x1.63). Far over 5%, so `fillKeplerRangeKm` stays inline (unchanged) and is covered by the table test. |
| New `tests/keplerSolver.test.ts`: table over e {0, .5, .9, .99, .995, .999, .9999} x many M vs independent bisection; residual and E to stated tolerance; e >= 1 and e < 0 refused; fails against current solver | Table has 28 mean anomalies (near 0, +-pi, +-2pi offsets, large values to -98765.4) x 7 eccentricities for 6 entry points (shared E, shared true anomaly, `eccentricAnomalyRad`, `trueAnomalyFromMeanRad`, sun-centred E, `fillKeplerRangeKm` position). Tolerances: E within 1e-9 and residual within 1e-12, each plus 2e-15 x abs(M) for whole-turn reduction. Before the rewrite (same test file, temp shim for the not-yet-existing shared export) 3 failed / 5 passed; the failing output is below. After: all pass. |
| Existing tests unchanged and green (Horizons fits, jupiterIo, longOrbitPaths, listedOrbitGroup, pointsKepler, showers keplerShader) | From repo root: `npm test -- <those six files>` = 6 files, 73 passed, 1 skipped. No existing test edited. (Running them from `packages/astraeus` alone fails jupiterIo with NotLoadedError because root setup loads the fits; not a regression.) |
| Gates; vitest on new/touched files on Node 22 | See gates below. Node 22 is not installed here (only v24.16.0; no nvm/fnm/n/volta), so the focused run was on Node 24: limitation. |

Failing output before the rewrite (current `trueAnomalyFromMean`, Newton from M + e sin M, 50 steps without safeguard; the e = 0.9999 rows were found by a scan, and the other six entry points already converged for this table):

```
x keplerAnomaly.eccentricAnomalyFromMean ... (via the true-anomaly shim)
x keplerAnomaly.trueAnomalyFromMean ...
x refuses eccentricities outside [0, 1) with a named error
+ "e=0.9999 M=0.0017782794: E=0.21942331486832672 want 0.21942327859316363 (error 3.627516309556711e-8, residual 8.733050385276164e-10)",
+ "e=0.9999 M=-0.0017782794: E=-0.21942331486832672 want -0.21942327859316363 (error 3.627516309556711e-8, residual 8.733050385276164e-10)",
Tests  3 failed | 5 passed (8)
```
(The scan also showed the current solver is off by up to 0.33 rad for e = 0.9999 at M of about 0.0018 and 5.08 rad at M of about 0.0032 by true-anomaly residual: the Newton iteration cycles without converging.)

Gates (inside `flock /tmp/claude-1000/astraeus-gates.lock`): `npm run lint` clean; `npm run typecheck` clean; `npm run build` built; `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml`: 291 files passed, 4640 tests passed, 2 skipped. An earlier full run, taken while T-342's builder was mid-edit in `elementsBody.ts`, showed 9 failures in 6 files (publicApiGroup, scenePin, viewerIds, showers elementsBody, rebuildComparison, swiftTuttle); the same files passed on rerun with no change of mine, so they were T-342's transient state.

Files changed: `packages/astraeus/src/core/keplerAnomaly.ts`, `listedOrbitGroup.ts`, `sunCentredSources.ts`; new `packages/astraeus/tests/keplerSolver.test.ts`. `keplerElements.ts` unchanged (stays inline).

Limitations: Node 22 not available; behaviour change: for M exactly +-pi the solvers return +pi (existing `jupiterIo` test requires pi); `trueAnomalyFromMean` now throws `KeplerEccentricityError` for e >= 1 where it previously returned NaN or garbage.

## Drift Notes

Record any change to which solver a subsystem uses for Design reconciliation.

Drift (for Design reconciliation, science core): `satelliteMeanElements`, `bodies/io` and `elementsBody` (through `trueAnomalyFromMean`), `listedOrbitGroup` and `sunCentredSources` now share one bounded elliptic solve in `core/keplerAnomaly.ts` (`eccentricAnomalyFromMean`, `KeplerEccentricityError`). `fillKeplerRangeKm` keeps its inline Newton (shared solve measured 46% to 63% slower on 110,000 members). The GLSL solver and its Float32 twin are unchanged. No deferred architecture notes.

Coordinator (orchestrate-g024-20261121): gates passed at hand-off (lint, typecheck, build, `npm test` 291 files / 4640 passed); `status: done` set by the coordinator under the owner's standing orchestration rule ("I mark them as they pass", O-038) and G-024 decision 7 ("Orchestrate each objective to completion"). Node 22 run deferred to the Full Objective Check.
