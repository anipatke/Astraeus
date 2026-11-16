---
id: C-183
scope: {kind: objective, id: O-075}
result: NEEDS WORK
checked_by: {role: checker, session: o075-check-20261116}
executed_session: plan-o075-20261115
checked_at: '2026-11-16T08:19:29Z'
health_snapshot: sha256:939a0445d429cb461b19b7fa3956eff1281d48beeb6fbe32d434f65181a79afe
reviewed:
  base_commit: 79708bc2
  head_commit: e2d24d96
  files: [packages/astraeus/src/core/storyPanels.ts, packages/astraeus/src/shell/storyPanels.ts, packages/astraeus/src/shell/useStoryPanels.ts, packages/astraeus/src/shell/AstraeusShell.tsx, packages/astraeus/src/shell/ObjectControls.tsx, packages/astraeus/src/shell/experience.ts, packages/astraeus/src/api/story.ts, packages/astraeus/src/api/scene.ts, packages/astraeus/src/api/look.ts, packages/astraeus/src/api/index.ts, packages/astraeus/src/api/planCamera.ts, packages/astraeus/src/api/assembleScene.ts, packages/astraeus/src/api/planStory.ts, packages/astraeus/src/api/planTimeline.ts, packages/astraeus/src/api/planViews.ts, packages/astraeus/src/api/sceneReads.ts, packages/astraeus/src/api/switches.ts, packages/astraeus/src/app/App.tsx, packages/astraeus/src/app/AstraeusScene.tsx, packages/astraeus/src/app/displaySwitches.ts, packages/astraeus/src/app/liveLook.ts, packages/astraeus/src/app/look.ts, packages/astraeus/tests/storyPanelClose.test.ts, packages/astraeus/tests/cameraChoices.test.ts, packages/astraeus/tests/sceneLookReads.test.ts, packages/astraeus/tests/look.test.ts, packages/astraeus/tests/lifecycle.test.ts, packages/astraeus/tests/sceneInputCopies.test.ts, packages/astraeus/tests/apiImports.test.ts, packages/astraeus/tests/helpers/viewerPresentation.ts, packages/astraeus-site/tests/migrationTable.test.ts, packages/astraeus-site/tools/validate/load-budget.mjs, tools/api-rules.mjs, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, packages/astraeus/api-surface.lock.json, .savepoint/Design.md]
  dependencies: []
issues: [I-179]
unmet: [O-075-SC1, T-317-DW2-close-rule]
supersedes: null
---

# C-183: O-075 Full Objective Check

Fresh session; I did not plan or build O-075 or T-317..T-319. Scope: O-075 and its three Tasks T-317, T-318, T-319 (each Task Check waived by the owner, 2026-11-15T10:09:53Z, session plan-o075-20261115), diff `git diff main...HEAD` (merge base 79708bc2 to HEAD e2d24d96). A stopped earlier attempt wrote nothing; this run started fresh.

## Progress

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix (n/a for the change itself: no server, subprocess or network in the scoped code; the browser gate's runner is unchanged and only run as a gate)
- [x] Workflow And Side-Effect Check Lock (n/a: in-memory scene planning, a live look and a per-tick React effect; no persistence, artifacts or multi-step writes. The one stateful sequence, the per-tick close decision, is covered as matrix rows)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (n/a: no planning advice in the acceptance criteria)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (n/a: initial Check)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock

1. Criteria: O-075 Success Conditions SC1 (panel close span), SC2 (`sheetMaxPercent` look), SC3 (Focus choices, Overview on/off, sky-only recipe), SC4 (switch `label`), SC5 (scene reads), SC6 (additions only; README, CHANGELOG, API lock; gates); each Task's Done When (T-317, T-318, T-319). Guardrails named by the Tasks: ARCH-01..03, API-01, API-02, API-04..06, TEST-01..03, STYLE-07. Release gates: full gate, engine-alone, check:pack, check:node-consumer, measure:example, check:browser (once), Code Health.
2. Changed files: the `reviewed.files` list. Public entry points: `Scene.setStoryPanelPlayback`, `Scene.addStoryPanels`, `Scene.setLook` / `handle.setLook` / `handle.look`, `scene.camera.setFocusChoices` / `setOverview`, `Scene.setSwitches`, `Scene.look`, `Scene.switches`, `Scene.panelPlayback`, `Scene.timeline.pacing`, the viewer's camera bar, switch bar/panel and story panel.
3. Relied-on runtime: `CrossingTracker` and `useStoryPanels` tick effect; the shell's seek path (`noteSeek`); `definitionOf`/`assembleScene` camera presets; `displaySwitchItems`; App live controls and Developer slider.
4. Matrix axes below; not-applicable cells give a reason.
5. Issue boundary: supported public paths only (host calls, visitor play/seek/speed/marker); demo data fidelity out of scope.

## Coverage Matrix

| # | Row (criterion) | Cell | Evidence | Result |
|---|---|---|---|---|
| 1 | SC1 close span | playback span / panel span / panel span over shorter playback / none x forward pass / seek past / rewind / paused | `storyPanelClose.test.ts` 16-row table (full gate) | pass |
| 2 | SC1 | stop exactly on end after playing into close time | same file, stop-on-end row | pass |
| 3 | SC1 | DOM: auto-opened panel (20 s span) stays then closes, `onPanel {id:null, cause:"playback"}`; no span never closes | same file DOM tests | pass |
| 4 | SC1 | with `pauseSeconds: 2` hold then resume, 20 s span | independent DOM probe P2: closes, cause playback | pass |
| 5 | SC1 | span shorter than one frame's clock advance (span 1 s, 6 s per 100 ms; or any span after the visitor raises the speed) | independent DOM probe P1 + pure probe P4: panel opened on the tick that also crosses its close time never closes (clock 53 s past) | **Issue I-179** |
| 6 | SC1 | panel reopened by the visitor from its marker after its close time, then play | probe P3: stays open | observation (adjacent case, recorded in I-179) |
| 7 | SC1 | panel opened from the event list (seeks to its time), then play | code path `openPanelFromTimeline` seeks then opens; rule applies as rows 1-3 | pass (by trace) |
| 8 | SC1 | bad values: 0, negative, text, NaN on panel/playback; span on a step | `storyPanelClose.test.ts` 6 throw cases + accept case | pass |
| 9 | SC1 | defaults unchanged (no span) | rows 1, 3; `panelPlayback` read omits the field | pass |
| 10 | SC2 sheet look | default 50, set 70/85, live `applyLook`, read back; bounds 30, 85, 42.5 accepted; 29, 29.99, 85.01, 86, NaN, Infinity, text refused `bad-look` | test file + probe P5 | pass |
| 11 | SC2 | Developer slider and look one value; Reset; host `setLook` updates shown value | App diff (`controls.current.sheetMaxPercent`, `setSheetShown`), handle setLook handler sets `setSheetShown(read.sheetMaxPercent)` | pass (by trace) |
| 12 | SC2 | no page address parameter | look table `param: null`; `look.test.ts` "address ignored" row | pass |
| 13 | SC3 Focus choices | default / empty / partial; Follow, Look-out, Overview each default / empty / partial; sky-only combination, through `ObjectControls` | `cameraChoices.test.ts` 11-row table; probe P5 sky-only presets `["lookOut"]` | pass |
| 14 | SC3 | `unknown-body`, non-list `bad-camera`, non-boolean `setOverview` `bad-camera`, opening focus/follow outside choices `bad-camera`, inside accepted | test file + probe P5 | pass |
| 15 | SC3 | default scene presets and `focusListed` absent | test + probe P5 (`overview, focus-earth, follow-earth, focus-moon, follow-moon`) | pass |
| 16 | SC3 | owner look on localhost:5490 (T-318 User Check) | owner "looks good", 2026-11-15T10:29:23Z (T-318 drift notes) | owner-judged |
| 17 | SC4 switch label | trimmed label in bar and panel; built-in names unchanged; later call replaces entry (label gone) | `cameraChoices.test.ts`; probe P5 | pass |
| 18 | SC4 | `""`, blank, number, null → `bad-switch` | probe P5; test file | pass |
| 19 | SC4 | Developer drawer shows label | not implemented: drawer has fixed controls, not per-switch rows; deviation accepted by the coordinator; README and CHANGELOG state "the Developer drawer's controls keep their own (fixed) names" | accepted deviation, documented honestly |
| 20 | SC5 `Scene.look` | defaults and set values, frozen nested parts, equals `handle.look` on a fresh mount (default and heavy look) | `sceneLookReads.test.ts` | pass |
| 21 | SC5 `Scene.switches` / `panelPlayback` | defaults, set values, `on` filled, `closeAfterSeconds` absent when unset, replaced by a later `setStoryPanelPlayback({})` | test file + probe P5 | pass |
| 22 | SC5 `timeline.pacing` | absent when none; span and near pieces, ramps filled; frozen list and pieces | test file | pass; nested `near` object not frozen (probe P5) - observation |
| 23 | SC5 | handle's live reads unchanged | `lookReadOf` gains one field only; no handle read added | pass |
| 24 | SC6 | API lock, migration table, API rules, api page size limit (owner 45,000 B) | full gate (`apiSurface`, `migrationTable`, `apiRules`, `apiReference`) | pass |
| - | Text classes, Unicode width | n/a: labels are passed through as text; no width or truncation logic in scope |
| - | Serialization round trips | n/a: no new serialized form (page address explicitly excluded for the sheet look) |

## Acceptance Classification

- O-075 SC1 / T-317 close rule: **Issue** (I-179). Other T-317 criteria (bad-panels, sheet look, docs, tests): Proven.
- SC2: Proven. SC3: Proven (owner visual judgement recorded). SC4: Proven for bar and panel; Developer drawer part is a coordinator-accepted deviation, honestly documented in README and CHANGELOG. SC5: Proven. SC6: Proven.

## Issues

- **I-179** (T-317, O-075 SC1): the close rule is a crossing test evaluated only for the panel already open before the tick, so a panel whose time and close time are both crossed in one frame (short span, or any span after the visitor speeds playback up) opens and never closes by itself. `packages/astraeus/src/shell/storyPanels.ts:30-35`, `packages/astraeus/src/shell/useStoryPanels.ts:37-42`. Tests use spans larger than one tick.

## Materiality

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-179 | Medium: needs a span below one frame's advance, which any visitor reaches by raising the speed on a fast story timeline (the F-18 case) | Medium: the panel stays over the scene, the exact symptom F-18 reported; visitor can still close it | Medium | Fix now: a narrow repair under I-179 in `panelSpanPassed`/`useStoryPanels` (close when forward playback has the clock at or past the close time of the open panel, including one opened on the same tick), plus a table row at high speed; decide and document the marker-reopen case |

## Gates

All at HEAD e2d24d96, repo root, this session (times UTC):

- `npm run test:full` (2026-11-16T08:09:46Z to 08:11:16Z): pass, 263 files, 4021 passed, 2 skipped, 82 s; fresh `coverage/coverage-final.json` and `junit.xml`.
- `savepoint health check O-075` (08:11:30Z): snapshot `sha256:939a0445…a79afe` (created); "Code Health does not block clearance"; complexity, coverage, dependency vulnerabilities, duplication, tests all reported with no blocking finding.
- `npm run lint` pass (7 s); `npm run typecheck` pass (6 s); `npm run build` pass (3 s).
- `npm run check:engine-alone` pass (24.2 s); `npm run check:pack` pass (14.6 s, all nine packages under limits); `npm run check:node-consumer` pass; `npm run measure:example` pass (first-open total 1,772,576 B raw / 509,982 B gzip).
- `git diff --check main...HEAD`: clean.
- `npm run check:browser` (run once): pass, 2026-11-16T08:13:53Z to 08:19:22Z, all 12 steps exit 0 with 0 error lines; total 329 s over the 320 s limit and `hello-sky` 19 s over its 15 s limit (timing WARNING lines only, not failures; neither step's code is touched by O-075 beyond the shared engine). Evidence `docs/evidence/browser-20261116T081353Z`.
- Probes: a temporary file `packages/astraeus/tests/zzCheckO075Probe.test.ts` (P1-P5) was run with `npx vitest run` and deleted before the browser run; working tree left as found.

## File Reality

Every file named in the Task evidence and drift notes exists at HEAD (checked against `git diff --name-only main...HEAD`); no phantom or unexplained file. `tools/api-rules.mjs` `Percent` suffix, `apiImports` allowlist entry and `migrationTable` WIDENED entry are present with reasons.

## Design Reconciliation

Design.md "Panels, controls and reads (O-075, T-317 to T-319)" paragraph (commit e2d24d96) accounts for every drift note of T-317, T-318 and T-319 (close rule location, sheet look single value, `Percent` suffix, camera choices WeakMap, `cameraPresetsOf` choices object, `checkOpeningChoices`, `focusListed`, overview fallbacks, switch label path and Developer drawer exception, scene reads and pacing span-end names). It describes the close rule as "closes once forward playback passes its time plus closeAfterSeconds", which I-179's repair must keep true.

## Owner Decisions Assessed

- API page gzip limit 44,500 → 45,000 B (owner, T-318, 2026-11-15T10:29:23Z): applies; page passes under it in the full gate (`apiReference.test.ts`).
- T-318 owner look on localhost:5490, "looks good" (2026-11-15T10:29:23Z): applies; camera choices and switch labels unchanged since. T-318 declares `owner_validation.required: true` but carries no structured `accepted_check`; the owner may record it against a later CLEAR Check.
- Switch label not in the Developer drawer: coordinator-accepted deviation from SC4's wording; README `setSwitches` row and CHANGELOG say the drawer keeps its own fixed names. Honest. The owner has not been recorded accepting the change to SC4's wording.

## Owner Validation Still Needed

- None for looks. The owner may confirm the SC4 deviation (Developer drawer) on the Objective.

## Observations (non-blocking)

- `Scene.timeline.pacing` freezes the list and each piece but not a near piece's nested `near` object (probe P5); the read is rebuilt on each access, so writing to it changes nothing in the scene.
- The internal doc comment on `DisplaySwitchSetting.label` (`packages/astraeus/src/app/displaySwitches.ts:20`) still says the label shows in "the Developer drawer"; the public docs are right.
- `timeline.pacing` reads span ends as `spanStartUtcMs`/`spanEndUtcMs`, while the input names them `start`/`end`; documented in README (API-04 naming).
- `Scene.look` counts `sunGlow` only for a Sun added with `addBody` (T-319 drift note); a Sun from a Sun-centred layer is not counted.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [ ] STYLE-03 **Test branches** — the close table never crosses a panel's time and close time in one tick (I-179).
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth** — sheet cap one value; `Scene.look` reuses the viewer's resolvers.
- [ ] STYLE-08 **Comments explain why** — `displaySwitches.ts:20` comment states a place the label does not show.
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**

## Handoff

`NEEDS WORK` on I-179 only. Remediation is a direct repair under I-179 (`savepoint-task` under `issue-capture.md`); T-317 stays done. Then a re-check against this scope lock.
