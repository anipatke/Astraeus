---
id: C-161
scope: {kind: objective, id: O-064}
result: NEEDS WORK
checked_by: {role: checker, session: o064-check-20261110}
executed_session: o064-run-20261110
checked_at: '2026-11-10T02:44:58Z'
health_snapshot: sha256:3278ffa6bb663291cb3c9acd036d826b066bfb5f389db0add686aabc499564ab
reviewed:
  base_commit: cdeea7d8
  head_commit: e6e6cd8b
  files: [docs/BROWSER_CHECKS.md, packages/astraeus-demo-apollo11/tests/missionScene.test.ts, packages/astraeus-demo-planets/src/experiences/planets/planetSettings.ts, packages/astraeus-site/src/main.tsx, packages/astraeus-site/src/synthetic/syntheticLookOutScene.ts, packages/astraeus-site/tests/syntheticScenes.test.ts, packages/astraeus-site/tools/validate/driver.mjs, packages/astraeus-site/tools/validate/journey-look-out.mjs, packages/astraeus-site/tools/validate/public-build-assets.mjs, packages/astraeus-site/tools/validate/run-browser.mjs, packages/astraeus/CHANGELOG.md, packages/astraeus/README.md, packages/astraeus/api-surface.lock.json, packages/astraeus/src/api/AstraeusScene.tsx, packages/astraeus/src/api/assembleScene.ts, packages/astraeus/src/api/index.ts, packages/astraeus/src/api/planCamera.ts, packages/astraeus/src/api/viewerCamera.ts, packages/astraeus/src/api/viewerHandle.ts, packages/astraeus/src/api/viewerLink.ts, packages/astraeus/src/app/App.tsx, packages/astraeus/src/app/AstraeusScene.tsx, packages/astraeus/src/app/CameraController.tsx, packages/astraeus/src/app/DeveloperSettings.tsx, packages/astraeus/src/app/experienceDefinition.ts, packages/astraeus/src/app/lookOut.ts, packages/astraeus/src/app/sceneCamera.ts, packages/astraeus/src/app/sceneFrame.ts, packages/astraeus/src/app/sceneFraming.ts, packages/astraeus/src/app/viewHiding.ts, packages/astraeus/src/app/viewLink.ts, packages/astraeus/src/app/viewerPort.ts, packages/astraeus/src/core/startView.ts, packages/astraeus/src/shell/AstraeusShell.tsx, packages/astraeus/src/shell/ObjectControls.tsx, packages/astraeus/src/shell/experience.ts, packages/astraeus/src/shell/objectModel.ts, packages/astraeus/src/shell/topBarIcons.tsx, packages/astraeus/tests/domMenuAndLink.test.ts, packages/astraeus/tests/hostCameraDom.test.ts, packages/astraeus/tests/lifecycle.test.ts, packages/astraeus/tests/lookOut.test.ts, packages/astraeus/tests/lookOutMenuDom.test.ts, packages/astraeus/tests/publicApi.test.ts, packages/astraeus/tests/sceneFrame.test.ts, packages/astraeus/tests/sceneInputCopies.test.ts, packages/astraeus/tests/smallSettings.test.ts, packages/astraeus/tests/viewFrame.test.ts, packages/astraeus/tests/viewerLinkPin.test.ts, tools/gate-limits.json, .savepoint/Design.md]
  dependencies: []
issues: [I-162, I-163]
unmet: [O-064 SC2 bad input throws bad-camera at the call, API-04]
supersedes: null
---

# C-161: O-064 Full Objective Check

**Verdict: NEEDS WORK, on one small input check.** The sky view works as specified: the camera stands at a body's centre, pans and zooms by field of view within 5 to 100 degrees, hides the body stood in, reads and restores both kinds of camera reading, carries a sky reading in the share link, and the camera menu offers "Look out from" only for listed bodies. All nine gates and the browser check (with its new `look-out` step) pass; Code Health does not block; Design accounts for every drift note. One Issue holds the verdict: the opening call `scene.camera.lookOut` quietly fills in a half, empty or misspelt direction (and ignores a misspelt `fov` key) where `setCamera` refuses the same shapes with `bad-camera` (I-162). A separate follow-up, outside this Objective, records the `setTimeline` rate-unit trap the owner hit during the T-293 look (I-163; not material to O-064).

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (not a feature here; nothing to evaluate)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: first Check)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock

1. **Criteria.** O-064 Success Conditions SC1 (stand at any body, pan, field-of-view zoom 5..100 opening 60, stood-in body hidden, directions right in every scale), SC2 (host opening, `setCamera` look-out by star-map position or object, read/hear sky reading, `bad-camera` at the call, `up` choice), SC3 (two kinds of reading, round trip, share link sky form, API-06), SC4 (menu entry only for listed bodies, Focus/Follow/Overview/orbit `setCamera` leave, phone first), SC5 (lock, README, CHANGELOG, Design reconciled, one `check:browser`, owner look); the Owner Decisions in Objective.md; T-291, T-292, T-293 Done When; Guardrails ARCH-01, ARCH-02, ARCH-03, ARCH-06, API-01..API-07, CODE-01, CODE-02, TEST-01, TEST-03; AGENTS "Deferred Design reconciliation" and "Strategic fix first"; gates per `docs/agents/build.md` and the browser policy.
2. **Changed files and entry points.** `git diff cdeea7d8..e6e6cd8b`, files in `reviewed.files`. Entry points: `scene.camera.lookOut`, `scene.camera.setStartView` (sky pose), `scene.camera.setLookOutChoices`, `handle.setCamera` (`LookOutTarget`, sky pose), `handle.camera`, `onCameraChange`, `<AstraeusScene camera>`, the `?view=` share link (`parseView`/`formatView`/`viewFromSearch`), the camera menu presets (`cameraPresetsOf`), the internal frame stages (`applyLookOut`, `leaveLookOut`, `poseCamera`, `lookOutFar`, `hiddenOf`), gestures (`panLookOut`, `zoomLookOut`), readout (`skyViewOf`).
3. **Relied-on orchestration.** The host-call slot (`hostCameraRequest`, O-061), `cameraTargets()` (view-hidden objects), the one hidden set read by visibility, labels, taps and story markers, `orbitAnglesFor`/`orbitBasis` about the up in force, `eqjToRenderVector`, logarithmic depth (near 1e-3 with a large far).
4. **Matrix axes.** Entry point (above) x input shape (normal, missing, half pair, empty, array, extra key, misspelt key, wrong type, non-finite, boundary 5/100 fov and ±90 dec, ra wrap) x state (orbit, looking out, leaving by focus/follow/overview/pose/hold, opening vs host call, up change) x representation (pose object, share-link text, Developer readout, browser readout) x body (Earth, Mars, made-up ids) x viewport (1280x720, 375x667). Text classes and output sinks: not applicable (ids are passed through `encodeURIComponent`; no width or terminal output in scope).
5. **Admission boundary.** Supported public calls and the visitor menu; Issues only against the criteria above. Rate units in `setTimeline` are outside the lock (not changed by O-064); recorded as follow-up I-163, not as a blocker.

## Coverage Matrix And Outcome Coverage

Independent harness: `o064.probe.test.ts` and `extra.probe.test.ts` in this session's scratchpad (`.../scratchpad/probe/`, own Vitest config, imports repo source by absolute path; nothing written to the repo). 95 + 1 cases. Oracle for directions: the textbook RA/Dec unit vector written in the harness, compared by angular separation.

| Row | Case | Expected | Actual | Class |
|---|---|---|---|---|
| SC1 direction | `eqjUnitVector` at 7 RA/Dec incl. dec ±89 | textbook vector to 1e-12 | match | Proven |
| SC1 direction | render angles -> `skyViewOf` round trip, equatorial and ecliptic up, 7 directions | separation < 0.02° | all < 0.02° | Proven |
| SC1 pan | 50 drags up/down at fov 100 | elevation stops at ±89° | ±89° | Proven |
| SC1 pan | one viewport-height drag at fov 40 | turns 40° | 40° | Proven |
| SC1 zoom | factor 100 and 1e-6 | clamped 100 / 5 | 100 / 5 | Proven |
| SC1 far plane | `lookOutFar` empty / near body / body at 23,400 | keep far / keep / 1.5 x 23,400 | as expected | Proven |
| SC1 hide, scale | `tests/lookOut.test.ts`, `tests/sceneFrame.test.ts` ("look out through the frame stages", "draws out to the farthest body while looking out"); browser step: Earth then Mars not drawn while stood in, drawn again after Focus | hidden then shown | pass (gate and browser) | Proven |
| SC2 setCamera | 18 bad shapes through `ViewerCamera` with a fake control (body = direction, empty, unknown, hidden, half pair, both forms, extra keys, array, null, fov string/4/Infinity, mixed orbit keys) | `bad-camera`, nothing sent | all | Proven |
| SC2 setCamera | object direction, flat sky pose, no direction while looking out / from orbit | request sent; keeps ra/dec 200/-40; else 0/0 | as expected | Proven |
| SC2 opening | unknown body, fov 4/101, direction null/string/dec 91, undefined body, Mars ref, sky start view with unknown body or extra `distance`, last call wins, failed call keeps prior pose | `unknown-body` / `bad-camera` / accepted | as expected | Proven |
| SC2 opening | `direction: { raDeg: 10 }`, `{ decDeg: 10 }`, `{}`, `[]`, `{ ra, dec }`, extra key; `look` `{ fov: 40 }`, `"x"`, `null`; `fovDeg: null` | `bad-camera` (as `setCamera`) | accepted, filled with 0 / 60 | **Issue I-162** |
| SC2 both paths | `tests/lifecycle.test.ts` look-out cases on mount, AstraeusScene, StrictMode | pass | pass (gate) | Proven |
| SC3 validation | sky reading at dec ±90, fov 5/100 accepted; ±90.0001, 4.9999, 100.0001, NaN, Infinity, string, empty id, missing fov, extra key, `distance` refused; ra -10/360/720.5 wrap; input mutated after check | as stated | as stated | Proven |
| SC3 share link | 3 round trips incl. encoded id; 8 malformed texts (`SKY`, empty part, 6 parts, dec 95, fov 3, bad %, empty id, non-number) refused by `parseView` | refuse | refuse (via `viewFromSearch` `%E0` is already decoded by `URLSearchParams`, as for an orbit link; an unknown id then opens the scene's own view) | Proven |
| SC3 orbit | orbit link text parses unchanged | unchanged | unchanged | Proven |
| SC4 menu | choices dedupe; `lookout-earth` after Focus/Follow; none by default; non-list `bad-camera`; unknown or null id `unknown-body` | as stated | as stated | Proven |
| SC4 leave | `tests/lookOutMenuDom.test.ts`, `lookOut.test.ts`; browser: Mars entry pressed, Focus returns to orbit and unpresses | leave sky view | pass | Proven |
| SC4 layout | browser `cameraEntryFit` at 1280x720 and 375x667 | inside window, no overlaps, >= 24 / 44 px | pass | Proven |
| SC5 docs | CHANGELOG "Unreleased" states `CameraPose = OrbitPose | SkyPose` as a type-level change with the one-line check `if ("lookOut" in pose) … else … pose.distance`; README rows for `lookOut`, `setStartView`, `setLookOutChoices`, `setCamera`, `camera`, `<AstraeusScene camera>`, `onCameraChange`; API lock, reachable-type check and public-type lint in `npm test` | present and passing | present and passing | Proven |
| SC5 Design | "The sky view (O-064, …)" paragraph and Codebase Map row vs every Drift Note of T-291, T-292, T-293 | each reflected or marked non-architectural | each accounted (T-293 accounting list checked line by line; `lookOutFar` repair also reflected) | Proven |
| SC5 owner look | T-293 Owner Validation 2026-11-10T02:36:42Z: "looks good go" after the repair | recorded | recorded | Proven |
| ARCH-06 | added lines in `src/api/` naming a body | none outside doc examples | only `@example`/doc comments; `apiRules` passes | Proven |
| ARCH-03 | tests use Mars, Moon and made-up ids, not only Earth | yes | `lookOut.test.ts` (Earth, Mars), `lifecycle.test.ts` (Mars, Moon), `lookOutMenuDom.test.ts` (Earth, Mars, Moon) | Proven |
| ARCH-02 | sky view is camera state only | no State change | `OrbitCameraState.lookOut`, no State touched | Proven |

Finite external-boundary matrix: the browser runner (dev server, public build, packed examples) is exercised by `check:browser` (servers started and stopped by `run-browser.mjs`; exit 0, error-lines 0 per step); redirect, timeout and secret-output cells are not applicable (no network calls or secrets in the scope). Workflow and side-effect lock: not applicable beyond the camera request order (host slot then frame stage), which `lifecycle.test.ts` and `sceneFrame.test.ts` exercise; no persistence, transactions or artifacts.

## Commands And Results

All times UTC, wall clock, run once each from `/home/user/code/Astraeus` at e6e6cd8b.

- `npm run lint` 02:37:24Z, 4.2 s, pass.
- `npm run typecheck` 02:37:28Z, 6.0 s, pass.
- `npm run build` 02:37:34Z, 2.3 s, pass (chunk-size warning as before).
- `npm run test:full` 02:37:36Z, 70.3 s, pass: 238 files, 3,408 passed, 2 skipped; statements 93.09 %; fresh `coverage/coverage-final.json` and `junit.xml`.
- `npm run check:engine-alone` 02:38:47Z, 23.2 s, pass.
- `npm run check:pack` 02:39:10Z, 14.5 s, pass.
- `npm run check:node-consumer` 02:39:24Z, 4.8 s, pass.
- `npm run check:react-consumer` 02:39:29Z, 8.8 s, pass (react 19.3.1).
- `npm run check:browser` (once) 02:40:19Z to 02:44:30Z: all eleven steps exit 0, error-lines 0, total 252 s (limit 320 s); `look-out` 16 s (limit 30 s); evidence `docs/evidence/browser-20261110T024019Z/`.
- `savepoint health check O-064 .` 02:44:35Z: snapshot `sha256:3278ffa6bb663291cb3c9acd036d826b066bfb5f389db0add686aabc499564ab` (created), "Code Health does not block clearance"; complexity, duplication, vulnerabilities no finding; coverage and tests "stale" (optional, non-blocking; the gates after `test:full` and the browser run's public build wrote files newer than the reports; no source changed).
- `git diff --check cdeea7d8..HEAD`: one blank line at end of the T-293 Task file (record only; no code).
- Probe harness: 95 cases, 93 passed; the two failures are I-162 and a probe-design artifact (see SC3 share-link row). `savepoint resume`: loads.

## Issues

- **I-162** (T-292): `scene.camera.lookOut` accepts a half, empty, array, misspelt or extra-key `direction`, an unknown `look` key and a non-object `look`, filling in 0 / 60; `setCamera` refuses the same shapes with `bad-camera`. Violates SC2 and API-04. `packages/astraeus/src/api/planCamera.ts` line 63.
- **I-163** (follow-up, outside the scope lock, not material to O-064): `setTimeline` silently takes a rate in milliseconds (the T-293 synthetic scene's `rate: DAY_MS`, which hid the Sun at the owner's first look). Captured under "Strategic fix first" for a planner to choose the general rule.

## Materiality

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-162 | Low: TypeScript's `SkyDirection` needs both fields; JS callers and data-driven directions reach it | Low: the scene opens pointed at the wrong place, silently; easy to see, no data harm | Low | Fix now: route the opening through the same direction check as `setCamera`, add the shapes to `lifecycle.test.ts`; small change, then a targeted re-check (the gate and browser runs here would need a fresh `npm test`/full gate, not a new browser run unless the browser scripts change) |
| I-163 | Medium: the units differ within one call | Low to Medium: clock runs to the end at once; looks broken | Low for O-064 (out of scope) | Defer to named follow-up work; planner picks throw vs warn |

## Observations (non-blocking)

1. Picking another object in the picker while looking out keeps the sky view (T-293 judgement in Drift Notes and Design; owner looked and approved). The success conditions list only Focus, Follow, Overview and an orbit `setCamera` as ways out, so this is consistent.
2. The menu's "Look out from" entry always turns to right ascension 0, declination 0, so choosing it again while already looking out from that body resets the direction; documented in README.
3. `handle.setCamera({ lookOut: body })` (no direction) from orbit looks toward RA 0, Dec 0, not toward what the orbit camera faced; documented.
4. The opening `scene.camera.lookOut` takes a star-map position only (no object id), by design (Design item 4).
5. A share link with a sky reading for an unknown body opens the scene's own view, as an unknown orbit link does.
6. Real touch drag and pinch feel is not measured headless (the browser step drives one wheel turn on desktop); the pure pan and zoom maths are proven above, and the owner looked.
7. `git diff --check`: trailing blank line at the end of `T-293-…md`.

## Owner Validation Still Needed

- None for O-064's behaviour: T-293's owner look is recorded ("looks good go", 2026-11-10T02:36:42Z).
- I-162: a direct repair, then a targeted re-check.
- I-163: the owner or planner decides when and how (throw or warn) — not needed to close O-064.

## Prior Owner Decisions

First Check on O-064: no prior Check-linked acceptance or exception to carry forward. The Objective's Owner Decisions are honoured: app and visitor both enter the sky view; a sky spot is a star-map position or an object, no ecliptic-longitude input; two kinds of reading, with the type-level change in the CHANGELOG; field of view opens at 60 within 5..100, stood-in body hidden, menu choices default to none. All three Tasks carry the owner's recorded `check_waiver`.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [ ] STYLE-06 **Handle errors at boundaries** — `scene.camera.lookOut` fills missing direction parts before validating (`planCamera.ts` line 63; I-162).
- [ ] STYLE-07 **One source of truth** — the opening and `setCamera` each check a look-out direction their own way (`planCamera.ts` 59-64 vs `viewerCamera.ts` `lookDirection`), which is how they diverged.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**
