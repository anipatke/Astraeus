---
id: T-045
title: Draw paths as orbits or trails and measure precision at one astronomical unit
objective: O-014
status: done
depends_on: [{task: T-044, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o014-plan-2026-10-11}
lane: scene
planned_reads: [src/app/experienceDefinition.ts, src/app/SunCentredView.ts, src/app/orbitPath.ts, src/app/AstraeusScene.tsx, src/app/TrackedBodyView.ts, src/app/mission.ts, src/core/sunCentredSources.ts, src/core/stateResolver.ts, src/assets/compositions.ts, tests/sunCentred.test.ts, tests/missionScene.test.ts, tools/validate/browser-synthetic-belt.mjs, docs/ASTRAEUS_SPIKE_04_ASSET_ARCHITECTURE.md]
planned_writes: [src/app/experienceDefinition.ts, src/app/PathView.ts, src/app/SunCentredView.ts, src/app/orbitPath.ts, src/app/AstraeusScene.tsx, src/app/TrackedBodyView.ts, src/assets/compositions.ts, src/core/sunCentredSources.ts, tests/paths.test.ts, tests/sunCentred.test.ts, tests/missionScene.test.ts, tools/validate/browser-synthetic-belt.mjs]
---

# Draw paths as orbits or trails and measure precision at one astronomical unit

## Outcome

A path is declared as a co-moving `orbit` (optionally about a named centre) or a `trail` whose frame is `relative` or `inertial`, and every path, including the Moon's monthly path and the Apollo tracks, is drawn by the same rule through the resolver's offsets. The Moon path stops being a special case and becomes the Earth–Moon composition's declared orbit path. The precision of a true-scale body one astronomical unit from the floating origin is measured in pixels and recorded, so the Sun-centred claim rests on a number.

## Astraeus Hypothesis

- **Capability tested:** that the presentation layer's "paths" job holds for any state source under one stated transformation rule, and that the floating origin carries Sun-centred scenes at the precision the brief needs.
- **Contract reused:** `samplePathKm`, `PathView`, `TrackedBodyView`, `sampleOrbitPath`, `StateResolver.offsetKm`, `ScalePolicy`, `FloatingOrigin`.
- **Gap:** design A.4 item 9 (unmeasured precision) and Addendum 1 finding 6 / final review correction 2 (path semantics undefined).
- **Generic change:** `PathLayer` as the tagged union in design C.6; `TrackedBodyView` declared a relative trail; `orbitPath.ts` folded into the generic path layer.
- **Evidence independent of any experience:** made-up two-body sources for all three readings; the review's moving-centre test with a body stationary in the root frame.

## User Check

None required; the belt and Apollo should look as before. The owner may read the recorded precision figure.

## Done When

1. `PathLayer` is `orbit` (optional `center`, default the source's native centre) or `trail` with `frame: "relative" | "inertial"`; validation names the bad field; existing declarations (belt paths) are migrated to `orbit`.
2. Rule tests on made-up sources: an orbit's vertices are invariant under a change of scene centre up to one rigid translation; a relative trail equals per-sample positions from the scene centre at the sample time; an inertial trail equals root-frame positions offset by the scene centre at the display time; a body stationary in the root frame under a moving scene centre gives an inertial trail of one point and a relative trail mirroring the centre's motion.
3. The Earth–Moon composition declares the Moon's monthly orbit path; its vertices equal today's `sampleOrbitPath` output at three dates, and the refresh policy is preserved; `orbitPath.ts`'s Moon-specific code is removed.
4. `TrackedBodyView` is a relative trail: Apollo's drawn path is unchanged (vertex equality test at three times); as an inertial trail in a Sun-centred test scene, Columbia's samples equal sample + Earth-from-Sun at the sample time minus the centre at display time.
5. Precision measured: in the belt at true scale, with the camera focused on Earth and then on the Sun marker, the screen-space jitter of Earth's rendered centre and of a path vertex near Earth over 60 frames at a fixed clock time, in pixels, at 1280×800; recorded in `docs/evidence/o014-<task>-<date>/precision.json` with the method. If jitter exceeds one pixel on the focused body, record the finding and return REPLAN REQUIRED rather than change the floating-origin threshold silently.
6. Gates pass; every browser script passes in a fresh run directory.

## Context Files

`docs/ASTRAEUS_SPIKE_04_ASSET_ARCHITECTURE.md` (A.4 item 9, C.6 path semantics, E step 3 and risks), `src/app/experienceDefinition.ts`, `src/app/SunCentredView.ts`, `src/app/orbitPath.ts`, `src/app/AstraeusScene.tsx`, `src/app/TrackedBodyView.ts`, `src/app/mission.ts`, `src/core/sunCentredSources.ts`, `src/core/stateResolver.ts`, `src/assets/compositions.ts`, `tests/sunCentred.test.ts`, `tests/missionScene.test.ts`, `tools/validate/browser-synthetic-belt.mjs`.

## Design References

Design: Interfaces and Data Flow (tracked-body path, Moon path refresh); Groups and the `points` layer. Design document C.6, E step 3, Gate D (precision).

## Guardrails

ARCH-02, ARCH-03, TEST-01, TEST-03, STYLE-01, STYLE-07, STYLE-10.

## Implementation Plan

1. Confirm the scene Task's composition and resolver offsets landed; REPLAN REQUIRED if not.
2. Define the `PathLayer` union and validation; rename `SunCentredView.ts`'s path class to `PathView.ts`.
3. Implement the orbit and the two trail rules through `offsetKm`; make `TrackedBodyView` the relative trail.
4. Move the Moon path to the composition's declared orbit path; delete the Moon-specific sampler.
5. Rule tests; the moving-centre test; Apollo and Moon equality tests.
6. Precision script in the belt browser run; record the figures; gates and browser scripts.

## Boundaries

No scale change, no experience move, no planets. The floating-origin threshold and `State` are not changed; a precision failure is a recorded finding.

## Technical Verification

Focused tests during iteration; handoff runs the gates and every browser script. Evaluated later under `agent-skills/references/check-method.md`.

## Technical Evidence

Executor session `o014-t045-executor`, 2026-10-12, branch spike-04 on top of 15c381f (T-044). Not a Check; claims for a fresh `savepoint-check` to verify.

### Per-criterion outcomes

| # | Criterion | Outcome | Where |
|---|---|---|---|
| 1 | `PathLayer` = `orbit` (optional `center`) or `trail` with `frame`; validation names the field; belt paths migrated | Done | `src/app/experienceDefinition.ts` (`PathRule`, `PathSpec`, `PathLayer`, `validatePathSpec`); `src/synthetic/syntheticRingDefinition.ts` (both belt paths `kind: "orbit"`); `tests/paths.test.ts` "a path declaration names its rule" (8 named-field rejections) |
| 2 | Rule tests on made-up sources: orbit invariant up to one rigid translation; relative trail per-sample from centre at sample time; inertial trail root-frame + centre at display time; stationary body under moving centre | Done | `tests/paths.test.ts`: orbit (rigid translation, also equals the resolver's offset, and through a `PathView`); relative and inertial trails against independent `resolver.stateOf` formulae for centres earth/moon/sun; stationary-in-root source: inertial trail one point, relative trail mirrors Earth's motion (rule level and `PathView` level). Mutation check: flipping the sign in `rootFrameKm` fails 4 tests |
| 3 | Moon monthly path is the composition's declared orbit; vertices equal `sampleOrbitPath` at three dates; refresh policy preserved; Moon-specific code removed from `orbitPath.ts` | Done | `earthMoonSystem.paths` (unchanged declaration) is drawn by `PathView(compositionPathLayer(...))` as `{kind:"orbit", center: parent, span:{windowMs}}`; `tests/paths.test.ts` compares times, km samples and drawn absolutes against a frozen copy of the removed sampler at 2023-01-15, 2024-07-01, 2025-03-20 (equal) and exercises the refresh policy through the view (seek, drift, cadence). `src/app/orbitPath.ts` deleted; generic parts moved to `src/app/pathRules.ts` (`mapPathKm`, `pathNeedsRefresh`, `PathRefreshPolicy`) and `src/core/sunCentredSources.ts` (`windowTimesUtcMs`, `samplePositionsKm`, `pathTimesUtcMs`) |
| 4 | `TrackedBodyView` is a relative trail; Apollo path unchanged at three times; Columbia as inertial trail in a Sun-centred scene | Done | `TrackedBodyView.pathRule`, its remap now calls `relativeTrailKm`/`mapPathKm`; `tests/paths.test.ts` compares the drawn travelled/future vertices to the replaced formula at 20/50/80% of the flight for centres earth, moon, sun; Columbia inertial trail equals sample + Earth-from-Sun at sample time - centre at display time (Sun centre) at 15 vertices. Existing `missionScene`/`compositions` tests pass unchanged except the `mapOrbitPath` call |
| 5 | Precision measured in the belt at True scale, 1280x800, 60 frames, Earth focused then Sun marker; recorded with method; REPLAN if > 1 px on the focused body | Done, no replan | `docs/evidence/o014-t045-20261012T075844/run/precision/precision.json`; command below. Numbers in "Precision" |
| 6 | Gates pass; every browser script passes in a fresh run directory | Done | Gates and browser table below |

### I-020 (assigned to this Task)

Real cause, not a wrong assertion: draw order. The script counts Earth-path pixels in the Sun view. The belt's amber dots (a `Points`) and the path line are both transparent with depth test off, so Three.js sorts them by object centre and the belt, which covers the 1 AU circle, was drawn after and painted over the line: 16 (desktop True) and 29 (phone True) blue pixels survived against a threshold of 40. Fix under the new rule: every `PathView` line has `renderOrder` 1 (the data dots stay 0), so a path overlay is drawn after the data it crosses (the stated purpose of `TRACK_LAYER`). The assertion and threshold are unchanged, because the quantity it checks (the line is visible in the view) is correct under the path rule. Controlled check: new `PathView` with `renderOrder` 0 reproduces the failure (phone/True 29); with 1 it passes. Final counts: desktop True 102, desktop Readable 108, phone True 114, phone Readable 113. Recorded on I-020 as a `repair_attempted` history entry (the task brief asked for `kind: note`, which the Issue schema rejects; `savepoint resume` refused it). I-020 `status` was not changed.

### Precision (criterion 5)

Command: `PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js ASTRAEUS_EVIDENCE_DIR=docs/evidence/o014-t045-20261012T075844/run/precision node tools/validate/browser-precision.mjs` (new script; own vite on :5199). Output: `docs/evidence/o014-t045-20261012T075844/run/precision/precision.json` (+4 screenshots). Clock paused at 2030-01-01T13:00Z, True scale, 1280x800. Method: the script projects, with the camera's own matrices in Float64, the Float32 local positions the GPU receives for Earth's sphere and for the Earth-path vertex nearest Earth, for 60 frames. "Static": nothing moves, figure = largest distance from frame 0. "Sweep": camera orbits 1 px of mouse drag per frame, figure = largest residual from a cubic fit (the wobble left after smooth camera motion).

| Case | Earth from GPU origin | Earth centre, static / sweep wobble | Path vertex near Earth, static / sweep wobble |
|---|---|---|---|
| Focus Earth (close, Earth radius 249 px) | 0 units | 2e-13 px / 1e-12 px | vertex off screen: not measured (swings thousands of px as the camera turns) |
| Focus Earth (pulled back, Earth radius 3.2 px) | 0 | 0 / 1e-12 px | vertex off screen; wobble 0.065 px, not a precision figure |
| Focus Sun marker, Sun view (Earth radius 0.0028 px) | 23,089 units (0.98 AU) | 1e-9 px / 0.00058 px | 3e-8 px / 0.00056 px |
| Focus Sun marker, zoomed out | 23,089 | 0 / 0.0013 px | 0 / 0.0013 px |

Float32 grid at 1 AU: one AU is 23,481 Earth radii, so the spacing is 2^-9 = 0.00195 units = 12.4 km, which is 5.4e-6 px at the Sun-view scale. The focused body never exceeds 1 px (it is pinned to the origin by the floating origin, threshold 1 unit unchanged). The floating-origin threshold and `State` were not changed. Finding: the Sun-centred claim holds at the measured precision; the number is far below one pixel because a camera that orbits the Sun cannot get close enough to a body 1 AU away to resolve 12 km, and a camera focused on Earth is rebased onto it.

### Commands and results

| Command | Result |
|---|---|
| `npm run typecheck` | pass (`docs/evidence/o014-t045-20261012T075844/gates/typecheck.txt`) |
| `npm run build` | pass (`docs/evidence/o014-t045-20261012T075844/gates/build.txt`) |
| `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml` | 25 files, 494 tests pass (`docs/evidence/o014-t045-20261012T075844/gates/test.txt`; before this Task 460 + 34 new in `tests/paths.test.ts`) |
| Browser scripts, own vite on :5199, fresh dir `docs/evidence/o014-t045-20261012T075844/run/<script>/` (anchor-labels takes the dir as argv[2], the rest as `ASTRAEUS_EVIDENCE_DIR`), `PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js` | anchor-labels, precision, shell, showers, spike02, spike03, synthetic-belt, synthetic-ring, synthetic: all exit 0, `errors: []` in every output, zero console errors (`docs/evidence/o014-t045-20261012T075844/run/results.txt`). Vite stopped afterwards |
| Before run of the belt script at HEAD (`docs/evidence/o014-t045-20261012T075844/before/`) | fails at `phone/True: Earth's path is drawn (29)` (reproduces I-020); 3 before screenshots kept |

Evidence is written only under `docs/evidence/o014-t045-20261012T075844/`; no committed evidence was overwritten.

### Browser regression maintenance

No script scenario was removed or replaced; `browser-synthetic-belt.mjs` is unchanged (its failing assertion is now satisfied by the fix). `browser-precision.mjs` is added, not a replacement. Moon path drawing in the Earth-Moon scene keeps its prior look (same colour, opacity 0.45, depth-tested, layer 0, render order 0) via `COMPOSITION_PATH_STYLE`; spike02, spike03, shell, anchor-labels and synthetic scripts that draw it pass.

### Files read

Context Files: AGENTS.md, CLAUDE.md, the Task, `docs/ASTRAEUS_SPIKE_04_ASSET_ARCHITECTURE.md` (A.4 item 9, C.6, Addendum 1 finding 6, final review correction 2), `src/app/experienceDefinition.ts`, `SunCentredView.ts`, `orbitPath.ts`, `AstraeusScene.tsx`, `TrackedBodyView.ts`, `mission.ts`, `src/core/sunCentredSources.ts`, `stateResolver.ts`, `src/assets/compositions.ts`, `tests/sunCentred.test.ts`, `tests/missionScene.test.ts`, `tools/validate/browser-synthetic-belt.mjs`; also C-018 (observation 3) and I-020 as the brief directed.

### Extra reads (logged)

| File | Reason |
|---|---|
| `src/app/sceneLayout.ts` (`sceneOffsetKm`, `ScenePlacement`) | the offset helper every rule uses |
| `src/synthetic/syntheticRingDefinition.ts` | the belt's two `PathLayer` declarations to migrate |
| `tests/compositions.test.ts`, `tests/scenePlacement.ts`, `tests/sceneTransforms.test.ts`, `tests/controls.test.ts` | test patterns; tests importing the deleted `orbitPath.ts` |
| `src/app/BodyView.tsx`, `src/app/PointsView.ts`, `src/app/CameraController.tsx` | what the belt draws over the path, scene structure for the precision probe, camera easing |
| `agent-skills/references/issue-capture.md` (history kinds) | `kind: note` is not a valid history kind |

### Files changed

`src/app/PathView.ts` (renamed from `SunCentredView.ts`), `src/app/pathRules.ts` (new), `src/app/experienceDefinition.ts`, `src/app/AstraeusScene.tsx`, `src/app/TrackedBodyView.ts`, `src/app/mission.ts`, `src/app/orbitPath.ts` (deleted), `src/core/sunCentredSources.ts`, `src/synthetic/syntheticRingDefinition.ts`, `tests/paths.test.ts` (new), `tests/sunCentred.test.ts`, `tests/sceneTransforms.test.ts`, `tests/controls.test.ts`, `tests/missionScene.test.ts`, `tools/validate/browser-precision.mjs` (new), this Task, `.savepoint/issues/I-020-*.md` (history only), `.savepoint/router.md` (task selection). Planned writes not touched: `SunCentredView.ts` content moved to `PathView.ts` as planned; `src/assets/compositions.ts` unchanged (the declaration already existed; the scene now draws it through `PathView`). Unplanned: `src/app/pathRules.ts` (pure rule functions, kept out of `PathView.ts` to avoid a cycle with `TrackedBodyView.ts`), `tools/validate/browser-precision.mjs`.

### Limitations

- The precision probe projects the Float32 buffers the GPU receives in Float64; the GPU's own Float32 matrix arithmetic is not included and the only renderer available is headless software (swiftshader).
- Apollo "looks as before" is proved by vertex equality against the replaced formula, not by a pixel diff; no owner visual look was taken (`owner_validation.required: false`).
- The path vertex near Earth is on screen only in the Sun-focus cases; the focused-Earth close-up has no measurable vertex.
- A rolling span's source is not probed at validation time (no fixed start); an unusable source throws on first sync.
- Observation 3 of C-018 (re-shifting trails): relative trails are shifted once per scene centre or scale (cached), inertial trails compute root-frame samples once per sampling and add one resolver call per frame; orbits add one resolver call per frame.
- `.gitignore` shows an uncommitted edit (ignoring `docs/evidence/**/*.png`) that this session did not make; left untouched.

## Drift Notes

Architecture deltas for the integration Task (T-050) to reconcile into Design.md, each reflected or marked non-architectural:

1. `PathLayer` is a tagged intersection `PathRule & PathSpec & {object}`; `span` is `TimeBounds | RollingSpan {windowMs}` (not in design C.6): the Moon's monthly path needs a window about the clock time, so a rolling span is a generic part of the path, not a Moon special case.
2. Composition paths (`CompositionPath`) remain `{body, spanMs, samples}`; the scene turns each into an orbit `PathLayer` about the body's parent (`compositionPathLayer`) with a presentation `PathStyle` (opacity, depth test, layer, render order). `PathStyle` is presentation only and never reaches a rule.
3. Draw order: path lines have `renderOrder` 1, data dots 0 (I-020). Presentation rule, likely non-architectural.
4. The rule functions live in `src/app/pathRules.ts` (not in `PathView.ts`); `orbitPath.ts` is gone; `SIDEREAL_MONTH_MS` now only in `src/assets/compositions.ts`.
5. The resolver gives the root frame through `sunFrom` (negated for inertial trails); no `offsetKm(.., "sun")` literal is used, so a catalogue with a different root works.
6. `sunEarthSystem`'s doc comment still says drawing Earth's year is "the path Task's work"; the belt keeps declaring it as a `PathLayer`. No composition path added (outside this Task's boundaries); T-047 may declare it.

## Completion

- 2026-10-12T08:45Z — Task Check C-019 CLEAR; I-020 closed as verified. `status: done` set by the orchestrator under the owner's explicit delegation in chat on 2026-10-11 ("I authorise you to move tasks to Done once you have checked and are satisfied"), actor {role: owner-delegate, session: o014-orchestrator-check-20261012}.
