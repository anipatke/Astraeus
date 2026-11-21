---
id: T-398
title: Orbit-set lines skip unchanged frames
objective: O-087
status: planned
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

Pending execution.

## Drift Notes

None expected.
