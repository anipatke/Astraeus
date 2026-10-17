---
id: C-055
scope: {kind: task, id: T-075}
result: CLEAR
checked_by: {role: checker, session: o017-orchestrator-check-20261017}
executed_session: t075-builder-20261017
checked_at: '2026-10-17T19:30:00Z'
reviewed:
  base_commit: 0d02516
  head_commit: 0d02516
  files:
    - src/core/keplerElements.ts (new)
    - src/app/keplerShader.ts (new)
    - src/app/KeplerPoints.ts (new)
    - src/app/PointsView.ts
    - src/core/pointGroup.ts
    - src/core/orbitGroup.ts
    - src/core/listedOrbitGroup.ts
    - src/core/scalePolicy.ts
    - tests/keplerShader.test.ts, tests/pointsKepler.test.ts, tests/pointsBlendCorner.test.ts (new)
    - tests/pointsLookAheadShowers.test.ts
    - tools/validate/run-full.sh (picture baseline)
    - docs/evidence/o017-baseline-20261017/ (new picture baseline)
  dependencies: []
issues: []
supersedes: null
---

# C-055: T-075 Task Check (Quick)

## Scope Lock

1. T-075 Done When 1–5 (6 is owner validation): per-member elements uploaded once and Kepler solved in the vertex shader with a 64-bit epoch; a 32-bit JS twin matches the CPU positions within a stated tolerance for a made-up group (e up to 0.99) and every member of both shipped sets, with a CPU fallback rule for non-linear policies; behaviour unchanged; probe before and after at desktop, 2x and 4x; gates, lite, pictures, one full run. Added during build at the owner's request: the perihelion corner-cutting measured before and after.
2. Uncommitted work on `o017-simplify` at `0d02516`.

## Invariants and probes

| Criterion | Actual | Evidence |
|---|---|---|
| DW1 design | GLSL and its 32-bit twin side by side in `src/app/keplerShader.ts`; elements derived once in 64 bits (`src/core/keplerElements.ts`); Halley steps 2/3/4 by eccentricity band; epoch rebased about once per window, not per frame (test). Shader path only for groups offering elements, over 1,024 members, under a policy with `linearUnitsPerKm`; otherwise the T-073 path (tested). | diff, tests |
| DW2 accuracy | Twin against 64-bit CPU positions: Geminids all 51,115 members worst 94–139 km, 0.002 px; Perseids all 25,588 members at 24 instants 2.4e-7 relative, 0.010 px; made-up e up to 0.99 0.016 px. Asserted: 4e-7 relative and 0.03 px at the closest camera. Real-GPU sin/cos accuracy not emulated (stated). Corner-cutting near the Sun (Geminids within 0.3 AU, blend factor 0.5): T-073 path 3,481,918 km (5.24 px), shader path 43 km (0.0001 px). | `tests/keplerShader.test.ts`, `tests/pointsBlendCorner.test.ts` |
| DW3 behaviour | `tests/pointsKepler.test.ts`: pause, forward and reverse, seeks, scale changes including back to the blend path, bounds, centre offset, exact focus after a seek, fill and rebase counts. | tests |
| DW4 probe | Headless software GL, 12 s at one week per second (>90 ms frames, median): desktop both showers 0 long frames before and after; 2x Geminids 28 to 1, median 66.6 to 50.0; 4x Perseids 28 to 0; 4x Geminids 29 to 13, median 366.7 to 66.6 (about 3 to 15 frames a second). The remaining 4x Geminids cost is software rendering of 51k points at 780x1688 (median unchanged with the Kepler loop forced to zero steps). | `docs/evidence/o017-t075-probe-20261017T025809Z/` |
| DW5 gates | Checker: `npx tsc --noEmit` exit 0; `npx vitest run` 55 files, 919 passed, 1 skipped. Builder: build and public build with validator pass; lite 26/26; `run-full.sh` every step exit 0, 515 s. Pictures: 16 of 20 within tolerance against the T-066 set; the four shower pictures differ on the arcs next to the Sun (0.03–0.25% over 16 levels), back within tolerance with the shader forced off, so the difference is the intended move from the straight-line blend to true positions. Checker viewed a before/after crop of the Geminids near the Sun: only the curve at the Sun differs. Owner accepted the new shower pictures as the reference (below); against the new baseline `o017-baseline-20261017` every picture is within tolerance (max 0.0231%). | `docs/evidence/c055-20261017T033825Z/`, `o017-t075-after-20261017T032416Z/`, `o017-t075-full-20261017T032832Z/` |

## Owner decision recorded in this Check

Owner, 2026-10-17, asked to look on a laptop and a phone: the phone could not reach the local preview, and the owner said "cant reach, but thats OK i think previous version ran ok and this should be better". Recorded as acceptance of T-075 (and T-073) and of the new shower pictures as the picture baseline, on the strength of the owner's laptop look at the T-073 build ("thats way smoother") and the measurements above. The T-075 build itself has not been watched by the owner, and no real phone has run it; both are to be done once a preview link or the live site carries it.

## Issues Pass

DW1–DW5 Proven. No Issues. No materiality actions are required.

## Observations (non-blocking)

1. A real-phone look is still owed (above).
2. Design.md has no section on the shader path yet; T-072 reconciles it with the T-073 GPU blend note.
3. `.savepoint/task-ids.yml` (last issued 76) had been left uncommitted after T-076's creation; committed with this record.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**
