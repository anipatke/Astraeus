---
id: C-205
scope: {kind: objective, id: O-087}
result: NEEDS WORK
checked_by: {role: checker, session: check-o087-orchestrator-20261122}
executed_session: orchestrate-g024-20261121 (Sonnet builders for T-394..T-400; T-396 repair after T-400's run)
checked_at: '2026-11-22T02:08:24Z'
health_snapshot: sha256:7bb1fbae1cba128d2e4b9fe835fba8f731929756f935c6bae170361cbd3bc5d0
reviewed:
  base_commit: ab920e9d
  head_commit: 994ce09e
  files: [packages/astraeus/src/app/App.tsx, packages/astraeus/src/app/BodySetLabels.ts, packages/astraeus/src/app/FeatureMarkers.ts, packages/astraeus/src/app/OrbitSetView.ts, packages/astraeus/src/app/PathView.ts, packages/astraeus/src/app/SceneLabels.ts, packages/astraeus/src/app/diagnosticsFlag.ts, packages/astraeus/src/app/sceneFrame.ts, packages/astraeus-site/tools/validate/harness.mjs, packages/astraeus-site/tools/validate/driver.mjs, packages/astraeus-site/tools/validate/driver.d.mts, packages/astraeus-site/tools/validate/engine-budget.mjs, packages/astraeus-site/tools/validate/profile-frame-loop.mjs, packages/astraeus-site/tools/validate/run-profile.mjs, .savepoint/Design.md, packages/astraeus/CHANGELOG.md, docs/BROWSER_CHECKS.md]
  dependencies: []
issues: [I-196, I-197]
unmet: [O-087-no-visual-change, T-400-design-note]
supersedes: null
---

# C-205: O-087 Full Objective Check

This is a fresh session. It did not plan or build T-394..T-401. I ran the full browser tier because the diff touches label layout (`SceneLabels.ts`) and label sizes changed after T-400's run. All Task Checks were waived by the owner (`check_waiver` on each Task), so this Check covers the whole diff `ab920e9d..994ce09e`.

**Result: NEEDS WORK.** Every gate is green, the full browser tier passes, and the profiles support condition 1. Two in-scope Issues block CLEAR, both small:

- **I-196:** orbit-set lines no longer finish their budgeted catch-up while the clock is paused (a visible straight chord at the head).
- **I-197:** Design and the changelog name `data-frames-drawn` as opt-in, but it is always on.

## Gates (this session, all fresh)

| Gate | Result |
|---|---|
| `npm run test:full` | 322 files, 5157 passed, 3 skipped; 54 s |
| `npm run lint` / `typecheck` / `build` | pass (8.7 s / 11.6 s / 3.4 s) |
| `npm run check:engine-alone` | 245 files, 3940 passed, 2 skipped; 33.7 s |
| `npm run check:pack` | pass; engine 1,836,199 B raw (limit 1,838,000), 525,620 B gzip (limit 527,000) |
| `npm run check:node-consumer` | 12 passed |
| `npm run measure:example` | first-open 1,836,199 / 525,620 |
| `npm run check:public-build` | pass (4 s) |
| `git diff --check base..HEAD` | clean |
| `npm run check:browser` (full tier, one run) | exit 0, 315 s / 450 s; all 12 steps passed, 0 error lines, first run: smoke 46 s, synthetic-journey 70 s, smoke-public-showers 6 s, planets-phone 12 s, meteor-shower 17 s, views 21 s, look-out 72 s, catalogue 6 s, hello-scene 12 s, hello-react 3 s, hello-planets 4 s, hello-sky 22 s. Evidence: `docs/evidence/browser-20261122T020302Z` |
| `savepoint health check O-087` | snapshot above; "does not block clearance"; coverage and tests instances reported "stale" (optional, a collection statement, not a finding) |

## Success conditions

| # | Condition | Class | Evidence |
|---|---|---|---|
| 1 | Before/after profiles, paused/playing, diagnostics on/off | Proven | `before.json` (commit f7855440) and `after.json` (f5aa9fd4): same Chromium 147, 16 cores, 8 cases × 3 runs. Script time fell in every case (Apollo paused 0.16 → 0.03 s/s). Style recalcs fell. Layout count is flat within the spread. |
| 2 | Diagnostics only with the flag, which the harness sets; a test proves no writes by default; the browser suite passes with it | Proven | `diagnosticsFlag.ts` (strict `=== true`, read once in `createFrameState`). Call-site gates in `sceneFrame.ts`. `frameDiagnostics.test.ts` covers absent, false and true. `harness.mjs` `enableDiagnostics` on page, `openPage` and `openContext`. Full tier green. |
| 3 | Label sizes measured once per label/style change; arithmetic collisions | Proven | `SceneLabels.ts`: ResizeObserver border-box cache, one fallback measure, one `transform` write. The canvas box is read once at the start of `runFrame`. `sceneLabelsLayout.test.ts` (9 cases, including the border-box regression). The look-out, hello-planets and hello-sky "no overlap" steps pass in a real browser. The placement string is unchanged from main, so names sitting over large discs (the owner's question in T-401) is existing behaviour. |
| 4 | No coordinator re-render while the clock is unchanged | Proven | `sameClock` covers every `ClockSnapshot` field (time, playing, rate). `pausedRenders.test.ts` covers both embedding paths. |
| 5 | Unchanged-time early-out for orbit lines; one dirty range per set, none while hidden | Proven, but see 6 | `OrbitSetView` `#sameAsLast` / `#flushPaths`; `PathView` `#synced` / `#placedAt`. `orbitSetSync.test.ts` and `pathViewSync.test.ts` pass. The policy is compared by id: same-id solar-system policies differ only in radii, which orbit lines do not use. |
| 6 | No visual change (owner look) | **Issue (I-196)** | The owner passed every T-401 item on 2026-11-22T01:58:34Z. Independent probe: with more paths than `ORBITS_PER_FRAME` and a clock step that leaves 18 stale, main finishes the catch-up during paused frames (head chord 27,872 → 1,050 km). O-087 freezes it (27,872 km) until time changes. The owner's items did not cover pause-after-fast-play. |
| T-400 | Design reconciled with the drift notes | **Issue (I-197)** | Section `### A lighter frame loop (O-087)` exists and accounts for T-395..T-399, but it gives `data-frames-drawn` (always written, `LayeredRender.tsx:39`) as its opt-in example. The CHANGELOG 0.10.0 line has the same error. |

Owner choices verified as applied: the raw cap is 1,838,000 ("Raise cap by 2,000 B") in `engine-budget.mjs`, the `publicBuild.test.ts` pin, `BROWSER_CHECKS.md` and Design. The `skyFigures.test.ts` assertion was changed ("Update the test") with its setup untouched.

## Owner validation

T-401 `owner_validation.required: true`. The owner's answer (2026-11-22T01:58:34Z, "1. Works fine, but they sit over their object which is OK ? 2. Yes 3.Y 4Y 5Y") is in T-401's Technical Evidence. This Check is not CLEAR, so `accepted_check` is not written. The checker never records owner acceptance on the owner's behalf. For the re-check: the I-196 repair changes `OrbitSetView.ts`, which falls under owner item 3. The re-check assesses carry-forward of the owner's look. A repair that only restores the paused catch-up leaves item 3 (lines while playing, hide/show) unchanged.

## Matrix (summary)

- **Entry points:** `mount` and `AstraeusScene` (pausedRenders), frame stages (sceneFrame tests), `SceneLabelLayer`, `OrbitSetView`, `PathView`, `FeatureMarkerLayer.update(readout)`, harness and driver (browserDriverGuard).
- **Flag:** absent, false and true are tested. A truthy non-`true` value gives no readouts (strict compare, by reading). A flag set after mount is ignored (read once, documented).
- **Orbit sets:** unchanged, time, policy, enabled and placement are tested. Hidden for 100 frames, then shown: tested. A stale backlog when the clock stops is **Issue I-196**.
- **Paths:** value-equal look, each look field, origin and screen are tested. Not applicable: an async chunk load while paused (the same no-resample behaviour as on main for orbit sets; not probed for paths).
- **Labels:** size cached or not, ResizeObserver absent, border box versus content box, hidden label reporting 0. The real browser covers the rest.
- **External boundary (browser runner):** one full-tier run, no reruns. Profile runner: evidence reviewed, not rerun (per the brief).

## Materiality

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-196 | Medium: a set with more than 12 orbits (planets pages) paused after fast play | Low: a straight chord at some heads while paused; heals on the next time change | Low–Medium | Fix now. Keep the early-out only once no path is stale, e.g. set a pending flag when the budget runs out. |
| I-197 | High (always read as written) | Low: a wrong example in Design and the changelog | Low | Fix now, combined with I-196 (two one-line doc edits) |

## Observations (non-blocking)

- `after.json` was recorded at f5aa9fd4, before the T-396 border-box repair (bc6e43c0). The repair changes only which box is cached and adds no per-frame work.
- The Saturn profile rows read 0 frames drawn and 0 layouts, even while playing. Only the script and style-recalc rows carry signal there (T-394 and T-400 both say so).
- When a label's style changes (for example on selection), the ResizeObserver reports one frame later, so for one frame the arithmetic uses the old size.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock (gates and browser runner only; no persistence in scope)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (not a feature here)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: first run)
- [x] Verify File Reality (every evidence path exists; run folders cited in the Tasks are present as untracked folders)
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**
