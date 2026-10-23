---
id: I-073
title: The browser command proves the scene wakes on a wheel turn, not on a tap
type: verification
status: open
source:
  kind: check
  check: C-100
  actor: {role: checker, session: o031-full-check-20261023}
  at: '2026-10-23T00:24:21Z'
tasks: [T-149]
checks: [C-100]
guardrail_ids: [TEST-01]
severity: low
history:
  - at: '2026-10-23T00:24:21Z'
    actor: {role: checker, session: o031-full-check-20261023}
    kind: observed
    check: C-100
    note: 'O-031 Success Condition 2 and T-149 Done When ask npm run check:browser to show a resting scene draws again on a tap; the meteor journey uses a wheel turn instead, and the evidence does not record the swap. The behaviour itself works (checker probe: a tap on the canvas, a drag and a body pick all draw again).'
  - at: '2026-10-23T00:28:53Z'
    actor: {role: executor, session: o031-orchestration-20261023}
    kind: repair_attempted
    note: 'Owner chose "Add the tap, short recheck". Added driver function tapCanvas (click on freeCanvasPoint, through the pointer listeners) in tools/validate/driver.mjs; journey-meteor-shower.mjs now rests, wheel-turns, rests again, taps and asserts waitForMoreFrames, then play; docs/BROWSER_CHECKS.md names the tap. Lint, typecheck and the driver guard test (4 passed) pass. One npm run check:browser, 00:27:26-00:28:40Z, 74 s, all six steps exit 0, 0 error lines, docs/evidence/browser-20261023T002726Z: meteor-shower idleAt 38, afterNudge 45, idleAgain 68, afterTap 73, whilePlaying 89.'
---

# I-073: The browser command proves the scene wakes on a wheel turn, not on a tap

## Summary

O-031 Success Condition 2 says `npm run check:browser` "confirms a paused, untouched page stops drawing ... and draws again on a tap and on play". T-149 Done When says "the meteor journey asserts that play and a tap resume it". The journey (`tools/validate/journey-meteor-shower.mjs` lines 18-21) waits for the scene to rest, then calls `ui.nudgeCamera` (`tools/validate/driver.mjs`, a mouse **wheel** turn), then play. No step of the browser command taps or clicks the canvas and then reads `data-frames-drawn`. T-149's Technical Evidence reports "a wheel turn gives 45" without noting that it replaced the tap.

A tap goes through the pointer listeners (`scenePointer.ts`, `pointerdown`/`pointerup`, picking), a different path from the wheel listener. So a later change that stops a tap waking the scene would not be caught by the one browser command. That is the phone's main gesture.

## Evidence

- Smallest scenario: read `tools/validate/journey-meteor-shower.mjs` lines 17-31 and `tools/validate/browser-smoke.mjs` line 73. Resting is asserted (smoke, Apollo 11) and so are the wheel turn and play (journey). A tap is not.
- Fresh run `docs/evidence/browser-20261023T001937Z` (C-100): meteor-shower `idleAt` 38, `afterNudge` 44 (wheel), `whilePlaying` 81. Nothing is recorded for a tap.
- Checker probe outside the set (scratch script, Apollo 11 at 1280x720, dev server on port 5199, 2026-10-23T00:21Z): a click on a free canvas point after rest drew 48 frames, a mouse drag 51 and a body pick 42. So the behaviour holds today. Only the browser command's proof is missing.

Expected: the browser command rests the scene, taps the canvas through the driver and asserts more frames drawn. Actual: it does this with a wheel turn only.

## Proof Needed

`tools/validate/journey-meteor-shower.mjs` (or the smoke check) rests the scene, taps the canvas through a `driver.mjs` function (for example a click on `freeCanvasPoint`, or a tap on a body), and asserts `waitForMoreFrames`. `docs/BROWSER_CHECKS.md` names the tap. The driver guard passes, and one fresh `npm run check:browser` passes with the tap's frame counts in `results.json`. Or the owner records an exception for the tap clause of Success Condition 2.
