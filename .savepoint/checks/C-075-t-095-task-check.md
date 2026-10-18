---
id: C-075
scope: {kind: task, id: T-095}
result: CLEAR
checked_by: {role: checker, session: o020-orchestrator-20261018}
executed_session: t095-builder-20261018
checked_at: '2026-10-18T05:20:00Z'
reviewed:
  base_commit: d6effbd
  head_commit: 9aa2faa
  files:
    - vercel.json
    - tests/publicBuild.test.ts
    - tools/validate/driver.mjs, tools/validate/browser-sky.mjs
  dependencies: []
issues: []
supersedes: null
---

# C-075: T-095 Task Check (Quick)

## Scope Lock

1. T-095 Done When 1-5. The Task's premise was wrong: the planner (orchestrator) read only `SkyView`'s constructor and said every page downloaded the Milky Way tiles; the builder found the caller passes `picture: null` and `requestPicture()` loads them on first show (`sceneHooks.ts`, `sceneSky.ts`, already covered by `tests/skyPicture.test.ts`), and the load-budget page sets already leave them out. The owner was told.
2. Lane o024-t095 at 9aa2faa merged after T-094 (one driver conflict, both additions kept).

## Invariants and probes

| Criterion | Actual | Evidence |
|---|---|---|
| DW1 Milky Way on demand | Already true; now also asserted in the browser: no tile request with the picture off, exactly two after switching on, two with `?milkyway=on`, desktop and phone. | browser-sky, `trackRequests` in the driver |
| DW2 caching | `vercel.json` sends `Cache-Control: public, max-age=31536000, immutable` for `/assets/(.*)` only; HTML keeps revalidating; a unit test reads `vercel.json` and checks the rule exists and is the only one. | `tests/publicBuild.test.ts` |
| DW3 load budget | No change needed (the tiles were never counted); limits unchanged, none raised. | builder's measurement |
| DW4-5 checks, gates | Builder: `run-full.sh docs/evidence/o024-t095-full-20261018T033437Z` all steps pass (an earlier run's sky failure was its own request pattern, fixed). Checker on the merged head: as C-074 (23/24 full run, the earth-moon driver race since fixed). | summaries |

## Issues Pass

Proven as corrected: the caching rule and the new Milky Way assertion. No download saving exists, and none is claimed. No Issues. No materiality actions are required.

## Observations (non-blocking)

1. Done When 1 and 3's premise is recorded as wrong in this Check; the O-024 Objective needs no change (T-095 is listed as delivered caching and an assertion).

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
