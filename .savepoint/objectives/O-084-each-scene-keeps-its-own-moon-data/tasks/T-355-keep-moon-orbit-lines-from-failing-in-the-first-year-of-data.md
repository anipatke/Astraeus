---
id: T-355
title: Keep moon orbit lines from failing in the first year of data
objective: O-084
status: planned
depends_on: []
check_waiver: {task: T-355, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T12:08:49Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: clamp
planned_reads: [packages/astraeus/src/core/ephemerisGroup.ts, packages/astraeus/src/app/OrbitSetView.ts, packages/astraeus/tests/bodySet.test.ts, packages/astraeus/tests/moonData.ts, packages/astraeus/tools/import/test-io.mjs]
planned_writes: [packages/astraeus/src/core/chebyshevEphemeris.ts, packages/astraeus/tests/moonLoadedFrom1950.test.ts]
---

# Keep moon orbit lines from failing in the first year of data

## Outcome

`ChebyshevEphemeris.loadedFromUtcMs` limits its answer to the time-scale table, as `boundsOf` already does. A moon's orbit line in early 1950 then starts at the first time the engine can convert, and no longer throws (AH-48: Claude CQ-8 / F-15, Gemini SCI-10(4)).

## User Check

None visual. The new test passes: Io's loaded-from time in February 1950 is a finite UTC time, no earlier than `boundsOf("io").startUtcMs`.

## Done When

- `loadedFromUtcMs(body, t)` takes the latest of the body's loaded run start, the centre's loaded run start, and the time-scale table's first instant + 1 s (in TDB), using the same expression `boundsOf` uses. Its doc comment says it is limited like `boundsOf`.
- New `packages/astraeus/tests/moonLoadedFrom1950.test.ts`. It builds a `ChebyshevEphemeris` from the installed `astraeus-data-jupiter` index and adds the 1950 chunks of Io and of the Jupiter centre series (read through `tools/import/test-io.mjs`, as `tests/moonLoadTwice.test.ts` reads chunks). Rows:
  1. `loadedFromUtcMs("io", Date.UTC(1950, 1, 1))` does not throw and returns a value ≥ `boundsOf("io").startUtcMs` and ≤ the asked time.
  2. The same through `createEphemerisGroup(...).memberLoadedFromUtcMs(0, t)`, the path `app/OrbitSetView.ts:160,350` calls.
  3. A mid-span time (2016) returns the same value as before the change.

  Show row 1 failing first, with the raw error it throws today, and record that error in Technical Evidence. If row 1 does not fail today, record that AH-48 does not reproduce, keep the rows as guards, and still apply the clamp.
- Existing tests unchanged and green, including `tests/bodySet.test.ts` (its stub of `loadedFromUtcMs`) and `tests/moonLoadTwice.test.ts`.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/core/chebyshevEphemeris.ts` (`boundsOf` ~253, `#loadedRunStart` ~266, `loadedFromUtcMs` ~279, `utcMsForTdb` ~166)
- `packages/astraeus/src/core/ephemerisGroup.ts` (`memberLoadedFromUtcMs`)
- `packages/astraeus/src/app/OrbitSetView.ts` (`#sample`, line ~350: the only caller)
- `packages/astraeus/tests/moonData.ts` (`moonDataFolder`)
- `audits/2026-11-21_anthropic_claude-fable-5-2_auditfindings.md` under CQ-8 (line ~165)

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`: `Every listed moon addable` (moon spans from 1950).

## Guardrails

ARCH-01, ARCH-04, PROV-01, TEST-01, TEST-02, TEST-03, STYLE-06.

## Implementation Plan

1. Write the test and show row 1 failing.
2. Add the clamp to `loadedFromUtcMs`, sharing the table-start expression with `boundsOf` through one small private helper.
3. Run the focused tests, then the gates.

## Boundaries

Only `loadedFromUtcMs` changes. No change to `boundsOf`, the chunk spans, `OrbitSetView` or the time-scale table. No browser look; the Full Check's quick browser tier covers the drawing path.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/moonLoadedFrom1950.test.ts packages/astraeus/tests/bodySet.test.ts packages/astraeus/tests/moonLoadTwice.test.ts`. Handoff: `quality_gates`. No browser run.

## Technical Evidence

Pending execution.

## Drift Notes

None expected (an internal bound).
