---
id: I-028
title: Perseids opens at the Sun close-up instead of the overview
type: defect
status: resolved
source:
  kind: report
  actor: {role: checker, session: o011-orchestrator-check-20261013}
  at: '2026-10-16T07:30:00Z'
tasks: [T-038, T-040]
checks: [C-034]
history:
  - at: '2026-10-16T07:30:00Z'
    actor: {role: checker, session: o011-orchestrator-check-20261013}
    kind: observed
    note: 'Found by the T-040 integration run: browser-sky.mjs fails on Perseids (sky lights 1024000 vs 1024000 pixels) because a plain load opens with the Sun selected and the camera at its minimum distance, so the textured disc fills the canvas. Evidence docs/evidence/o011-integration-20261016T063816Z/sky-diagnosis/.'
  - at: '2026-10-16T07:45:00Z'
    actor: {role: executor, session: i028-repair-20261016}
    kind: repair_attempted
    note: 'Cause: the camera starts at 16 scaled units and is clamped to the focused body closest approach; with the Sun as centre that minimum is 1.15 Sun radii (the T-038 rework), so the first frame was a Sun close-up. Fix: START_CAMERA_DISTANCE and startsInsideFocus (src/app/sceneFraming.ts); AstraeusScene issues an Overview request on its first frame only when the start distance is inside that minimum, no body named. Test: tests/startCamera.test.ts (3). Browser: browser-showers.mjs gains a plain-load scenario (stream drawn, under 30 percent of the canvas lit; floor 50 lit pixels after the Geminids phone read 95 against a first floor of 150). Gates: typecheck 0, build 0, vitest 43 files 789 passed 1 skipped. Run docs/evidence/o011-i028-20261016T071739Z/: sky, earth-moon, jupiter-io, spike02, synthetic-belt, showers perseids and geminids exit 0, zero console errors; the first Geminids attempt failed the 150 floor and is kept beside it. Not closed; needs a Check.'
  - at: '2026-10-16T11:50:00Z'
    actor: {role: checker, session: o011-orchestrator-check-20261016-night}
    kind: rechecked
    note: 'C-034 verified Proof Needed 1-4 at committed 8130ff6 in a clean worktree. tests/startCamera.test.ts passes in the full run (828 passed, 1 skipped). The browser-showers plain-load scenario passes for both showers, and every browser script passes with zero console errors (docs/evidence/o011-check-20261016T105315Z/summary.txt). An independent public-build probe opens Perseids and Geminids at the overview with the stream in view (probes/pubper.png, pubgem.png).'
resolution:
  disposition: verified
  check: C-034
  actor: {role: checker, session: o011-orchestrator-check-20261016-night}
  at: '2026-10-16T11:50:00Z'
---

# I-028: Perseids opens at the Sun close-up instead of the overview

## Summary

Since the T-038 Sun rework (true-radius sphere, framing radius for emissive marker bodies), a plain load of `?experience=shower-perseids` opens with the Sun focused at the minimum distance, 1.15 Sun radii. The textured disc fills the screen and the stream is out of view. Before the rework, the same load opened on the overview (T-038 evidence `quality/showers/desktop-sun-overview-peak.png`). `browser-showers.mjs` sets its own camera, so it did not catch this; `browser-sky.mjs` loads the default view and fails.

## Evidence

- `docs/evidence/o011-integration-20261016T063816Z/sky/` and `sky-rerun/` (identical failure), `sky-diagnosis/perseids-default-port5302.png`.

## Proof Needed

1. Find the cause. The likely candidate is a start distance that was below the old marker minimum and is now clamped up to the new Sun-radius minimum, or a start preset that resolves to the Sun focus.
2. Fix it generically: an experience opens at its declared default view (Perseids: Overview), not the focused body's minimum distance. Name no body in the code.
3. Add a test on the start camera for a Sun-centred experience, plus a browser assertion in `browser-showers.mjs` that a plain load shows the stream (lit-pixel count) with no preset clicked.
4. Re-run browser-sky and browser-showers for both showers, plus earth-moon, jupiter-io, spike02 and synthetic-belt, into a fresh directory, with zero console errors.
