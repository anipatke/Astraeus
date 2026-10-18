---
id: C-073
scope: {kind: task, id: T-091}
result: CLEAR
checked_by: {role: checker, session: o020-orchestrator-20261018}
executed_session: t091-builder-20261018
checked_at: '2026-10-18T03:40:00Z'
reviewed:
  base_commit: 88c5d02
  head_commit: 28072f2
  files:
    - src/experiences/showers/showerChoice.ts (new), src/shell/SwitchControl.tsx (new), tests/showerChoice.test.ts (new)
    - src/main.tsx, src/app/App.tsx, src/app/experienceDefinition.ts, src/shell/AstraeusShell.tsx, src/shell/TopBar.tsx, src/shell/TopBar.css, src/shell/phone.css
    - data/showers/perseids.json, data/showers/geminids.json (an `order` field only)
    - index.html, README.md, docs/BROWSER_CHECKS.md, tests/homePage.test.ts, tests/publicBuild.test.ts
    - tools/validate/driver.mjs, load-budget.mjs and the browser scripts that named the old addresses
  dependencies: []
issues: []
supersedes: null
---

# C-073: T-091 Task Check (Quick)

## Scope Lock

1. T-091 Done When 1-6; 7 is owner validation (switching between the showers), still pending.
2. Lane o024-t091 at 28072f2 from 88c5d02, merged into o018-o019 without conflict. Main between them changed only the Earth–Moon eclipse panel and its test (I-039), covered by C-072's full run; no file overlap.

## Invariants and probes

| Criterion | Actual | Evidence |
|---|---|---|
| DW1 one experience | `showers` with a shower choice from the address (`?experience=showers`, `&shower=geminids`); Perseids default by each shower file's `order`; unknown name opens the default. | `showerChoice.ts`, `tests/showerChoice.test.ts` |
| DW2 switch | Generic `switcher` on the experience definition rendered by `SwitchControl` (no shower names in the shell, ARCH-01), first group of the top bar and so in the phone drawer, shared control styles, accessible name "Shower". Switching reloads at the new address with `view` and `t` dropped (the Task's allowed fallback; Drift Note 1). | diff |
| DW3 one shower's data | Only the chosen shower's orbit file is requested (browser check); load budget lists Showers and Showers with Geminids, no limit raised (10.7 MB of 11.19, 13.2 MB of 13.79). | load budget, browser-showers `checkSwitch` |
| DW4 link and old addresses | The view link keeps `shower` and round-trips; old addresses removed with no redirect and open the default experience (asserted); README, home page and docs updated. | browser-view-link, browser-showers |
| DW5 data stays data | Shower files gain only `order`; stories unchanged. | diff |
| DW6 checks | `checkSwitch` at desktop and phone covers both directions, back again, removed, default and unknown addresses; prior scenarios kept through the driver. Builder: `run-full.sh docs/evidence/o024-t091-full-20261018T013907Z` 24/24, error-lines 0. Checker on the merged head: `npx tsc --noEmit` 0, driver guard pass, `npx vitest run` 1016 passed 1 skipped, `npm run build` 0. | summaries |

## Issues Pass

DW1-DW6 Proven. No Issues. No materiality actions are required.

## Observations (non-blocking)

1. The home page shows four cards (one showers card) until T-093 reworks it.
2. `capture-experience-pictures` still takes a Perseids and a Geminids picture; T-093 settles the baseline set.

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
