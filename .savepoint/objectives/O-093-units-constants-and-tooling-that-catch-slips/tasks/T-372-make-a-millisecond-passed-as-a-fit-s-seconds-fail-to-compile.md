---
id: T-372
title: Make a millisecond passed as a fit's seconds fail to compile
objective: O-093
status: done
depends_on: [{task: T-371, requires: clear}]
check_waiver: {task: T-372, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T19:19:52Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: units
planned_reads: [packages/astraeus/src/core/constants.ts, packages/astraeus/tests/scaleChoice.test.ts, packages/astraeus/src/core/moonTrajectory.ts]
planned_writes: [packages/astraeus/src/core/timeScale.ts, packages/astraeus/src/core/chebyshevSeries.ts, packages/astraeus/src/core/chebyshevEphemeris.ts, packages/astraeus/src/core/planetModels.ts, packages/astraeus/tests/timeBrands.test.ts]
---

# Make a millisecond passed as a fit's seconds fail to compile

## Outcome

The seconds a curve-fit chunk is evaluated at carry a light nominal type naming their time scale (TDB or TT seconds from J2000), produced only by the time-scale conversions, so passing a UTC millisecond, a millisecond divided by nothing, or TT seconds to a TDB fit fails `npm run typecheck` (AH-21 part a: Claude CQ-9 "five call sites where dropping a `/ 1000` compiles", Gemini CQ-02 `audits/2026-11-21_google_gemini-4-neon_auditfindings.md:198-204`; all three auditors advise no dimensional framework).

## User Check

None visual. `npm run typecheck` passes; the three planted slips in `tests/timeBrands.test.ts` are each marked `// @ts-expect-error` and would make typecheck fail if they compiled.

## Done When

- `core/timeScale.ts` exports `TdbSeconds` and `TtSeconds`: `number` intersected with a type-only unique-symbol brand (no runtime cost, no runtime field). `utcMsToTdbSeconds` returns `TdbSeconds`; a new `utcMsToTtSeconds(table, timeUtcMs): TtSeconds` holds the arithmetic `planetModels.ts` does inline today (`(utcMs - J2000) / 1000 + ttMinusUtcSeconds(...)`, same operation order); `tdbMinusTtSeconds` takes `TtSeconds`.
- `core/chebyshevSeries.ts`: a chunk carries its scale as a type parameter (`SeriesChunk<"tdb" | "tt">`), and `chunkCovers`, `chunkPositionInto`, `chunkStateInto` take the matching branded seconds. Moon chunks (`chebyshevEphemeris.ts`) are TDB; planet fits (`planetModels.ts`, documented "Chebyshev series in TT") are TT. Field names in stored data (`startTdbS`, `startS`) are not changed.
- The one place that uses TDB seconds where the formula is written for TT (`chebyshevEphemeris.ts:169`, `tdbMinusTtSeconds(tdbS)`, Gemini CQ-02) gets an explicit, commented stand-in conversion with the same value (TDB−TT is under 2 ms, so the argument difference changes the result by under 1e-12 s); behaviour unchanged.
- The only `as TdbSeconds` / `as TtSeconds` casts are in `timeScale.ts` (the producers), at the decoded-chunk header, and the commented stand-in; their count is recorded.
- New `tests/timeBrands.test.ts` with three planted slips under `// @ts-expect-error`, following `tests/scaleChoice.test.ts`: `chunkPositionInto(chunk, timeUtcMs, ...)`, `chunkPositionInto(chunk, timeUtcMs / 1000, ...)`, and a `TtSeconds` passed to a TDB chunk. Each is shown to compile without the brand (remove the brand in a scratch copy, run typecheck, see "unused @ts-expect-error"), then restored. The file also holds one runtime case that evaluates a decoded chunk at a branded time.
- Values unchanged: `tests/fixtures/scenePin.json` byte-identical; `planetAccuracyFlybys.test.ts`, `chebyshevEphemeris.test.ts`, `dataSpans.test.ts` green and unedited.
- Typecheck wall time recorded (limit 20 s).
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/core/timeScale.ts` (`tdbMinusTtSeconds`, `ttMinusUtcSeconds`, `utcMsToTdbSeconds`)
- `packages/astraeus/src/core/chebyshevSeries.ts` (`SeriesChunk`, `ChunkExpectation`, `decodeChunk`, `chunkCovers`, `chunkPositionInto`, `chunkStateInto`)
- `packages/astraeus/src/core/chebyshevEphemeris.ts` (`utcMsForTdb` ~163-175, `boundsOf` ~253, the `tdbS` reads ~281-360)
- `packages/astraeus/src/core/planetModels.ts` (`planetModel`, `createPlanetModels`)
- `packages/astraeus/tests/scaleChoice.test.ts` (the `@ts-expect-error` pattern)

## Design References

`.savepoint/Design.md` under `Planet positions from Horizons` and `Core layers and demos`.

## Guardrails

STYLE-04, STYLE-05, STYLE-07, ARCH-02, DATA-01, TEST-01, TEST-02.

## Implementation Plan

1. Add the brands and `utcMsToTtSeconds` in `timeScale.ts`.
2. Type the chunk functions by scale; follow the compiler through `chebyshevEphemeris.ts` and `planetModels.ts`.
3. Add the commented stand-in at `utcMsForTdb`.
4. Write `timeBrands.test.ts`; prove each slip would compile without the brand.
5. Focused tests, typecheck time, gates.

## Boundaries

Internal core types only: no public signature changes (the API lock must not move; if `npm run api:lock` would change, stop and report). No brand on UTC milliseconds (they cross the public API everywhere). No change to orb's time handling, elements bodies, or the three TT−UTC models. No change to orbital-element schemas (not in the Objective's Success Conditions). If more than about ten casts are needed outside the producers, stop and report REPLAN rather than spreading casts.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/timeBrands.test.ts packages/astraeus/tests/chebyshevEphemeris.test.ts packages/astraeus/tests/planetAccuracyFlybys.test.ts packages/astraeus/tests/dataSpans.test.ts packages/astraeus/tests/scenePin.test.ts`, plus `npm run typecheck`. Handoff: `quality_gates`. No browser run.

## Planner amendment 2026-11-22

Approved by the coordinator after the builder found call sites the plan missed: (1) `tdbMinusTtSeconds` keeps `(number)` (elements bodies and `chebyshevEphemeris.test.ts` pass plain numbers); Done When item 1's `tdbMinusTtSeconds` part and the stand-in-cast bullet are replaced by "the chunk functions take scale-branded seconds; a UTC-millisecond or wrong-scale value passed to them fails typecheck", with a comment at the CQ-02 site. (2) `tests/chebyshevFit.test.ts` gets a type-only helper `at = (s: number): TdbSeconds => s as TdbSeconds` at its five chunk-function call sites (before: `chunkPositionInto(chunk, t, ...)`; after: `chunkPositionInto(chunk, at(t), ...)`; no value or setup change). (3) `moonChunkCache.ts` added to writes; not needed, because `SeriesChunk<S>` defaults to `"tdb"`, so its annotations are unchanged.

## Technical Evidence

| Done When | Evidence |
|---|---|
| Brands + `utcMsToTtSeconds` | `timeScale.ts`: `TdbSeconds`/`TtSeconds` (unique-symbol, type-only); `utcMsToTtSeconds` holds the arithmetic planetModels did inline, same order; `utcMsToTdbSeconds` returns `TdbSeconds` |
| Chunk typed by scale | `SeriesChunk<S extends "tdb"|"tt" = "tdb">` with type-only optional `scale`; `chunkCovers/PositionInto/StateInto` take `ScaleSeconds[S]`; moon chunks tdb, `planetModels.ts` uses `<"tt">`; stored field names unchanged |
| CQ-02 site | comment at `utcMsForTdb`; no behaviour change (amended) |
| Casts | `as TdbSeconds`/`as TtSeconds`: 2 in `timeScale.ts` (producers); 0 in `chebyshevSeries.ts` (decodeChunk's header value stays `number`, generic return); 1 type-only helper in `chebyshevFit.test.ts`. Nothing else |
| Planted slips | `tests/timeBrands.test.ts`: UTC ms, ms/1000, TtSeconds to TDB chunk, each `@ts-expect-error`; red-first: with both brands set to `number` in a scratch edit, tsc gave 3 "Unused '@ts-expect-error'" in that file; restored. Runtime case: decoded chunk evaluated at branded time |
| Values unchanged | scenePin.json untouched (git diff empty); chebyshevEphemeris, planetAccuracyFlybys, dataSpans, scenePin, chebyshevFit tests pass; first four unedited |
| Typecheck time | about 15 s wall (limit 20) |
| Gates | lint, typecheck, build clean; full test run 5070 passed, 1 failed (my own new runtime case, fixed after; focused re-run of 6 files: 58 passed); lint and typecheck re-run clean after the fix. Full test run not repeated after the fix |

Extra reads: `src/core/bodies/moonSystem.ts` (~205-235), `src/core/elementsBody.ts` (~205-225), `tests/chebyshevFit.test.ts`: to find call sites that pass plain numbers. API lock: unchanged by my work (`node tools/api-surface.mjs` run once by mistake rewrote it; only T-375's `./presentation/*` export line differed, which I removed again).

Files: src/core/timeScale.ts, chebyshevSeries.ts, chebyshevEphemeris.ts, planetModels.ts; tests/timeBrands.test.ts (new), tests/chebyshevFit.test.ts (type-only helper).

Limitations: `tdbMinusTtSeconds` is still untyped (number), so TT/TDB confusion there is not caught.

## Drift Notes

For Design reconciliation (`Core layers and demos`): fit seconds are typed by scale (TDB moon chunks, TT planet fits); producers are the time-scale conversions.

Coordinator (orchestrate-g024-20261121): lint, typecheck (~15 s wall, measured while another builder ran), build green; focused suites (58 tests) green; the full suite runs at the Full Objective Check. `status: done` set by the coordinator under the standing orchestration rule ("I mark them as they pass", O-038) and G-024 decision 7.
Coordinator note: this Task's source and test changes (timeScale.ts, chebyshevSeries.ts, chebyshevEphemeris.ts, planetModels.ts, chebyshevFit.test.ts, timeBrands.test.ts) were committed inside T-375's commit e254e799 by a coordinator staging slip (a broad add while this builder was mid-edit); the tree matched this Task's final state afterwards (no diff), so nothing is missing. Later commits stage each builder's reported file list only.
