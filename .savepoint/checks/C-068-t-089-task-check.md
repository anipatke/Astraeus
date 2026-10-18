---
id: C-068
scope: {kind: task, id: T-089}
result: CLEAR
checked_by: {role: checker, session: o020-orchestrator-20261018}
executed_session: t089-builder-20261018
checked_at: '2026-10-18T03:50:00Z'
reviewed:
  base_commit: 92559e4
  head_commit: aaab63d
  files:
    - data/stories/geminids/panels.json (new), data/stories/earth-moon/panels.json (new), data/stories/jupiter-io/panels.json (new)
    - data/showers/geminids.json
    - src/experiences/earth-moon/earthMoonExplorer.ts, src/experiences/jupiter-io/jupiterIo.ts
    - tools/validate/load-budget.mjs
    - tests/storyStoriesAllDemos.test.ts (new), tests/publicBuild.test.ts, tests/showers.test.ts
    - tools/validate/driver.mjs, tools/validate/browser-story-panels.mjs
  dependencies: ['T-087 (C-066 CLEAR)']
issues: []
supersedes: null
---

# C-068: T-089 Task Check (Quick)

## Scope Lock

1. T-089 Done When 1-6; 7 is owner validation (the owner reads the nine panels on the preview), still pending.
2. Lane o015-t089 at aaab63d, branched from 92559e4, merged into o018-o019 after T-086 without conflict.

## Invariants and probes

| Criterion | Actual | Evidence |
|---|---|---|
| DW1 voice and rules | Nine panels, two to four short sentences, at most one everyday number, no acronyms; figures, caveats and comparisons' working in `details`; a test enforces the plain-voice rules. Checker read all nine: plain, warm, honest (e.g. the scene draws no red Moon; Io from approximate elements; Phaethon's position uncertainty and two published sizes). | `tests/storyStoriesAllDemos.test.ts`, panel files |
| DW2 moments | As proposed: Phaethon at perihelion, the best shower, the peak; same face, drifting away, the 14 March 2025 eclipse; volcanoes, tidal squeezing, the 4:2:1 rhythm. First Earth-Moon and Jupiter-Io panels near the start for pacing (stated in details). | panel files |
| DW3 story data, generic wiring | Panels under `data/stories/<story>/`; Geminids through settings only; Earth-Moon and Jupiter-Io pass their file through `parseStoryPanels` as Apollo does; shell and engine unchanged. One generic fix: the public load budget admits several same-stem chunks only when a listed script imports them, with a negative proof; no limit raised. | diff, `proveSameStemChunks`, `tests/publicBuild.test.ts` |
| DW4 times | Every panel inside its window; the Geminids' narrowed activity view keeps the two December panels (as the Perseids). | tests, browser-story-panels |
| DW5 sources | Published sources on every panel (JPL SBDB, NASA pages and fact sheets, Goddard eclipse catalogue entry 09706, AMS, IAU MDC, peer-reviewed papers); eclipse greatest 06:59:56 UT pinned by a test. | panel files |
| DW6 checks | browser-story-panels covers the three stories (open in order, badge, title, source, one folded section with details, marker reopens). Builder: full run 1 22/24 kept as history (load budget, fixed; spike02 load timeout, passed alone); full run 2 `docs/evidence/o015-t089-full-20261017T234644Z` 24/24, error-lines 0. Checker on the merged head (T-086 + T-087 + T-089): `npx tsc --noEmit` 0, driver guard pass, `npx vitest run` 982 passed 1 skipped, `npm run build` 0. | summaries |

## Issues Pass

DW1-DW6 Proven. No Issues. No materiality actions are required.

## Observations (non-blocking)

1. Owner read pending; wording changes from it are made under this Task.
2. Shower pages load every story's panels file up front (a few kB); narrowing needs the generic path to know shower stories by name. Recorded as a Drift Note for O-015's integration account.
3. No full run yet on the head with T-086 and T-089 together; the T-088 merge's full run covers it.
4. The builder recorded one rule slip (a quick browser run started without a fresh idle check); its full runs were properly gated.

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
