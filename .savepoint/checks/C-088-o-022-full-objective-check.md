---
id: C-088
scope: {kind: objective, id: O-022}
result: CLEAR
checked_by: {role: checker, session: o022-full-check-20261020}
executed_session: o022-run-20261020
checked_at: '2026-10-20T08:30:44Z'
health_snapshot: sha256:a25b5a14ad7ebff2cbc4193b1fbe4f7c18941627795c10b2f88ca482d424b0ae
reviewed:
  base_commit: 641a50c
  head_commit: 3f7cec5
  files:
    - src/app/scenePicking.ts
    - src/app/CameraController.tsx
    - src/app/AstraeusScene.tsx
    - src/app/SceneLabels.ts
    - src/app/BodySetLabels.ts
    - src/app/App.tsx
    - src/shell/AstraeusShell.tsx
    - tests/scenePicking.test.ts
    - tests/bodySet.test.ts
    - tools/validate/driver.mjs
    - tools/validate/browser-tap-focus.mjs
    - tools/validate/browser-jupiter-io.mjs
    - tools/validate/run-full.sh
    - docs/BROWSER_CHECKS.md
    - .savepoint/Design.md
  dependencies: []
issues: []
supersedes: null
---

# C-088: O-022 Full Objective Check

Scope: O-022 and its Tasks T-107 (done), T-108 (done), T-109 (in_progress, audit, owner validation required). Reviewed the committed diff 641a50c..3f7cec5 plus the uncommitted T-109 work and coordinator repairs in the working tree.

Independence: fresh checker session; built none of O-022; Task evidence, logs and coordinator notes treated as claims.

**Result: CLEAR.** Every Success Condition is proven by unit tests, code reading and the coordinator's browser runs at this check; gates pass fresh. Owner validation for T-109 (preview look) is still needed and is not part of this technical verdict.

## Owner decisions recorded as facts (2026-10-20)

- Per-Task Checks skipped; T-107, T-108, T-109 each carry a `check_waiver` (TEST-04 met). The owner authorised marking T-107 and T-108 done after build and tests passed.
- No browser runs at handoff; all browser runs happened once, at this check, run by the coordinator (`docs/evidence/o022-check-20261020T073626Z/`). Not rerun here, per instruction.
- The owner stopped `browser-jupiter-io.mjs` (2026-10-20T08:27:35Z); it is not a required area script for this Check.

## Full Check Progress

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (lane advice not a feature here; nothing to evaluate)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: first run)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope lock

1. O-022 Success Conditions SC1-SC5, Confirmed Decisions 1-5, Task Done When criteria; Guardrails ARCH-01..04, TEST-01, TEST-03, TEST-04, STYLE; AGENTS.md scene-affecting gate (touched areas: lite, licence gate, tap-focus, moon-panel) and Browser regression maintenance rule.
2. Changed files listed in `reviewed.files`. Entry points: canvas pointer events (`attachOrbitGestures` + `onTap`), canvas `pointermove`/`pointerleave` hover, `pickCandidatesOf`/`pickTarget`/`hoverTarget`/`TapTracker`, `SceneControls.onPickObject` -> App `requestPick` -> shell `pickRequest` -> `pickObject`, Developer > Labels hover slider, canvas readouts `data-pick-target`/`data-pick-hover`.
3. Relied-on: `bodyScreenReadouts` (scale-aware via `drawnRadii(policy)`, positions from render-space groups, so floating-origin-relative), `SceneLabelLayer` placement, `focusPresetFor`/`activatePreset`, story/feature marker `pointerdown` `stopPropagation`.
4. Matrix axes below; text-class, serialization and environment-sink axes not applicable (no text width, persistence or terminal output in scope).
5. Admission: supported paths in the three shipped demos and synthetic compositions; headless browser runs as recorded.

## Coverage matrix

| Row / cell | Evidence | Result |
|---|---|---|
| SC1 disc hit, picker shows it | `tests/scenePicking.test.ts` "hits inside a body's disc"; run14 body taps earth x2, venus, jupiter x2, europa with picker check | Passed |
| SC1 label hit | unit "hits a shown label away from the disc"; run14 label taps moon (apollo phone), europa (jupiter phone) | Passed |
| SC1 label of a body not drawn in view (coordinator `labelOnly` repair) | unit "keeps a shown name a target when its body is not drawn in view"; code: only the tag answers (disc distance forced to infinity); unlisted/non-catalogued ids still excluded | Passed |
| SC1 hidden label | unit "ignores a hidden label"; `shownRects` cleared each update, only placed (non-overlapped) labels added | Passed |
| SC1 no information opened (Decision 1) | `pickObject` calls `activatePreset` only, never `setInfo`; run14 `infoOpen` false after every tap | Passed |
| SC2 small move tap / large move drag / out-and-back drag | unit TapTracker cases; run14 `dragAcross` on all six runs leaves picker and readout unchanged | Passed |
| SC2 pinch never a tap (either finger lifts) | unit "never counts a pinch"; run14 `pinchAt` on three phone runs | Passed |
| SC2 cancel; release without press; non-primary mouse button | unit cancel case; probe by reading: secondary button stored at NaN, `hypot(NaN) <= slop` is false so never a tap and never spoils | Passed |
| SC3 tolerance on sub-pixel body (mouse 10, touch 22) at boundary ±1/2 px | unit tolerance case | Passed |
| SC3 overlap: nearest wins, order-independent | unit overlap case (both orders) | Passed |
| SC4 ARCH-01 no experience names | grep of added `src` lines: no mission/experience names outside comments | Passed |
| SC4 ARCH-03 synthetic composition; tracked subject, orbit line, off-screen not targets | unit `pickCandidatesOf` synthetic frame (`probe`, `orbit-line`, `offscreen` excluded) | Passed |
| SC4 spacecraft not targets (Decision 2) | `bodyIdFor` returns null for any id outside the catalogue (spacecraft are tracked subjects), so neither disc nor label is a candidate | Passed (code + unit; not browser-scripted, see observations) |
| SC4 scales and floating origin | true-scale in browser on all three demos (Apollo and Jupiter offer only true-scale); solar-system scale (Showers) by construction: candidates read the same `bodyScreenReadouts(..., policy)` the scene publishes | Passed (see observation) |
| SC4 every demo | run14: Apollo, Showers, Jupiter-Io x laptop mouse 1280x720 and phone touch 375x667 | Passed |
| Marker priority over bodies | story and feature markers `stopPropagation` on `pointerdown` (`StoryMarkers.ts:75`, `FeatureMarkers.ts:180`); the canvas never sees the press, and an orphan `pointerup` returns null from `TapTracker` | Passed |
| Decision 3 hover: same rule, mouse only, pointer cursor, brightness setting 1-3 | unit "hover" cases (hover equals tap, touch/pen none, clamp/default/non-finite); run14 hover earth, europa, jupiter with `pointer` cursor then empty | Passed |
| Decision 4 one tap on set moon | `BodySetLabelLayer` tap path removed; run14 pasiphae one tap on both Jupiter sizes | Passed (listed branch only) |
| SC5 driver only, no screenshots | `tests/browserDriverGuard.test.ts` in the suite (passed); `browser-tap-focus.mjs` has no `screenshot(` | Passed |
| SC5 full run lists script; regression map | `run-full.sh` lane B `tap-focus`; `docs/BROWSER_CHECKS.md` "Tap to focus" table and moved two-tap scenario | Passed |
| Design reconciliation (T-109 #4) | Design.md Codebase Map row `scenePicking.ts` and Interfaces bullet cover every T-107/T-108 drift note | Passed |

## External-boundary matrix (headless Chromium via donor playwright-core, dev server)

Configured vs actual target: dev server `localhost:5479/app.html` and a fresh `ASTRAEUS_PUBLIC_BUILD=1` build, as logged. Startup ordering: one browser job at a time (log timestamps sequential). Unavailable dependency, timeout, cancellation: `browser-jupiter-io.mjs` runs killed or timed out in `places()` and are recorded as such, not as passes. Malformed response, redirect, retry, secret output: not applicable (no network calls beyond the local server; logs contain no secrets).

## Workflow and side-effect lock

Tap: pointerdown (capture, `TapTracker.down`) -> moves -> pointerup (`up` decides tap before `onPointerEnd`) -> `pickTarget` on last frame's candidates -> `data-pick-target` set -> `onPickObject` -> App state serial -> shell effect -> `activatePreset` (selection + camera) or, for an id absent from `experience.objects`, `onCameraRequest`. No State writes (ARCH-02). Failure cases: no hit -> nothing; unavailable object -> readout set, no focus (benign). Cleanup: effect teardown removes listeners and clears cursor and `data-pick-hover`.

## Gates (fresh, this session)

- `npm run typecheck`: exit 0 (08:28:32Z start).
- `npm run build`: exit 0.
- `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml`: 78 files, 1139 passed, 1 skipped; exit 0 (ended 08:29:06Z).
- `git diff --check 641a50c`: clean.
- Browser (coordinator, cited, not rerun; source mtimes all precede the runs): `run14-tap-focus.log` exit 0, `errors: []`, six demo x size runs; `browser-moon-panel.log` exit 0, zero console errors; `browser-lite.log` 26/26; `public-build-assets.log` 75 checked, no matches; `public-addresses.log` ok. Driver last edited 18:50:55 local, run14 at 18:52:18 local.

## Code Health

`savepoint health check O-022`: snapshot `sha256:a25b5a14…b0ae` (created). "Code Health does not block clearance." Coverage instance stale (optional); others no finding.

## File reality

Every file named in T-107, T-108, T-109 evidence exists. `driver.d.mts` unchanged as T-109 states. Evidence directory present with every log cited.

## Issues

None. No materiality actions required.

## Owner validation still needed

- T-109 #6: the owner's look on the preview (`localhost:5490`): tapping and dragging in Apollo 11, Showers and Jupiter at laptop and phone size, and the hover hand and name brightening (including the Developer > Labels slider's place at 375x667 and 1280x720).

## Observations (non-blocking)

1. **`browser-jupiter-io.mjs` phone branch edited, not run to completion.** The owner stopped this script and it is out of this Check's required set. The one O-022 behaviour it covers (one tap on a set moon) is asserted at both sizes by run14. Weaker supporting evidence: the first run's log fails in `places()` called from the `small-phone` run (script line 340), and `moons()` runs before `places()`, so the edited phone branch most likely passed for `phone` and `small-phone`; no notes were written, so this is inference. Under the Browser regression maintenance rule the scenario is mapped and replaced, so this is not a finding; the next full run (`run-full.sh` before release or merge) should confirm it.
2. **Unlisted set-moon branch unexercised.** In Jupiter-Io every body-set member is an `experience.objects` entry (`listed: false` for the small moons), so the shell's `onCameraRequest` fallback for ids absent from `objects` is reached by no shipped demo, no unit test and no browser run. Design's wording ("not Object-list entries fly through `onCameraRequest`") describes that generic branch; for Jupiter's small moons the path is `activatePreset`.
3. **Second scale in browser.** Only Showers offers a second scale (solar-system); run14 used each demo's default. Proven by construction (shared policy-aware readout), not by a browser run.
4. **Spacecraft taps not scripted** (they are not in `data-body-screen`); proven by `bodyIdFor` and the synthetic unit test.
5. **Two hover radii.** Body-set name hover uses `BodySetLabels.PICK_RADIUS_PX` 12 px while the shared cursor rule uses `MOUSE_TOLERANCE_PX` 10 px, so between 10 and 12 px a set moon's name can brighten without the hand cursor. Cosmetic; T-108 drift notes disclose the split.
6. `data-pick-target` is set even when the shell then declines (object unavailable at the current time). Readout semantics ("last picked") still hold.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth** — set-moon hover keeps its own 12 px radius (`src/app/BodySetLabels.ts` `PICK_RADIUS_PX`) beside the shared 10 px mouse tolerance (`src/app/scenePicking.ts:27`).
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**
