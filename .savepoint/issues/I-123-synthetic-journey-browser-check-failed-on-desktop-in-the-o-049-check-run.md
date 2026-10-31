---
id: I-123
title: "Synthetic journey browser check failed on desktop in the O-049 check run"
type: verification
status: open
source:
  kind: check
  check: C-130
  actor: {role: checker, session: o049-check-20261031}
  at: '2026-10-31T12:55:00Z'
tasks: [T-212]
checks: [C-130]
guardrail_ids: [TEST-01]
severity: medium
history:
  - at: '2026-10-31T12:55:00Z'
    actor: {role: checker, session: o049-check-20261031}
    kind: observed
    note: 'Fresh single `npm run check:browser` in the O-049 Full Objective Check failed: smoke synthetic-journey desktop. Everything else passed, public-build-assets included (Apollo 11 4,486,131 B raw under the owner-raised 4,490,000).'
    check: C-130
  - at: '2026-10-31T13:10:00Z'
    actor: {role: executor, session: o049-repair-20261031}
    kind: repair_attempted
    note: 'Cause: the journey check read the scene 1.5 s after a seek with a fixed sleep; with Uranus and five moons the chunk loads take longer on a loaded machine, so the body readout could still be empty. Fix is general: driver.mjs gains waitForSceneReady and seekToReady (poll the scene readouts until the clock shows where the slider settled, bodies are reported and named ids are drawn, 60 s limit, failure says what it last saw); every seek in browser-smoke.mjs now uses it in place of fixed sleeps. Also: sceneCatalogueReach.test.ts now fails on any new src/app function defaulting a catalogue parameter to the built-in one (allowlist with reasons). Fresh npm run check:browser passed every step (docs/evidence/browser-20261031T130145Z): synthetic-journey 72.8 s desktop, 71.3 s phone. Two earlier runs failed on my own first versions of the wait (compared the clock to an unsnapped instant); fixed. Journey time is still about 72 s, not back to 35 s: the time is Uranus data loading and the 60-step zoom loops, not the wait. Not closed; needs a Check.'
---

# I-123: Synthetic journey browser check failed on desktop in the O-049 check run

## Summary

T-212 Done When and the O-049 Proof condition both require one passing `npm run check:browser`. The one fresh run in the Full Objective Check failed. The smoke step's `synthetic-journey` desktop load failed at its first moon check: `at 1979-03-05T12:00:00Z the moons io, europa, ganymede, callisto are not in the scene ([])`. The scene's `data-body-screen` readout was empty 1.5 s after the seek, so no body was listed at all, not just the Jovian moons. The same view passed at phone size in the same run (74.7 s), and both sizes passed in T-212's final run. That points to a timing race, not a deterministic break. Still, the race became much more likely during O-049. The synthetic journey's smoke time was 35 s in the O-048 check run (C-129, `docs/evidence/browser-20261031T090631Z`). It was about 74 s in T-212's run and in this one. T-212 added Uranus and five Uranus moons with orbit lines to the journey, and their fit chunks over the journey's 1977–2026 window are about 14.7 MB on disk (`packages/astraeus-data-uranus/data/uranus-moons/{uranus,miranda,ariel,umbriel,titania,oberon}`).

The browser check was not rerun: under the browser policy and this Check's brief, it runs once per Objective Check.

## Evidence

- Run: `npm run check:browser`, 2026-10-31T12:39:46Z–12:43:33Z, HEAD 0b37876f, no other browser job running. Evidence folder `docs/evidence/browser-20261031T123947Z/` (summary.txt and `smoke/results.json`). Step logs are in `/tmp/astraeus-check-logs-JbtaRj/` (scratch). Only 17 of 18 smoke loads passed. smoke-public-showers, planets-phone, meteor-shower, hello-scene, hello-react, public-build-assets and public-addresses all passed. No console errors (error-lines=0).
- Failing check: `packages/astraeus-site/tools/validate/browser-smoke.mjs` `journeyChecks` (lines ~100–110). It calls `ui.seekTo` and then a fixed `page.waitForTimeout(1500)`, then reads `ui.sceneBodies` (`driver.mjs:722`, the canvas `data-body-screen` attribute, `"[]"` when absent). It does not wait for the scene to be ready or for that readout to be non-empty.
- Expected: every smoke load passes on a fresh run. Actual: synthetic-journey desktop failed 14 s after it started. The first `drawsSomething` reading had already seen one body in view, but after the seek to 1979 the body readout was empty. The phone load of the same view passed.
- Timing history (`smoke/results.json`): C-129 run 35.0 s / 34.8 s (desktop/phone); T-212 run `browser-20261031T123014Z` 73.8 s / 73.9 s; this run 14 s (fail) / 74.7 s.

## Proof Needed

- Find the cause. Either the journey's data load after a seek (a slower ready state since the Uranus moons were added) or the check's fixed 1.5 s wait. Fix it at the general level. For example, the driver could wait for a scene-ready readout after a seek instead of a fixed timeout, if that is the cause. A Uranus-specific delay is not a fix.
- Then one fresh `npm run check:browser` in a later Objective Check passes every smoke load at both sizes. Record whether the synthetic-journey time is back near its pre-O-049 figure or the owner accepts the longer time.
