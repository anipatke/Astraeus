---
id: T-362
title: Compare shower rates at a stated tolerance
objective: O-085
status: done
depends_on: []
check_waiver: {task: T-362, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T12:50:31Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: numbers
planned_reads: [packages/astraeus-demo-showers/tests/fixtures/showers-before-rebuild.json]
planned_writes: [packages/astraeus-demo-showers/tests/rebuildComparison.test.ts]
---

# Compare shower rates at a stated tolerance

## Outcome

The showers rebuild comparison passes on Node 22 as on Node 24: numeric rate series are compared at a stated relative tolerance, while their structure, times, units, labels and ids are still compared exactly (AH-35: Codex F10).

## User Check

None visual. `npx vitest run packages/astraeus-demo-showers/tests/rebuildComparison.test.ts` passes 34 of 34 on Node 22 (today 3 fail).

## Done When

- Before any change, run the file on Node 22 (`source ~/.nvm/nvm.sh; nvm use 22`) and record the 3 failing cases and their measured differences; run it on Node 24 and record 34/34.
- A small helper in the test file compares two values deeply: same keys, same array lengths, strings/booleans/`null` and integer-valued numbers (such as `timeUtcMs`) exactly; non-integer numbers within a relative tolerance named by one constant with a comment stating its size and why (planner proposal: `1e-12` relative, many orders of magnitude below the rate's displayed `digits: 0`, and well above the last-bit differences between Node versions; the builder sets it from the measured differences and records them).
- The helper replaces exact comparison only where a float series is compared:
  - "has the same events, … activity window (rate curve …)" ~174: `expect(window.rate).toEqual(was.rate)` → the helper (the unit, sample count and every `timeUtcMs` stay exact).
  - "reads the same rate at the same times …" ~253: `expect(now[0]!.value, …).toBe(wasRate.value)` → the helper's number rule, keeping the `rate at ${t}` message. `unit`, `label`, `peak`, `id` and `unavailable` stay exact.
  - Any other case among the recorded Node 22 failures, the same way; no case that passes on Node 22 changes.
- One extra case shows the helper fails on a changed id, a dropped sample, a changed `timeUtcMs`, and a value off by more than the tolerance (a planted difference for each), and passes on a value off by less.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus-demo-showers/tests/rebuildComparison.test.ts` (header comment lines 1–3; the cases at ~163–185 and ~245–262)
- `packages/astraeus-demo-showers/tests/fixtures/showers-before-rebuild.json` (the `windows[0].rate` and `metricRows` shapes only; do not edit)

## Design References

None beyond `.savepoint/Design.md` under `Spike 04 shower fixtures (O-011) and the G-004, G-005 additions (O-015, O-016)` if the builder needs the fixture's origin.

## Guardrails

TEST-01, TEST-02, TEST-03, DATA-01, STYLE-10.

## Implementation Plan

1. Record the Node 22 failures and their sizes.
2. Write the helper and its planted-difference case.
3. Swap the exact comparisons named above.
4. Re-run on Node 22 and Node 24.

## Boundaries

The fixture is never edited or re-recorded (DATA-01). No change to `src`. No tolerance on structure, ids or text. The file's other comparisons (including the existing `toBeCloseTo` calls) are unchanged.

## Technical Verification

Focused on both Node versions: `npx vitest run packages/astraeus-demo-showers/tests/rebuildComparison.test.ts` under `nvm use 22` and under the default Node 24 (record `node --version` with each). Handoff: `quality_gates`. No browser run.

## Technical Evidence

Red first (Node v22.23.5): 3 of 34 failed, all last-bit float differences: perseids "has the same events..." (rate curve: 68.32630935804792 vs ...791, 36.76309250579643 vs ...6436, 14.635650738279091 vs ...093, 9.234471324564158 vs ...156); perseids "reads the same rate..." (rate at 1598110916000: 10.061483108762513 vs ...515); geminids "has the same events..." (22.75593744686533 vs ...325, 114.04985337589689 vs ...969). Largest relative difference about 3e-16. Node v24.16.0: 34/34.

| Done When | Evidence |
|---|---|
| Red recorded on 22, 34/34 on 24 | the figures above |
| Helper: exact structure/strings/integers, tolerance constant with comment | `RATE_RELATIVE_TOLERANCE = 1e-12` (measured max ~3e-16) and `rateDifference` in rebuildComparison.test.ts |
| Swapped at the curve (~174) and rate row value (~253, message kept), others unchanged | `expectSameRate(window.rate, was.rate)`; `expectSameRate(now[0]!.value, wasRate.value, \`rate at ${t}\`)`; the third failure was the geminids case of the same curve line |
| Planted-difference case | describe "the rate comparison helper": passes off-by-less; fails changed id, dropped sample, changed timeUtcMs, off-by-more |
| Gates | lint clean; typecheck 0 errors; build ok; npm test: 301 files passed, 1 failed (loadingCoverChain, another builder's file mid-edit, 11/11 passing on rerun), 5033 passed; rebuildComparison 39/39 on Node 22 and Node 24 |

Files changed: packages/astraeus-demo-showers/tests/rebuildComparison.test.ts (an intermediate lint complexity error in the first helper was split into smaller functions). Fixture untouched. Limitations: none; earlier gate runs saw failures in sibling builders' files while they were mid-edit.

## Drift Notes

None expected.

Coordinator (orchestrate-g024-20261121): gates green (lint, typecheck, build; `npm test` passed apart from sibling in-flight files that cleared on rerun); comparison 39/39 on Node 22 and Node 24. `status: done` set by the coordinator under the standing orchestration rule ("I mark them as they pass", O-038) and G-024 decision 7.
