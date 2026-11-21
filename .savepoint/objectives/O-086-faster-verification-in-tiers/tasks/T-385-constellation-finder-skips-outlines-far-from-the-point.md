---
id: T-385
title: Constellation finder skips outlines far from the point
objective: O-086
status: done
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

| Done When | Evidence |
|---|---|
| Band per loop (vertices, arc extremes, pole +-1) | `buildLoop` in `finder.ts` stores `minZ`/`maxZ` (z = sin dec); arc extreme = projection of the pole onto the edge's plane, counted when the arc runs through it (same within-test as `edgeDistance`). |
| `find`/`enclosing` skip out-of-band loops; rule 3 scans all | `inBand(loop, z)` (band widened by 2*EDGE_EPS) guards the rule-1/2 loop and `enclosing`; the nearest-edge loop is untouched. |
| Same answers, proved | Scratch test (deleted, uncommitted) dumped find + enclosing for 38,188 points (whole-sky 1.5 deg grid + every outline vertex + every edge midpoint) to before.txt with the old finder, and after.txt with the new: `cmp` byte-identical. |
| Bulge case, fails with vertex-only band | New test "finds a direction under the bulge of an edge ..." passes (8/8). With the arc-extreme `minZ`/`maxZ` updates removed (local edit, reverted, file diffed equal): fails "expected [] to deeply equal ['Zzz']". |
| No existing case changes | Only an `it` added in `finder.test.ts`. |
| Timing | finder.test.ts file duration 5.66 s before, 2.22 s after (this machine, under shared load); 10,000 random `find` lookups 1433 ms before, 278 ms after. |
| Gates / check:pack | lint, typecheck, build ran; check:pack: pass; engine budget 1834360 B raw (limit 1836000), unchanged by this Task (no engine change). Full `npm test`: 5109 passed, 1 failed (`packages/astraeus-site/tests/gateLimits.test.ts`, row check:public-build: another builder's in-flight T-389 work, not touched). `npm run lint` fails only prettier --check on 9 files outside this Task (others' in-flight); my two files are Prettier-clean. |

Files changed: packages/astraeus-data-constellations/src/finder.ts, packages/astraeus-data-constellations/tests/finder.test.ts, this Task file.

## Drift Notes

None. The working tree's `finder.ts` was reformatted by O-093's Prettier commit; build on the merged branch head.

Coordinator (orchestrate-g024-20261121): answers byte-identical on 38,188 points; the new bulge case fails without the arc extremes; its files pass prettier; `check:pack` passes. The one suite failure (`gateLimits` row for `check:public-build`) is T-389's in-flight work; full gates at the Full Check. `status: done` set by the coordinator under the standing orchestration rule ("I mark them as they pass", O-038) and G-024 decision 7.
