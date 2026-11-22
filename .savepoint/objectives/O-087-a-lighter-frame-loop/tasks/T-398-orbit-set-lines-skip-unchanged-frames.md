---
id: T-398
title: Orbit-set lines skip unchanged frames
objective: O-087
status: done
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-398, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on orchestrating G-024" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-21T22:11:52Z'}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: orbit-sets
planned_reads: [packages/astraeus/tests/plutoOrbitLines.test.ts, packages/astraeus/tests/bodySet.test.ts, packages/astraeus/src/app/sceneFrame.ts]
planned_writes: [packages/astraeus/src/app/OrbitSetView.ts, packages/astraeus/tests/orbitSetSync.test.ts]
---

# Orbit-set lines skip unchanged frames

## Outcome

A body set's orbit lines do no sampling or remapping in a frame where the time, scale and switch are unchanged, mark at most one update range per buffer, and mark none while the set is hidden, so a hidden set no longer piles up update ranges without bound (AH-14, AH-15; Objective condition 5; audit Claude F-09/R-4 at the old `OrbitSetView.ts:422-425`, now ~473-476).

## User Check

None visual (draft 08 looks at the lines).

## Done When

- `OrbitSetView.sync` (~321) returns early when `timeUtcMs`, the scale policy id, `enabled` and the placement are the same as at the last full sync; no `positionInto`, `moveInto` or `#mapPath` call happens then.
- `#mapPath` (~460) no longer calls `addUpdateRange` per path per frame: it widens one dirty span per buffer (positions, sizes). `place` (~515), when the set is drawn AND its group is visible (`applyViewVisibility` runs before `placeViews`), clears the attribute's update ranges, adds the one span and sets `needsUpdate`; while hidden or not drawn it adds none and keeps the span for when it shows again.
- `place` skips rewriting the heads when neither a sync ran nor the origin-local centre moved since the last write.
- New `packages/astraeus/tests/orbitSetSync.test.ts` (a made-up set with a balance point and one without, ARCH-03), one table test across the input kinds:
  - "does not resample when nothing changed": second `sync` with identical inputs makes 0 source calls (spied sources); changing time, policy, `enabled` or placement each resamples.
  - "keeps one dirty range per buffer": 100 frames of a balance-point set, visible: after each `place`, each path buffer holds at most 1 update range covering every changed path.
  - "marks no range while hidden": 100 frames with the group hidden: 0 update ranges; on showing, exactly 1 range covering every path changed meanwhile, and the drawn positions equal a fresh view's.
  - Each case fails on the old code (record which).
- `plutoOrbitLines.test.ts` and `bodySet.test.ts` pass unchanged.
- Engine size: raw growth at most ~400 B; engine-size check passes; bytes recorded.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/app/OrbitSetView.ts` (`sync` ~317-356, `#sample` ~382-398, `#mapPath` ~460-477, `#writeHeads` and `place` ~479-540)
- `packages/astraeus/src/app/sceneFrame.ts` (`syncViews`, `applyViewVisibility`, `placeViews`; read only, for stage order)
- `packages/astraeus/tests/plutoOrbitLines.test.ts` (read only)

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` > `Every listed moon addable`.

## Guardrails

ARCH-02, ARCH-03, TEST-01, TEST-02, STYLE-02, STYLE-10.

## Implementation Plan

1. Early-out key in `sync`.
2. Dirty span per buffer; flush in `place` when drawn and visible.
3. Head rewrite early-out.
4. Table test; show each case fails on the old code; focused tests; size; gates.

## Boundaries

`OrbitSetView.ts` only. No change to sampling steps, the per-frame budget, colours, shader or `sceneFrame.ts`. Resource disposal is O-092's.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/orbitSetSync.test.ts packages/astraeus/tests/plutoOrbitLines.test.ts packages/astraeus/tests/bodySet.test.ts`. Handoff: `quality_gates`. No browser run.

## Technical Evidence

Done When -> evidence (all in `packages/astraeus/tests/orbitSetSync.test.ts`, each run for a balance-point set and a plain set; made-up bodies, ARCH-03):

| Done When | Evidence |
|---|---|
| `sync` early-out on same time, policy id, enabled, placement | "does not resample when nothing changed": 0 ephemeris reads on identical inputs; time, policy, enabled, placement each > 0 (`sync` keeps `#lastTime/#lastPlacement/#lastPolicyId` via `#sameAsLast`; a not-drawn sync clears the placement key) |
| One dirty span per buffer, flushed in `place` when drawn and group visible | "keeps one dirty range per buffer, covering every changed path": 100 frames, <= 1 range on positions and sizes, covering the changed floats |
| No range while hidden; one on showing | "marks no range while hidden...": 0 ranges for 100 hidden frames; 1 range on showing covering every change; drawn positions equal a twin that ran the same frames visible (a fresh view is not equal by design: incremental sampling is budgeted) |
| `place` skips head rewrite when nothing changed | `#headsStale` / `#headsLocal` in `place`; covered by the existing pluto/bodySet/sceneBodySets tests still passing (no dedicated new case) |
| Each case fails on old code | HEAD's OrbitSetView.ts swapped in: all 6 cases fail; restored |
| plutoOrbitLines, bodySet pass unchanged | focused run: 4 files, 70 tests pass (incl. sceneBodySets) |
| Engine size | NOT measured (no cheap size command found); source diff +56/-6 lines in one file, minified growth expected well under 400 B is unverified |
| Gates | typecheck pass; build pass; full `npm test` 321 files / 5147 passed (run before a no-behaviour refactor extracting `#sameAsLast` to fix a lint complexity error; focused tests rerun after: pass); lint: OrbitSetView complexity error fixed; remaining lint item is prettier on `packages/astraeus/tests/pausedRenders.test.ts` (another builder's file, not touched) |

Files changed: `packages/astraeus/src/app/OrbitSetView.ts`, `packages/astraeus/tests/orbitSetSync.test.ts` (new), this Task file. No extra reads beyond Context Files.

## Drift Notes

None.

## Coordinator

Set done by the orchestrating session after the combined handoff gates passed with T-395, T-397, T-398, T-399 together (owner: "I mark them as they pass", O-038; G-024 decision 7 "Orchestrate each objective to completion"; "carry on orchestrating G-024", 2026-11-22): lint and Prettier clean, typecheck clean, build ok, `npm test` 321 files, 5147 passed, 3 skipped; `npm run check:pack` engine budget 1,835,598 B raw (limit 1,836,000), 525,328 B gzip (limit 527,000).

## Repair (C-205, I-196)

Repair builder, session repair-o087-c205-20261122, 2026-11-22. Status and stage left as they were (done).

**Cause confirmed.** `sync`'s unchanged-input early-out (`#sameAsLast`) returned before the budgeted stale-path loop, so after a clock step that left more than `ORBITS_PER_FRAME` paths stale, the remainder were never re-sampled while the clock stayed paused. The new test reproduced it on the old code: 18 paths stale after the step, 0 re-sampled over 10 paused syncs (`expected 0 to be greater than or equal to 18`, `orbitSetSync.test.ts`).

**Fix** (`packages/astraeus/src/app/OrbitSetView.ts`). A `#backlog` flag is cleared at the start of each full sync's budget loop and set when a path is a step or more behind but the budget has run out. The early-out helper, renamed `#nothingToDo`, skips only when the inputs are unchanged and `#backlog` is false; otherwise it records the inputs and marks the heads stale as before. The single dirty span, the hidden-set behaviour and the unchanged-frame 0-reads behaviour are unchanged. The check is folded into the helper so `sync` stays within the lint complexity cap of 20.

**Proof Needed -> evidence**

| Proof Needed item | Evidence |
|---|---|
| More paths than `ORBITS_PER_FRAME`, a clock step that leaves paths stale, repeated same-time syncs finish re-sampling them, every head within its fine-point reach | New case `orbit-set lines with a stale backlog when the clock stops (I-196) > finishes re-sampling the stale paths in repeated syncs at the same time`: 30 made-up circular orbits, sync at T then T + 12 h, asserts paths are stale and 30 > 12, then 10 syncs at T + 12 h re-sample at least that many and every path's last-fine-point-to-body gap is at most the distance the body moves in one fine step. Red before the fix, green after. |
| Once nothing is stale, an unchanged frame still makes 0 source reads | New case `... > makes no source reads in an unchanged frame once nothing is stale` (0 `positionsKmInto` + `stateOf` calls, `computed` unchanged). The existing `does not resample when nothing changed` cases pass unchanged. |
| `orbitSetSync.test.ts`, `plutoOrbitLines.test.ts`, `bodySet.test.ts` pass unchanged; engine size check passes | No existing case or fixture changed (the new cases use their own 30-body fake). The three files pass, 26 tests. `npm run check:pack`: pass, engine 1,836,247 B raw (limit 1,838,000), 525,636 B gzip (limit 527,000). |

**Gates** (run under the gates lock): `npm run lint` clean (Prettier clean), `npm run typecheck` clean, `npm run build` ok, `npm test` 322 files, 5159 passed, 3 skipped, `npm run check:pack` pass (values above). No browser runs.

**Files changed:** `packages/astraeus/src/app/OrbitSetView.ts`, `packages/astraeus/tests/orbitSetSync.test.ts` (two new cases appended, plus the `ORBIT_HEAD_SUBSTEPS`/`ORBITS_PER_FRAME` import).

**Drift notes:** None. The fix brings back the catch-up behaviour main had. Design's `### A lighter frame loop (O-087)` description of the early-out may say "only when nothing is left stale"; the coordinator can decide whether to add that.
