---
id: C-219
scope: {kind: objective, id: O-097}
result: NEEDS WORK
checked_by: {role: checker, session: check-o097-20261124}
executed_session: orchestrate-o097-20261124 (T-449..T-451 builders, coordinator)
checked_at: '2026-11-24T07:53:00Z'
health_snapshot: sha256:7d792671058f7634379372504fa4cb6934d7d287298b8c7149f075f6bc5f103a
reviewed:
  base_commit: 4438469c
  head_commit: 221b41f6
  files: [packages/astraeus/src/shell/parts/parts.css, packages/astraeus/src/shelf/chart/View.tsx, packages/astraeus/src/shelf/chart/markRows.ts, packages/astraeus/tests/chartMarkRows.test.ts, packages/astraeus/tests/panelWrap.test.ts, packages/astraeus-site/src/catalogue/examples/chart.ts, packages/astraeus-site/src/catalogue/examples/explainer.ts, packages/astraeus-site/tools/validate/driver.mjs, packages/astraeus-site/tools/validate/journey-catalogue.mjs, packages/astraeus-site/tools/validate/browser-steps.mjs, tools/gate-limits.json, docs/BROWSER_CHECKS.md, docs/architecture/viewer-interface.md, packages/astraeus/CHANGELOG.md, .savepoint/Design.md]
  dependencies: []
issues: [I-207]
unmet: [O-097-SC3-chart-labels-never-overlap, browser-gate-catalogue]
supersedes: null
---

# C-219: O-097 Full Objective Check

Fresh session; it did not plan, build, coordinate or repair O-097. Diff `git diff main...HEAD` on branch `o097-panel-text-and-chart-labels` (`4438469c..221b41f6`, 21 files). T-449, T-450 and T-451 are `done` with owner `check_waiver`s ("orchestrate O-97"); this Check covers all three. The uncommitted T-388 (O-086) change, untracked `docs/evidence/*` and `docs/research` are outside scope.

**Result: NEEDS WORK.** Two things are open.

1. **I-207 (low).** The panel half is proven. The chart half holds at the default text size, but the label row height is a fixed 12 chart units while the label font follows the public `textSizePx` (11 to 18). At 17 and 18, two close labels in adjacent rows overlap by more than the `catalogue` step's own quarter-box rule. From 15 upward, the upper label's descenders reach into the lower label.
2. **The `catalogue` browser step exited 1 on one environmental console line.** The phone page logged `Failed to load resource: net::ERR_NETWORK_CHANGED`; C-178, C-207 and C-215 saw the same host network change. Every assertion in the step ran and passed at both sizes, including the new long-word and mark-label checks: `results` holds both viewports, there is no `failure`, and the step took 8 s of its 16 s limit. The step was not rerun under the one-command rule, so the browser gate is recorded as not green. The I-207 repair changes `shelf/chart/`, so it needs the `catalogue` step again in the recheck anyway.

Every other gate passes and Code Health does not block.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix (browser runner only: its own dev servers on their own ports and the scratch public build; the owner's :5490 was untouched; the one network-change console line is classified above; no other external boundary)
- [x] Workflow And Side-Effect Check Lock (n/a: CSS rules and a pure layout plus a measure-then-place layout effect; no persistence, artifacts or multi-step writes; the layout effect's convergence is in the adversarial pass)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (n/a: not a feature of this scope)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (n/a: initial Check)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope lock

1. Criteria: the Objective's six Success Conditions (SC1 to SC6 below, in order) and its Decisions. These are the sizes 1280x720 and 375x667 with touch; one driver check per part with `nowrap` and chart SVG text left out; widths measured in the browser so that rows follow the host's text size, with no new chart input; the owner's two example changes ("Yes, change both"); and the owner's `catalogue` limit of 16 s ("Keep 16 seconds"). Also the Tasks' Done When lists and the Guardrails they name: TEST-01..03, STYLE-*, CODE-01.
2. Entry points: the shared panel CSS (`.info-panel`, which also covers About, the body card and the tile card and sheet; and `.story-panel`); the `chart` factory and `ChartControl` through `ChartView`; the public look `LookInput.interface.textSizePx` (11 to 18), which sets the label font; `placeMarkRows`; and the `catalogue` driver functions.
3. Relied-on runtime: browser layout of flex and inline text, `getComputedTextLength`, React layout effects, the catalogue page and its examples.
4. Axes. Text classes: a 120-character word with no break opportunity, ordinary text, a short button label. Surfaces: the eight shelf parts and story panels. Sizes: 1280x720 and 375x667. Mark layouts: one mark, far apart, a cluster (Kirkwood), an edge mark, a label wider than the chart. Host text size: the default 14 through the maximum 18. Mutation: the fix removed (fails-without-fix). Not applicable: wide characters and emoji (the rule is `overflow-wrap: anywhere`, which is independent of class), serialization (none), state transitions beyond redraw (the chart has no state of its own).
5. Admission: a reproducible violation, through a public entry point or setting, of a Success Condition or Decision above.

## Coverage matrix

| SC | Evidence (this session) | Result |
|---|---|---|
| SC1: a long word in every wrapping text of all eight parts stays inside the panel at both sizes | Browser `catalogue` (07:50:36Z to 07:50:44Z): `catalogueLongWordFit` asserted for the six bar-button panels, the chart panel and the tile card (wide) and sheet (phone), at both sizes. Every assertion passed; `results` holds desktop and phone with no `failure`. T-451's fails-without-fix: with `parts.css` from 7c471a7e, "scrollWidth 2363 of clientWidth 358; past the edge: h2 +1948px". This stands in for T-449's live cause probe, which T-449's builder could not run. Reviewed: the driver walks every non-empty text node, skips only the close glyph, SVG text and `nowrap` (each one commented), waits two frames and checks scrollWidth and every element's right edge against the content box | Pass (assertions); step exit 1 on an environmental console line |
| SC2: one shared rule; a CSS test fails if it is lost; text that fits is unchanged; Close never breaks; look tests unedited | `parts.css`: `:is(.info-panel, .story-panel) { overflow-wrap: anywhere }`, `> * { min-width: 0 }`, `min-width: 0` on both `h2` rules, `flex: none` on both Close buttons; no part sheet changed. `panelWrap.test.ts` (4 cases) asserts each declaration. `lookDrift`, `computedLook` and `domStorySteps` pass unedited in `npm test`. The owner looked on :5490 at 03c9be33 ("both look fine, carry on") | Pass |
| SC3: labels never overlap; further rows; a one-row chart unchanged (`0 0 320 156`); labels inside the width; Kirkwood unit test; catalogue cluster in two rows at both sizes | `chartMarkRows.test.ts` (5 cases): Kirkwood no-overlap and inside, far apart, single mark, edges, happy-dom render with a taller viewBox and `0 0 320 156` for one mark. Reviewed: the row-0 geometry is identical to main's (text `y = TOP - 8`, line `y1 = 18`, unclamped anchors unchanged). Browser `catalogue`: at least 2 labels, no overlap beyond the quarter rule, inside the svg, at least 2 rows at both sizes, all passed. Fails-without-fix in T-451: "Limit" and "Survey edge" overprint, 28.9 x 14.0 px. **Probe at host text sizes 14 to 18 (I-207):** box overlap 0.58 / 1.58 / 2.58 / 4.58 / 5.58 px against the quarter limits 3.5 / 3.75 / 4.0 / 4.5 / 4.75 px; glyph-extent gap +1.43 px at 14, then -0.57 / -0.57 / -0.57 / -1.57 px | **Issue I-207** (default size passes; 17 and 18 fail the step's own rule) |
| SC4: both browser checks fail without their fix; no existing test or browser assertion edited, removed or loosened | T-451 evidence records both failures (above). `git diff main...HEAD` adds only two new test files under `tests/`. In `journey-catalogue.mjs` the only change to an existing line is `pressCataloguePanelButton(page, actions, BAR_BUTTONS.actions)`, which passes the same "Fly to"/"Fly" names as before (the regex is now built from the list). `browserDriverGuard` passes in `npm test` | Pass |
| SC5: CHANGELOG 0.11.0 has two `Fixed` lines; viewer-interface section 11 states both rules | Both `Fixed` lines are in the open 0.11.0 section. Section 11 has the One-contract wrap line and the `chart` row's further-rows clause | Pass |
| SC6: engine under 527,000 B gzip; the `catalogue` limit raised only to cover the checks, with the measured times as the reason | `check:pack`: engine **525,853 B gzip** (cap 527,000; +42 B against main's 525,811), 1,833,752 B raw (cap 1,838,000). Limit 10 to 16 s on measured 9/12/9/9/12/9 s, with the owner's "Keep 16 seconds". This run: 8 s | Pass |

## Adversarial pass

- **Row height against text size (bypass through a public setting).** Widths are measured, but `ROW = 12` (`View.tsx:16`) is fixed while `--astraeus-text-xs = textSizePx * 11 / 14`. This finding became I-207. The probe was a headless Chromium run on a static SVG that copies View.tsx geometry and `markRows.ts`, with the catalogue chart's two marks, a 358 px chart and the shell font stack. It was run once under the browser lock (07:51:13Z) from the session scratchpad; it is not committed and is not part of the browser gate.
- **The quarter-box tolerance (T-451's change from the plan).** At the default size, labels one row apart overlap by 0.6 to 1.5 px of box (the font's line gap), which is 4 to 11 % of the box. Two labels in one row overlap by the full box height. A quarter therefore cleanly separates "adjacent rows" from "overprint" and still caught the real regression (14.0 px of 14). I judge it sound. Its blind spot is the text-size axis, which I-207 covers.
- **Layout effect convergence.** The effect runs after every render. `setMeasured` bails out when the key (the labels) and the widths are unchanged, and the widths do not depend on placement, so a render settles in one extra pass. A runtime host change to `textSizePx` does not re-render the chart, so the widths can stay stale until the next render (observation 2).
- **A min-width override from the shared rule.** `.astraeus-shell :is(.info-panel, .story-panel) > *` (specificity 0,2,0) beats `.astraeus-shell :where(.story-panel-continue) { min-width: var(--astraeus-hit) }` (0,1,0). The Continue button is a direct child of `.story-panel`. Its label "Continue playback" is far wider than 44 px and it is `align-self: flex-start`, so its rendered width does not change; only the declared floor is gone (observation 3). The `meteor-shower` step, which opens a story panel, passed.
- **Flex rows with `overflow-wrap: anywhere`.** This lowers the min-content of every flex item in a panel. The header Close buttons are `flex: none`; chip rows wrap before they shrink (`flex-wrap`); the fit and crossing-text checks in `catalogue` and the story-panel step pass. No short label was seen breaking.
- **Flakiness (T-451's single 60 s timeout).** This run's `catalogue` reached every example in 8 s with no timeout. One run cannot settle it (observation 4).

## Gates (this session, branch at 221b41f6)

| Gate | Start (UTC) | Time | Result |
|---|---|---|---|
| `npm run typecheck` | 2026-11-24T07:44:52Z | 8 s | pass |
| `npm run lint` | 07:45:00Z | 7 s | pass |
| `npm test` (junit) | 07:45:07Z | 38 s | 345 files, 5610 passed, 2 skipped |
| `npm run build` | 07:45:45Z | 3 s | pass |
| `npm run check:pack` | 07:45:48Z | 24 s | pass; engine 525,853 B gzip of 527,000; 1,833,752 B raw of 1,838,000 |
| `npm run check:node-consumer` | 07:46:12Z | 7 s | pass |
| `npm run measure:example` | 07:46:19Z | 4 s | pass; first-open 1,833,752 B raw, 525,853 B gzip |
| `npm run check:shelf-split` | 07:46:23Z | 4 s | ok, no other part's marker class in the emitted JS |
| `git diff --check main...HEAD` | 07:46:52Z | 0 s | clean |
| `npm run check:browser -- --tier quick --step look-out --step catalogue --step synthetic-journey --step meteor-shower --skip-examples` (under `flock`, lock taken at once) | 07:46:52Z to 07:50:44Z | 231 s of a 441 s limit | **exit 1.** smoke 45 s, synthetic-journey 70 s, smoke-public-showers 6 s, planets-phone 8 s, meteor-shower 20 s, look-out 70 s: all exit 0 with error-lines=0. catalogue 8 s (limit 16 s): every assertion passed at both sizes, exit 1 on one console line, `phone console: Failed to load resource: net::ERR_NETWORK_CHANGED`. Evidence `docs/evidence/browser-quick-20261124T074653Z/`, logs `/tmp/astraeus-check-logs-CnRU0z/` |

Browser step choice (browser-policy.md). `look-out` because `packages/astraeus/src/shell/parts/parts.css` is a Layout path (a `.css` under `packages/astraeus/src`, under `shell/`). `catalogue` because `src/shelf/` (chart), `src/catalogue/` and its own script changed. `synthetic-journey` because the shared panel CSS under `shell/` changes the phone panels (the policy says to add a step when unsure). `meteor-shower` because the `.story-panel` rules changed and that step opens a story panel. Examples are skipped: no packaging, `examples/` or public API change (`api-surface.lock.json` is unchanged). The driver functions changed or added (`pressCataloguePanelButton`, `catalogueLongWordFit`, `catalogueChartMarks`) are called only by `journey-catalogue.mjs`.

## Code Health

`savepoint health check O-097` (07:51:25Z) created snapshot `sha256:7d792671…5f103a`: "Code Health does not block clearance." Complexity, duplication and dependency vulnerabilities: no finding. Tests: 0 failing, but marked stale. Coverage: stale, as expected, because coverage is refreshed at release. The tests reading is most likely stale because the browser run wrote new files after `junit.xml`; the gate's own result above is current. This is a collection note, not a finding. No other snapshot was produced in this session.

## File reality

Every file named in the three Tasks' evidence exists at HEAD. `markRows.ts`, `chartMarkRows.test.ts` and `panelWrap.test.ts` are new. T-451's proof swaps were restored: `parts.css` and `View.tsx` match HEAD, and the working tree shows only the out-of-scope T-388 change. T-450's `part.css` was planned but not changed, and its evidence says so. No phantom files.

## Design reconciliation

None of the three Tasks has an open drift note (T-450's note asked for the viewer-interface `chart` row, which T-451 wrote). `.savepoint/Design.md` `Viewer interface` carries the O-097 sentence (221b41f6), and it matches the code: one shared rule in `shell/parts/parts.css`, `shelf/chart/markRows.ts`, and the `catalogue` step proving both. The `docs/BROWSER_CHECKS.md` row and limit match `tools/gate-limits.json`; `gateLimits.test.ts` passes.

## Guardrails

TEST-01: each change has named outcome evidence. TEST-02: there is a regression test per fix (`panelWrap.test.ts`, `chartMarkRows.test.ts`) plus browser fails-without-fix. TEST-03: the existing tests are named. TEST-04: owner waivers are on all three Tasks. CODE-01: lint passes (the complexity rule is in lint). The TEST-01 gap on the text-size axis is I-207.

## Issues

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-207: chart label rows overlap at host `textSizePx` 17 to 18 (glyphs touch from 15) | Low: a host must pick a large text size and have marks close together | Low to Medium: descenders print into the label below by 0.6 to 1.6 px, which is the very overprint this Objective removes, though mild | Low to Medium | Fix now as a direct repair under I-207: take the row height from the measured label box height (12 as the fallback), add a test that fails if the row height stops following the text size, then recheck with the `catalogue` step |

The browser gate is not an Issue (the code is not at fault). It is the `unmet` item `browser-gate-catalogue`: the recheck reruns `npm run check:browser -- --step catalogue` once. Because the I-207 repair touches `src/shelf/chart/` only (no CSS), no other step is needed, and every other result here can be reused if nothing else changes.

## Owner validation

T-449 and T-450 declare `owner_validation.required`. The owner's look at 03c9be33 ("both look fine, carry on") is recorded in each Task's body; `git diff 03c9be33 221b41f6` touches only the browser scripts, docs, the gate limit and records, so the look covers the code checked. The coordinator fills the acceptance fields (this Check does not). The I-207 repair would change chart drawing only at text sizes above the default; at the default size the catalogue chart the owner saw is unchanged.

## Observations (non-blocking)

1. `markRows.ts` decides the anchor side with `x > chartWidth / 2`, and `View.tsx` repeats the same test for `textAnchor`. These are two copies of one rule (STYLE-07). The per-character fallback width (`CHAR = 6`, used when nothing is measured) has no direct test, because the render test mocks a measured width.
2. A host that changes `textSizePx` on a live viewer does not re-render the chart, so the measured widths stay as they were until the next chart render. Rows are recalculated on that render.
3. The shared `> * { min-width: 0 }` overrides the `story-panel-continue` 44 px `min-width` floor. Its rendered width is unchanged because the label is long, but the touch-target rule now rests on the label length alone.
4. T-451's one 60 s timeout (panel example reaching `running`) did not recur here (`catalogue` 8 s). It sits in the first section, before any O-097 code runs, which points at page or server load rather than the new checks. If it recurs it deserves its own Issue.
5. T-450's stated limitation stands: in a cluster, a higher row's dashed line can cross a lower row's label. Lines are not labels, so this is outside SC3.
6. The phrase "clipped at the left edge" in `markRows.ts` means a label wider than the chart starts at 0 and runs past the right edge. That is the stated limit; the wording is loose.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [ ] STYLE-03 **Test branches** — the per-character width fallback in `View.tsx` (`CHAR = 6`) is never exercised; `chartMarkRows.test.ts` mocks `getComputedTextLength` to 34.
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth** — the anchor-side rule `x > width / 2` is in both `markRows.ts` and `View.tsx`.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**
