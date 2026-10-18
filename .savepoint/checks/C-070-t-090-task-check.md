---
id: C-070
scope: {kind: task, id: T-090}
result: CLEAR
checked_by: {role: checker, session: o020-orchestrator-20261018}
executed_session: t090-builder-20261018
checked_at: '2026-10-18T05:30:00Z'
reviewed:
  base_commit: 023b55a
  head_commit: fe83e49
  files:
    - src/shell/Collapsible.tsx (new)
    - src/app/App.tsx
    - src/app/FrameRateSection.tsx
    - src/app/style.css
    - tests/collapsible.test.ts (new)
    - tools/validate/driver.mjs
    - tools/validate/browser-phone.mjs
  dependencies: ['T-081 (C-065 CLEAR)', 'T-086 (C-067 CLEAR)']
issues: []
supersedes: null
---

# C-070: T-090 Task Check (Quick)

## Scope Lock

1. T-090 Done When 1-5; 6 is owner validation (the panel on laptop and phone), still pending. Done When 2's owner approval of the grouping is recorded in the Task (2026-10-18).
2. Lane o020-t090 at fe83e49, branched from 023b55a; main between them changed only `.savepoint` records, so the lane's full run covers the merged code.

## Invariants and probes

| Criterion | Actual | Evidence |
|---|---|---|
| DW2 inventory, grouping | Eight groups as approved (This demo; Camera and view; Timeline and stories; Orbit lines with a nested Fine-tune fold; Sky and Sun; Labels; Phone layout; Under the hood); full old-to-new inventory in the Task evidence; nothing dropped. One placement not in the approved list: Frame rate, put in Under the hood beside Scene instrumentation (diagnostics). | Task evidence, App.tsx |
| DW3 folds | First present group open, the rest closed; state in localStorage behind try/catch with a default; heading is a button with `aria-expanded`/`aria-controls`, body a labelled group not drawn while closed; 44 px on phones. | `src/shell/Collapsible.tsx`, `tests/collapsible.test.ts`, browser-phone (portrait and landscape: only the first open, 44 px, press opens, survives reload, press closes) |
| DW4 one shared part | One `Collapsible` for groups and the nested fold; shared control styles. | diff |
| DW5 names, driver, runs | Accessible names and test ids unchanged; the driver expands all groups when it opens the panel, so no script changed to reach a control; `closeInfoStrict` falls back to an in-page click when the expanded panel covers Close (driver only). Checker on the merged head: `npx tsc --noEmit` 0, driver guard pass, `npx vitest run` 1012 passed 1 skipped, `npm run build` 0. Builder: `run-full.sh docs/evidence/o020-t090-full-20261018T005955Z` 24/24 exit 0, error-lines 0 (two earlier runs kept as logs: spike02 Close covered, fixed in the driver; one lite socket hang-up, passed on rerun). | summaries |

## Issues Pass

DW1-DW5 Proven. No Issues. No materiality actions are required.

## Observations (non-blocking)

1. Owner validation pending; Frame rate's placement is one line to move if the owner prefers.
2. Design.md's developer-panel description is left for the O-020 integration account.

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
