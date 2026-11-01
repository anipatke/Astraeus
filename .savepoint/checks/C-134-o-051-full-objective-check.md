---
id: C-134
scope: {kind: objective, id: O-051}
result: NEEDS WORK
checked_by: {role: checker, session: o051-check-20261101}
executed_session: o051-run-20261101
checked_at: '2026-11-01T00:30:00Z'
health_snapshot: sha256:82c3816039bc01279fe8c334f7f90601a7beb640ba04dc0160ca17fed8626cd9
reviewed:
  base_commit: a8af72b9
  head_commit: db67f14f
  files: [packages/astraeus/src/api/views.ts, packages/astraeus/src/api/scene.ts, packages/astraeus/src/api/errors.ts, packages/astraeus/src/api/index.ts, packages/astraeus/src/api/mount.ts, packages/astraeus/src/api/viewerLink.ts, packages/astraeus/src/api/AstraeusScene.tsx, packages/astraeus/src/app/views.ts, packages/astraeus/src/app/viewHiding.ts, packages/astraeus/src/app/App.tsx, packages/astraeus/src/app/AstraeusScene.tsx, packages/astraeus/src/app/sceneFrame.ts, packages/astraeus/src/app/sceneCamera.ts, packages/astraeus/src/app/CameraController.tsx, packages/astraeus/src/app/StoryMarkers.ts, packages/astraeus/src/app/viewerPort.ts, packages/astraeus/src/app/experienceDefinition.ts, packages/astraeus/src/shell/AstraeusShell.tsx, packages/astraeus/src/shell/DisplaySwitches.tsx, packages/astraeus/src/shell/TopBar.tsx, packages/astraeus/src/shell/viewCamera.ts, packages/astraeus/src/synthetic/syntheticViewsDefinition.ts, packages/astraeus-site/src/main.tsx, packages/astraeus-site/vite.config.ts, packages/astraeus-site/tools/validate/engine-budget.mjs, packages/astraeus-site/tools/validate/load-budget.mjs, packages/astraeus-site/tools/validate/public-build-assets.mjs, packages/astraeus-site/tools/validate/journey-views.mjs, packages/astraeus-site/tools/validate/driver.mjs, packages/astraeus-site/tools/validate/runner.mjs, packages/astraeus-site/tools/validate/run-browser.mjs, tools/check-packs.mjs, tools/check-node-consumer.mjs, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, .savepoint/Design.md, docs/BROWSER_CHECKS.md]
  dependencies: []
issues: [I-129]
unmet: [O-051 Host control (AstraeusScene view prop), O-051 In the viewer (time, speed carry over on a host switch), T-220 Done When 2]
supersedes: null
---

# C-134: O-051 Full Objective Check

This is the mandatory Full Objective Check of O-051, "Switch between views inside the viewer". It covers T-218 to T-221 and I-124. The diff is `git diff a8af72b9..HEAD` (plan commit to `db67f14f`, 72 files, +3065/-119). The owner waived every per-step Task Check under the run rules, and each Task records `check_waiver`. This Check is the one gate.

**Independence.** This session did not plan, build, repair or coordinate O-051. It wrote only these things:
- gate outputs (`coverage/`, `junit.xml`, `dist/`, packed tarballs, example builds);
- one official health snapshot;
- one browser evidence folder, `docs/evidence/browser-20261101T000803Z/`;
- four throwaway probes: three test files, each copied into `packages/astraeus/tests/`, run with plain `npx vitest run` after `test:full` and the health snapshot, then deleted, plus one node script run from the scratchpad (sources and logs in the checker scratchpad `probes/`, the key outputs quoted below);
- this record and I-129.

Not a lane (`git-dir` = `git-common-dir`). `docs/prds/` and `docs/research/` were not read or touched. Times are UTC.

**Verdict: NEEDS WORK** on one Issue, I-129. The `AstraeusScene` React component applies `time`, `rate` and `view` together. Changing the `view` prop therefore seeks the clock back to the `time` prop, and changing `time` or `rate` undoes a visitor's view. Everything else in the Objective is proven:
- the API, membership and validation;
- the hiding stage and the shell lists;
- the camera rules and the stay hold;
- `mount`'s `view` / `setView` / `onChange`;
- the packed-package consumer, the browser journey, the docs and the Design reconciliation;
- the owner's pack and budget decisions, implemented as recorded.

All gates pass.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (advisory; nothing to evaluate, no finding)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: first Check of O-051)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock

1. **Criteria.** These are under test:
   - the O-051 Success Conditions: Views, In the viewer, Camera rule, Host control, Proof and Documentation;
   - the Architectural Considerations (ARCH-02 presentation only, resolve once, no `buildRuntime` rebuild, `switcher` untouched, `ViewerLink` pattern);
   - every Done When of T-218 to T-221;
   - Guardrails ARCH-01/02/03/06, TEST-01..04 and CODE-01/02, with STYLE advisory;
   - the release gates: `quality_gates`, `test:full`, `check:pack`, `check:engine-alone`, `check:node-consumer`, one `check:browser` and `git diff --check`;
   - the owner decisions recorded in the run, to be checked as implemented: the pack file count replaced by a stray-file rule (T-218), the split engine and demo load budgets (T-221), and the camera rule chosen per view with `stay` as the default (Objective).
2. **Entry points.** These were changed:
   - `Scene.setViews` and `Scene.toDefinition`, through `viewsOf` and `resolveViews` (`api/views.ts`);
   - `definition.views`;
   - `hiddenByView`, `experienceInView` and `viewById` (`app/viewHiding.ts`);
   - the `applyViewVisibility` frame stage, `shownUnderView` (labels, picks) and `StoryMarkerLayer.update`;
   - `App` (view state, `chooseView`, host attach);
   - `AstraeusShell` (`useViewSwitch`, `applyViewRule`), `presetForViewRule`, `ViewButtons` and `SwitchPanel` rows;
   - the `hold` camera request (`applyCameraRequest`, `cameraTargetAbsolute`, `switchFocus`, `rescaleCameraForPolicy`);
   - `ViewerLink.view` / `setView` / `publish`, `MountedScene.view` / `setView`, and the `AstraeusScene` `view` prop;
   - the synthetic views scene and the browser step;
   - `check-packs` `strayFiles`, and `engine-budget` with the `load-budget` own-share and the vite `engineShare` plugin;
   - the node consumer case, README, CHANGELOG, API reference sections, Design and BROWSER_CHECKS.
3. **Relied-on behaviour.** The Check relies on:
   - the existing camera request path (`controls.cameraRequest`, `stepCameraTarget`, `resolveCamera`);
   - the existing shell unavailable-object effect;
   - React effect ordering;
   - `measureBuild` (`tools/measure-example.mjs`);
   - the Rollup `renderedLength`;
   - Playwright and the dev and preview servers for the browser run.
4. **Matrix.** The axes and cells are below. Not-applicable cells give a reason.
5. **Admission boundary.** An Issue must break a named Success Condition, Done When item or owner decision, through a supported public path: `Scene` and `mount` as typed, the `AstraeusScene` props as documented, or the shipped viewer. Inputs the TypeScript types refuse, and mutation of inputs after a call, are observations.

## Coverage Matrix

Probes are in the checker scratchpad `probes/`:
- `zzCheckProbeApi.test.ts` (25 tests) and `zzCheckProbeDom.test.ts` (3 tests): logs `probe-run-1.txt` and `probe-run-3.txt`;
- `zzCheckProbeSun.test.ts`: log `probe-run-2.txt`;
- `budgetProbe.mjs`: log `budget-probe-out.txt`.

Each test file was run with `npx vitest run tests/<file> --reporter=verbose --silent=false` from `packages/astraeus` and deleted afterwards. Every test passed. The DOM probes print their findings, and those printed findings are what the cells below quote.

| # | Row | Cell | Expected | Actual | Class |
|---|---|---|---|---|---|
| M1 | membership | Shared bodies (earth, moon), a body named by one view (mars), a path in two views (pa), a path in one (pb), and an empty view `c` | earth and moon everywhere; mars only in a; pa in a and b; pb only in b; c shows only shared things | `[earth,moon,mars,pa]`, `[earth,moon,pa,pb]`, `[earth,moon]` (probe) | passed |
| M2 | membership | Events and panels the same way, plus an unnamed shared event and panel | `[ea,es]`, `[eb,es]`, `[es]`; panels likewise | Matches (probe) | passed |
| M3 | order and replacement | `setViews` before `addBody`/`addTrajectory`; a second `setViews` call | resolved at build; the later call replaces the first | `[true,false]`, then `["z"]` (probe) | passed |
| M4 | no views | Definition keys and experience compared with and without views | no `views` key; otherwise identical | Same keys, same experience JSON (probe). The full suite passes unchanged | passed |
| M5 | shape faults | Empty list, a non-list, duplicate id, missing or null options, place `"sidebar"`, `start` not a view, missing id, empty label, `paths` a string, an event id that is a number, camera with both follow and focus, camera `{}`, camera `null` | `bad-view` naming the view (index or id) and the field | All 13 match the expected messages, for example `view "a" paths must be a list`, `place must be one of top-bar, panel, got "sidebar"` (probe) | passed |
| M6 | build faults | Unknown path, a path id given under `bodies`, unknown event, unknown panel, a camera target the view hides, a camera target that does not exist; a camera on a shared body | `bad-view` at `toDefinition` naming the view, kind and id; the shared target is accepted | All match; the shared target gives no error (probe) | passed |
| M7 | mutable input | The caller edits the view list after `setViews` (duplicate id, empty label) | — | No error; the edited labels and ids are kept as `[["a","A"],["b","B"]]`, because `viewsOf` copied the views shallowly at the call. Its arrays (`paths` and the like) are still shared, but `resolveViews` re-checks every id | observation O1 |
| M8 | camera forms | `"stay"`, omitted, `"start"`, `{follow}`, `{focus}` | stay; stay; start; start with framing | The node consumer case and the probe (M1 cameras `{rule:"stay"}`) | passed |
| M9 | hiding rule | Hidden = ids some view shows and this one does not; ids no view's set holds are never hidden | as stated | Builder `viewFrame.test.ts` "what a view hides". Probe: mars hidden in `e`, earth kept, `m` hides nothing | passed |
| M10 | lines follow their body | A moon orbit line (composition path) and an orbit-set line follow their owner; Sun-orbit `partOf` objects leave the lists | as stated | Builder tests "lines follow the body they belong to" (3 cases). Code: `applyViewVisibility` `showOwned`. My Sun-centred probe scene made no `partOf` objects (`sun, earth, mars`), so it adds nothing beyond the builder test | passed (builder test plus code) |
| M11 | frame stage | Hides body groups, tracked, group, Sun-centred, composition, body-set and orbit-set groups from one set; nothing is rebuilt | as stated | `applyViewVisibility` runs once per frame in `runFrame`; `buildRuntime` is untouched by the diff; builder tests. Browser: each probe's line `visible` matches its view at both sizes | passed |
| M12 | labels, picks, markers | Hidden ids leave labels and picks; a marker is hidden when its object is hidden or all of its panels are | as stated | `shownUnderView` (code); builder story-marker test; browser `listedStoryPanelIds` per view | passed |
| M13 | shell lists | Object menu, events, panels, auto-open, info card: all read the one filtered experience | as stated | `App` passes `experienceInView` into `withSkyObject` and then the shell; `useStoryPanels` reads `experience.storyPanels`. Builder `viewsDom.test.ts`; browser menu and events per view | passed |
| M14 | clock kept (visitor and `mount` host) | Time, rate and playing are the same before and after a switch | unchanged | Builder DOM test; browser at both sizes (clock and speed equal after b, both, a; host `setView` clock equal) | passed |
| M15 | **clock kept (React host)** | `<AstraeusScene view time>`: change only `view` after the clock ran 3,000 s | the time stays | **The clock jumps back to the `time` prop**: before `time 1893459001000`, after `1893456001000`, `view b, cause host` (probe) | **Issue I-129** |
| M16 | **React prop once and on change** | `<AstraeusScene view="a" time>`; a visitor picks b; the app changes `time` only | b stays | **The view goes back to a** (`cause: "host"`, b `aria-pressed=false`) (probe) | **Issue I-129** |
| M17 | camera stay | Followed object hidden: hold request; following stops; card closes; the pose is held while the clock runs | as stated | Builder `viewCameraDom` stay cases (`{kind:"hold"}`) and the `sceneCamera` hold tests (target fixed while the object moves 90 → 5000; release on the next focus or the same id; rescale). Browser: Earth's projected centre unchanged to 0.002 while playing at the fastest speed (desktop 1.06,0.941 → 1.06,0.941; phone 2.284,0.861 → 2.284,0.861) | passed |
| M18 | camera start, follow, focus and untouched | `start` takes the scene's start preset, else the overview; `{follow}`/`{focus}` take that target; the camera is untouched when the object stays | as stated | Builder `viewCameraDom` (start, follow, focus, untouched for stay, start and follow, no request on open). Browser: follow probe b moves Earth on screen | passed |
| M19 | camera bypass paths | A focus from the scene's own start (`scene.camera.follow/lookAt`), a tap pick, a timeline event or the menu | each sets `activePresetId`, so the rule sees it | `startCameraPresetId` comes from `scene.camera` (`scene.ts:821`); `pickObject`, `seekToEvent` and `selectObject` go through `activatePreset`. Exception: a tap on a body-set member that is not a listed object asks for a focus with no preset. Body sets are not view members, so this is not reachable through a view | passed |
| M20 | `mount` host | `view` undefined before `ready`, after `unmount` and without views; `setView` unknown → `bad-view`, no views → `bad-view`, before or after → `missing-data`; `onChange` causes `host` and `visitor`; a repeat `setView` of the same id is silent; no `view` key without views | as stated | Builder `viewerHostDom` (4 cases), read against `viewerLink.ts:56-67,106-113`. Browser: the host hears `visitor` for b and `host` for `setView("b")` | passed |
| M21 | React prop errors | An unknown id, or no views → `onError` `bad-view` | as stated | Builder test | passed (but see M15/M16) |
| M22 | view choice UI | Top bar (`aria-pressed`, `.switch-control`), panel rows, phone drawer; fewer than two views draws nothing; no overlap at 1280x720 and 375x667 | as stated | Builder `viewsDom.test.ts`. Browser `viewChoiceFit`: inside the window, no overlaps, smallest button 36 px on desktop and 44 px on phone | passed |
| M23 | packed package | Two made-up probes, a shared body, three views, faults | as stated | `check:node-consumer` 8 passed (the views case asserts the membership, cameras and seven faults) | passed |
| M24 | stray-file rule (owner) | No astraeus file count; a stray file fails by name; byte limits kept | as stated | `check:pack` prints `482 files (no count limit; stray-file check)`, 7.17 / 9.25 MB within 8.0 / 9.5. The planted stray test passes in `test:full` | passed |
| M25 | budget split (owner) | Engine growth trips only the engine; demo growth only the page; a mixed chunk is shared in proportion; a missing sidecar fails by name | as stated | Builder `proveEngineDemoSplit`. My independent mixed-chunk probe: engine 3,000 → 30,000 in a mixed chunk keeps the own share at 4,013 (ok); demo +1,500 gives own 5,513 over 5,000 (fail, named); no sidecar fails with "engine-share.json is not in the build". Real run: engine 1,652,588 / 472,895 within 1,735,000 / 497,000; every page within its own-share limit (Apollo 4,036,027 of 4,240,000 …) | passed (see O3) |
| M26 | first-download line | The CHANGELOG figure | measured | `node tools/measure-example.mjs`: first-open 1,652,588 raw / 472,895 gzip, the same as the CHANGELOG | passed |
| M27 | ARCH-01/06 | No body or mission names in `api/views.ts`, `viewHiding.ts` or `viewCamera.ts`; defaults come from the scene | none | Read; the body-name check passes in `test:full` | passed |
| M28 | ARCH-02 | State and `stateOf` unchanged; a hidden object keeps its state | unchanged | The diff touches no `core/` State; hiding only sets `group.visible`; the hold is scene-frame camera state | passed |
| M29 | `switcher` untouched | The existing address switcher is not changed | unchanged | `switcherOf` and `SwitchControl` are not in the diff | passed |
| M30 | docs and Design | README rows and section, API reference sections, CHANGELOG, Design paragraph for every Drift Note, BROWSER_CHECKS | present | All present; each Drift Note is in Design or marked non-architectural with a reason (T-221 list checked against T-218..T-220 notes) | passed (see O2) |

Not applicable:
- text classes (labels are caller text, with no width or truncation rule in scope);
- terminal and redirected sinks (none in scope);
- serialization round trips (views are not serialized past `toDefinition`, and a view is not in the address by design).

## Finite External-Boundary Matrix

| Cell | Classification |
|---|---|
| Configured and actual runtime target | Browser: dev server for `synthetic-views`, preview for the public build, example previews; ports from the runner. Passed: every step exit 0 |
| Startup, discovery and reuse ordering | The runner builds the public build (with `ASTRAEUS_ENGINE_SHARE=1`) and then the example before `public-build-assets`. Passed (that step read the example build and the sidecar) |
| Connection refused or dependency unavailable | `checkEngineBudget` without an example build returns a named problem (code read). A load budget without the sidecar fails by name (probe M25) |
| Success and non-success responses | Not applicable: no network calls in scope |
| Redirects, timeouts, cancellation | Not applicable to the view code. The browser harness owns its own timeouts, which were unchanged except for the new step |
| Malformed response | Not applicable: the sidecar is written by our own plugin, and a malformed JSON throws in `readEngineShares` (an accepted developer-tool failure) |
| Retry, cleanup, partial effects | `proveEngineDemoSplit` cleans its temp folder in `finally`. The browser evidence keeps only `summary.txt` and the `results.json` files |
| Secret-safe output | Not applicable: no secrets |

## Workflow And Side-Effect Check Lock

| Order | Operation | Side effect | Failure timing and owner | Final state | Oracle |
|---|---|---|---|---|---|
| 1 | `setViews` | Stores a shallow copy of the plan | Shape fault throws `bad-view` at the call | The scene is unchanged on a throw | Probe M5 |
| 2 | `toDefinition`, `#viewsEntry` | Writes `definition.views` | Unknown id or hidden target throws `bad-view` before any definition is returned | No definition | Probe M6 |
| 3 | Mount, `App` | Opening view state, `controls.viewHidden`, host attach | — | Opens on `start` | Browser (opens on a; the host reads a) |
| 4 | Visitor switch, `chooseView` | `viewRef`, `viewHidden` replaced, `setViewId`, then publish `visitor` | — | New sets; the clock is untouched | Builder test and browser |
| 5 | Shell effect, `takeSwitchRule` | Selection fallback, card close, camera rule (request or hold) | Once per id change | — | `viewCameraDom` |
| 6 | Frame, `applyViewVisibility` | `group.visible` per id | — | Drawn state matches the set | Browser path readouts |
| 7 | Host `setView` | `#open` (missing-data), check id (`bad-view`), `chooseView`, publish `host` | A throw happens before any state change | Unchanged on a throw | `viewerHostDom`; `viewerLink.ts:60-67` |
| 8 | React props | One effect: `setTime`, then `setRate`, then `setView` | A throw in `setTime` skips the later two; **any of the three props changing re-applies all three** | **The clock or view is overwritten** | **Probe M15/M16, Issue I-129** |

## Gates (fresh, HEAD db67f14f, 2026-11-01 UTC)

Each command ran from the repository root. The logs are in the checker scratchpad as `gate-*.log`.

| Command | Result |
|---|---|
| `npm run lint` | pass |
| `npm run typecheck` | pass |
| `npm run build` | pass |
| `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml` | 172 files; 2131 passed, 1 skipped |
| `npm run test:full` | 172 files; 2131 passed, 1 skipped; coverage written |
| `npm run check:pack` | pass (astraeus 7.17 MB packed / 9.25 MB unpacked, 482 files, stray-file check) |
| `npm run check:engine-alone` | pass in 19.6 s (114 files, 1204 passed, 1 skipped) |
| `npm run check:node-consumer` | pass (8 tests) |
| `git diff --check a8af72b9..HEAD` | clean |
| `npm run check:browser` (once, 00:08:03-00:13:54) | All 9 steps exit 0 with 0 error lines, 351 s. `views` took 41 s; `public-build-assets` passed, with the engine budget ok, `engineSplitProof` true and every page within its limit. Evidence: `docs/evidence/browser-20261101T000803Z/`; logs: `/tmp/astraeus-check-logs-zNugRG` |
| `node tools/measure-example.mjs` | first-open 1,652,588 raw / 472,895 gzip |

## Code Health

`savepoint health check O-051` ran after the full gate and saved snapshot `sha256:82c3816039bc01279fe8c334f7f90601a7beb640ba04dc0160ca17fed8626cd9` (created). Its verdict was "Code Health does not block clearance". All five instances (complexity, coverage, dependency vulnerabilities, duplication, tests) are optional, and each reported "no blocking finding". The health verdict neither grants nor withholds clearance; the result here rests on I-129.

## Owner Decisions Assessed

- **The pack file count is replaced by a stray-file rule** (T-218, owner 2026-11-01): implemented as recorded (M24).
- **Engine and demo load budgets are split** (T-221, owner 2026-11-01): implemented as recorded (M25). See O3 for what "engine" counts.
- **The camera rule is chosen per view, with `stay` as the default** (Objective): implemented (M8, M17, M18).
- **T-221 owner look** ("Voyager is the real test, but this looks good", 2026-11-01T00:03:55Z): recorded in T-221 Technical Evidence. Owner validation acceptance and T-221 completion stay with the owner.
- Each Task carries an owner `check_waiver` (TEST-04 satisfied). No structured `exception` is recorded, so nothing carries forward.

## Issues

- **I-129** (medium): the React `view` prop moves the clock back, and other prop changes undo a visitor's view. It violates:
  - the O-051 Host control condition ("`AstraeusScene` gains a `view` prop");
  - the In the viewer condition (time and speed carry over when switching);
  - T-220 Done When 2 ("applied once drawn and on change");
  - the README row at `README.md:141`.

  Evidence: `packages/astraeus/src/api/AstraeusScene.tsx:58-67`, with probe M15 and M16. The missing test: `viewerHostDom.test.ts` never combines `view` with `time` or `rate`.

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-129 | Medium: needs a React app that passes `time` or `rate` together with `view`, which a host with its own scrubber or speed control and a view selector (the Voyager app's intended shape) will do | Medium: the clock jumps back on each host view switch, and the visitor's choice is reverted silently. No data loss; the `mount` path is unaffected | Medium | Fix now as a direct repair under I-129 (one effect per prop, with a regression test that changes one prop at a time), then a targeted re-check |

Route: a direct repair under I-129 (issue-capture.md). T-218 to T-220 stay `done`, and T-221 stays at `audit` for the owner. The re-check should reuse this scope lock and re-run M15, M16, M20 and M21, plus the gates.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [ ] STYLE-02 **One job per function**: `AstraeusShell`'s lost-target effect now mixes the view-switch rule with the time-availability fallback, behind an `eslint-disable` for exhaustive deps (`AstraeusShell.tsx:250-278`).
- [ ] STYLE-03 **Test branches**: the `AstraeusScene` prop effect's prop combinations are untested (I-129).
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs**: 72 files (+3065), but most are evidence JSON from two browser runs. The code part is 48 files (+1645), about 1,000 lines of which are tests.

## Owner Validation Still Needed

- The owner's acceptance of T-221 (`owner_validation.required: true`), its completion, and O-051 closure, after I-129 is repaired and re-checked.

## Non-blocking Observations

- **O1.** `setViews` copies the views shallowly at the call. A caller who edits the view objects afterwards can get a duplicate id or an empty label past the shape check, because `resolveViews` re-checks only the ids and cameras. This is outside the typed contract.
- **O2.** CHANGELOG `Unreleased`: the T-219 line still says a hidden selection or follow "falls back as for an object that is not available", but T-220's camera rule supersedes that. The T-220 line describes the current behaviour. `docs/NPM_PACKAGING.md`'s limit table is still the spike's (pre-existing; `check-packs.mjs` cites it as the source of its limits).
- **O3.** The engine share counts only modules under `packages/astraeus/`. The engine's npm dependencies (three, React, fiber) count as each demo page's own share: Apollo's engine share is 463,999 B against the example's 1,652,588 B. A three.js or React upgrade would trip demo limits as well as the engine limit. This is consistent with "the engine package's code", but the owner may want vendor code counted as engine.
- **O4.** CODE-02 says to add a node test of a new frame stage in `tests/sceneFrame.test.ts`. `applyViewVisibility` is tested in `tests/viewFrame.test.ts` instead (a Guideline, and covered).
- **O5.** The `both` view's rule is only resolved, never applied, in the browser scene (T-221 states this limit). `start` without framing is proven only in DOM tests.
- **O6.** The `views` browser step asserts a smallest button of ≥ 24 px. The measured values are 36 px on desktop and 44 px on phone, so the 44 px phone target holds but is not asserted.

## Appendix: probe sources (abridged; full files in the checker scratchpad `probes/`)

`zzCheckProbeDom.test.ts`, the I-129 cases:

```ts
// mocks as tests/viewerHostDom.test.ts (AstraeusScene stub, prepareScene returning syntheticDefinition + views a, b)
const draw = (time: number) => act(async () => { root!.render(createElement(AstraeusScene, { scene, view: "a", time, onChange: (c) => seen.push(c) })); });
await draw(startUtcMs + 1000); act(() => press($(host, '[data-view-id="b"]'))); await draw(startUtcMs + 2000);
// -> PROBE view-prop-after-time-change: {"pressedB":"false","last":{...,"view":"a","cause":"host"}}
const drawV = (v: string) => act(async () => { root!.render(createElement(AstraeusScene, { scene, view: v, time: T1, onChange: (c) => seen.push(c) })); });
await drawV("a"); await act(async () => { vi.advanceTimersByTime(5000); }); await drawV("b");
// -> PROBE view-prop-change-clock: before time 1893459001000 (playback), after 1893456001000 (= T1), view b, cause host
```

`budgetProbe.mjs`: a page `[app.html, mixed.js, pic.jpg]` with limits 5,000 / 6,000, where `mixed.js` holds engine and demo noise and `engine-share.json` gives its engine bytes. It is run through `checkLoadBudget` for base, engine-grown, demo-grown and no-sidecar builds, with the outputs quoted in M25.
