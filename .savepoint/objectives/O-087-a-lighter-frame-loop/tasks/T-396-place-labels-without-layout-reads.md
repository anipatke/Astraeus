---
id: T-396
title: Place labels without layout reads
objective: O-087
status: done
depends_on: [{task: T-395, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-396, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on orchestrating G-024" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-21T22:11:52Z'}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: labels
planned_reads: [packages/astraeus/src/app/scenePicking.ts, packages/astraeus/src/app/SkyFiguresView.ts, packages/astraeus/src/app/sceneContentsHooks.ts, packages/astraeus/src/app/AnchorLabels.ts, packages/astraeus/src/shell/Label.tsx, packages/astraeus/tests/sceneLabelsHysteresis.test.ts, packages/astraeus/tests/scenePicking.test.ts]
planned_writes: [packages/astraeus/src/app/SceneLabels.ts, packages/astraeus/src/app/sceneFrame.ts, packages/astraeus/tests/sceneLabelsLayout.test.ts, packages/astraeus/tests/sceneFrame.test.ts]
---

# Place labels without layout reads

## Outcome

Names on the scene are placed without forcing the browser to lay out the page mid-frame: each label's size is measured once per label or style change, collisions are resolved by arithmetic on cached sizes, and the frame takes at most one layout read (the canvas box), before its first DOM write (AH-10; Objective condition 3).

## User Check

None visual here (draft 08 looks at labels). Same labels show and hide as before in every unit test.

## Done When

- `SceneLabelLayer` (SceneLabels.ts) keeps a size per label `{ width, height }`. Sizes come from a `ResizeObserver` on the label elements (no forced read; it reports font, phone-layout and `max-width` changes); where `ResizeObserver` is missing, or a label shows with no size yet, it is measured once with `getBoundingClientRect` and cached. A label size or style change (`--label-font`, `--label-size`, phone layout, text) re-measures only that label.
- `update(...)` computes each try's rectangle arithmetically from the projected point, the try offset (`[8,0]`, `[-8,0]`, `[0,-20]`), the `translate(-100%|0, -50%)` rule and the cached size, plus the layer's page offset; it writes `transform` once per shown label (the winning try) and never calls `getBoundingClientRect` on a label in a frame where every shown label has a cached size.
- The page offset is the canvas box read ONCE per frame at the start of `runFrame` (before any DOM write of that frame) into frame state and passed to `SceneLabelLayer.update` and to `pickCandidatesOf` as `{ getBoundingClientRect: () => box }` (so `pickCandidatesOf`'s signature and `scenePicking.test.ts` are unchanged). The builder confirms the label root (`.scene-labels`, inset 0 on the canvas host) shares the canvas's top left; if not, the root box is read at the same moment.
- `shownRects` keep page coordinates (contract unchanged for `pickCandidatesOf` and `SkyFiguresView.screenFigures`). The `skyFigures` closure keeps its tap-time read.
- `setHover` (~110) and `canvas.style.cursor` (sceneFrame `updateOverlays`) write only on change.
- Hysteresis, priority, selected-wins and sky-label rules are unchanged: `tests/sceneLabelsHysteresis.test.ts` passes unchanged (its rect mock is consistent with the arithmetic: same width/height, a constant offset).
- New `packages/astraeus/tests/sceneLabelsLayout.test.ts` (made-up labels, ARCH-03):
  - "places N labels with no label layout read once sizes are known": spy on `HTMLElement.prototype.getBoundingClientRect`; first update measures each label at most once; updates 2-10 make 0 calls on label elements.
  - "re-measures only the label whose size changed": a stubbed `ResizeObserver` reports one label wider; next update measures nothing, uses the new size, and the overlap outcome changes as the arithmetic predicts.
  - "matches the old layout": a table of label sets (no overlap, overlap resolved by the left try, by the upper try, hidden, selected wins, reappear margin) gives the same shown/hidden set and rectangles as the read-based placement did (expected values computed in the test from the old rule).
- `tests/sceneFrame.test.ts` gains a case: one `runFrame` reads the canvas box exactly once.
- Engine size: raw growth at most ~600 B; engine-size check passes; bytes recorded.
- Gates per `docs/agents/verification.md`.

## Context Files

- `packages/astraeus/src/app/SceneLabels.ts` (whole)
- `packages/astraeus/src/app/sceneFrame.ts` (`runFrame`, `updateOverlays`, `FrameState`)
- `packages/astraeus/src/app/scenePicking.ts` (`PickFrame`, `pickCandidatesOf`, ~215-260; read only)
- `packages/astraeus/tests/sceneLabelsHysteresis.test.ts` (read only)
- `packages/astraeus/src/shell/bar/useBarFit.ts` (its `ResizeObserver` pattern; read only)

## Design References

`.savepoint/Design.md` under `Interfaces and Data Flow` > `Overview`.

## Guardrails

CODE-02, ARCH-02, ARCH-03, API-03, TEST-01, TEST-02, TEST-03, STYLE-02, STYLE-10.

## Implementation Plan

1. Size cache + `ResizeObserver` (disconnect in `dispose`), with the fallback measure.
2. Arithmetic rectangles; one `transform` write per shown label.
3. Frame-start canvas box in `runFrame`; pass to labels and picking.
4. Change-only hover/cursor writes.
5. Tests; then show "no layout read" fails with the old read put back (local edit, revert, record).

## Boundaries

No change to label wording, priorities, padding constants, CSS, `AnchorLabels`, `BodySetLabels` (draft 02 owns it), `FeatureMarkers` (occluder reads are throttled; out of scope), `StoryMarkers` or `pickCandidatesOf`'s signature. Diagnostics gating is draft 02's.

## Technical Verification

Focused: `npx vitest run packages/astraeus/tests/sceneLabelsLayout.test.ts packages/astraeus/tests/sceneLabelsHysteresis.test.ts packages/astraeus/tests/sceneFrame.test.ts packages/astraeus/tests/scenePicking.test.ts packages/astraeus/tests/cameraAndNamesDom.test.ts`. Handoff: `quality_gates`. No browser run here (labels are layout: the full browser run in draft 07 and the owner look in draft 08 cover it).

## Technical Evidence

Stopped at stage build, not complete (two blockers for the coordinator):
1. Engine size: check:pack raw 1,836,117 B vs limit 1,836,000 (117 B over; baseline 1,835,598; growth +519 B), gzip 525,563 (limit 527,000, fine). Tightened the code three times; no limit raised.
2. tests/skyFigures.test.ts "keeps a body's name over a sky name when they collide (no overlap)" fails: its getBoundingClientRect mock ignores translate(-100%), so the old read-based left try overlapped; arithmetic correctly finds the left try clear. Fixing needs a change to an existing test's setup (rule 5), so not done.
Done so far: SceneLabels.ts (size cache, ResizeObserver, arithmetic rects, one transform write, change-only hover), sceneFrame.ts (canvasBox read once in runFrame, change-only cursor), new tests/sceneLabelsLayout.test.ts (8 tests, red-first shown: 3 fail with the cache removed), sceneFrame.test.ts case. Focused tests pass except the skyFigures one above. Lint/typecheck/build pass; full test run: 1 failure (the skyFigures one).

## Drift Notes

Design note for draft 07: label sizes are cached (ResizeObserver); the frame reads the canvas box once, before its first write.

## Coordinator

The builder stopped at build on two blockers; both were settled by the owner on 2026-11-22 and applied by the orchestrating session:
1. Engine size 117 B over (1,836,117 raw vs 1,836,000). Owner chose "Raise cap by 2,000 B": `ENGINE_LIMIT.rawLimit` 1,838,000 (engine-budget.mjs comment, `publicBuild.test.ts` pin, docs/BROWSER_CHECKS.md and Design `Size budgets` updated); gzip unchanged.
2. `skyFigures.test.ts` "keeps a body's name over a sky name when they collide (no overlap)": its rect mock ignores `translate(-100%)`, so the old read-based left try always overlapped; arithmetic places the kite on the free left side. Owner chose "Update the test": the assertion now keeps Earth shown and, if the kite shows, requires it on the opposite side (setup unchanged).
Set done after the gates passed (owner: "I mark them as they pass", O-038; G-024 decision 7): lint and Prettier clean, typecheck clean, `npm test` 322 files, 5156 passed, 3 skipped; `npm run check:pack` pass, engine 1,836,117 B raw (limit 1,838,000), 525,563 B gzip (limit 527,000).
