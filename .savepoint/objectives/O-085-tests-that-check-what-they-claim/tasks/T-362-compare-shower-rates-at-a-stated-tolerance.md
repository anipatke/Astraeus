---
id: T-362
title: Compare shower rates at a stated tolerance
objective: O-085
status: planned
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

Pending execution.

## Drift Notes

None expected.
