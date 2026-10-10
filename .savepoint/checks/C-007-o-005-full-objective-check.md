---
id: C-007
scope: {kind: objective, id: O-005}
result: NEEDS WORK
checked_by: {role: checker, session: o005-check-claude-20261010}
executed_session: t016-t022 executor sessions (g002-replan-2026-10-06 plan; t019-2026-10-09; t018-test-and-metric-visuals-2026-10-09; T-020 executor, unnamed)
checked_at: '2026-10-09T21:36:00Z'
reviewed:
  base_commit: e57ab5f5301b75106aa6e1bb7c56e54dbd2b4933
  head_commit: 9072155ca2be2473bfaceb9fa273ce64d8ad743c
  files:
    - src/shell/AstraeusShell.tsx
    - src/shell/TimelineBar.tsx
    - src/shell/timelineModel.ts
    - src/shell/ObjectControls.tsx
    - src/shell/objectModel.ts
    - src/shell/experience.ts
    - src/shell/Label.tsx
    - src/shell/InfoPanel.tsx
    - src/shell/infoModel.ts
    - src/shell/ProvenanceBadge.tsx
    - src/shell/ScaleControl.tsx
    - src/shell/scaleModel.ts
    - src/shell/metrics.ts
    - src/shell/MetricVisual.tsx
    - src/shell/style.css
    - src/app/App.tsx
    - src/app/ephemerisProvenance.ts
    - src/app/metricReadouts.ts
    - src/app/DebugControls.tsx
    - src/app/DebugOverlay.tsx
    - src/mission/apollo11.ts
    - tests/timeline.test.ts
    - tests/infoProvenance.test.ts
    - tests/metricVisuals.test.ts
    - tests/missionScene.test.ts
    - tests/controls.test.ts
    - tools/validate/browser-shell.mjs
    - tools/validate/browser-spike03.mjs
    - tools/validate/browser-spike02.mjs
    - tools/validate/browser-anchor-labels.mjs
    - docs/ASTRAEUS_SPIKE_03.md
    - docs/DONOR_PROVENANCE.md
    - .savepoint/Design.md
  dependencies: []
issues: [I-011, I-012]
supersedes: null
---

# C-007: O-005 Full Objective Check

## Independence and revision

This is a fresh session started after `/clear`. It did not build any O-005 Task. The review covers commits `e57ab5f..9072155` plus the uncommitted T-020 working tree, which modifies `src/shell/ObjectControls.tsx`, `src/shell/style.css`, `.savepoint/Design.md` and `docs/DONOR_PROVENANCE.md` and adds `docs/ASTRAEUS_SPIKE_03.md`, `tools/validate/browser-spike03.mjs` and `docs/evidence/spike03/*`. `git diff e57ab5f -- src/core data` is empty. The Check wrote nothing outside `.savepoint/checks/` and `.savepoint/issues/`. Probe scripts and screenshots stayed in the session scratchpad. A temporary copy of `browser-spike03.mjs` was placed in `tools/validate/` to redirect its output, then deleted. Committed evidence was not overwritten.

## Frozen scope lock

1. **Criteria under test:** O-005 success conditions 1–13; the Done When lists of T-016, T-017, T-018, T-019, T-020 and T-022 (all `status: done`, each with an owner Task-check waiver); Guardrails ARCH-01, ARCH-02, PROV-01, TEST-01, TEST-03 and TEST-04; the configured gates; and the AGENTS.md scene-affecting fuller gate.
2. **Public entry points:** `AstraeusShell` props; the `ExperienceConfig`/`ExperienceObject`/`ExperienceCameraPreset` contract; `TimelineBar`, `ObjectControls`, `ScaleControl`, `InfoPanel`, `ProvenanceBadge` and `MetricVisual`; the pure models `timelineModel`, `objectModel`, `infoModel`, `scaleModel` and `metrics`; Apollo's `buildApollo11Experience`/`apollo11KnownLimitations`; `createObjectMetrics`; and the app wiring in `App.tsx`.
3. **Relied-on runtime:** `SimulationClock` (seek/rate/play), `CameraRequest`, `ScalePolicy` (`trueScale`/`readableScale`), trajectory `Provenance`, `TimelineEvent`, generated `validation.json`/`events.json`, and headless Chromium through the donor `playwright-core`.
4. **Matrix axes:** see the coverage matrix below. Text-class (Unicode width) cells are not applicable: no truncation contract is promised beyond CSS ellipsis.
5. **Issue boundary:** a finding is an Issue only if it violates a named criterion or Guardrail through a supported path in the Apollo app or the shell contract. Visual taste belongs to the owner's validation and is never an Issue here.

## Coverage matrix

| Surface | Normal | Boundary / malformed | State / sequence | Result |
|---|---|---|---|---|
| Timeline context and navigation (`eventContextAt`, `eventNavigationTargets`) | Current, next and previous derived from events | Before first, on an event, after last, tied times (`tests/timeline.test.ts`) | All 30 events visited in order (unit); all 30 developer jumps land on their own timestamp (probe) | Passed |
| Clock via shell (play, rate, seek) | Shell callbacks call `SimulationClock` | Seek clamped to window (`clampToBounds`) | Rates measured 1×/100×/1,000×/10,000× (probe, repeated) | Passed |
| Object selection and availability | Configured labels; picker drives selection | Out-of-bounds objects disabled; ids that are not available rejected (`availableObjectById`) | Fallback to an available object and to overview when a target leaves its bounds (unit + `browser-shell.mjs`) | Passed |
| Camera presets | Labels from config ("Focus Earth", "Follow Columbia (CSM)", "Earth–Moon overview") | Mobile select with disabled presets for unavailable objects | Readouts and UTC unchanged across five presets (`browser-spike03.mjs`) and across six presets (probe) | Passed |
| Scale control | Explanation states the Readable trade-off and that readouts do not change | Unknown id maps to `trueScale` | Six mission times × two scales give identical mission readouts (probe); unit State identity | Passed |
| Info panel and provenance | Object and event views from config | Ids not configured → `null`; no provenance → no badge | Opened for all four objects and one event; Escape and Close (`browser-shell.mjs`) | Passed |
| Known limitations | Apollo figures | Generated-data changes alter the text (named test) | Recomputed independently from `validation.json` (below) | Passed |
| Metric Visuals | Speed, distance, phase and extended types | Numeric-only fallback; no invented ranges (unit) | State identical, mounted and removed (SSR unit; live via browser) | Passed (observation on SSR) |
| Developer diagnostics | Available behind the toggle | Default viewer text has no diagnostics (probe: no origin, EQJ, render or anchor text) | Toggle on/off | Passed |
| Responsive layout | 1440×900, 1280×800, 768×1024, 390×844 | Bounds fit the viewport; ≥44 px targets on tablet and mobile; sheet clears the timeline | Mobile sheet open | Passed (canvas dominance is the owner's judgement) |
| Keyboard and contrast | 40 Tab stops, every one with a 2 px solid outline | Measured contrast 6.4–15.8:1 on primary controls | Hover-only: marker labels also show on focus; event list is the primary route | Passed |
| Spike 01/02 browser regression | — | — | Repository scripts fail on replaced UI; no named superseding script | **Issue I-011** (behaviour proven by probe) |
| Design reconciliation | Map updated | — | Drift notes from T-018, T-019 and T-022 not reflected | **Issue I-012** |

External-boundary matrix (browser runner and Vite dev server). The configured target and the actual target were both `http://localhost:5199/` on a fresh `npx vite --port 5199 --strictPort`. Startup succeeded. The headless Chromium launch ran inside the sandbox without escalation. No connection was refused, and no redirects or timeouts occurred. Failure output from the legacy scripts is secret-free. Retry and cleanup cells are not applicable because nothing is persisted.

## Workflow and side effects

The shell has no persistence and no transactions. The only side effects are evidence files written by the browser scripts. `browser-spike03.mjs` writes `docs/evidence/spike03/*` unconditionally, and `browser-spike02.mjs` would overwrite the committed `docs/evidence/spike02*`. T-019 and T-020 recorded and avoided that hazard, and I-011's Proof Needed asks for an explicit decision. Camera, selection and scale callbacks mutate only the `controls` ref and React state. Clock mutation happens only through the play, rate and seek callbacks (`App.tsx:102-114`).

## Fresh gates and browser evidence

Toolchain: Node v22.22.2, npm 10.9.7, Vite 8.3.2, Vitest 5.0.3.

- 2026-10-09T21:27:48Z–21:28:18Z UTC: `npm run typecheck` exit 0; `npm run build` exit 0 (existing >500 kB chunk advisory); `npm test` exit 0, 10 files and 170 tests; `git diff --check` exit 0. Lint is not configured.
- `node tools/validate/browser-shell.mjs` (ASTRAEUS_URL `http://localhost:5199/`, donor playwright-core) at 21:28:31Z: exit 0, 30 events, four objects, overview/focus/follow, identical readouts under both scales, `errors: []`.
- `browser-spike03.mjs`, with its output redirected to the scratchpad, at 21:28:52Z: exit 0, all 11 screenshots, four viewports, identical readouts across scales, unchanged readouts across cameras, `errors: []`.
- Check probe (scratch `legacy-probe.mjs`, re-expressing `browser-spike02.mjs` and `browser-anchor-labels.mjs` against the current UI): 6/6 scale pairs identical; 30/30 event jumps exact; rates 0.995 / 58.1 / 999.9 / 9,999.8. Two repeat runs gave 100× = 100.05 / 99.99 / 95.7 / 99.95 and 1× = 0.58 / 0.97, so the outliers are click latency under SwiftShader. The 100× follow track ran continuously from 17:00:31 to 17:22:38 sim-time. USNO illumination read 50.1 / 0.2 / 50.1 / 99.8 %. Anchor labels showed 0 off, 40 on and hid again. `errors: []`.
- Independent oracle for the known limitations, computed from `validation.json` with a separate script:
  - Columbia: 13 smoothed coasts, max 1,963.327 km (A-30>A-31); 9 burns, 2.265–454.706 km.
  - Eagle: 3 smoothed coasts, max 456.409 km (A-15>A-18); 3 burns, 0.191–5.812 km.
  - Post-TLI: 69,263 m/s over 10 s.
  - Landing offset: 254.18 km / 8.386° and 275.37 km / 9.087°.
  - All match the rendered badge text exactly.
- Code Health: `savepoint health check O-005` printed "Code Health is not configured". No snapshot was taken; this is not a finding.

## Acceptance and Guardrails

**O-005 success conditions:**

1. **Proven technically.** Screenshots at four viewports, bounds asserted, progressive disclosure observed. Whether the canvas feels dominant needs owner validation.
2. **Proven.** Timeline has play/pause, time, rate, seek, previous/next, markers, and "Just happened" / "Up next".
3. **Proven.** Labels come from config; State is unchanged (named test `shell object selection and overview, focus, and follow requests leave State identical at a fixed time`, plus the probe).
4. **Proven.** `src/shell/scaleModel.ts:21` carries the explanation; `ScalePolicy` is unchanged.
5. **Proven.** Badge, sources, accuracy, notes and limitations match the generated-data oracle above.
6. **Proven.** No diagnostics in the default view. FPS was never available, before or after.
7. **Proven.** The audit exists; the DONOR_PROVENANCE Spike 03 section is recorded.
8. **Proven.** The glob test `generic shell boundary › contains no experience-specific names`; an independent `grep -rniE 'apollo|columbia|eagle|tranquil|nasa'` over `src/shell` finds nothing.
9. **Proven.** Every Tab stop has a visible outline; targets are ≥44 px on touch layouts; contrast is ≥6.4:1; nothing critical is hover-only.
10. **Partly Issue (I-011).** Core and data are unchanged. Removed test lines are limited to replaced UI (rate labels, the overlay `Speed` row and an import). Browser behaviour holds per the probe, but the Spike 01/02 scripts in the repository fail.
11. **Proven technically.** The screenshot set is complete. Owner visual validation is still required.
12. **Partly Issue (I-012).** The design note covers all 13 topics plus future needs and the Perseids recommendation. Design.md is only partly reconciled.
13. **Proven.** Metric Visuals, the non-Apollo fixture (`metric visuals reuse outside Apollo`) and `docs/ASTRAEUS_METRIC_VISUALS.md`.

**Task Done When:**
- T-016 1–6: Proven by document review.
- T-017 1–6: Proven; the named tests exist and pass.
- T-018 1–6: Proven.
- T-019 1–6: Proven; the named tests in `tests/infoProvenance.test.ts` pass.
- T-022 1–8: Proven; 9 is Proven technically, with owner validation outstanding.
- T-020 1, 2, 3 and 5: Proven. T-020 4: **Issue I-011**. T-020 6: **Issue I-012**. T-020 7: owner validation outstanding.

**Guardrails:** ARCH-01, ARCH-02 and PROV-01 are satisfied. TEST-01 and TEST-03 are satisfied except for the browser regression evidence (I-011). TEST-04 is satisfied: every Task carries an owner waiver naming the Task, reason, actor and time. SEC-01 and DATA-01 are not touched.

## Adversarial pass

- **Bypassing availability.** Mobile `select` options and preset buttons are both disabled for unavailable targets, and `activatePreset` re-checks with `availableObjectById`.
- **Mode switch on the same time.** Readouts stayed identical under scale and camera changes at six times.
- **Default-mode leak.** The developer panel is `hidden`, and its children are not mounted unless Developer mode is on.
- **Provenance identity.** Columbia and Eagle pass the trajectory's own `Provenance` (named identity test).
- **Self-referencing tests.** The limitation-figure test reads the generated file; this Check used a separate computation as its oracle.
- **Speed figure.** The post-TLI speed is probed through the runtime trajectory, not hand-copied.

No further defects were found.

## Findings and materiality

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-011: Spike 01/02 browser scripts not re-run or superseded | High (the scripts fail today) | Low–Medium (behaviour holds now, but future scene changes lose the rate, continuity and USNO browser regression net) | Medium | Fix now. Update or supersede the two scripts; the C-007 probe shows the selectors needed. |
| I-012: Design.md drift notes not reconciled | High | Low (documentation; risk is a future planner misreading the default scale or app types) | Low | Combine with the I-011 fix in the same direct repair. |

Both are direct repairs under their Issues (issue-capture Out-Of-Scope Repair). No Task retreats, and every completed Task keeps `status: done`.

## Observations and owner validation

**Owner validation still needed.** T-020 and T-022 declare `owner_validation.required: true`. O-005 success condition 11 requires the owner's visual verdict. Design.md and T-020 both say the verdict is pending. The owner should record acceptance naming a current `CLEAR` Check: the recheck after I-011 and I-012, not this C-007.

**Nonblocking observations:**
- Several Spike 03 screenshots (laptop, tablet, mobile, mobile sheet) were captured with Readable still selected from the earlier metrics step. The app's default is True, so the owner is not seeing the default 1280×800 view.
- The mobile camera `select` cannot re-apply the preset it already shows (for example after a manual drag), because `onChange` does not fire. Choosing another preset and then returning works. Desktop buttons are unaffected.
- The 30 timeline markers are each a Tab stop. Keyboard users pass through them to reach later controls.
- The T-022 State-independence unit test uses server rendering. Live mount and update are covered only by browser scenarios, as T-022 already states.
- The T-020 work is uncommitted. Per the project rule "Commit at Objective close", commit before the recheck so it has a real diff baseline.
- Generated JSON enters through `as unknown as` casts without runtime validation (`src/mission/apollo11.ts:96-98,188`). This was unchanged in kind by O-005.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [ ] STYLE-02 **One job per function** — `src/shell/AstraeusShell.tsx:61-81` uses one effect for both the selection fallback and the camera-preset fallback.
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [ ] STYLE-06 **Handle errors at boundaries** — generated JSON is cast, not validated (`src/mission/apollo11.ts:96-98,188`).
- [ ] STYLE-07 **One source of truth** — `App.tsx:34` hard-codes the initial `selectedObjectId: "earth"`, while the shell derives the first available object; selection is also pushed to the app both by the effect and inside `selectObject`/`activatePreset`.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs** — commit `3e089e0` adds 1,952 lines across 31 files for three Tasks.
