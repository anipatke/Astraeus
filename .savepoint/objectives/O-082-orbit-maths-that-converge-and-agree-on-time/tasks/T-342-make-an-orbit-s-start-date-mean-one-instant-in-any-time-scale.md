---
id: T-342
title: Make an orbit's start date mean one instant in any time scale
objective: O-082
status: done
depends_on: []
check_waiver: {task: T-342, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T11:00:13Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: plan-g024-20261121}
lane: epoch
planned_reads: [packages/astraeus/src/core/timeScale.ts, packages/astraeus/src/core/twoBodyAdapter.ts, packages/astraeus/tests/planetAccuracyFlybys.test.ts]
planned_writes: [packages/astraeus/src/core/elementsBody.ts, packages/astraeus/tests/elementsEpoch.test.ts]
---

# Make an orbit's start date mean one instant in any time scale

## Outcome

A body built from orbital elements gives the same state whether its epoch is written in UTC, TT or TDB for the same instant, and its two-body motion uses the given centre's mass (AH-02, AH-08).

## User Check

None visual. The same orbit with its epoch written as UTC and as the equivalent TT gives positions within a metre of each other instead of 2,154 km apart.

## Done When

- `buildElementsBody` converts the epoch to TDB (through `core/timeScale.ts`) before subtracting `perihelionJdTdb`, so the mean anomaly and `periapsisUtcMs` are computed in one scale.
- The two-body adapter receives the centre's `gmKm3S2`, so mean motion and propagation use the same mass.
- New `tests/elementsEpoch.test.ts`: Codex's probe case (a = 1 AU, e = 0.2, perihelion JD 2451500 TDB; epoch JD 2451545 UTC versus JD 2451545 + 64.184/86400 TT with `ttMinusUtcSeconds: 64.184`) gives states within 1 m; the same equivalence for a TDB epoch and for the `meanAnomalyDeg` branch; it fails against the current `elementsBody.ts` (show it).
- Existing elements-body, Perseids parent-body and Horizons tests unchanged and green.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/core/elementsBody.ts` (around `parseEpoch`, `epochUtcMsOf`, `buildElementsBody`)
- `packages/astraeus/src/core/timeScale.ts` (the UTC/TT/TDB conversions)
- `packages/astraeus/src/core/twoBodyAdapter.ts` (adapter options)
- `.savepoint/objectives/O-082-orbit-maths-that-converge-and-agree-on-time/Objective.md`

## Design References

`.savepoint/Design.md` under `Architecture`.

## Guardrails

ARCH-04, PROV-01, API-04, TEST-01..04.

## Implementation Plan

1. Write the equivalence test first and show the 2,154 km gap.
2. Convert the epoch once to TDB seconds/JD for the anomaly computation; keep `epochUtcMs` for the clock.
3. Pass the centre GM to the adapter.
4. Run elements-body and Horizons suites, then the gates.

## Boundaries

No change to the public elements record schema, its validation ranges or the solver (the other Task). Pre-1972 civil time limits stay as documented.

## Technical Verification

Focused tests while iterating; Task handoff gates. No browser run.

## Technical Evidence

Red first (current code, before the fix; saved at the coordinator scratchpad `t342-before.txt`): UTC-vs-TT perihelion case failed with a gap of 2,153,975 m (2,154 km); UTC-vs-TDB perihelion case the same; the centre-GM test got 36.48 km in 1 s against the expected 72.96 km (adapter used the built-in Sun GM, not the centre's).

| Done When | Evidence |
|---|---|
| Epoch converted to TDB before subtracting `perihelionJdTdb` | `elementsBody.ts` `epochInstant` (UTC via orb `ttMinusUtc` + `tdbMinusTtSeconds` from `core/timeScale.ts`; TT via `tdbMinusTtSeconds`; TDB as written); `tests/elementsEpoch.test.ts` UTC vs TT (perihelion and meanAnomalyDeg) under 1 m |
| Adapter gets the centre's GM | `createOrbTwoBodyAdapter([{ id: centre.id, gmKm3S2: gm }])`; test "moves the body by its true mean motion about the given centre's mass" (4x GM doubles perihelion speed) |
| New test, TDB epoch and meanAnomalyDeg branch, fails on old code | `tests/elementsEpoch.test.ts` (5 tests); failed before as above, 5 of 5 pass after. The meanAnomalyDeg cases pass before the fix too (the branch never used the perihelion scale; they guard the epoch clock). |
| Existing tests unchanged and green | elements-body, Perseids rebuild, Swift-Tuttle, scenePin, publicApiGroup all green with no edits |
| Gates | lint clean, typecheck clean, build ok, test 291 files / 4640 passed, 2 skipped, 0 failed (run under flock, with T-341's concurrent edits in the tree) |

Files changed: `src/core/elementsBody.ts`, `src/types/orb.d.ts` (declares orb's already exported `ttMinusUtc`), new `tests/elementsEpoch.test.ts`.

Limitations / deviation: a TDB epoch stays "TDB taken as TT" for the clock (the record's documented convention, and existing tests pin the ms: elementsBody and Swift-Tuttle epoch tests), so a TDB epoch agrees with the same instant in UTC to the TDB-TT difference (0.1 ms, about 3 m at J2000; up to 2 ms, about 60 m of motion), not 1 m; the new TDB test asserts 5 m and says why. The engine epoch is a whole millisecond. `orb.d.ts` edit is outside planned_writes.

## Drift Notes

Design.md: elements-body epoch handling now converts to TDB for the anomaly (UTC and TT epochs); a TDB epoch is still taken as TT for the clock (documented convention). Name of integration Task not needed unless Design describes elements epochs.

Coordinator (orchestrate-g024-20261121): gates passed at hand-off (lint, typecheck, build, `npm test` 291 files / 4640 passed, with T-341 in the tree). The TDB-epoch tolerance (5 m, not 1 m) is accepted as a planner decision recorded in the Objective's Decisions. `status: done` set by the coordinator under the owner's standing orchestration rule ("I mark them as they pass", O-038) and G-024 decision 7.
