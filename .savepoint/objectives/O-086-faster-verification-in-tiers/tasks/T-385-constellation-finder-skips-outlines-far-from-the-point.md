---
id: T-385
title: Constellation finder skips outlines far from the point
objective: O-086
status: planned
depends_on: []
check_waiver: {task: T-385, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261121}, recorded_at: '2026-11-21T20:47:35Z'}
owner_validation: {required: false}
planned_by: {role: planner, session: orchestrate-g024-20261121}
lane: finder
planned_reads: [packages/astraeus-data-constellations/src/index.ts]
planned_writes: [packages/astraeus-data-constellations/src/finder.ts, packages/astraeus-data-constellations/tests/finder.test.ts]
---

# Constellation finder skips outlines far from the point

## Outcome

`constellationFinder()` stops testing every edge of all 89 outlines on each lookup: each outline carries a precomputed declination band, and a lookup tests only the outlines whose band (widened by the edge tolerance) holds the direction. Every answer stays exactly what it is today (AH-49; Gemini S-10: `finder.test.ts` about 39 s of CPU).

## User Check

None visual.

## Done When

- `buildLoop` in `packages/astraeus-data-constellations/src/finder.ts` stores `minDec`/`maxDec` (as `z` = sin(dec) bounds) per loop that truly bound the outline's region: the vertices, the extreme `z` of each great-circle edge between them (an arc's highest or lowest point can lie between its ends), and +1 / −1 for a loop enclosing the north / south pole.
- `find` and `enclosing` skip a loop when the direction's `z` is outside its band widened by `EDGE_EPS` (in `z` terms, conservatively); the alphabetical loop order and the three resolution rules (edge, inside, nearest edge) are unchanged. The nearest-edge fallback (rule 3) still scans every loop.
- Same answers, proved: before the change, write to a scratch file (not committed) the answer of `find` and `enclosing` for every point of the whole-sky grid in `finder.test.ts` ("gives every direction of a whole-sky grid ...", 1.5° rows) plus every outline vertex and every edge midpoint; after the change the same run gives a byte-identical file. Record the point count and the `cmp` result.
- A new case in `finder.test.ts` proves the band includes an arc's bulge: a constructed two-outline boundary whose edge's great circle rises above both its ends, and a direction just inside that bulge (above both vertices' declination) is still found in that outline. Show it fails with the band built from vertices only (local edit, run, revert; record).
- No existing case in `finder.test.ts` changes.
- Timing evidence, same machine: `npx vitest run packages/astraeus-data-constellations/tests/finder.test.ts` file time before and after, and a lookup micro-timing (10,000 random directions, printed only) before and after.
- Gates per `docs/agents/verification.md`; `npm run check:pack` (the package's packed contents and sizes) passes.

## Context Files

- `packages/astraeus-data-constellations/src/finder.ts` (whole file, ~160 lines)
- `packages/astraeus-data-constellations/tests/finder.test.ts` (the `constellationFinder()` describe)

## Design References

`.savepoint/Design.md` under `Constellations`.

## Guardrails

API-01, TEST-01, TEST-02, STYLE-07, STYLE-10, CODE-01.

## Implementation Plan

1. Time the test file and the lookup; write the before-answers file.
2. Add the band to `Loop` and `buildLoop` (arc extremes from the edge normal: the great circle's highest `z` is `sqrt(1 - n_z^2)`, reached inside the arc only when the arc spans that point; check with the existing `cross`/`dot` helpers).
3. Add the band test to `find`/`enclosing`.
4. Compare answers; add the bulge case and its mutation proof; re-time; gates.

## Boundaries

`finder.ts` and its test only. No change to the public signature, error messages, `EDGE_EPS`, the tie rule, the boundary data, or other packages. If the answers file differs anywhere, stop and report (do not adjust tolerances).

## Technical Verification

Focused: `npx vitest run packages/astraeus-data-constellations/tests`. Handoff: `quality_gates`; plus `npm run check:pack`. No browser run.

## Technical Evidence

Pending execution.

## Drift Notes

None expected. The working tree's `finder.ts` was reformatted by O-093's Prettier commit; build on the merged branch head.
