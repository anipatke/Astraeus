---
id: T-361
title: Timing checks warn instead of fail
objective: O-085
status: done
depends_on: []
check_waiver: {task: T-361, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T12:50:31Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: timing
planned_reads: [packages/astraeus/src/core/pacing.ts, packages/astraeus/src/app/frameStats.ts, packages/astraeus/tests/listedOrbitGroup.test.ts, packages/astraeus/tests/groupLookRender.test.ts]
planned_writes: [packages/astraeus-demo-showers/tests/showersMeasured.test.ts, packages/astraeus/tests/frameStats.test.ts, packages/astraeus/tests/pacedAdvance.test.ts]
---

# Timing checks warn instead of fail

## Outcome

No test in the default suites (`npm test`, `npm run test:full`) fails because the machine was busy or coverage slowed it: each wall-clock assertion becomes a printed warning, or is replaced by a check that does not depend on the clock (AH-35: Gemini F-07, Claude F-22).

## User Check

None visual. `npm run test:full` no longer fails on "fills every dot quickly enough … (an indication only …)" under coverage.

## Done When

- The three wall-clock assertions the planner found in the default suites are gone (PLAN.md decision 1):
  - `packages/astraeus-demo-showers/tests/showersMeasured.test.ts` ~258 `expect(ms).toBeLessThan(100)`: the test keeps its best-of-five fill and its `console.info` line; over 100 ms it prints a `console.warn` naming the time and the 100 ms budget instead of failing. The title keeps "an indication only".
  - `packages/astraeus/tests/frameStats.test.ts` ~80 `expect(tickUs).toBeLessThan(50)` ("costs little per frame"): the same treatment (warn over 50 µs).
  - `packages/astraeus/tests/pacedAdvance.test.ts` ~103 `expect(Date.now() - start).toBeLessThan(2_000)` ("is bounded …"): replaced by a clock-free outcome that proves the bound, for example that the advance from `START` over ten years of real time stops short of what an unbounded walk would reach (the rest is dropped) and is finite. The two existing assertions after it stay unchanged.
- The `ASTRAEUS_PERF=1` frame-budget case in `listedOrbitGroup.test.ts` (~327, `it.skipIf(perfOnRequest)`) is left as it is: it is not in the default suites.
- A repo search for `performance.now()` and `Date.now() -` under `packages/*/tests` is recorded in Technical Evidence, listing each hit as warning-only, log-only, opt-in (`ASTRAEUS_PERF`), or not a timing measure (for example the `until` poll in `lifecycle.test.ts`).
- Each changed test is the subject of this Task; only the named timing assertion lines change. Every other assertion in those tests, and every other test, is unchanged.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus-demo-showers/tests/showersMeasured.test.ts` (the "fills every dot quickly enough" case, lines ~253–260)
- `packages/astraeus/tests/frameStats.test.ts` (the "costs little per frame" case, lines ~70–81)
- `packages/astraeus/tests/pacedAdvance.test.ts` (the "is bounded" case, lines ~100–107)
- `packages/astraeus/src/core/pacing.ts` (`MAX_PACE_STEPS` ~159, `pacedAdvance` ~203; read only)

## Design References

`.savepoint/Design.md` under `Current Technical State` (gate times and limits paragraph).

## Guardrails

TEST-01, TEST-03, STYLE-07, STYLE-10.

## Implementation Plan

1. Run the search; confirm the three sites are the only assertions on measured wall-clock time in default suites. Report any further site found and treat it the same way.
2. Turn the two budget checks into warnings (`console.warn` only when over budget).
3. Replace the paced-advance timing check with a clock-free bound derived from `MAX_PACE_STEPS` and the step cap; show it still fails if the loop bound is removed (temporarily change `step < MAX_PACE_STEPS` to `true` in a scratch copy or local edit, run, revert; record the result).
4. Focused tests, then gates.

## Boundaries

Test files only; no change to `pacing.ts`, `frameStats.ts` or the fill code. No new allowlist or text-scan test for timing (PLAN.md decision 1). Timeouts are draft 03's; float tolerances are draft 02's.

## Technical Verification

Focused: `npx vitest run packages/astraeus-demo-showers/tests/showersMeasured.test.ts packages/astraeus/tests/frameStats.test.ts packages/astraeus/tests/pacedAdvance.test.ts`, then the same under coverage: `npx vitest run --coverage packages/astraeus-demo-showers/tests/showersMeasured.test.ts`. Handoff: `quality_gates`. The Node 22 and 24 `test:full` runs are draft 03's. No browser run.

## Technical Evidence

### Search (`performance.now()` / `Date.now() -` under packages/*/tests)

- showersMeasured.test.ts:257: was a failing assertion (`toBeLessThan(100)`); now warning-only (`console.warn` at >= 100 ms) plus the existing `console.info`.
- frameStats.test.ts:73-78: was a failing assertion (`toBeLessThan(50)`); now warning-only (>= 50 us) plus the existing `console.log`.
- pacedAdvance.test.ts:101-103: was a failing assertion (`Date.now() - start < 2000`); replaced by a clock-free check (below).
- groupLookRender.test.ts:136-138: log-only (`console.log` median/worst; no timing assertion).
- listedOrbitGroup.test.ts:344-353: opt-in (`it.skipIf(perfOnRequest)`, ASTRAEUS_PERF=1), left as is.
- listedOrbitGroup.test.ts:549-553: log-only (O-077 scale `console.log`).
- lifecycle.test.ts:54-56: `until` poll deadline, not a timing measure.
No further failing wall-clock assertion found.

### Before / after

- showersMeasured ~258: `expect(ms).toBeLessThan(100);` -> `if (ms >= 100) console.warn(...)`.
- frameStats ~80: `expect(tickUs).toBeLessThan(50);` -> `if (tickUs >= 50) console.warn(...)`.
- pacedAdvance ~101-103: removed `const start = Date.now()` and `expect(Date.now() - start).toBeLessThan(2_000)`. The existing pacing (10 zones) never reaches MAX_PACE_STEPS, so the old test did not exercise the bound; the case now builds a local 300-zone pacing (ramps; needs far more than 4096 sub-steps) and asserts the ten-year advance is finite, > START, and `< ` the last zone's end (the remainder is dropped). The existing `MAX_PACE_STEPS > 0` assertion stays.

### Done When -> evidence

| Done When | Evidence |
|---|---|
| three wall-clock assertions gone | diff above; focused run 3 files / 43 tests passed |
| showers: warn, title unchanged | showersMeasured.test.ts, warn line |
| frameStats: warn | frameStats.test.ts, warn line |
| pacedAdvance clock-free bound | mutation: `step < MAX_PACE_STEPS &&` -> `true &&` in pacing.ts made "is bounded" fail (expected 708417197920919600 < 1945301400000); pacing.ts restored (git diff empty) |
| ASTRAEUS_PERF case untouched | not edited |
| search recorded | list above |
| other assertions unchanged | diff limited to the named lines |
| gates | lint: 1 error, only in other builder's file (packages/astraeus-demo-showers/tests/rebuildComparison.test.ts:47 complexity 23, T-362), not fixed; typecheck clean; build ok; npm test 301 files, 5031 passed, 2 skipped |

Not run: coverage focused run (showersMeasured under --coverage).

## Drift Notes

None.

Coordinator (orchestrate-g024-20261121): ran the focused coverage run the Task lists (`npx vitest run packages/astraeus-demo-showers/tests/showersMeasured.test.ts --coverage`): 19 passed, no failure under coverage. Typecheck, build, `npm test` (5031 passed) green; the one lint error was T-362's in-flight `rebuildComparison.test.ts` (checked again at the Full Check). The `pacedAdvance` case gained its own 300-zone pacing because the Task's subject is that case's assertion (planner decision 1, boundedness, not wall clock). `status: done` set by the coordinator under the standing orchestration rule ("I mark them as they pass", O-038) and G-024 decision 7.
