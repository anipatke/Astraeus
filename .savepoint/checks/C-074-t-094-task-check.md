---
id: C-074
scope: {kind: task, id: T-094}
result: CLEAR
checked_by: {role: checker, session: o020-orchestrator-20261018}
executed_session: t094-builder-20261018
checked_at: '2026-10-18T05:15:00Z'
reviewed:
  base_commit: 95a99a1
  head_commit: 12880c6
  files:
    - app.html
    - src/shell/bootLoader.ts (new), tests/bootLoader.test.ts (new)
    - src/main.tsx, src/app/AstraeusScene.tsx, src/app/App.tsx
    - tools/validate/driver.mjs, tools/validate/browser-lite.mjs
  dependencies: ['T-091 (C-073 CLEAR)']
issues: []
supersedes: null
---

# C-074: T-094 Task Check (Quick)

## Scope Lock

1. T-094 Done When 1-6; 7 is owner validation (switching showers and opening each demo), still pending.
2. Lane o024-t094 at 12880c6 merged into o018-o019 with no conflict; T-095 then merged with one driver conflict (two additions in the same place), resolved by keeping both.

## Invariants and probes

| Criterion | Actual | Evidence |
|---|---|---|
| DW2 in the page, generic | Markup and inline CSS in app.html (a few hundred bytes): faint ring, orange body round it every 2.4 s, "Loading" label; no demo names; `pointer-events: none`. | app.html |
| DW3 fade and failure | `hideBootLoader()` on the scene's first drawn frame fades then removes it; a failed start swaps it for a reload message and rethrows (new: the app had no load-failure message before). | `src/shell/bootLoader.ts`, `src/main.tsx`, tests |
| DW4 reduced motion, setting | Still version under reduced motion; fade time from `?loadfade=`, a saved Developer setting (next load) or 0.6 s. | tests |
| DW5-6 every demo, checks | browser-lite checks, per experience at desktop and phone, the loader at first paint and gone when ready. Builder runs: the first found a real fault (a phone tap landed on the fading loader; fixed with `pointer-events: none`); the second failed only earth-moon's 44 px ⓘ check. Checker: merged head (T-094 + T-095) `npx tsc --noEmit` 0, driver guard pass, `npx vitest run` 1022 passed 1 skipped, `npm run build` 0; `run-full.sh docs/evidence/o024-head-20261018T035212Z` 23/24, the same earth-moon check failing. Cause found: the driver measured the ⓘ while the phone drawer was still sliding open; fixed in the driver (98efc61, wait for the drawers to settle after opening); the check then passed 3 times alone and 3 times in parallel at load 18 (`docs/evidence/o024-drawer-settle-20261018`). | summaries |

## Issues Pass

DW1-DW6 Proven. The earth-moon failure was a driver race, not this Task; repaired directly. No Issues. No materiality actions are required.

## Observations (non-blocking)

1. Owner validation pending.
2. The fade setting applies on the next load (no live preview); Design.md's public-site section should mention the loader (O-024 integration).
3. The next full run (T-092's merge) re-proves the driver fix inside the full run.

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
