---
id: T-355
title: Keep moon orbit lines from failing in the first year of data
objective: O-084
status: done
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

Done When -> evidence:
- Clamp in `loadedFromUtcMs` (max of own run start, centre run start, `#tableStartTdbS()`; helper shared with `boundsOf`; doc comment says limited like `boundsOf`) -> `src/core/chebyshevEphemeris.ts`, rows 1-3 below.
- Row 1 (Feb 1950 Io: finite, >= boundsOf start, <= asked) -> `tests/moonLoadedFrom1950.test.ts` (1). Red first: before the change it threw `TimeScaleOutOfRangeError: time -631162828932 is outside the TT - UTC table [-631152000000, 1893628800000]` from `utcMsForTdb` in `loadedFromUtcMs`. AH-48 reproduces. Green after.
- Row 2 (via `createEphemerisGroup(...).memberLoadedFromUtcMs`) -> test (2): same raw error before, green after.
- Row 3 (2016 unchanged) -> test (3) pins 1451735931817, the value read from the unchanged code (an early draft with a wrong bound failed only on that bound; the value itself was recorded pre-change). Green after.
- Existing tests unchanged and green -> focused run of the new file + bodySet + moonLoadTwice: 27 passed.
- Gates: lint clean, typecheck clean, build ok, `npm test`: 303 files, 5031 passed, 4 expected fail, 2 skipped. (A first run showed 4 failures in one file while T-354's new cold test was being written concurrently; the rerun was clean.)
Files changed: src/core/chebyshevEphemeris.ts, tests/moonLoadedFrom1950.test.ts (new). Limitations: no browser look (per Task).

## Drift Notes

None.

Coordinator (orchestrate-g024-20261121): hand-off gates green (lint, typecheck, build; `npm test` 303 files, 5031 passed, 4 expected-fail). `status: done` set by the coordinator under the standing orchestration rule ("I mark them as they pass", O-038) and G-024 decision 7.
