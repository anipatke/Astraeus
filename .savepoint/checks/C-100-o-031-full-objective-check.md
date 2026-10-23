---
id: C-100
scope: {kind: objective, id: O-031}
result: NEEDS WORK
checked_by: {role: checker, session: o031-full-check-20261023}
executed_session: o031-orchestration-20261023
checked_at: '2026-10-23T00:24:21Z'
health_snapshot: sha256:b9242648e70fcd16c223d753c2d1959cccce1623163c9e0277b3519a0012f4d0
reviewed:
  base_commit: a771640e
  head_commit: 54b63e79
  files: [src/app/sceneFrame.ts, src/app/LayeredRender.tsx, src/app/AstraeusScene.tsx, src/app/sceneContentsHooks.ts, tests/sceneFrame.test.ts, tools/validate/driver.mjs, tools/validate/browser-smoke.mjs, tools/validate/journey-meteor-shower.mjs, docs/BROWSER_CHECKS.md, .savepoint/Design.md, .savepoint/objectives/O-031-lighter-app-code-and-gentler-drawing/Objective.md, .savepoint/objectives/O-031-lighter-app-code-and-gentler-drawing/tasks/T-149-stop-drawing-the-scene-when-nothing-moves.md, .savepoint/objectives/O-031-lighter-app-code-and-gentler-drawing/tasks/T-150-trim-the-download-every-page-shares.md, .savepoint/objectives/O-031-lighter-app-code-and-gentler-drawing/tasks/T-151-owner-look-on-the-preview-and-design-notes-brought-up-to-date.md]
  dependencies: []
issues: [I-073]
unmet: [O-031-SC2]
supersedes: null
---

# C-100: O-031 Full Objective Check

This session is independent. It did not plan, build, coordinate or mark any O-031 Task. Full mode. The diff is `main` (a771640e, which holds the planning commit) to `54b63e79`: 7 commits, 20 files, +747 / -20. All timestamps are `date -u` output.

**Verdict: NEEDS WORK, low materiality.** One gap: Success Condition 2 asks the browser command to show the scene drawing again after a **tap**, and it shows this after a **wheel turn** instead (I-073). Everything else is proven. Drawing stops when paused and idle and wakes on every input probed. Scientific State is untouched. The tests, lint, typecheck, build, full gate, health snapshot and one browser run all pass fresh. T-150 changed no code, as the owner decided. The owner's look is recorded. I found no freeze while something visible changes.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: first Check of O-031)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock

1. **Requirements under test.** O-031 Success Conditions 1-4 and Confirmed Decisions 1-5, including Decision 5: "Drop the cut, keep the findings", so SC3 is met by measurement only. Also the Done When lists of T-149, T-150 and T-151; ARCH-02, ARCH-03, ARCH-04, CODE-01, CODE-02, TEST-01, TEST-03 and TEST-04; the STYLE rules; and the AGENTS.md browser rules (one run, no screenshots, evidence retention).
2. **Changed files and entry points.** `runFrame` stage 8 (`decideDraw`, `readDrawInputs`, `shouldDrawFrame`, `cameraSettled`, `IDLE_GRACE_FRAMES`, the new `FrameState` fields) in `src/app/sceneFrame.ts`. The draw skip and `data-frames-drawn` in `LayeredRender.tsx`. The shared frame state in `AstraeusScene.tsx`. The `drawThisFrame = true` default and `useDrawWakes` in `sceneContentsHooks.ts`. The new tests in `tests/sceneFrame.test.ts`. The driver functions `framesDrawn`, `waitUntilSceneIdle`, `waitForMoreFrames` and `nudgeCamera`, and their use in `browser-smoke.mjs` and `journey-meteor-shower.mjs`. Also `docs/BROWSER_CHECKS.md` and `Design.md`.
3. **What these rely on.** React Three Fiber's frame loop (`frameloop: "always"`, priority 0 for the scene frame, priority 1 for `LayeredRender`). three's `DefaultLoadingManager`, which `useLoader(SafeTextureLoader)` and the sky's `new TextureLoader()` use. The App's writes to `SceneControls`. The other frame callbacks in `BodyView.tsx` (glow, rings). The look-ahead fills in `PointsView.ts`. The browser runner `run-browser.mjs`.
4. **Matrix axes.** Input class (clock, time, camera, controls, size or pixel ratio, mount, wake). Boundary (grace frame 29, 30 and 31). State transitions (rest, wake, rest, play, pause, rest). Representation (unit rule versus the real `runFrame` versus the real browser). Environment (desktop 1280x720 and phone 375x667 in smoke, the scratch public build).
5. **What counts as an Issue.** A picture that stays stale while something visible changed, through a supported page and input. A Scientific State change. A requirement unmet as written. Over-drawing (drawing when nothing changed) is safe and is never an Issue.

## Acceptance Coverage

| Requirement | Classification | Evidence |
|---|---|---|
| SC1 Idle stops drawing; tap, drag, wheel, key, setting, play, animation draw again | **Proven** | Fresh browser run: Apollo 11 rested at 59 frames (desktop) and 43 (phone); the Perseids at 38. Checker probe A (below): drag +51, wheel +30, body pick (flight) +42, seek +30, next event +30, resize +30, illuminate-all +30, play +59, canvas click +48; Escape (a DOM-only key) +0, which is correct because the picture did not change. Unit probes: one change gives exactly 30 drawn frames, then no draw |
| SC2 Fast tests prove the rule case by case; the browser command confirms rest, then waking on a tap and on play | **Issue (I-073)** for the tap clause; the rest is **Proven** | 11 new cases in `tests/sceneFrame.test.ts` "draw this frame? (stage 8)" pass in the full gate. Browser: rest (smoke, journey), wheel +6, play +81. No tap step |
| SC3 `app.js` measured; only invisible cuts; before/after; budget; ideas listed | **Proven, measurement only, per Decision 5** | T-150 evidence lists the top contributors with sizes, the one cut with both sides of its trade-off, and five bigger ideas. The owner dropped the cut at 2026-10-22T21:49Z. `git diff main..HEAD` touches no `App.tsx`, `DeveloperPanel.tsx` (it does not exist) or `load-budget.mjs`, so the budget is unchanged and nothing visitors see changed. Fresh default build: `app` 1,339.47 kB / gzip 394.51 kB (not the public build; T-150 measured the public one at 1,366 kB / 404 kB) |
| SC4 Owner look; gates pass; one browser run at the Full Check | **Proven** | The T-151 verdict is quoted ("all fine, run the final check", 2026-10-23T00:16:39Z) after a 12-item checklist that includes the late-texture risk. Gates are below. One `npm run check:browser` ran |
| T-149 Done When | Proven except the tap (I-073) | The approach and its reason are recorded. The developer frame-rate readout is recorded (see observation 2) |
| T-150 Done When | Proven as amended by Decision 5 | The not-built ideas are listed with estimated savings |
| T-151 Done When | Proven | Design.md has the O-031 paragraph, which covers T-149's drift note; T-150's note was withdrawn |
| ARCH-02 | **Proven** | `src/core/` is not in the diff. `readDrawInputs` reads `clock.playing` and the frame time and writes only `FrameState.drawn`. Probe: 1000 `decideDraw` calls leave `clock.snapshot()`, the orbit distance and the controls unchanged |
| ARCH-03 / ARCH-04 | Proven / not affected | The rule is tested on a generic Earth-Moon context and runs in two experiences in the browser (Apollo 11, Perseids). No imports changed layers |
| CODE-01 | Proven | `npm run lint` (complexity 20) passes |
| CODE-02 | Proven | The rule is stage 8 in `sceneFrame.ts` with node tests. `LayeredRender` only obeys the flag and counts frames, which is renderer work, not new per-frame logic |
| TEST-01 / TEST-03 | Proven | Each behaviour has a named test case or a browser step |
| TEST-04 | Proven | Each of T-149, T-150 and T-151 has a `check_waiver` naming the Task, the reason with the owner's quote, the actor and the time |

## Coverage Matrix (draw rule)

| Row | Normal | Boundary | Malformed / odd | Bypass / repeat | Result |
|---|---|---|---|---|---|
| Clock playing | draws every frame (unit; `runFrame` probe 20/20; browser +81 in 1.5 s) | n/a | n/a | pause, then rest within the grace | passed |
| Time changed (seek, step, loop wrap) | seek draws (unit, `runFrame` probe, browser probe +30) | the first frame of `memo.timeUtcMs` is NaN, so it draws | NaN frame time always draws (probe), which is safe | next event +30 | passed |
| Camera tween | unsettled draws until it arrives (unit, `runFrame` probe: settles in a bounded number of frames) | 1e-6 tolerance; a 1e-9 nudge is ignored (unit) | n/a | flight from a body pick +42 (browser probe) | passed |
| Camera pose (drag, wheel, pinch) | drag +51, wheel +30 (probe), journey wheel +6 | relative tolerance | n/a | fov change (unit) | passed |
| Controls by identity | policy, starBrightness (unit); illuminate-all, selection, cameraRequest, open panel, open feature, Milky Way, bodyMarker (checker probe: each draws) | n/a | `viewReadout` ignored (unit) | a new look object with the same values: no draw, which is correct because the picture is the same (probe) | passed |
| Flat looks edited in place (glowLook) | draws (unit) | n/a | n/a | `hiddenLabels` is a Set edited in place and not seen, but it only drives DOM labels (`sceneLabels.update`), so the canvas is unaffected | passed |
| Size / pixel ratio | resize draws (unit; browser probe 900x600 +30) | pixel ratio alone draws (probe, stubbed to 3) | n/a | n/a | passed |
| Mount | a new body part mount draws (unit) | n/a | `bodiesMounted` false: the frame returns early with `drawThisFrame = true`, so it draws | n/a | passed |
| Wake (loader, context restored) | `wakes` bump draws (unit) | grace of 30 frames after the wake | load error also wakes (`onError` wrapped) | the wrappers chain the previous handlers and restore them on unmount | passed (late texture: observation 3) |
| Grace | exactly 30 drawn frames after one change, then none (probe: independent count) | 29 draws, 30 does not (unit) | n/a | repeated settle cycles (unit, probe) | passed |
| Browser readout | smoke 59 / 43, journey 38 → 44 → +81 | `waitUntilSceneIdle` 1.5 s quiet, 10 s timeout | 0 when the attribute is missing (see observation 1) | n/a | passed |

Not applicable: text classes, serialization, redirected or no-colour output (no text output in scope).

## Finite External-Boundary Matrix (browser runner)

| Cell | Classification |
|---|---|
| Configured target vs actual | Passed. The runner started its own servers; the scratch public build was served for `smoke-public-showers`. The owner's preview on 5490 was left alone and was still listening afterwards |
| Startup, discovery, reuse | Passed. Total 67 s, including servers and the public build |
| Connection refused, non-success, redirect, timeout | Not applicable to O-031's change. The runner is unchanged; its failure paths were proven in O-038 (C-098/C-099) |
| Malformed response | `framesDrawn` reads 0 when the attribute is missing (observation 1) |
| Cleanup, partial side effects | Passed. Logs went to `/tmp/astraeus-check-logs-rAC42o`; only `summary.txt` and `results.json` files are kept in the evidence folder |
| Secret-safe output | Not applicable (no secrets in scope) |

## Workflow And Side-Effect Lock (one frame)

| Order | Operation | Side effect | Failure / final state | Oracle |
|---|---|---|---|---|
| 1 | `useSceneFrame` callback sets `drawThisFrame = true` | flag | bodies not mounted: returns early, so it draws | code read; mount unit case |
| 2-7 | `runFrame` stages 1-7 (unchanged) | poses, overlays, readouts | an exception leaves the flag true, so it draws | unchanged code |
| 8 | `decideDraw` → `readDrawInputs` | updates `state.drawn` only | n/a | ARCH-02 probe |
| 9 | `BodyView` glow and ring callbacks (priority 0) | glow scale from camera distance and `glowLook`; ring bands from `ringLook` | both inputs are tracked by the rule (pose, controls) | code read |
| 10 | `LayeredRender` (priority 1): skip, or draw and count | GPU passes; `framesDrawn`; `data-frames-drawn` | skipping keeps the last presented frame | browser readouts; owner look |

## Adversarial Pass (missed wakes and other questions)

- **Textures arriving after the 30-frame grace.** `useLoader(SafeTextureLoader)` and the sky's `new TextureLoader()` use `DefaultLoadingManager`. three calls `manager.itemEnd` right after the loader's `onLoad`, so the wake follows the image being set. The GPU upload happens at the next draw, which the wake causes. The remaining risk is a React Suspense commit landing more than about 0.5 s after the load event. That is theoretical; the owner's checklist item 12 saw none. Observation 3.
- **Story and feature markers, hover, pulses.** These are DOM, updated every frame because the frame loop keeps running. Hover changes only DOM labels and the cursor (`updateOverlays` lines 255-258). Pressed marker state is `openStoryPanelId` / `openFeatureKey`, which are controls (probe: each draws).
- **Body-set refill.** `PointsView` look-ahead computes the next pair and swaps it in only when the clock passes it. While paused the drawn pair does not change. A seek makes the fill whole in the same frame, which draws.
- **Selection highlight, illuminate-all.** Both are controls fields; probes draw (+30 in the browser for illuminate-all).
- **Resize.** The size string includes the pixel ratio; both are probed.
- **Frame-rate readout while idle.** It reads the loop rate (about 60) because `FrameStats` ticks in the scene frame callback. This is developer-only and recorded in T-149 and Design. Observation 2.
- **Are the browser assertions vacuous?** No, as a set. The meteor journey requires `waitForMoreFrames` (+3) after the wheel and at least 10 frames while playing, and read 38 → 44 and 81. The smoke rest check alone would pass if the readout were missing (observation 1).
- **Did anything visitors see change?** Only the skipped redraws of an unchanged picture, plus a `data-frames-drawn` attribute. T-150's code was not merged. The owner's look: "all fine".
- **The claim that a tap on empty sky does not draw** (T-149 list item 12) is contradicted by the probe: it drew 48 frames. That is harmless over-drawing. Observation 5.

## Verify File Reality

Every file named in the three Tasks' evidence exists, except T-150's lane files (`src/app/DeveloperPanel.tsx`; lane commit d60b2199), which are recorded as not merged. `docs/evidence/browser-20261022T215309Z` exists with `summary.txt` and four `results.json`. T-149's earlier failing run is recorded as deleted. No phantom files.

## Gates And Commands (fresh, this session)

| Command | Time (UTC) | Result |
|---|---|---|
| `npm run lint` | 00:17:28-00:17:31 | pass |
| `npm run typecheck` | 00:17:31-00:17:35 | pass |
| `flock /tmp/astraeus-build.lock npm run build` | 00:17:35-00:17:36 | pass (chunk-size warning only) |
| `npm run test:full` | 00:17:36-00:18:35 | pass: 111 files, 1513 passed, 1 skipped; coverage statements 71.9%, branches 70.22%, functions 71.65%, lines 74.76%; fresh `coverage/coverage-final.json` and `junit.xml` |
| `git diff --check main..HEAD` | 00:23 | clean |
| `savepoint health check O-031` | 00:19:26 | snapshot created (below) |
| `npm run check:browser` (once) | 00:19:37-00:20:45 | exit 0, 67 s; smoke 32 s, smoke-public-showers 13 s, planets-phone 9 s, meteor-shower 9 s, files-only steps 1 s; 0 error lines; evidence `docs/evidence/browser-20261023T001937Z`; no screenshots |
| Checker probe A: scratch Playwright script through `driver.mjs` on `npx vite --port 5199` (stopped afterwards) | 00:21:28-00:22:12 | the frame deltas listed above, no page errors. A second scratch probe found Apollo 11 and the planets offer one scale only, so the scale switch is unit-proven only |
| Checker probe B: temporary Vitest file (removed) with 8 cases: grace count, ARCH-02, seven controls, pixel ratio, NaN time, equal look object, `runFrame` end to end | 00:23 | all pass |

Probes A and B are scenarios written for this Check, not the browser set; the set ran once.

## Code Health Evidence

`savepoint health check O-031` gave snapshot `sha256:b9242648e70fcd16c223d753c2d1959cccce1623163c9e0277b3519a0012f4d0` (created), with the verdict "Code Health does not block clearance". Complexity, coverage, dependency vulnerabilities, duplication and tests are all optional instances, reported only, with no finding. It was taken before the browser run, so the new evidence folder cannot make it stale.

## Issues

- **I-073** (verification, low): SC2's "draws again on a tap" is shown only with a wheel turn in `journey-meteor-shower.mjs` lines 18-21, and the substitution is not recorded. The behaviour holds (probe A). The browser command's proof is missing.

## Materiality

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-073 | Low: tap waking works today, and a future pointer change would have to break it unnoticed | Low to Medium: a phone tap that fails to wake would leave a stale picture, and the main browser gate would miss it (the drag and pick paths share the pointer listeners) | Low | Either a direct repair (add a canvas tap and `waitForMoreFrames` to the journey through the driver, update `BROWSER_CHECKS.md`, one fresh `check:browser`, then a short recheck), or the owner records an exception for the tap clause of SC2 |

## Observations (non-blocking)

1. `browser-smoke.mjs` line 73 records `idleAtFrames` but does not assert it is above 0. On its own it would pass with the readout missing. The journey's growth assertions cover this for the set as a whole.
2. While idle, the developer frame-rate readout shows about 60 fps (the loop rate, not draws). This is developer-only and documented. A "frames drawn" line beside it would avoid misreading it.
3. A texture whose React swap lands more than 30 frames after its loader event could stay stale until the next input. This is theoretical; the owner's look item 12 saw none.
4. The doc comment on `FrameState.wakes` (`sceneFrame.ts` line 53) still lists "a React render", a wake the evidence says was removed (STYLE-08).
5. T-149's paused list item 12 says a tap on empty sky does not draw. In the browser it drew 48 frames. This is safe and only the record is wrong.
6. The router still selects T-151, which is done (`savepoint resume` warns about it). This is router upkeep, not part of this Check.
7. T-151 declares `owner_validation.required: true` with no `accepted_check` yet. The owner's look is quoted in its evidence, but formal acceptance still has to be recorded.

## Owner Validation Still Needed

T-151's owner acceptance needs to be recorded against a Check. The look itself is done ("all fine, run the final check").

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [ ] STYLE-08 **Comments explain why**: the `FrameState.wakes` comment (`src/app/sceneFrame.ts` line 53) names a React-render wake that no longer exists.
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**
