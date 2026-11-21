---
id: T-356
title: Share decoded moon files between loaders without sharing what each loaded
objective: O-084
status: planned
depends_on: [{task: T-354, requires: clear}, {task: T-355, requires: clear}]
check_waiver: {task: T-356, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T12:08:49Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: binding
planned_reads: [packages/astraeus/src/core/readBytes.ts, packages/astraeus/src/core/bodies/jupiterMoons.ts, packages/astraeus/src/core/bodies/planetMoons.ts, packages/astraeus/src/api/data.ts, packages/astraeus/tests/moonLoadTwice.test.ts, packages/astraeus/tests/twoViewers.test.ts, packages/astraeus/vitest.setup.ts]
planned_writes: [packages/astraeus/src/core/moonChunkCache.ts, packages/astraeus/src/core/bodies/moonSystem.ts, packages/astraeus/src/core/chebyshevEphemeris.ts, packages/astraeus/tests/moonChunkCache.test.ts]
---

# Share decoded moon files between loaders without sharing what each loaded

## Outcome

Two moon-system loaders made from the same configuration (`createMoonSystem(config)` called twice) share the decoded chunks of one data source, so a chunk is fetched and decoded once. Each loader still answers only for the chunks its own requests asked for. The shared store holds immutable decoded bytes keyed by source; it holds no selection. This is the cache half of AH-03 ("share immutable decoded bytes keyed by source", Codex F01).

## User Check

None visual. The new `moonChunkCache` tests pass and `moonLoadTwice` stays green unchanged.

## Done When

- New `packages/astraeus/src/core/moonChunkCache.ts`, a module-level store keyed first by source identity and then by chunk URL. Source identity is the `loadIndex` reader handed to `provideIndex`, which is the `MoonPositions.loadIndex` of a data package. The store keeps one parsed index per source (read once) and one decoded chunk per URL, plus the in-flight fetch per URL so concurrent requests share it. It uses a `WeakMap` on the reader, so a dropped source frees its bytes. A failed fetch or decode is not kept, and a later request fetches again.
- `ChebyshevEphemeris` can take an already-decoded chunk (for example `adoptChunk(body, path, chunk)`, with `addChunk` decoding and then adopting). Several sets built from one parsed index then share chunk objects by reference. Decoding stays in one place.
- `createMoonSystem`'s loader reads its index and chunks through the store. Each system keeps its own set and its own record of the chunks its requests asked for (today's `added`/`fetching`/`installed`). A system answers `EphemerisChunkMissingError` for a chunk it did not request, even when another system of the same source holds it. `install(set)` and `install(null)` keep their meaning for that one system and never clear the shared store.
- New `packages/astraeus/tests/moonChunkCache.test.ts`, run on real Jupiter fits read from disk behind a counting `fetchBytes`. Rows:
  1. Two systems made from `JUPITER_MOON_SYSTEM.config`, same reader, same window: every chunk URL is fetched once in total, and both answer Io in the window.
  2. Same reader, different windows (2016, 2020): system A asked for Io in 2020 throws `EphemerisChunkMissingError`, and B answers.
  3. Different readers (two sources), same paths: each source's URLs are fetched once, and neither system is affected by the other.
  4. Both systems load at once (in flight together): no URL is fetched twice.
  5. A fetch that fails once is fetched again by the next request, and the failure is not served from the store.
  6. The two systems' Io chunk objects are the same object (shared decoded bytes).

  Show rows 1, 2 and 6 failing first, against today's per-system sets.
- Existing tests unchanged and green: `tests/moonLoadTwice.test.ts` (each row's `beforeEach` hands a fresh reader, so it gets a fresh source entry), `tests/twoViewers.test.ts`, `tests/planetChunksWindow.test.ts`, `tests/dataSpans.test.ts` and the preloaded setup in `vitest.setup.ts`.
- `tests/cold/sceneMoonIsolation.test.ts` rows are unchanged; they still fail as pinned, because scenes still share the process-wide systems until draft 05.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/core/bodies/moonSystem.ts` (`createMoonSystem`: `indexSet`, `ensureChunks`, `decodeInto`, `loadRequest`, `install`, `reset`, lines ~148–260)
- `packages/astraeus/src/core/chebyshevEphemeris.ts` (`addChunk` ~238, `#chunkAt` ~288)
- `packages/astraeus/src/core/readBytes.ts` (`fetchBytesOf`)
- `packages/astraeus/tests/moonLoadTwice.test.ts` (`beforeEach`, the `ROWS` table, the counting `fetchBytes`)
- `packages/astraeus/vitest.setup.ts` (how the preload hands readers to the process-wide systems)

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow`: `Every listed moon addable`, `Planet positions from Horizons`; under `Decisions`, `Public API shape (G-016, owner 2026-11-01)`.

## Guardrails

API-03 (no page-wide cache that skips loading: each loader still requests and binds its chunks; only bytes are reused), ARCH-01, ARCH-04, DATA-01, TEST-01, TEST-02, TEST-03, CODE-01, STYLE-06.

## Implementation Plan

1. Write `moonChunkCache.test.ts` and show rows 1, 2 and 6 failing.
2. Split decoding from installing in `ChebyshevEphemeris`.
3. Add `moonChunkCache.ts` and route `indexSet` and `ensureChunks` through it. Keep per-system bookkeeping of what each request asked for.
4. Run the focused tests and `moonLoadTwice`, then the gates.

## Boundaries

No change to which chunks a request needs (window, history, year after), to `DataSource`/`MoonPositions`, to `installData`, or to the public API. Scenes are not yet bound to their own systems (draft 05). No eviction policy beyond the `WeakMap`.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/moonChunkCache.test.ts packages/astraeus/tests/moonLoadTwice.test.ts packages/astraeus/tests/planetChunksWindow.test.ts packages/astraeus/tests/dataSpans.test.ts`. Handoff: `quality_gates`. No browser run.

## Technical Evidence

Pending execution.

## Drift Notes

Record for Design reconciliation (`Every listed moon addable`): decoded moon chunks are shared in one store keyed by source and URL (`core/moonChunkCache.ts`), and each moon-system loader keeps its own selection.
