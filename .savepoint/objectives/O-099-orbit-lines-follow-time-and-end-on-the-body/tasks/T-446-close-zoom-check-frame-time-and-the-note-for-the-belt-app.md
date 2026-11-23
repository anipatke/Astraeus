---
id: T-446
title: Close-zoom check, frame time and the note for the belt app
objective: O-099
status: done
depends_on: [{task: T-445, requires: clear}]
owner_validation: {required: true, accepted_check: C-216, accepted_by: {role: owner, session: orchestrate-o099-20261123}}
check_waiver: {task: T-446, reason: 'Owner said "orchestrate O99" (2026-11-23): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-o099-20261123}, recorded_at: '2026-11-23T08:18:33Z'}
planned_by: {role: planner, session: plan-g026-20261123}
planned_reads: [docs/BROWSER_CHECKS.md, docs/agents/browser-policy.md, packages/astraeus/CHANGELOG.md]
planned_writes: [packages/astraeus/CHANGELOG.md, docs/BROWSER_CHECKS.md]
---

# Close-zoom check, frame time and the note for the belt app

## Outcome

The fix is proven on screen and on cost: a browser check at true scale and close zoom on Earth with time playing shows the line staying on the planet; a frame-time check at the belt's scale shows no regression against 0.10.0; the CHANGELOG has a 0.10.1 `Fixed` entry; and a short note tells the belt app what to verify after it upgrades.

## User Check

Open the browser-check results named in the evidence; on `localhost:5490`, close zoom on Earth with time playing, the line stays on the planet. Read the belt note.

## Done When

- A browser check at 1440x900 and 390x844: true scale, camera focused on Earth at a few radii, time playing over a few simulated days; the screen distance from Earth's centre to its orbit line stays under a stated pixel bound at every sampled frame. Added to the existing step that owns orbit lines or the planets demo, per the browser policy; one browser job at a time.
- A frame-time comparison against 0.10.0 on a scene at the belt's scale (tens of thousands of group points plus Earth, Mars and Jupiter orbit lines, time playing): median and 95th-percentile frame time not worse beyond run-to-run noise, both numbers recorded.
- CHANGELOG: a `## 0.10.1` section with a `Fixed` entry in plain words (lines stay on their body at close zoom and in every year), no breaking changes.
- A belt note in the Task evidence, ready for the owner to paste into the belt session: upgrade to 0.10.1; check Earth, Mars and Jupiter at a few radii with time playing at the opening year and about 5 years either side; check zoomed-out lines look as before; check nothing moves while paused; report back.
- Configured gates pass; release-tier checks are the owner's release step.

## Context Files

- `docs/BROWSER_CHECKS.md`
- `docs/agents/browser-policy.md`
- `packages/astraeus/CHANGELOG.md` (top section only)
- `.savepoint/releases/G-026-orbit-lines-that-stay-on-the-body-for-0-10-1/Release.md` (`Belt verification after release`)

## Design References

`.savepoint/Design.md` under `Verification in tiers (O-086)`.

## Guardrails

TEST-01, TEST-03, CODE-02.

## Implementation Plan

1. Pick the browser step per the policy; add the close-zoom check.
2. Build the belt-scale frame-time scene from the made-up preview scenes (no belt code), measure 0.10.0 and the change.
3. CHANGELOG and belt note.

## Boundaries

No change to the belt app; no version bump or publish.

## Technical Verification

The touched browser step and configured gates at handoff. Evaluated later per `agent-skills/references/check-method.md`.

## Technical Evidence

Builder session (orchestrate-o099, 2026-11-23). Stage build -> audit; step Check waived (`check_waiver`).

**Extra reads:** `packages/astraeus-site/tools/validate/browser-steps.mjs` (steps), `browser-smoke.mjs` (views, `sunPathChecks`), `driver.mjs` (readouts, zoom helpers), `journey-planets-phone.mjs` (the planets step), `packages/astraeus/src/app/sceneDebug.ts`, `sceneFrame.ts` (`publishOrbitHeadGap`), `PathView.ts` (`screenReadout`), `src/synthetic/syntheticBeltScene.ts` and `syntheticProbeScene.ts` (which made-up scene has Earth's Sun line at true scale), `tests/orbitLineGap.test.ts` and the 0.10.0 JS (`api/sunOrbit.js`, `app/PathView.js`) for the benchmark. Reason: choose the step, add a screen-space readout, build the frame-time bench.

**Deviation (outside planned_writes, needed by the Done When):** the existing `data-paths` readout gives only boxes, so it cannot say how far a body's centre is from its line. Added a diagnostic `data-orbit-line-gap` (written only when diagnostics are on): `PathView.screenGapTo(camera, local)` and `publishOrbitLineGaps` in `sceneFrame.ts` (beside `publishOrbitHeadGap`, called after the paths are placed), driver `orbitLineGapsPx`, a new test `tests/orbitLineGapReadout.test.ts` (2 cases: on-line vs off-line, behind the camera = null), a readout row in `docs/BROWSER_CHECKS.md`. No existing test touched. Needs Design.md reconciliation only as a diagnostics readout (non-architectural).

**Browser step.** Per the policy the planets demo has no Sun-centred Earth line and its step (`planets-phone`) is phone only; the made-up probe scene is not at true scale. The only scene with Earth's year line at true scale is `?experience=synthetic-belt`, which no step opened. Added it as a `smoke` view (quick tier, dev server only, both sizes: 1440x900 and 390x844) with `closeZoomChecks` in `browser-smoke.mjs`: true scale asserted, camera Focus on Earth, fastest playback, three zoom stops (Earth radius on screen 12, 60 and 240 px), 12 samples each at 250 ms of `data-orbit-line-gap` (pixels); fails at 2 px (`LINE_ON_BODY_PX`) or when Earth is not a sphere of about the stop's radius. The belt's timeline is 24 h, so the check proves the line on Earth while playing (about 6 simulated hours at the fastest rate), not the years either side; those are proved by `tests/orbitLineGap.test.ts` (Earth, Mars, Jupiter at +3 y and -5 y, worst 0.0036, 0.011, 0.0004 body radii).

**Browser runs (2 of 2 allowed), both failed before any measurement:** `ASTRAEUS_VIEWS=synthetic-belt npm run check:browser -- --step smoke` (evidence `docs/evidence/browser-steps-20261123T084507Z/`) and the same with `ASTRAEUS_SIZES=desktop` (`browser-steps-20261123T084552Z/`): "Earth's orbit line has no segment in front of the camera at radius 12 px (frame 0)"; the second run's debug read: `data-orbit-line-gap` `{"earth-orbit":null,...}`, Earth `as: marker, radiusPx 0.047, x 0.819, y 0.729, inView false`: the camera was still on the belt (the object picker did not move the focus), so the zoom never reached Earth. Fix made after run 2 and NOT yet run: the script now chooses the Focus camera for Earth (`chooseCamera("focus-earth")` when not active) and waits until it is pressed, and allows 200 zoom turns. **No browser measurement exists yet: pixel bound 2 px, measured worst value at both sizes unknown.** A third run of the same step is needed (coordinator approval: the limit was two).

**Third browser run (coordinator-approved, the last):** `ASTRAEUS_VIEWS=synthetic-belt npm run check:browser -- --step smoke`, exit 0, evidence `docs/evidence/browser-steps-20261123T084959Z/`. Passed at both sizes. Pixel bound 2 px (kept: the measured worst is 0 px, rounded to 0.001, at every sampled frame; 2 px leaves headroom and still catches a drift of the old size, which would be tens of px at 240 px per Earth radius). Worst measured: desktop 1440x900 0 px at Earth radius 272 px (samples over about 5.1 simulated hours); phone 390x844 0 px at radius 255 px (about 4.7 h). Caveat: all three zoom stops landed on the same radius (272 / 255 px): the first stop's zoom loop overshot the 12 and 60 px stops, so the check measured one close zoom three times, not three radii. Not iterated further per the coordinator. Smoke duration: this run (belt view only, both sizes, run one after the other, 27.7 s and 27 s) took 55 s against the 65 s limit; the other smoke views are not included, so the whole smoke step will exceed 65 s and `tools/gate-limits.json` `browser.steps.smoke` needs review (owner/coordinator). The Done When browser row is met except the "a few radii" spread.

**Frame time** (Node benchmark; reasoning: the change touches only orbit-line sync, group points are untouched, so the per-frame orbit-line work is the whole difference and a Node run measures it without a GPU; the per-frame cost of the belt's 10,000 group points is identical on both sides). Per frame: `sync` + `place` for three Sun-orbit lines (Earth, Mars, Jupiter, true scale) over 2,500 frames at 60 frames a second of simulated time (first 300 dropped), at 3,600x (the belt's fastest) and 86,400x (a day a second); three repetitions each; the 0.10.0 numbers are the published 0.10.0 `src/*.js` at `/home/user/code/belt/node_modules/astraeus/src` through the same file, run twice alternately with the branch (temporary test files, removed). Medians over repetitions (each repetition's values within 2% of the others), milliseconds per frame:

| | median | 95th percentile |
|---|---|---|
| 0.10.0, 3,600x | 0.363 to 0.370 | 0.47 to 0.54 |
| branch, 3,600x | 0.569 to 0.578 | 0.74 to 0.79 |
| 0.10.0, 86,400x | 0.362 to 0.367 | 0.47 to 0.59 |
| branch, 86,400x | 0.582 to 0.600 | 0.75 to 0.82 |

Result: not equal within noise. The three lines cost about 0.21 ms more per frame (median 0.365 -> 0.58 ms; 95th percentile about 0.5 -> 0.78 ms): one source evaluation per changed frame per line plus the head merge. That is 1.3% of a 16.7 ms frame and does not scale with the group's point count. Judgement for the owner/Check: small absolute cost, but the Done When's "not worse beyond run-to-run noise" is not met literally. A browser frame-time run was not made.

**Belt note (ready to paste into the belt session):**

> Upgrade `astraeus` to 0.10.1 (planet and moon orbit lines now stay on their body; no API change). Then in the browser, at true scale, with time playing: focus Earth, then Mars, then Jupiter, and zoom in to a few body radii each (a few radii, close, and the body filling a good part of the screen). Check the line passes through the body and does not drift off it over several simulated days, at the opening year and again at about 5 years before and after it (seek there, then play). Zoom out to the belt and check the lines look as they did on 0.10.0 (same shape, same brightness). Pause: nothing should move or flicker while paused. Remove any workaround you added for the line drifting off. Report back: what you checked, anything off, and the frame rate with the belt's points on screen compared with 0.10.0 (the lines cost about 0.2 ms a frame more in a Node measurement).

**Done When -> evidence**

| Done When | Evidence |
|---|---|
| Browser check at 1440x900 and 390x844, true scale, Earth focus at a few radii, time playing; distance under a stated bound | Written: `closeZoomChecks` in `browser-smoke.mjs` (bound 2 px, readout `data-orbit-line-gap`, unit-tested in `tests/orbitLineGapReadout.test.ts`). Passed on the third run (0 px worst at both sizes, bound 2 px); one effective zoom radius only (see the third-run note). |
| Frame-time comparison, median and 95th percentile for both | Table above (Node benchmark; both numbers recorded). Cost +0.21 ms a frame, outside noise; flagged. |
| CHANGELOG `## 0.10.1` section with a plain-words `Fixed`, no breaking changes | `packages/astraeus/CHANGELOG.md` top: "## 0.10.1 (unreleased)". |
| Belt note in the evidence | Above. |
| Configured gates pass | Focused gates below. |

**Commands and results**
- `npm run typecheck`: pass.
- eslint (use-typescript6) on `PathView.ts`, `sceneFrame.ts`, `orbitLineGapReadout.test.ts`, `driver.mjs`, `browser-smoke.mjs`: 0 problems; `npx prettier --check` the same plus `docs/BROWSER_CHECKS.md` and `packages/astraeus/CHANGELOG.md`: clean. `node packages/astraeus-site/tools/validate/driver-guard.mjs`: ok.
- `npx vitest run` on orbitLineGapReadout, orbitLineGap, frameDiagnostics, pathViewSync, sceneFrame, orbitLook, viewFrame (packages/astraeus) and browserDriverGuard, gateLimits, demoAbout (packages/astraeus-site): 10 files, 134 passed.
- Smoke limit (`tools/gate-limits.json` `browser.steps.smoke` 65 s) not re-measured with the new view (about 12 s a size when it fails early); may need review once the check passes.

**Files changed:** `packages/astraeus/CHANGELOG.md`, `docs/BROWSER_CHECKS.md`, `packages/astraeus/src/app/PathView.ts`, `packages/astraeus/src/app/sceneFrame.ts`, `packages/astraeus/tests/orbitLineGapReadout.test.ts` (new), `packages/astraeus-site/tools/validate/driver.mjs`, `packages/astraeus-site/tools/validate/browser-smoke.mjs`. Untracked evidence folders `docs/evidence/browser-steps-20261123T084507Z/`, `-084552Z/` (failed runs).

**Limitations / unverified:** the browser check has not passed (above); the belt's 24 h timeline means no years-either-side browser coverage; the `LINE_ON_BODY_PX` bound of 2 px is a guess to be set from the first passing run's worst value.

## Drift Notes

- New diagnostics-only readout `data-orbit-line-gap` (`PathView.screenGapTo`, `publishOrbitLineGaps`), alongside `data-orbit-head-gap`; non-architectural for Design.md. `docs/BROWSER_CHECKS.md` readout table and smoke row updated.
- `smoke` gains the `synthetic-belt` view (quick tier): time limit for the smoke step to be reviewed.

## Coordinator Completion

Owner decisions, 2026-11-23 (orchestration session): (1) frame time "Accept it": the measured +0.21 ms per frame for three planet lines (Node benchmark, about 1.3% of a 60 fps frame) is accepted, so the Done When "not worse beyond run-to-run noise" is met by owner acceptance, not by measurement; (2) "Only when orbit lines change": the close-zoom check moved out of the quick `smoke` step into a new full-tier step `orbit-lines` (`browser-steps.mjs`, limit 60 s in `tools/gate-limits.json` from the measured 55 s, its paths listed in `docs/agents/browser-policy.md`, row in `docs/BROWSER_CHECKS.md`); `smoke` skips `synthetic-belt`, keeping its 65 s limit. The step will be run by the Full Objective Check (the diff touches its paths); not rerun here (one browser run per change). Known weakness kept: the three zoom stops landed on one radius (272 px desktop, 255 px phone).

Coordinator fix: the open CHANGELOG section gained `### Breaking changes in 0.10.1` ("None"), which `releaseBreaks.test.ts` requires.

Marked done by the coordinator under the owner's "orchestrate O99" after the wave gate passed on 2026-11-23T08:54Z: `npm run typecheck` ok, `npm run lint` ok, `npm test` 340 files, 5518 passed, 2 skipped. Owner look on localhost:5490 still to come, before the Full Objective Check.

## Owner Validation

Owner looked on localhost:5490 (`npm run preview:owner`, branch o099-orbit-lines at 2e8de417) on 2026-11-23 — `?experience=synthetic-belt` close zoom on Earth with time playing, zoomed out, and the Apollo page's Moon line — and said "looks good". The acceptance fields are filled in once the Full Objective Check has an id.
