---
id: C-053
scope: {kind: task, id: T-073}
result: CLEAR
checked_by: {role: checker, session: o017-orchestrator-check-20261017}
executed_session: t073-builders-20261017
checked_at: '2026-10-17T16:40:00Z'
reviewed:
  base_commit: 5dd44ed
  head_commit: d586a57
  files:
    - src/app/PointsView.ts
    - src/core/orbitGroup.ts
    - src/core/listedOrbitGroup.ts
    - src/core/pointGroup.ts
    - src/experiences/showers/showerSettings.ts
    - src/experiences/showers/showerStream.ts
    - data/showers/geminids.json
    - tests/pointsLookAhead.test.ts
    - tests/pointsLookAheadShowers.test.ts
    - tests/pointsGpuBlend.test.ts
  dependencies: ['T-067 (C-048 CLEAR)']
issues: []
supersedes: null
---

# C-053: T-073 Task Check (Quick)

## Scope Lock

1. T-073 Done When 1–4 (5 is owner validation): the next fill is computed in slices with a setting; seek, reversal, scale change and overrun fall back to a whole fill with today's positions; measured before and after with the I-034 probe, periodic long frames gone on the measured (desktop) configuration; gates, lite, pictures. The updated Boundaries allow the GPU blend (owner, 2026-10-17: "It will need to run on phones and laptops, we should optimise for that").
2. Two build passes: the lane commit 3d5e375 (range fill and look-ahead slicing, merged in d586a57 with `look.refillSliceMs: 12` for the Geminids), and the uncommitted GPU blend in `src/app/PointsView.ts`.
3. Out of scope, moved to a new Task by owner decision: phone-class devices, where the fill compute itself is too large (below).

## Invariants and probes

| Criterion | Actual | Evidence |
|---|---|---|
| DW1 slicing and setting | Range fill on both orbit groups (whole fill calls it, so identical by construction); look-ahead in 1,024-member chunks within `refillSliceMs` per frame (default 8, Geminids 12, 0 off, negative or NaN throws); swapped in only when complete. | diff, `tests/pointsLookAhead.test.ts` |
| DW2 fallbacks, exact positions | Tests compare a sliced view with a `refillSliceMs: 0` view at every step on a made-up 3,072-member group (forward, backward, seek mid-fill, overrun, reversal, scale change, pause, bounds end) and on the shipped showers. GPU blend: `tests/pointsGpuBlend.test.ts` proves the shader inputs reproduce the 64-bit blend within 1e-4 Earth radii (seek, between fills, after a slide, origin moved, scale change); attributes rewritten only when a fill changes. `frustumCulled = false` kept, so shader offsets cannot be culled. | tests, diff |
| DW3 measured | Checker probe (`frames.mjs`, headless software GL, 1440x900, 12 s at one week per second, frames over 60 and 90 ms counted). Before T-073: Perseids over-60 7, max 83 ms; Geminids over-90 28, max 117 ms. After slicing alone: Geminids over-90 0–2 but over-60 8–11. After the GPU blend: Perseids over-60 0–1 (one 200 ms outlier in one run), max 50 ms otherwise; Geminids over-90 0, over-60 4–6, max 67 ms. The Geminids' longest frame is within one frame (17 ms) of the Perseids' usual longest. | `docs/evidence/c053-20261017T022500Z/` (`before-*`, `after-*`, `exp-*`, `final-*`, `gpu-desktop-*`) |
| DW4 gates | Checker: `npx tsc --noEmit` exit 0; `npx vitest run` 51 files, 902 passed, 1 skipped; `npm run build` exit 0. Builder: public build and validator with budget pass; lite 26/26, 0 failed; pictures max 0.0189% over 16 levels (rerun alone; first run 0.0473% on a loaded machine). | `docs/evidence/c053-*/`, `o017-t073-gpu-lite-*`, `o017-t073-gpu-after2-*` |

## Issues Pass

DW1–DW4 Proven for the desktop configuration the Task measures. No Issues. No materiality actions are required.

## Observations (non-blocking)

1. **Phones.** A phone-like run (390x844, Chromium CPU throttled) shows the fill compute itself is too large for slower processors, independent of this Task: at 4x throttle the Geminids run at about 3 frames a second both before and after T-073 (median 367 ms); at 2x the Perseids improve (over-90 25 to 5) but the Geminids do not (over-90 28 both). Owner decision 2026-10-17: compute the orbit positions on the graphics chip; planned as a new Task.
2. On the phone viewport the Perseids "stream-shape" story panel covers the timeline's Play button (the probe had to dispatch the click). A layout point for O-020's phone drawers.
3. The GPU-blend design note is not yet in the Drift Notes for Design reconciliation (T-072).
4. Owner validation (the owner sees both showers glide) is still required before T-073 can be marked done.

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
