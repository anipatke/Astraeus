---
id: C-139
scope: {kind: objective, id: O-058}
result: NEEDS WORK
checked_by: {role: checker, session: o058-check-20261101}
executed_session: o058-run-20261101
checked_at: '2026-11-01T07:58:00Z'
health_snapshot: sha256:ac5e30ac98fa2426a05464beea690424fdcdbeb8fe0723b1431e5c5f74c70b97
reviewed:
  base_commit: bffe3f2f
  head_commit: 1d729c02
  files: [packages/astraeus/src/api/scene.ts, packages/astraeus/src/api/planPaths.ts, packages/astraeus/src/api/planBodies.ts, packages/astraeus/src/api/planGroups.ts, packages/astraeus/src/api/planStory.ts, packages/astraeus/src/api/planTimeline.ts, packages/astraeus/src/api/planViews.ts, packages/astraeus/src/api/planCamera.ts, packages/astraeus/src/api/assembleScene.ts, packages/astraeus/src/api/viewerLink.ts, packages/astraeus/src/api/viewerClock.ts, packages/astraeus/src/api/viewerViews.ts, packages/astraeus/src/api/viewerCamera.ts, packages/astraeus/src/api/viewerZones.ts, packages/astraeus/src/api/story.ts, packages/astraeus/src/core/storyPanels.ts, packages/astraeus/src/core/startView.ts, packages/astraeus/src/shell/storyPanels.ts, packages/astraeus/src/app/viewLink.ts, packages/astraeus/tests/scenePin.test.ts, packages/astraeus/tests/fixtures/scenePin.json, packages/astraeus/tests/viewerLinkPin.test.ts, packages/astraeus/tests/apiImports.test.ts, tools/api-rules.mjs, .savepoint/Design.md]
  dependencies: []
issues: [I-135, I-136]
unmet: [O-058/SC6-gates]
supersedes: null
---

# C-139: O-058 Full Objective Check

This is the mandatory Full Objective Check of O-058, "Split the scene builder and host link by concern" (G-016). It covers T-231 to T-239: `git diff main..HEAD`, from bffe3f2f to 1d729c02, 9 commits (0db0b36c..1d729c02), 35 files, +31444/-1104, of which the pin fixture is 29,024 lines. All nine Tasks are `done`, and each carries an owner `check_waiver` (run rules "Orchestrate the next one", session o058-run-20261101). That makes this Check the one technical gate.

**Independence.** This session did not plan, build or coordinate O-058, and it is not a lane (`git rev-parse --git-dir` = `--git-common-dir`). It wrote only these: gate outputs (`junit.xml`, `dist/`, temp folders), one official health snapshot, one browser evidence folder (`docs/evidence/browser-20261101T074525Z/`), temporary planted edits (each restored with `git checkout -- <file>`, and `git diff --quiet` confirmed it), this record, I-135 and I-136. It did not touch `docs/prds/`, `docs/research/`, the three modified G-012/G-013/G-014 `Release.md` files or the router. The `packages/astraeus-data/tsconfig.build.tmp.json` leftover named in the brief was not on disk when this Check started (`ls`: no such file), so there was nothing to leave.

**Verdict: NEEDS WORK.** The refactor is sound. Every move I checked keeps its code as it was, the public surface is byte-for-byte unchanged, and both pins were written against the old code and catch the planted behaviour changes they are meant to catch. Two gates of Success Condition 6 are red on this tree, though, and both trace to the split:

- **I-135.** `npm run test:full` failed twice in a row on the same API-06 test, which timed out. The split made the TypeScript scans that test runs about 1.5 times slower.
- **I-136.** The one `npm run check:browser` failed at `public-build-assets`. Moving the story-panel parser to `core/` created a new eager chunk that no page set lists.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (lanes and manifests are advice; not evaluated)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: initial Check)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock

1. **Criteria:** the O-058 Outcome; Success Conditions 1-6 (SC1 pin first, SC2 one planner per concern plus one assembler with the size limits, SC3 `ViewerLink` in four parts, SC4 parsers out of display code plus the import test, SC5 nothing public moves, SC6 gates and Design); each Task's Done When (T-231..T-239); the Boundaries ("same inputs, same definition, same errors and messages"); Guardrails API-01, API-02, API-05, ARCH-02, ARCH-04, ARCH-06, TEST-01, TEST-03, CODE-01 (Required or Guideline as listed) and STYLE-* (advisory). Release gates: `docs/agents/build.md` and `docs/agents/browser-policy.md`.
2. **Changed files:** `reviewed.files`, plus the nine Task records and the router. **Entry points:** the public `Scene` (every method, `camera.*`, `toDefinition`, the definition's `prepare` and `createMetrics`) and `ViewerLink` (every member, reached through `mount` and `AstraeusScene`); the re-exported parser names at `shell/storyPanels` and `app/viewLink`.
3. **Relied-on orchestration:** the planet-series load state (`planetSeriesLoaded`/`loadPlanetSeries`), Vitest with v8 coverage, the Vite/Rolldown production build and its load-budget page sets, the TypeScript program the API rule scans build, and the npm registry (`check:react-consumer`).
4. **Matrix axes:** for the scene, each concern's planner × {clean, planted behaviour change, message change, check-order change} × {planet series loaded, not loaded}. For the host link: lifecycle state {before attach, attached, detached, re-attached, closed} × member × planted change. For the parsers: re-export identity and import rule. Gates: run on the tree. Not applicable: text classes, colour/TTY sinks and serialization round trips, because no text-width or output-mode behaviour changed.
5. **Admission boundary:** a reproducible change in output, error or order through a supported public path, or a failing release gate the Objective names, that the split caused. A difference that only shows when a scene is changed between `toDefinition()` and its own `prepare()`, or when a viewer control detaches inside its own call, is outside the supported path. Such a difference is an observation.

## Coverage Matrix

**How the probes ran.** Every plant went through `probes/run.sh` in the checker scratchpad. The script makes one exact replacement (it refuses unless exactly one occurrence matches), runs `npx vitest run <tests>`, restores the file with `git checkout --` and confirms the file is clean. Baseline with no plant: `P0-clean exit=0 | Tests 1 passed (1)`.

| # | Concern / part | Plant (checker's own) | Test | Expected | Actual | Result |
|---|---|---|---|---|---|---|
| 1 | timeline (`planTimeline.ts`) | clock default rate `?? 60` to `61` | scenePin | fail | `Tests 1 failed` | Pass |
| 2 | timeline | default rates `DAY_MS / 1000` to `/ 100` | scenePin | fail | failed | Pass |
| 3 | timeline | pacing base rate `?? 60` to `30` | scenePin | fail | passed | Observation O3 (pin gap) |
| 4 | groups (`planGroups.ts`) | `check` message "has not been added to the scene" to "is not in the scene" | scenePin | fail | failed | Pass |
| 5 | groups, series not loaded | `lateGroups` ignores `seriesIn` | scenePin | fail | failed | Pass |
| 6 | assembler (`assembleScene.ts`) | `groupPlan.check` moved before `story.panels` (check order) | scenePin | fail | failed | Pass |
| 7 | assembler | group metrics branch never taken | scenePin | fail | failed | Pass |
| 8 | assembler | `fault.error ??=` to `=` | scenePin | equivalent | passed (every out-of-span fault in one window has the same message) | N/A (equivalent mutant) |
| 9 | camera (`planCamera.ts`) | start view elevation `?? 30` to `31` | scenePin | fail | failed | Pass |
| 10 | camera | drop the eager `fitFarthestKm` read | scenePin | equivalent | passed (the read is lazy and memoised, so the same value) | N/A (equivalent mutant) |
| 11 | paths (`planPaths.ts`) | path cover factor `2 *` to `3 *` | scenePin | fail | failed | Pass |
| 12 | paths | `PATH_COVER_SAMPLES` 400 to 40 | scenePin | maybe | passed (the pinned path is monotone, so its farthest point is an end sample either way) | Observation O3 |
| 13 | paths, `"auto"` | auto stretches not resolved | scenePin | fail | failed | Pass |
| 14 | paths, `"auto"` | root body radius `Infinity` to `1` | scenePin | maybe | passed (the scene centre is the Sun, the same fallback) | N/A (equivalent in the pinned scene) |
| 15 | bodies (`planBodies.ts`) | label reach floor 500 to 501 | scenePin | fail | failed | Pass |
| 16 | bodies | Sun-orbit line colour default `""` to `"#fff"` | scenePin | fail | failed | Pass |
| 17 | bodies | moon loop `endFadeOn: false` dropped | scenePin | fail | failed | Pass |
| 18 | story (`planStory.ts`) | own event provenance always emitted | scenePin | fail | failed | Pass |
| 19 | views (`planViews.ts`) | resolved views get `panels: []` | scenePin | fail | failed | Pass |
| 20 | link publish order | zones before clock in `ViewerLink.publish` | viewerLinkPin | fail | `1 failed / 13 passed`: "reports change before zones …" | Pass |
| 21 | clock listener copy | iterate the live set | viewerLinkPin | fail | failed: "copies the listener sets …" | Pass |
| 22 | zones listener copy | iterate the live set | viewerLinkPin + 6 host DOM tests | fail | `Tests 73 passed (73)` | Observation O3 (pin gap; code read as unchanged) |
| 23 | rate source | `setRate(n)` sets `"scene"` | viewerLinkPin | fail | failed: "setRate takes only offered speeds …" | Pass |
| 24 | whenAttached | no re-arm on detach | viewerLinkPin | fail | failed | Pass |
| 25 | camera message | `setCamera` message text | viewerLinkPin | fail | failed | Pass |
| 26 | zone reset on attach | removed | viewerLinkPin | fail | failed: "a zone already active …" | Pass |
| 27 | host publish after `setView` | removed | viewerLinkPin | fail | failed | Pass |
| 28 | `NOT_OPEN` message | text changed | viewerLinkPin | fail | `2 failed` | Pass |
| 29 | zone `via` | always `"time"` | viewerLinkPin | fail | failed | Pass |
| 30 | **pins describe the old code** | main's `scene.ts` and `viewerLink.ts` put back over HEAD's (`git show main:… >`), then restored | scenePin, viewerLinkPin, viewerHostDom, eventZonesDom, hostCameraDom | pass | `M1 exit=0`, `Tests 59 passed (59)` | Pass |
| 31 | pin written first | `git show --stat 0db0b36c` (T-231) | | test and fixture only | only `scenePin.test.ts`, `fixtures/scenePin.json`, the T-231 record and the router; `git diff 0db0b36c HEAD -- scenePin.*` empty | Pass |
| 32 | viewerLinkPin written first | committed with the split in 38d69419 | | passes on old code | row 30 shows it passes against main's `viewerLink.ts` | Pass |
| 33 | "moved as-is" (scene) | normalised-line comparison of main `scene.ts` with HEAD `scene.ts`+`plan*.ts`+`assembleScene.ts`, plus reading every moved body against main | | only field-to-parameter renames | function bodies, message texts and the check order in `assembleScene` (empty, data, group readouts, moon paths, Sun-centred, solar-system scale, readouts, span, auto, fit, Sun paths, panels, groups, layers, event objects) all match main lines 781-860. Differences: renames; `catalogue` passed as a value to `autoPaths`/`fitFarthestKm` instead of read live (O4); a duplicated `return definition;` (`assembleScene.ts:161-162`, O5) | Pass |
| 34 | "moved as-is" (link) | read the four parts against main `viewerLink.ts` | | same | same bodies, messages and order. Host publish now reads `#access.open("publish").read()` after the call rather than the control captured before it (O4) | Pass |
| 35 | "moved as-is" (parsers) | sorted-line diff of main `shell/storyPanels.ts` and `app/viewLink.ts` against core+old paths | | imports and exports only | only import/export lines; `MAX_ELEVATION_DEG`/`wrapAzimuth` gained `export` | Pass |
| 36 | api import rule | the builder's plant re-read; the regex reads type-only, side-effect, export-from and dynamic imports (test case) | apiImports | fail on plant | the test file asserts the plant fails; it passes on the tree | Pass (bypass via a nested `api/` subfolder: O6) |
| 37 | nothing public moved | `git diff --exit-code main -- packages/astraeus/api-surface.lock.json packages/astraeus-site/tests/` | | empty | empty; `--diff-filter=M` on `*.test.ts(x)` empty; no D/R files; no CHANGELOG change; `index.ts`, `mount.ts`, `AstraeusScene.tsx` unchanged | Pass |
| 38 | sizes | `wc -l` | | scene.ts < 450, splits ≤ 300, link parts ≤ 150 | scene 350; planBodies 209, planPaths 204, assembleScene 173, planCamera 124, planGroups 85, planTimeline 65, planStory 49, planViews 30; viewerLink 146, viewerClock 72, viewerZones 51, viewerCamera 42, viewerViews 19 | Pass |
| 39 | Done When greps (T-232..T-236) | each Task's `grep -nE` on `scene.ts` | | none | 0 / 0 / 0 / 0; no top-level `function` in `scene.ts` | Pass |
| 40 | cycles | `grep 'from "./scene"\|"./viewerLink"'` in `api/` | | type-only | every planner and part import back into `scene.ts`/`viewerLink.ts` is `import type` (erased at runtime) | Pass (see judgements) |
| 41 | full gate | `npm run test:full` twice | | pass | **failed twice** (API-06 timeout) | **Issue I-135** |
| 42 | browser gate | `npm run check:browser` once | | pass | **`public-build-assets exit=1`** (unlisted `storyPanels-*.js` chunk) | **Issue I-136** |

**External boundary.** The browser runner: the configured target (scratch public build plus preview servers) matched the actual target, and its servers started and stopped (logs `/tmp/astraeus-check-logs-lg4vec`). The failure was a files-only step, with no network involved. `check:react-consumer`: the registry answered, React 19.3.1 was installed and the server render worked. Redirect, timeout and secret-output cells are not applicable: nothing in O-058 touches them.

**Workflow lock (`toDefinition` then `prepare`).** The order is: checks (throw at once) → deferred reads into `fault` (`deferredRead`) → definition → `prepare`: throw the recorded fault → load the series when needed → span check → auto settle → late groups → late Sun paths → fit settle → `installData`. The independent oracle is the pin's `seriesNotLoaded` order (a fresh module graph per scene). Rows 5, 6, 8 and 13 mutate it. **Host link:** attach (reset clock and zones, resolve wait) → host call → publish change then zones → detach (re-arm) → close (clear listeners). The oracle is viewerLinkPin against a fake control. Rows 20-29 mutate it, and row 30 replays the old code.

## Acceptance Coverage

| Criterion | Status | Evidence |
|---|---|---|
| SC1 same output, pinned first | Proven | rows 1-19, 30, 31; the pin covers 27 scenes, about 190 error builds and both series orders (T-231 evidence, re-read in the test) |
| SC2 one planner per concern, one assembler, same check order, sizes | Proven | rows 6, 33, 38, 39 |
| SC3 `ViewerLink` in four parts, same lifecycle and members, `implements ViewerPort` | Proven | rows 20-29, 32, 34, 38; `viewerLink.ts:79` |
| SC4 parsers in `core/`, re-exported, api import test | Proven | rows 35, 36; `grep -rnE "shell/storyPanels\|app/viewLink" src/api/` empty; `core/storyPanels.ts` imports only `./trajectory`, and `core/startView.ts` imports nothing |
| SC5 nothing public moves | Proven | row 37 |
| SC6 gates | **Issue (I-135, I-136)** | rows 41-42; lint, typecheck, build, engine-alone, pack and the consumer checks pass |
| SC6 Design.md describes the layout; drift accounted (T-239) | Proven, with observation O7 | Codebase Map row and "Scene and host-link split (O-058)" paragraph; each T-231..T-238 note is listed as reflected or non-architectural |
| Every Task's Done When | Proven, except T-239's full-gate line (I-135) and the Objective's browser gate (I-136) | per-Task greps, lock diffs and pin runs above |

## Gates

All ran fresh on HEAD 1d729c02 on 2026-11-01. The tree was clean apart from the three untouched Release.md files, the untracked owner docs and this Check's records. Logs are in the checker scratchpad `gates/`.

| Command | Result |
|---|---|
| `npm run lint` | exit 0 (07:37:08-07:37:12Z) |
| `npm run typecheck` | exit 0 |
| `npm run build` | exit 0 (chunk-size warning only) |
| `npm run test:full` run 1 (07:37:20-07:38:36Z) | **exit 1**: `Test Files 1 failed \| 185 passed (186)`, `Tests 1 failed \| 2257 passed \| 1 skipped (2259)`; `apiRules.test.ts > settings mapping (API-06) > gives every setting …` `Test timed out in 5000ms` (5.558 s); API-05 scan case 4.442 s; no coverage written |
| `npm run test:full` run 2 (07:39:50-07:41:04Z) | **exit 1**: the same single failure (5.973 s; API-05 4.171 s) |
| `npm run check:engine-alone` | `engine alone: pass in 22.1 s` |
| `npm run check:pack` | `pack check: pass (14.5 s)` |
| `npm run check:node-consumer` | `node consumer: pass` |
| `npm run check:react-consumer` | `installed: react 19.3.1, react-dom 19.3.1; AstraeusScene rendered 60 characters on the server` / `react consumer: pass` |
| `git diff --check main..HEAD` | clean |
| `npm run check:browser` (once, 07:45:25-07:51:18Z) | **FAILED**: smoke, smoke-public-showers, planets-phone, meteor-shower, views, hello-scene, hello-react and public-addresses `exit=0` with `error-lines=0`; `public-build-assets exit=1` (I-136); total 354 s; evidence `docs/evidence/browser-20261101T074525Z/summary.txt` |

`npm test` (the configured `quality_gates.test`) is the same Vitest suite that `test:full` runs with coverage, so it was not run separately. Under the full load, scenePin itself took 5.5 s and 7.1 s, within its own 600 s limit (O3).

## Code Health

`savepoint health check O-058` ran after the full gate (07:52:14Z) and created snapshot `sha256:ac5e30ac98fa2426a05464beea690424fdcdbeb8fe0723b1431e5c5f74c70b97`. **"Code Health blocks clearance."** The block is `tests via vitest-junit: 1 failing` (I-135). Coverage failed to collect, which is a separate statement: no report exists because the failing run wrote none. Complexity, dependency vulnerabilities and duplication: no blocking finding. While the health check ran, I-135 was moved aside, because the tool refuses an Issue that names a Check not yet written. It was then put back unchanged.

## Issues

- **I-135** (defect, TEST-01, SC6): the API-06 settings-mapping test times out under `test:full`, twice in a row, with no coverage written. The scans build a TypeScript program per case. That costs more since the split added 12 `api/` files and 14 `src/` files: medians `errorBreaks` 236 to 392 ms and `addressParameters` 319 to 469 ms, main against HEAD, measured with `timescan2.mjs`. Line evidence: `tools/api-rules.mjs:148,262`, `apiRules.test.ts:101-104,164-167`, `vitest.config.ts:13`.
- **I-136** (defect, TEST-01, SC6): `public-build-assets` fails. The new `core/storyPanels.ts` chunk (`assets/storyPanels-BiQHMCgc.js`) is statically imported by the scene and planet-definition chunks of four app page sets, and none of them lists it (`load-budget.mjs:202-212`). The same step passed in C-137's run before the split.

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-135 | High (2 of 2 checker runs and the builder's first run) | Medium (the full gate is red and no coverage report is written; no product effect) | Medium | Fix now, strategically (scan once per file in `beforeAll`, as I-080 did), with two green full runs |
| I-136 | High (deterministic on this build) | Medium (the public-build gate is red; page sizes are within limits, so visitors see no change) | Medium | Fix now: list the chunk or change the split, and decide whether a fast test should catch an unlisted eager chunk |

## Judgements Asked For

- **The T-239 builder's 3 timeouts.** Yes, this is a reliability defect that needs an Issue (I-135). It reproduced on both of my runs. The API-06 and API-05 cases scan source that O-058 made larger, so "not caused by O-058" in the T-239 drift note does not hold for them. The showers frame-timing case did not fail in my two runs. That demo is outside O-058's diff, and I-083 already made that case best-of-five. It is an observation, not an Issue.
- **Type-only import cycles** (`planPaths`/`planBodies`/`planCamera` to `scene.ts`; the four link parts to `viewerLink.ts`). Acceptable. Guardrails has no import-cycle rule. Every back edge is `import type` and erased in the emitted JavaScript, so there is no runtime cycle or initialisation order to get wrong. The O-053 checks require the public input types to stay keyed to `scene.ts`. Design.md records the cycle as accepted.
- **"Moved as-is."** It holds for every function body, error code and message, the check order and the definition field order (rows 33-35). The only semantic differences are two capture-time changes that are unreachable on supported paths (O4) and one dead line (O5).

## Observations (non-blocking)

- O1. The showers frame-timing "indication only" test failed once in the builder's first full run and passed in both of mine. It is outside O-058's diff.
- O2. Each Task Check was waived by the owner. The coordinator marked every Task `done` while T-239's own full-gate Done When needed a rerun to pass, and no browser run happened before this Check, which the run rules intended.
- O3. Pin gaps (the code was read and is unchanged, so these are not defects): the zones listener-set copy (row 22), the pacing base rate when `timeline.rate` is unset (row 3) and the path-cover sample count on a monotone path (row 12) are not pinned. A later Objective that changes these would not get a failing test. Under the full load scenePin takes 5.5 to 7.1 s against T-231's "target under 5 s" (about 2 s alone).
- O4. Capture differences outside the supported path. `autoPaths` and `fitFarthestKm` now get the catalogue as it stands at `toDefinition()` rather than reading it live in `prepare`. They differ only if `addBodyFromElements` is called between a scene's `toDefinition()` and its own `prepare()`. `ViewerLink.#afterHost` reads the control again after the host call. If a control detached inside its own `seek`/`setRate`/`setView`, the host would get `missing-data` "publish: …" where the old code read the stale control.
- O5. `assembleScene.ts:161-162` has `return definition;` twice. The second is unreachable. Neither lint (complexity only) nor `tsc` flags it.
- O6. `apiImports.test.ts`'s pattern matches only `../app/` and `../shell/` specifiers, so a file in a nested `src/api/` subfolder (`../../app/…`) would pass. `api/` is flat today, and the O-053 scans assume it stays flat.
- O7. Design.md still says "`spanOf` in `api/scene.ts`" (O-044 paragraph). It now lives as `TimelinePlan.span` in `api/planTimeline.ts`, a stale name for the T-239 reconciliation to fix.

## Closure

NEEDS WORK. No Task retreats: all nine stay `done`. Remediation is a direct repair under I-135 and I-136 (issue-capture.md, Out-Of-Scope Repair), then a Full Objective re-check under this scope lock. The re-check needs two fresh green `test:full` runs, one `check:browser` run, and a new `savepoint health check O-058` that does not block. No owner decision (acceptance or exception) exists on O-058 to carry forward. Owner validation still needed: none for the refactor itself; the owner sees the result on the preview at the end.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [ ] STYLE-02 **One job per function**: `assembleScene` (`assembleScene.ts:84-163`) is still one 80-line function, carried over from `toDefinition` as-is by design.
- [ ] STYLE-03 **Test branches**: the zones listener copy and the pacing base-rate default have no pinning test (O3).
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs**: one commit per concern, but `assembleScene.ts:161-162` keeps a duplicated, unreachable `return definition;` (O5).
