---
id: I-035
title: The Moon's orbit line has a moving gap opposite the Moon
type: defect
status: open
source:
  kind: report
  actor: {role: checker, session: o017-orchestrator-check-20261017}
  at: '2026-10-17T23:59:00Z'
history:
  - at: '2026-10-17T23:59:00Z'
    actor: {role: checker, session: o017-orchestrator-check-20261017}
    kind: observed
    note: 'Owner: "in the moons orbit directly on the other side of the moon there is a break in the orbit line that moves with the moon". Also visible in the owner''s Earth and Moon card screenshot (the line near Earth is broken).'
  - at: '2026-10-17T18:30:00Z'
    actor: {role: executor, session: i035-lane}
    kind: repair_attempted
    note: 'Lane i035-orbit-gap. Measured gap (first to last sample): Moon 3215-7952 km (0.8-2.2 percent of orbit radius) at four dates; Io 0 km. An overlap of the window traded the break for a double line, so by owner decision the orbit look is Planetary Explorer''s: faint ring with faded ends, quadratic trailing arc, zoom brightening; each layer toggleable and each number a path setting (src/assets/orbitLook.ts, defaults 0.18 / 0.1 / 0.2 / 0.65 / 2 / 0.45 / 0.3) with live controls under Developer > Display settings > Orbit lines. Lite 26/26 (docs/evidence/i035-lite-20261017T0534), controls check docs/evidence/i035-orbit-look-20261017T0534. Pictures skipped by owner request; owner inspects. Not verified: owner visual judgement.'
  - at: '2026-10-17T19:30:00Z'
    actor: {role: executor, session: i035-lane}
    kind: repair_attempted
    note: 'Lane i035-orbit-gap. Owner: Io''s line jumped. Cause: the arc was drawn by sample index on a stale rolling window, so its head lagged the body and stepped at each rebuild. Now alphas are computed from time every frame and the arc runs from the last sample to the body''s live position. Checks: docs/evidence/i035-orbit-motion-20261017T0552 (head gap 0 at 604800x for Jupiter-Io and Earth-Moon), lite 26/26 docs/evidence/i035-lite-20261017T0552. Not verified: owner visual judgement; frame-to-frame alpha smoothness is covered by unit tests, not measured in the browser.'
  - at: '2026-10-17T20:30:00Z'
    actor: {role: executor, session: i035-lane}
    kind: repair_attempted
    note: 'Lane i035-orbit-gap. Owner: Io looked like laser beams at the start. The arc no longer takes points from the ring window: each frame it samples the body''s own path from its trajectory (arcSamples, default 32) so it cannot contain a chord, and the ring resamples at once when the clock leaves the window or moves more than ringRefresh (0.05) of it. Browser check docs/evidence/i035-orbit-motion-20261017T0626 (load, seeks, 604800x playback, mid-play seek: longest arc segment 0.04 of orbit size, head gap 0); lite 26/26 docs/evidence/i035-lite-20261017T0626. Not verified: owner visual judgement.'
  - at: '2026-10-17T21:30:00Z'
    actor: {role: executor, session: i035-lane}
    kind: repair_attempted
    note: 'Lane i035-orbit-gap. Owner: the arc looked like a dashed line (two 1 px lines tracing one curve). The arc is now Planetary Explorer''s construction: 16 flat ribbon segments (camera-facing, transparent, no depth write, both sides) at 0.65 t squared with the same zoom boost, points from the body''s own path each frame; the ring is cleared along the arc''s span so they never overlap. New settings arcSegments (16) and arcWidth (0.004 of orbit size). Checks: docs/evidence/i035-orbit-motion-20261017T0634, lite 26/26 docs/evidence/i035-lite-20261017T0634. Not verified: owner visual judgement.'
---

# I-035: The Moon's orbit line has a moving gap opposite the Moon

## Summary

The Moon's orbit line is a rolling window exactly one sidereal month wide, centred on the clock (`src/assets/compositions.ts` line 61, `paths: [{ body: "moon", spanMs: SIDEREAL_MONTH_MS }]`, drawn by `compositionPathLayer` in `src/app/PathView.ts` as an open polyline over `span: { windowMs }`). Its two ends sit half a month either side of now, which is directly opposite the Moon, and the real Moon does not retrace its path each month (solar perturbation, apsidal and nodal motion), so the ends do not meet: a gap that moves with the Moon. Io's line is built the same way (`compositions.ts` line 79, `spanMs: IO_PERIOD_DAYS * 86_400_000`).

## Evidence

Owner's report; owner's Earth and Moon card picture (`docs/evidence/o017-cards-v2-20261017/owner-earth-moon.png`); code read above.

## Proof Needed

1. Reproduce: measure the gap (distance between the window's first and last sample, in km and in pixels at the default view) for the Moon and Io at a few dates.
2. Repair: draw slightly more than one period (a small stated overlap, as a setting of the composition path, not a hard-coded number) so the ends overlap, for every composition path; no change to the positions themselves.
3. Pictures of Earth and Moon, Apollo 11 and Jupiter and Io show a closed line; the lite check passes; the owner sees no gap.
