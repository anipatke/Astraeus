---
id: C-029
scope: {kind: task, id: T-052}
result: CLEAR
checked_by: {role: checker, session: o011-orchestrator-check-20261013}
executed_session: t052-builder-2026-10-15
checked_at: '2026-10-15T08:37:00Z'
reviewed:
  base_commit: 5d063f1
  head_commit: 5d063f1 (working tree, uncommitted)
  files:
    - src/core/listedOrbitGroup.ts
    - src/core/orbitGroup.ts
    - src/synthetic/syntheticListedDefinition.ts
    - src/main.tsx
    - tests/listedOrbitGroup.test.ts
    - tools/validate/browser-synthetic-listed.mjs
  dependencies: [T-051]
issues: []
supersedes: null
---

# C-029: T-052 Task Check (Quick)

Checker: the O-011 orchestrator session. The Sonnet builder sub-session is separate.

## Scope Lock

1. Done When 1–6 of T-052. The owner look is not required.
2. Changed files: as listed. `src/core/orbitGroup.ts` gains `export` on `seededRandom` and `rotateInto` only (checker diff: two lines, behaviour unchanged). `src/main.tsx` gains one registration line. Both are outside planned_writes and are recorded in the Task evidence.
3. Out of scope: real CAMS data (T-038).

## Acceptance Coverage

| DW | Result | Independent evidence |
|----|--------|----------------------|
| 1 Per-member propagation and record id | Proven | Checker probe (temporary test, deleted after the run): 200 made-up Sun-centred members with a = 3–42 AU and e = 0.6–0.98. The checker's own bisection Kepler solve and element rotation were compared against `fillPositionsKm` at 0, 30, 365 and 3650 days. Worst relative error was below 1e-9, using the engine's ecliptic→EQJ matrix; the checker's first run with its own obliquity constant differed by 2e-7, which is the constant, not the propagation. The builder's literal 1e-6 km holds about a planet. At Sun scale it uses max(1e-6 km, 1e-13·|r|), and that is a double-precision floor, not a defect (see Observation 1). `recordIdAt` and the State body id were reviewed in the code. |
| 2 Validation | Proven | Code review: errors name the member index, the record id and the field for non-finite values, e ≥ 1, a ≤ 0, inclination, epoch, blank and duplicate ids; an empty list raises `GroupCountError`. These are covered by the builder's tests. |
| 3 Phase rule and concentration | Proven | Checker probe: the sorted mean anomalies equal (k+0.5)·360/n to 1e-9, deterministic per seed. The epoch is kept but does not place a dot (code). Provenance is `illustrative`, and the concentration note says "a model, not a measurement". The concentration places round(fraction·n) members evenly within ±widthDeg of the parent's mean anomaly; the builder's test covers the share. |
| 4 Performance and determinism | Proven (builder figures) | 30,000 members fill in 5.6–5.8 ms, against 5.1–7.7 ms for `createOrbitGroup` and a 33.4 ms budget. The output is bit-identical between two builds. The checker reviewed the code: a single batch loop through `propagateMemberInto`, with no allocation per member in the fill. |
| 5 Made-up experience and browser | Proven | The checker re-ran `browser-synthetic-listed.mjs` against :5302 into `docs/evidence/o011-t052-check-20261015T083601Z/`: exit 0, `errors: []`, dot pixels 8,210 / 8,183 on desktop and 862 / 854 on phone. The checker viewed the screenshot: dots follow their orbits, a clump sits along the parent path, and the panel states made up, illustrative position, the clump as a model and the missing parts. The name grep over the new core and synthetic files returns 0 hits. |
| 6 Gates and browser scripts | Proven | Checker, 2026-10-15T08:33Z: `npm run typecheck` 0, `npm run build` 0, `npx vitest run` 33 files and 613 tests passed. The builder ran 14 browser scripts into `docs/evidence/o011-t052-20261015T080645Z/`, all exit 0 with no errors. `regression-spike01-02` is unchanged (checker `git status`). |

## Issues

None.

## Observations (non-blocking, for T-038 and T-040)

1. **DW1 tolerance at Sun scale.** 1e-6 km at 1e8 km sits below what two independent double-precision Kepler solves agree to, about 1e-14 relative. The builder's relative floor is the right reading. A planner may restate DW1 as relative for Sun-centred groups.
2. **What "clump near the comet" means.** The concentration matches the parent's *mean anomaly* (orbital phase), not its position in space. CAMS Perseid semi-major axes range widely, so members at the comet's phase lie along the same direction from the Sun but at their own distances, forming a band at the comet's phase rather than a blob on the comet. That is the usual meaning in stream dynamics, but T-038 must word the panel and pick or cite the fraction and width accordingly, and the owner's look against meteorshowers.org will judge it.
3. **Drift notes for T-040:** the new generic `createListedOrbitGroup` needs adding to Design.md; μ is probed through `elementsToState` (an explicit accessor would be a small later change); the parent's velocity uses a ±1000 s central difference when absent.
4. The builder's own run of `browser-synthetic-listed.mjs` left no log file. The checker's re-run above supplies it.
