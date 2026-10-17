---
id: C-065
scope: {kind: task, id: T-081}
result: CLEAR
checked_by: {role: checker, session: o020-orchestrator-20261018}
executed_session: t081-builder-20261017
checked_at: '2026-10-18T02:00:00Z'
reviewed:
  base_commit: 6338e2e
  head_commit: 9c505a0
  files:
    - src/shell/phoneLayout.ts, phone.css, controls.css (new)
    - src/shell/ControlsDrawer.tsx, Sources.tsx, useDrawerSwipe.ts, useSwipeToDismiss.ts (new)
    - src/shell/AstraeusShell.tsx, InfoPanel.tsx, ObjectControls.tsx, ProvenanceBadge.tsx, ScaleControl.tsx, StoryPanelView.tsx
    - src/shell/TimelineBar.tsx, TimelineBar.css, TopBar.tsx, TopBar.css, style.css, timelineModel.ts, topBarIcons.tsx
    - src/app/App.tsx
    - tests/phoneLayout.test.ts
    - tools/validate/driver.mjs, browser-phone.mjs (new), browser-controls.mjs (new), browser-story-panels.mjs, run-full.sh
    - docs/BROWSER_CHECKS.md
  dependencies: ['T-079 (C-060 CLEAR)', 'T-080 (C-061 CLEAR)', 'T-083 (C-062 CLEAR)']
issues: []
supersedes: null
---

# C-065: T-081 Task Check (Quick)

## Scope Lock

1. T-081 Done When 1-8 (owner_validation not required on this Task; the owner's laptop-and-phone look is T-082's).
2. Lane o020-t081 at b8bee5e, merged into o018-o019 (no conflicts); later commits on the same head: the orbit-look script made steady (6083228), the I-035 trail cap (d54c4ef), records only after that.
3. O-020 Decision 13 (owner, 2026-10-17): the phone information sheet sits above the timeline, replacing the mock-up's bottom-edge sheet.

## Invariants and probes

| Criterion | Actual | Evidence |
|---|---|---|
| DW1 mock-up, breakpoints | One phone rule (`PHONE_QUERY`: narrow, or short touch screen turned sideways) sets `data-phone`; `phone.css` keys on it; desktop above it unchanged apart from the shared control look (Drift Note). | `src/shell/phoneLayout.ts`, contact sheets |
| DW2 drawers | Top drawer (pill and cog) and timeline drawer (handle: speed slider, events) open and close by tap and swipe on the handle only; scene drag never opens one; state kept; reduced motion and safe areas in the stylesheet (safe areas read from the stylesheet, not emulable headless); 44 px targets; no horizontal scroll. | `browser-phone.mjs` portrait and landscape, `tests/phoneLayout.test.ts` |
| DW3 sheets, Sources | Information and story sheets share `useSwipeToDismiss`; `Sources.tsx` is one collapsible part, closed by default, used by the information and story panels; driver opens it before reading. | diff, browser-story-panels, browser-phone |
| DW4 Play not covered | Sheets sit above the timeline (Decision 13); browser-phone asserts the sheet clears the bar and Play. | browser-phone |
| DW5 settings | Animation time, drawer and sheet heights, swipe distance: live "Phone layout" group. | `phoneLayout.ts`, App.tsx |
| DW6 glow on phone | The T-084 glow shows in the phone timeline. | contact sheet |
| DW7 one control style | `controls.css` owns buttons, icon buttons and dropdowns (36 px desktop, 44 px phone); per-component overrides removed; `browser-controls.mjs` compares computed styles and row baselines at 1440x900 and 390x844 (31 states pass; it caught one dropdown padding mismatch, fixed). | browser-controls |
| DW8 phone check in the full run | `browser-phone` and `browser-controls` added to `run-full.sh`. Checker: on the merged head `npx tsc --noEmit` 0, driver guard pass, `npx vitest run` 967 passed 1 skipped, `npm run build` 0; `run-full.sh docs/evidence/o020-head-20261017T223908Z` 24/24 exit 0, error-lines 0, 710 s. The first merged run (`o020-merged-t081-20261017T221925Z`) failed only orbit-look, a script defect (whole-canvas sum with the clock running and panels over the canvas), fixed in 6083228 (scene only, clock paused; 3/3 alone, `docs/evidence/o020-orbit-look-steady-20261018`). | summaries |

## Issues Pass

DW1-DW8 Proven. No Issues. No materiality actions are required.

## Observations (non-blocking)

1. The contact sheet of the first merged run showed the I-035 trail as a wide band in Apollo's close Moon view; that is I-035 (trail width at true scale), not T-081, and was capped with the owner's decision (d54c4ef).
2. Picture differences against the O-017 baseline: desktop 2.9-8.4% (shared control look, Events button, T-084 glow), phone 6.4-12.4% (new phone layout); site pages 0%. A new baseline is T-082's job.
3. Drift Notes for Design reconciliation: landscape phones use the phone layout; picking an object on a phone closes the top drawer; compact speed labels on phones; Sources moved out of the badge detail; desktop controls 36 px / 13 px, Play 36 px (was 40).

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
