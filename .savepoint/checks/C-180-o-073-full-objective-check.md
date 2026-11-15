---
id: C-180
scope: {kind: objective, id: O-073}
result: NEEDS WORK
checked_by: {role: checker, session: o073-check-20261115}
executed_session: plan-g020-20261115
checked_at: '2026-11-15T04:42:49Z'
health_snapshot: sha256:641ba18aa7282ba63a531f883d02cb610de75808141b5760c1ed81f5e2ca24cb
reviewed:
  base_commit: a00afc63
  head_commit: 13ecf688
  files: [packages/astraeus/src/app/sceneCamera.ts, packages/astraeus/src/app/CameraController.tsx, packages/astraeus/src/app/scenePointer.ts, packages/astraeus/src/shell/AstraeusShell.tsx, packages/astraeus/src/core/clock.ts, packages/astraeus/src/shell/storyPanels.ts, packages/astraeus/src/api/story.ts, packages/astraeus/src/api/planTimeline.ts, packages/astraeus/src/app/SkyFiguresView.ts, packages/astraeus/src/app/sceneFrame.ts, packages/astraeus/src/api/time.ts, packages/astraeus/src/core/state.ts, packages/astraeus/src/core/storyPanels.ts, packages/astraeus/src/core/lookValues.ts, packages/astraeus/src/api/planPaths.ts, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, packages/astraeus/api-surface.lock.json, .savepoint/Design.md]
  dependencies: []
issues: [I-178]
unmet: [SC7]
supersedes: null
---

# C-180: O-073 Full Objective Check

This is a fresh session: I did not plan or build O-073. The scope is O-073 and its Tasks T-313, T-314 and T-315. All three are done under the owner's check waiver, which covers only the optional Task Checks. Diff: `git diff main...HEAD`, base a00afc63, head 13ecf688. The working tree matches HEAD for package files.

## Progress

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix (n/a: no server, subprocess or network in the change)
- [x] Workflow And Side-Effect Check Lock (n/a: per-frame and validation steps only; no persistence or artifacts)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (n/a)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (n/a: initial Check)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope lock

1. Criteria under test:
   - The nine O-073 Success Conditions, plus CHANGELOG `Unreleased` with no version bump.
   - The Done When lists of T-313, T-314 and T-315.
   - Guardrails ARCH-02, ARCH-03, ARCH-04, API-01, API-02, API-05, API-07 and TEST-01..03.
   - Gates: the full gate, the engine-alone, pack and consumer checks, and the browser gate.
   - The 0.9.2 additions-only promise. Allowed exceptions: the owner-approved refusal of fractional panel times and the look-out tap rule.
2. Changed entry points:
   - `handle.setCamera({ lookOut })`, a panel camera, and the timeline Go to (`turnToFigure`), all through `applyLookOut`.
   - The tap path: `attachScenePointer`, then `pickRequest`, then `AstraeusShell.pickObject`.
   - `setTimeline({ playing })` and `scene.timeline.playing`.
   - `SimulationClock.stopWithin` and `CrossingTracker.advance`.
   - `clearSkyTrace(id, { durationSeconds: 0 })`, through `advanceSkyTraces`.
   - `toUtcMs` and every `src/api` caller of it, plus the provider wrapper and panel `atOf`.
   - `splitColourAlpha`, through `SkyFiguresView.paint`.
3. Code these rely on: `resolveCamera` easing and its reduced-motion blend; `useStoryPanels` (crossing effect, `noteSeek`); every seek path (`AstraeusShell.seek`, `App.hostSeekTo`); `openClock`.
4. Matrix below.
5. Admission: a README or CHANGELOG sentence the Objective added that a public call contradicts, or a Success Condition met only under an unrecorded deviation.

## Coverage matrix

Harness: a temporary vitest file at `packages/astraeus/tests/zzCheckProbeO073.test.ts`, run after the gates and then deleted. It had 32 cells, all passing.

| Row | Cells | Result |
|---|---|---|
| SC1 glide | Already in look-out with a direction, an object or a zoom: targets only. From orbit: cut. A visitor zoom clears the target FOV. Reduced motion lands in one frame. | Pass. Source trace of `sceneCamera.ts` 160-177 and `CameraController.tsx` 215, 230-233. `lookOutGlide.test.ts` covers it. A panel camera and Go to share the `lookOut` request path (`App.tsx` 370), confirmed. |
| SC2 tap keeps sky | Look-out: figure over body, body only. Orbit: body over figure. | Pass. `scenePointer.ts` 441-448. The `pickObject` keepSky branch selects without `activatePreset` (source read). There is still no DOM test for it, but the owner looked on 5490 and said "Looks right". |
| SC3 open paused | `playing` false, true or absent. Non-boolean `"yes"`, `0`, `null`, `1`. `none` frozen; `none` with a rate. | Pass. Reads false/true/true. `bad-timeline` for each non-boolean. `none` reads false, or true with a rate. Mount and `AstraeusScene` are covered in `openPausedAndEdgeStop.test.ts`. |
| SC4 edge stop | Forward and backward, with a monotonic source ticking 7 ms per read, looped to the stop. | Pass: exactly on `end` and on `start`. |
| SC5 panel at end | 8 tracker sequences. | Pass. Play then stop on the end opens `end`. Seek (rebase) to the end, playing or paused, opens nothing. A pause tick (time moved by playback), then a paused change without rebase, opens nothing. Paused throughout opens nothing. Backward stop opens nothing. Auto-open off opens nothing. |
| SC5 bypass | Every time change while paused | Pass by trace. Every visitor seek goes through `AstraeusShell.seek`, which calls `noteSeek` (slider, event/window Go to, panel markers). A host seek goes through `App.hostSeekTo`, which also calls `noteSeek`. A pause cannot move time other than by playback, and the stop/wrap rules act only while playing. A pause therefore never opens a panel that playback did not cross. |
| SC6 zero clear | Paused, still frame | Pass: `clearTrace` returns true, then `state.wakes += 1` (`sceneFrame.ts` 410-413). Test in `openPausedAndEdgeStop.test.ts`. |
| SC7 fractional time | 14 calls x 5 bad values (`badTime.test.ts`); panel `at.time` with `T0+0.5`, `1e16` and `"bad"`; a whole-ms panel time | 70 cells throw `bad-time`. **Issue I-178**: panel, anchor and `shownDuring` times throw their own codes (`bad-panels`, `bad-anchor`, `bad-body`/`bad-trajectory`), but the README time rule and the CHANGELOG say `bad-time`. A whole-ms time is still accepted. |
| SC8 alpha | `#rrggbbaa`, `#rgba`, `rgba()` with a fraction or a %, `hsla()` with 0, `rgb()`, a named colour, alpha 2 (clamped) | Pass. The opaque part and the alpha are as expected, and every form passes `isCssColour`. Materials: shared, own, ecliptic/equator (re-painted on add), selected and trace lerp all multiply in alpha (`SkyFiguresView.ts` 297, 307, 336-339, 348). |
| SC9 docs F-16 | README `addEvents`, `EventInput`, `SceneEventRead` | Pass |
| API lock / CHANGELOG | `SceneTimelineRead.playing`, `TimelineInput.playing`, migration WIDENED row | Pass (lock test in `npm test`) |
| Design | `The sky view` (1) and (5), Opening and edges, Whole-millisecond times | Pass. Each sentence matches the code read above. |
| Text classes, serialization, output sinks | n/a: no text width, parser output or CLI in scope | |

## Adversarial pass

- Bypass of the crossing rule: every seek path is traced (SC5 bypass).
- Sky pose restore while already looking out: it now eases rather than cutting. That matches the documented setCamera rule.
- Additions-only: three things now change at the public surface. The new refusals of fractional times follow the Success Condition, and panel times are owner-approved. The look-out tap rule is owner-approved. The `loop` doc lost a sentence (observation). Nothing else breaks documented behaviour.
- ARCH-04: core `isUtcUnixMs` and `splitColourAlpha` import nothing outside core.
- ARCH-02: State is untouched by the camera and pick changes.

## Gates

Run 2026-11-15 at HEAD 13ecf688, through `npm run check:gates` (started 04:32:37Z).

| Gate | Result | Time (limit) |
|---|---|---|
| `git diff --check main...HEAD` | clean | |
| lint / typecheck / build | pass | 4.4 / 9.6 / 2.4 s (15 / 20 / 15) |
| `npm test` | pass | 44.5 s (65) |
| `npm run test:full` | pass, junit 3,927 tests, 0 failures | 77.2 s (105) |
| `check:engine-alone` | pass | 24.9 s (40) |
| `check:pack` | pass | 15 s (30) |
| `check:node-consumer` | pass | 5.1 s (15) |
| `check:react-consumer` | pass | 8.5 s (25) |
| `measure:example` | first-open 1,766,450 raw / 508,015 gzip (0.9.1: 1,764,446 / 507,330) | |
| `check:browser` (once) | pass, 12 of 12 steps exit 0, error-lines 0 (04:37:10Z-04:42:37Z); evidence `docs/evidence/browser-20261115T043710Z/`. Warnings only: total 327 s over 320, `hello-sky` 22 s over 15 | 327 s (320) |

## Code Health

`savepoint health check O-073` ran once, after the full gate. Snapshot `sha256:641ba18a…` (created). Verdict: "Code Health does not block clearance". All five instances are optional and report no finding. This is supporting evidence only.

## Issues

- **I-178** (SC7, API-05, API-07): the README time rule and the CHANGELOG say a fractional panel or path time throws `bad-time`. Panel, anchor and `shownDuring` times throw their own codes. The CHANGELOG also does not list these as newly refused. The coordinator chose to keep the call codes, but no owner decision covers that against the Success Condition's "every ... `bad-time`".

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-178 | Medium (a host that catches by code after reading the time rule) | Low (wrong code named; the time is still refused) | Low | Fix now: the owner decides on the codes, then a README and CHANGELOG wording repair |

## Observations (non-blocking)

- In look-out, a tapped body-set member that is not a listed object still falls to the last `pickObject` branch, a focus request, which leaves the sky. It is rare and outside "selects it", because it cannot be selected.
- To fit the api page gzip budget, the `TimelineInput.loop` doc dropped "The viewer can still seek and pause."
- `SceneTimelineRead.playing` is documented only as "Opens playing."
- The CHANGELOG `Unreleased` section has a stray blank line between its two groups of bullets.

## Owner decisions carried forward

- T-313, T-314 and T-315 check waivers (owner, 2026-11-15T04:10:47Z) still apply. They cover only the optional Task Checks.
- T-313 owner validation ("Looks right", 04:18:59Z) still applies; the look-out code has not changed since.
- The panel-time refusal (owner, 04:31:55Z) still applies.

## Owner validation still needed

Decide the I-178 codes question.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [ ] STYLE-03 **Test branches**: the shell keepSky branch (`AstraeusShell.tsx` 558-562) has no DOM test.
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**
