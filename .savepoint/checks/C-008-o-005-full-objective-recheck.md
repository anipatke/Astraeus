---
id: C-008
scope: {kind: objective, id: O-005}
result: CLEAR
checked_by: {role: checker, session: o005-full-check-codex-20261010}
executed_session: "T-016–T-022 executor sessions; I-011/I-012 repair codex-g003-spike03-repair-20261010"
checked_at: '2026-10-09T22:30:31Z'
reviewed:
  base_commit: 9072155ca2be2473bfaceb9fa273ce64d8ad743c
  head_commit: 601a9fff7bc02910ede0fad9fe323a16e706a6c8
  files:
    - .savepoint/Design.md
    - .savepoint/objectives/O-005-reusable-astronomy-ui-shell/Objective.md
    - .savepoint/objectives/O-005-reusable-astronomy-ui-shell/tasks/T-016-audit-planetary-explorer-s-ui-for-patterns-worth-reusing.md
    - .savepoint/objectives/O-005-reusable-astronomy-ui-shell/tasks/T-017-put-a-timeline-bar-around-the-canvas-and-move-diagnostics-behind-a-toggle.md
    - .savepoint/objectives/O-005-reusable-astronomy-ui-shell/tasks/T-018-let-viewers-pick-objects-and-switch-overview-focus-and-follow.md
    - .savepoint/objectives/O-005-reusable-astronomy-ui-shell/tasks/T-019-show-object-information-data-trust-and-the-scale-choice-on-request.md
    - .savepoint/objectives/O-005-reusable-astronomy-ui-shell/tasks/T-020-make-the-shell-work-on-every-screen-size-and-hand-it-over-for-visual-review.md
    - .savepoint/objectives/O-005-reusable-astronomy-ui-shell/tasks/T-022-show-common-measurements-as-compact-reusable-visuals.md
    - .savepoint/issues/I-011-spike-01-02-browser-checks-not-superseded.md
    - .savepoint/issues/I-012-design-not-reconciled-for-o-005-drift-notes.md
    - .savepoint/checks/C-007-o-005-full-objective-check.md
    - .savepoint/config.yml
    - .savepoint/Guardrails.md
    - src/shell/ObjectControls.tsx
    - src/shell/style.css
    - src/app/App.tsx
    - src/app/TrackedBodyView.ts
    - src/mission/apollo11.ts
    - tests/timeline.test.ts
    - tests/controls.test.ts
    - tests/missionScene.test.ts
    - tests/infoProvenance.test.ts
    - tests/metricVisuals.test.ts
    - tools/validate/browser-shell.mjs
    - tools/validate/browser-spike03.mjs
    - tools/validate/browser-spike02.mjs
    - tools/validate/browser-anchor-labels.mjs
    - docs/PLANETARY_EXPLORER_UI_AUDIT.md
    - docs/DONOR_PROVENANCE.md
    - docs/ASTRAEUS_SPIKE_03.md
    - docs/evidence/spike03/browser-results.json
    - docs/evidence/regression-spike01-02/browser-spike02-results.json
    - docs/evidence/regression-spike01-02/anchor-labels/browser-anchor-labels-results.json
  dependencies: []
issues: []
supersedes: C-007
---

# C-008: O-005 Full Objective Recheck

## Closure map

- I-011 — closed as verified by this CLEAR Check.
- I-012 — closed as verified by this CLEAR Check.

## Independence and revision

This is an independent Check session. It did not build the O-005 work and did not alter application source. The reviewed committed baseline is 601a9fff7bc02910ede0fad9fe323a16e706a6c8, following C-007 at 9072155ca2be2473bfaceb9fa273ce64d8ad743c. The checkout was clean before this Check. Source/data under src/core and data have no diff between those commits. Verification outputs and screenshots from this run were directed to /tmp; committed screenshot and Spike 02 evidence were not overwritten.

## Frozen scope lock

This is the full recheck under C-007's frozen scope. It covers O-005 success conditions 1–13; all Done When criteria for T-016, T-017, T-018, T-019, T-020 and T-022; Guardrails ARCH-01, ARCH-02, PROV-01, TEST-01, TEST-03 and TEST-04; configured typecheck, build and test gates; git diff --check; and the scene-affecting browser validation.

The reviewed surfaces are AstraeusShell, ExperienceConfig and ExperienceObject, TimelineBar, ObjectControls, ScaleControl, InfoPanel, ProvenanceBadge and MetricVisual; the pure timeline, object, info, scale and metric models; Apollo's experience projection and known-limitations content; and App wiring. The relied-on runtime is SimulationClock, camera requests, trueScale/readableScale policies, trajectory provenance, TimelineEvent and generated Apollo validation/events. Text-width and truncation cells remain not applicable: the shell promises CSS ellipsis and no Unicode width calculation. Terminal color/cursor output cells are not applicable to this browser UI.

An Issue is admitted only for one of the exact cells in the recheck ledger below, through a supported Apollo app or generic-shell path, where O-005 touched or promises that behavior. Owner visual taste remains outside the technical verdict; the owner acceptance action stays pending.

## Recheck admission ledger and coverage matrix

| Recheck item | Exact frozen C-007 cell | Evidence and result |
|---|---|---|
| Timeline context and navigation | Normal current/next/previous; before first, on event, after last, tied times; all 30 events in order | timeline.test.ts covers the boundary/tie cases; browser-spike02 checked 30/30 event jumps against timeline timestamps. PASS |
| Clock controls | Play, rate, seek, clamped bounds; 1×, 100×, 1,000×, 10,000× | controls.test.ts and missionScene.test.ts cover state transitions and configured rates. Browser-spike02 selected/measured all four rates: 0.951×, 93.862×, 947.777× and 5,597.720×; its explicit accepted interval is 50–150% of the selected rate. PASS |
| Object selection and availability | Configured labels; out-of-bounds/invalid ids; fallback to available object or overview | missionScene.test.ts covers configured labels and selection; browser-shell exercised availability fallback and focus/follow paths. PASS |
| Camera presets | Configured/mobile unavailable labels; UTC and telemetry invariant across presets | browser-shell and browser-spike02 checked overview/focus/follow. Six camera presets in browser-spike02 preserved UTC and spacecraft readouts. PASS |
| Scale control | Explanation; unknown id defaults to trueScale; six mission times × both scales preserve physical readouts | infoProvenance.test.ts covers policy mapping/state identity; browser-shell checked the explanation; browser-spike02 compared 6/6 True/Readable pairs. PASS |
| Info and provenance | Four configured objects and event; unknown/missing provenance; Escape/Close | infoProvenance.test.ts covers null/configured paths; browser-shell opened Earth, Moon, Columbia, Eagle and event information, checked source status and close paths. PASS |
| Known limitations | Generated Apollo figures and independent recomputation | infoProvenance.test.ts covers dynamic figures. Independent calculation from data/apollo11/generated/validation.json found Columbia 13 smoothed coasts (maximum 1,963.327 km, A-30>A-31), 9 burn residuals (2.265–454.706 km); Eagle 3 smoothed coasts (456.409 km, A-15>A-18), 3 burn residuals (0.191–5.812 km); landing offsets 254.18 km/8.386° and 275.37 km/9.087°. The A-02>A-03 generated record retains its 69,263.426 m/s correction over 10 seconds. Browser-shell confirmed the configured object/event provenance disclosures. PASS |
| Metric Visuals | Speed/distance/phase/extended types; numeric-only fallback; no invented ranges; State neutrality; non-Apollo reuse | metricVisuals.test.ts covers numeric fallback, references, each added type, non-Apollo fixture and State-preserving live lifecycle; browser-shell exercised rendered info metrics and developer visuals. PASS |
| Developer diagnostics | No diagnostics by default; available behind toggle | browser-shell checked default hidden state and toggle; browser-spike02 exercised Developer mode and anchor labels. PASS |
| Responsive shell | 1440×900, 1280×800, 768×1024, 390×844; viewport fit, touch targets, mobile info sheet above timeline | browser-spike03 passed all four viewports, touch-target and fit assertions, and captured 11 screenshots. PASS |
| Keyboard and contrast | All focus stops have visible 2px outline; focused marker labels and event-list route | Independent browser probe enumerated 44 visible stops in the expanded timeline state; all had a solid 2px outline. Primary-control text contrast measured 6.95:1–17.04:1. browser-shell confirmed a focused marker label is visible. C-007's reported stop count was 40; the current enumeration included the native summary and expanded event entries. The criterion requires keyboard access and visible focus, not an exact count. PASS |
| I-011 regression repair | Six scale pairs, camera invariance, all event jumps, four rates, 100× follow continuity, USNO phases, anchor toggle, zero errors; no overwrite of Spike 02 evidence | browser-spike02 passed 6/6 scale pairs, 6/6 camera presets, 30/30 event jumps, four rate checks, 30 continuous follow samples and the 100× track; USNO values were 50.1%, 0.2%, 50.1%, 99.8%; errors were empty. browser-anchor-labels passed 0 labels off, 40 on, 0 after toggle; errors were empty. Outputs were in /tmp. PASS; closes I-011 |
| I-012 Design repair | App/shell data flow, True default, ScalePolicy mapping, provenance/limitations, app types, anchor sprite and named browser scripts | Design.md now describes the ExperienceConfig/ClockSnapshot/callback flow, true-scale startup, unchanged policy mapping, object/event provenance, known limitations, TrackedReadout.positionKm, TrackedBody.positionDiscrepancies, MissionConfig.journey, anchorSpriteTexture and all four validation scripts. The corresponding Objective/task drift notes are reflected. PASS; closes I-012 |

The original public surfaces, input/state transitions, boundaries, sequence and representation axes remain as listed in C-007. No missing applicable cell was found. The independent browser scenarios are additional to the named unit tests.

## Workflow and side-effect check

| Order | Operation | Side effect/state change | Failure timing, owner and final state | Cleanup / secondary failure | Independent oracle |
|---|---|---|---|---|---|
| 1 | Typecheck, build, tests, diff check | Typecheck/tests are read-only apart from temporary caches; build writes ignored dist output | A nonzero gate is fatal to clearance; no application state is changed | No external resource to close; git status stayed clean | Compiler, Vite build result, Vitest result and Git whitespace check |
| 2 | Attach Chromium to the already-running local server | Opens a browser page only; no app persistence | Initial in-sandbox Chromium launch failed before the app opened due sandbox_host_linux permission. The same command succeeded with approved unsandboxed access | Browser scripts close Chromium in finally; no app/server state persists | Browser navigation to the exact configured URL and script assertions |
| 3 | Exercise timeline, selection, camera, scale, info and metrics | Changes only in-memory browser UI and SimulationClock | Assertion failure would fail that script; no external state would be committed | No retry or secondary app cleanup required; browser close in finally | Actual accessible controls, UTC, physical readouts and rendered provenance |
| 4 | Capture browser evidence | Writes screenshots/JSON under /tmp only; no overwrite of repository evidence | Scripts write final result JSON after assertions; an earlier screenshot failure could leave partial scratch files only | Scratch outputs are disposable; no cleanup error occurred | Reopenable screenshots and machine-readable result files |
| 5 | Official Code Health check | No snapshot written because Code Health is unconfigured | Tool returned success with “Code Health is not configured”; no health verdict was produced | No snapshot cleanup | Official health command output |
| 6 | Write C-008 and verify with savepoint resume | Adds one immutable Check and appends verified resolutions to I-011/I-012 | Strict-loader failure would block handoff | Existing history remains intact; no Task or Objective status changes | savepoint resume strict-load and resulting Next line |

## External-boundary matrix

The configured and actual browser target was http://127.0.0.1:5199/. The owner-provided server was already running; all four project scripts discovered the app and loaded it successfully. Browser setup succeeded with the donor Playwright Core at /home/user/code/planetary-explorer/node_modules/playwright-core/index.js. The initial sandbox launch error was an environment permission failure, not an app response; unsandboxed browser checks passed.

No redirect, timeout, cancellation or malformed app response occurred. This UI path has no external provider/API response handling, so those response classes and provider retry/partial-write behavior are not applicable. Browser results were written to /tmp, and the app-facing scripts reported zero page/console errors. No secret appeared in output.

## Fresh gates and browser evidence

Fresh configured gates ran sequentially on 2026-10-09, approximately 22:17–22:18 UTC. Toolchain: Node v22.22.2, npm 10.9.7, Vite 8.3.2, Vitest 5.0.3.

- npm run typecheck — exit 0.
- npm run build — exit 0; existing large-chunk advisory for the approximately 1.46 MB minified JS chunk.
- npm test — exit 0; 10 files and 170 tests passed in 26.40 seconds.
- git diff --check — exit 0. Lint is null in .savepoint/config.yml, so no lint command ran.
- git diff --exit-code 9072155..601a9ff -- src/core data — exit 0; no changes to scientific core or generated data.
- rg -in 'apollo|columbia|eagle' src/shell — no matches.
- browser-shell.mjs at http://127.0.0.1:5199/ — exit 0; 30 events, four object provenance panels, overview/focus/follow and Metric Visuals exercised; True/Readable readouts identical; zero page/console errors.
- browser-spike03.mjs at http://127.0.0.1:5199/ — exit 0; 11 screenshots across 1440×900, 1280×800, 768×1024 and 390×844; True/Readable readouts identical; camera changes preserved readouts; zero errors. Run from /tmp, so outputs are under /tmp/docs/evidence/spike03/.
- browser-spike02.mjs at http://127.0.0.1:5199/ — exit 0; results under /tmp/docs/evidence/regression-spike01-02/. The 10,000× measurement was 5,597.720× over a 7.281-second wall interval and passed the script's stated 50–150% tolerance; the measured value is recorded rather than rounded to the target.
- browser-anchor-labels.mjs at http://127.0.0.1:5199/ — exit 0 at 1280×800; output under /tmp/o005-c008-anchor-labels/; labels were hidden/0, visible/40 and hidden/0; zero errors.
- Independent focus probe at http://127.0.0.1:5199/ — 44 visible keyboard stops, all with a solid 2px focus outline; primary text contrast ranged 6.95:1–17.04:1.
- savepoint health check O-005 — exit 0; “Code Health is not configured”; no snapshot exists and health_snapshot is omitted.

## Acceptance coverage

| O-005 success condition | Classification and evidence |
|---|---|
| 1. Canvas-first hierarchy at required viewports | Proven technically: browser-spike03 assertions and screenshots cover all four sizes. Whether the canvas feels visually dominant is reserved for owner review. |
| 2. Timeline controls, event markers and context | Proven by shell browser validation, all 30 event jumps and timeline boundary tests. |
| 3. Configured selection/focus/follow preserve State | Proven by missionScene.test.ts camera-independence case and browser shell/regression checks. |
| 4. True/Readable explanation and unchanged ScalePolicy | Proven by browser-shell, scale model tests and no core/data diff. |
| 5. Provenance, accuracy and limitations | Proven by infoProvenance.test.ts, live panel browser checks and independent generated-data calculation above. |
| 6. Diagnostics are behind the developer toggle | Proven by default-hidden and toggled browser checks. |
| 7. Donor audit and provenance records | Proven by the existing audit/provenance documents and C-007 review; required files exist in the committed baseline. |
| 8. Generic shell has no Apollo naming | Proven: source search returned no matches; named generic-shell test passed in npm test. |
| 9. Keyboard access, focus, labels and tap targets | Proven technically by the focus probe and responsive browser assertions. |
| 10. Spike 01/02 unchanged | Proven: core and data diff is empty, all gates pass, restored browser regressions pass with zero browser errors. |
| 11. Required screenshot set and visual validation | Screenshot set is complete and was freshly re-captured under /tmp. Owner visual verdict remains pending and is not recorded by this Check. |
| 12. Spike 03 design note and Design reconciliation | Proven by docs/ASTRAEUS_SPIKE_03.md and current Design.md content including the repaired drift. |
| 13. Reusable Metric Visuals, generic config and non-Apollo fixture | Proven by metricVisuals.test.ts and live shell browser checks. |

All six owned Tasks remain status: done. T-016 through T-019 have explicit owner Task-check waivers; T-020 and T-022 still require owner acceptance naming this current Check. No Task or Objective status was changed. The task-level completion evidence, named tests and owner waivers were reviewed under C-007 and the source remains at the same committed implementation in this baseline.

## Guardrails

- ARCH-01 — satisfied: src/shell has no experience-specific names.
- ARCH-02 — satisfied: shell/camera/scale choices leave scientific State unchanged in unit and browser checks; src/core is unchanged.
- PROV-01 — satisfied: configured source status, accuracy, notes and known limitations are visible and data-derived.
- TEST-01 / TEST-03 — satisfied: changed behavior has named tests and browser scenarios; fresh configured gates passed.
- TEST-04 — satisfied: all optional Task Check skips carry an explicit owner waiver; those waivers do not replace this Objective Check.
- SEC-01, SEC-03 and DATA-01 — not touched by this scope.

## Adversarial pass

- No alternate shell surface bypasses the tested configured selection, availability, scale or provenance paths; pure-model edge tests cover unknown ids and missing provenance.
- Before/on/after/tied event transitions and all 30 configured events are tested. Clock pause/seek/rate transitions are unit tested and the browser run observed all four selected rates.
- Focus/follow/overview and both scale representations preserve UTC and physical readouts.
- The default viewer has no diagnostics; Developer mode and anchor labels are reachable by keyboard controls. A focused event marker exposes its label.
- UI boundary checks cover body availability, timeline limits, four viewports, mobile touch targets and an open mobile information sheet. No application response parser or external provider exists in this scope.
- Independent outcome evidence includes browser-observed UTC/readouts, a separately computed generated-data oracle, and the non-Apollo metric fixture. No material bypass or in-scope failure was found.

## Prior Issues and materiality

I-011 and I-012 were reproduced as repaired in their exact frozen cells and are verified closed by this CLEAR Check. There are no remaining Issues, so no materiality actions are required.

## Observations and owner validation

Owner validation is still required. T-020 and T-022 declare owner_validation.required, and O-005 success condition 11 asks for the owner's visual verdict. The 11 refreshed screenshots are available in the committed docs/evidence/spike03/ set; the fresh independent captures from this run are under /tmp/docs/evidence/spike03/. The owner should review those screenshots and record acceptance naming C-008 for T-020 and T-022. This Check does not record that acceptance.

The keyboard recheck enumerated 44 stops in the expanded timeline state, rather than the 40 reported in C-007; all had the required 2px outline. The exact stop count is not an acceptance criterion. The measured 10,000× browser rate was 5,597.720×, inside the regression script's 50–150% tolerance; clock rate state and exact mapping are covered by unit tests. No Issue was admitted.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [ ] STYLE-02 **One job per function** — src/shell/AstraeusShell.tsx:61-81 uses one effect for both selection and camera-preset fallback.
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [ ] STYLE-06 **Handle errors at boundaries** — generated JSON is cast, not runtime-validated (src/mission/apollo11.ts:96-98,188).
- [ ] STYLE-07 **One source of truth** — App.tsx:34 initializes selectedObjectId to earth while the shell derives the first available object; app selection is also synchronized at the effect and selection callbacks.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs** — O-005’s implementation spans the multi-Task source, tests, documentation and browser evidence reviewed in C-007. These STYLE rules are advisory and do not affect CLEAR.
