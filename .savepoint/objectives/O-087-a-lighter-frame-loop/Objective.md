---
id: O-087
title: A lighter frame loop
status: done
depends_on: [O-086]
release: G-024
priority: medium
rank: 6
---

# O-087: A lighter frame loop

## Outcome

Embedders stop paying every frame for work only the browser checks read: diagnostics are collected only when an opt-in flag is set, labels are placed without forced layout reads, the viewer does not re-render while nothing changes, and orbit lines skip re-sampling when time and look are unchanged.

## Why

AH-09 (all three): `sceneFrame.ts` projects paths, samples up to 512 points per group and `JSON.stringify`s readouts every frame. AH-10: `SceneLabels.ts` writes then reads layout up to three times per label per frame. AH-11: a 100 ms interval re-renders the coordinator while paused. AH-14: orbit lines re-sample about 129 states a frame. AH-15: update ranges accumulate for hidden orbit sets. Nobody profiled; measure first.

## Success Conditions

- A paused and a playing CPU profile recorded before and after, with diagnostics off and on.
- Diagnostics collected only with the opt-in flag, which the browser scripts set; a test proves no readout writes by default; the browser suite passes with the flag.
- Label sizes measured once per label or style change; collisions resolved arithmetically.
- No coordinator re-render while the clock snapshot is unchanged (render-count test).
- Unchanged-time early-out for orbit lines; one dirty range per orbit set, none while hidden.
- No visual change: owner look on localhost:5490.

## Architectural Considerations

`src/app/` frame stages (CODE-02); readouts remain the browser checks' mechanism.

## Boundaries

**In scope:**
- Frame-loop diagnostics, label placement, the paused re-render, orbit-line sampling, update ranges.

**Out of scope:**
- Lighting passes; resource disposal (O-092); coordinator restructuring (O-089).

## Decisions

- Owner 2026-11-21 (G-024 decision 7): "work through this list of objectives one by one. Orchestrate each objective to completion"; owner 2026-11-22 "carry on orchestrating G-024". Step checks waived on every Task; T-401 is the owner look on localhost:5490 before the Full Objective Check.
- Planner (orchestrate-g024-20261121), settled from evidence; conservative defaults taken on the planner's open questions (flagged to the owner):
  1. Profiles via CDP `Performance.getMetrics` plus the frames-drawn readout, median of 3, one Chromium, production preview; the profile script is not a `check:browser` step. Before T-395 the flag does nothing, so the "before, off" rows equal "before, on" (stated in `before.json`).
  2. Diagnostics switch: page global `globalThis.__ASTRAEUS_DIAGNOSTICS__`, read once per viewer, set by the browser harness for every page; no public API, README or lock change.
  3. Costly readouts are gated; cheap state attributes (`data-pick-hover`, `data-sky-lines`, `data-body-set-hover`/`-named`, `data-frames-drawn`) stay on, written only on change. Gating is at call sites so existing test fixtures stay.
  4. Labels: a size cache (ResizeObserver) plus arithmetic, one canvas-box read at frame start; `shownRects` keep page coordinates.
  5. Paused re-render: functional set with an equality bail-out on the clock snapshot (playing still re-renders at 10 Hz; O-089 owns that).
  6. Orbit sets: one dirty span, flushed in `place` only while visible. Paths: the look compared by value.
  7. Labels are layout, so T-400 runs the full browser tier once; the Full Check reuses it.
  8. Engine size: about 1.6 KB headroom; per-Task allowances 02 ≤400 B, 03 ≤600 B, 04 ≤200 B, 05 ≤400 B, 06 ≤300 B. A red size check parks the Objective with measured options for the owner (G-024 decision 7).
- Waves: T-394 first (its baseline is recorded before any other Task merges), then T-395, T-397, T-398, T-399; T-396 after T-395; then T-400 and T-401.
- PARKED 2026-11-22 (owner: "I am remote now, add park the check and move on"; G-024 decision 7): branch `o087-lighter-frame-loop` left unmerged. Waiting on T-401 (owner look on localhost:5490) and the Full Objective Check (full browser tier, since labels changed after T-400's run). Owner choices during the run: "Raise cap by 2,000 B" (engine raw 1,838,000) and "Update the test" (skyFigures collision assertion). O-088 is built on top of this branch, so O-087 merges first.
- Owner 2026-11-22 look: "1. Works fine, but they sit over their object which is OK ? 2. Yes 3.Y 4Y 5Y" (T-401, accepted under C-206). O-087 set done by the orchestrating session after re-check C-206 CLEAR (C-205 NEEDS WORK on I-196, I-197, both verified) (G-024 decision 7, "Orchestrate each objective to completion"; "CLEAR: fast-forward merge to main and push").
