---
id: T-309
title: Add line points where a provider path bends or moves fast
objective: O-070
status: done
depends_on: []
owner_validation: {required: false}
planned_by: {role: planner, session: plan-o070-20261112}
check_waiver: {task: T-309, reason: 'Owner said "orchestrate O-070" under the standing run rules (one builder at a time, no per-step checks, coordinator marks done once gates pass, one Full Objective Check at the end); the optional Task Check is waived.', actor: {role: owner, session: o070-run-20261112}, recorded_at: '2026-11-12T07:55:14Z'}
planned_reads: [packages/astraeus/src/api/planPaths.ts, packages/astraeus/tests/publicApiProviderLines.test.ts, packages/astraeus/tests/scenePin.test.ts, packages/astraeus/tests/fixtures/scenePin.json, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md]
planned_writes: [packages/astraeus/src/api/providerPathTimes.ts, packages/astraeus/tests/providerPathTimes.test.ts, packages/astraeus/src/api/planPaths.ts, packages/astraeus/tests/fixtures/scenePin.json, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md]
---

# Add line points where a provider path bends or moves fast

## Outcome

A provider path's line is drawn from the 128 evenly spaced moments plus moments the engine adds where the line bends or the body moves fast, as seen from the path's `center`, up to 4,096 in all, so a one-hour flyby on a six-year path is drawn as a curve through the marker.

## User Check

None for the owner at this step (no demo draws a provider path; Objective success condition 6).

## Done When

- A pure function (new file, one job) returns a provider path's draw times from its bounds and a position-at-time reader: the 128 even moments as today (whole milliseconds, first and last the bounds), plus refined moments; at most 4,096; strictly increasing whole milliseconds; deterministic.
- `providerBody` in `src/api/planPaths.ts` uses it with the provider's own positions about its `center` (after the `plane` rotation, which does not change bends); `PROVIDER_PATH_SAMPLES` goes or becomes the seed count only. `samples` paths are untouched.
- Tests in a new `tests/providerPathTimes.test.ts`, synthetic only (ARCH-03), one table test across path kinds where they share an assertion:
  - Regression (TEST-02, F-05): a straight-line pass about Earth, closest approach a few Earth radii, a one-hour pass inside six-year bounds whose closest approach falls between two of the 128 even moments: at every minute within closest approach ± 3 h, the piecewise-linear line through the sample positions lies within 1% of the true distance from the centre of the true position. The same case with the 128 even moments alone fails this bound (shown in the test).
  - A circular orbit over six years and a near-still path: every one of the 128 even moments is present; count ≤ 4,096.
  - A pathological provider (a pass so close and fast the refinement would exceed the cap) returns exactly ≤ 4,096 times, still including the 128 even moments and the bounds.
  - Very short bounds (a few ms) still return valid strictly increasing whole-ms times.
- `tests/publicApiProviderLines.test.ts` cases still pass unchanged (every `lineFixedTo` form builds and draws).
- The scene pin (`tests/fixtures/scenePin.json`) entries for provider paths change deliberately: rewrite only those entries by hand, per the pin's own header rule, and record in Technical Evidence which entries changed and why. No existing test's setup changes.
- README `Bodies and paths`, the `addTrajectory` row: one sentence on how a provider path's line is drawn and the known limit (Objective success condition 4). CHANGELOG Unreleased entry (fix). `api-surface.lock.json` unchanged.

## Context Files

`.savepoint/objectives/O-070-flyby-lines-follow-the-path-where-it-bends/Objective.md`, `packages/astraeus/src/api/planPaths.ts`, `packages/astraeus/tests/publicApiProviderLines.test.ts`, `packages/astraeus/tests/scenePin.test.ts` (header and the provider cases only), `packages/astraeus/tests/fixtures/scenePin.json` (provider path entries only), `packages/astraeus/README.md` under `Bodies and paths` (the `addTrajectory` row), `packages/astraeus/CHANGELOG.md` (newest section only).

## Design References

`.savepoint/Design.md` under `Paths across the solar system` and `One path through every stretch` (the `"auto"` stretches are planned from these same times).

## Guardrails

ARCH-02, ARCH-03, ARCH-04, API-01, API-07, TEST-01, TEST-02, TEST-03, STYLE-01, STYLE-02.

## Implementation Plan

1. Confirm `providerBody` still builds `pathTimesUtcMs` from 128 even moments and that `TrackedBodyView` and `autoStretches` read only `pathTimesUtcMs`; REPLAN REQUIRED if not.
2. Write the pure time planner. Recommended method (the builder may choose another that meets Done When): start from the 128 even moments; split an interval at its whole-ms midpoint while either (a) the angle the body sweeps as seen from the centre between the interval's ends exceeds a few degrees (catches a pass hidden between two even moments, where the body swings round the centre), or (b) the true midpoint lies farther from the chord's midpoint than a small fraction of its distance from the centre; never split an interval shorter than 2 ms; refine the worst intervals first (a priority queue on the error) so the cap keeps the most useful points.
3. Wire it into `providerBody`, reading positions through the rotated trajectory's `stateAt(t, center)`.
4. Tests as above; hand-rewrite the pin's provider entries; README sentence; CHANGELOG.

## Boundaries

No host density option, no change to `samples` paths, the marker's size (F-06), `stateOf`, readouts or the `lineFixedTo` drawing. Bends are judged from the path's `center` only (owner decision); do not resolve other bodies' positions while planning.

## Technical Verification

Focused `npx vitest run tests/providerPathTimes.test.ts tests/publicApiProviderLines.test.ts tests/scenePin.test.ts` while iterating; hand-off gates per `docs/agents/build.md` (`npm run lint`, `npm run typecheck`, `npm run build`, `npm test` in `packages/astraeus`). No browser run. Evaluated later under `agent-skills/references/check-method.md`; the Full Objective Check is mandatory.

## Technical Evidence

Gates (repo root, where the scripts live; `packages/astraeus` has no `lint` script): `npm run lint` pass, `npm run typecheck` pass, `npm run build` pass, `npm test` pass (253 files, 3,768 passed, 2 skipped, 0 failed). `api-surface.lock.json` unchanged. No browser run. Extra reads: none beyond Context Files.

Method (`src/api/providerPathTimes.ts`, `providerPathTimes(start, end, positionAt)`): start from the 128 even moments (as before, deduplicated for very short bounds). Each interval is scored by the larger of (sweep angle about the centre between its ends / 3 degrees) and (distance of the true whole-ms midpoint from the time-weighted chord point / (0.25% of max(midpoint distance, nearer end distance))). A max-heap on the score (ties to the earlier interval) splits the worst interval at its floor midpoint while the score exceeds 1 and the interval is at least 2 ms, until none is left or 4,096 moments exist. If the provider throws or gives no finite 3-vector at planning, the 128 even moments stand alone (the old behaviour; the fault surfaces when drawn, so the existing `publicApi` stub provider and the unloaded-series order keep working).

Counts: flyby (3 Earth radii, six years) 231 moments, 461 provider calls; circular orbit (2.3-year period, six years) 509; a 27-day circle over six years hits the 4,096 cap; near-still path 128.

| Done When | Evidence |
|---|---|
| Pure function in a new file, 128 even + refined, whole-ms, strictly increasing, <= 4,096, deterministic | `src/api/providerPathTimes.ts`; `tests/providerPathTimes.test.ts` "what every path keeps" (table over circle, near-still, flyby, pathological), "is deterministic" |
| `providerBody` uses it with positions about `center` after the plane rotation; `PROVIDER_PATH_SAMPLES` gone; `samples` untouched | `src/api/planPaths.ts` `providerBody` reads `trajectory.stateAt(t, center).positionKm` (the rotated trajectory); constant removed; `sampledBody` unchanged |
| F-05 regression: line within 1% at every minute within closest approach +/- 3 h; 128 even moments alone fail | `providerPathTimes.test.ts` first describe: even moments alone give a gap above 0.01 (asserted), planned moments below 0.01; closest approach falls midway between two even moments |
| Circular orbit and near-still: all 128 even moments present, count <= 4,096 | "what every path keeps" table (even moments contained, bounds, cap); near-still adds nothing (length 128) |
| Pathological provider: <= 4,096, with the 128 even moments and bounds | 60 s-period circle over six years: exactly 4,096, even moments and bounds present |
| Very short bounds valid | "very short bounds" table, spans 1, 2, 3, 7, 50, 200 ms |
| `publicApiProviderLines.test.ts` unchanged and passing | file untouched; passes |
| Pin entries for provider paths rewritten deliberately | `tests/fixtures/scenePin.json`, trackedBodies entry `bump` (the only provider path), in both orders (series loaded and not loaded): `pathTimesUtcMs` `[numbers]` 128 -> 210 and `sum` 226260172800000 -> 371196105874000; `head` and `tail` unchanged. Why: the made-up provider drifts in x about the Sun, so the planner adds moments where the angle swept about the centre is above 3 degrees. Regenerated with `vitest -u` on that file and the diff checked to be only those 4 lines; no test setup changed. |
| Unreadable provider keeps the 128 | `providerPathTimes.test.ts` "a provider that gives no position at planning" table (throws, none, NaN) |
| README `addTrajectory` row sentence; CHANGELOG Unreleased fix | `README.md` `addTrajectory` row (end), `CHANGELOG.md` Unreleased top entry |

Marked done by the coordinator 2026-11-12T08:03:07Z under the owner's "orchestrate O-070" standing rule ("I mark them as they pass"): gates passed (lint, typecheck, build, test 3,768 passed); focused rerun by the coordinator 21/21; `api-surface.lock.json` unchanged.

## Drift Notes

Design `Paths across the solar system` has no sentence on provider line sampling; add one at reconciliation before the Full Check (128 even moments plus up to 4,096 in all, bends judged from the path center, an unreadable provider at planning keeps the 128). Original note: if the Design `Paths across the solar system` text needs a sentence on provider line sampling, note it here for reconciliation before the Full Check.
