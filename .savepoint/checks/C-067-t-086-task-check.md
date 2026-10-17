---
id: C-067
scope: {kind: task, id: T-086}
result: CLEAR
checked_by: {role: checker, session: o020-orchestrator-20261018}
executed_session: t086-builder-20261018
checked_at: '2026-10-18T03:10:00Z'
reviewed:
  base_commit: 9c505a0
  head_commit: deaa717
  files:
    - src/shell/timelineGlow.ts
    - src/shell/TimelineBar.tsx
    - src/shell/TimelineBar.css
    - src/app/App.tsx
    - tests/timeline.test.ts
    - tools/validate/driver.mjs
    - tools/validate/browser-synthetic.mjs
  dependencies: ['T-084 (C-063 CLEAR)', 'T-081 (C-065 CLEAR)']
issues: []
supersedes: null
---

# C-067: T-086 Task Check (Quick)

## Scope Lock

1. T-086 Done When 1-5; 6 is owner validation (a non-shower experience), still pending.
2. Lane o0xx-t086 at deaa717, branched from 9c505a0, merged into o018-o019 after T-087 (92559e4). The two lanes share one file, `tools/validate/driver.mjs`, which merged without conflict (separate additions).

## Invariants and probes

| Criterion | Actual | Evidence |
|---|---|---|
| DW1 always the glow | `.timeline-glow` always drawn; the plain-track class merged away; no second look kept. | diff |
| DW2 generic flat glow | Null profile gives two equal stops at `steadyBrightness` (clamped 0-1, default 0.5); rate profiles unchanged; no experience names. | `src/shell/timelineGlow.ts`, `tests/timeline.test.ts` |
| DW3 live setting, marks | "Steady brightness (no rate)" slider; the Timeline glow group shows for every experience; marks centred on the track (phone 44 px track too). | App.tsx, TimelineBar.css, browser-synthetic |
| DW4 text | No rate: glow `aria-hidden`, no tooltip or peak text; slider name and value text unchanged. | browser-synthetic |
| DW5 checks | browser-synthetic's Apollo plain-track scenario now asserts one even glow, no text, no tooltip, the steady slider live, scrubber height unchanged; showers scripts unchanged and pass. Builder: `run-full.sh docs/evidence/o020-t086-full-20261017T230821Z` all steps exit 0, error-lines 0, 708 s. Checker on the merged head (T-086 + T-087): `npx tsc --noEmit` 0, driver guard pass, `npx vitest run` 973 passed 1 skipped, `npm run build` 0. | summaries |

## Issues Pass

DW1-DW5 Proven. No Issues. No materiality actions are required.

## Observations (non-blocking)

1. Owner validation (look at Apollo, Earth-Moon or Jupiter-Io) is required before T-086 can be marked done.
2. No full run yet on the head with both T-086 and T-087; their only shared file merged cleanly. The next full run (T-088, T-089 merges, or T-082) covers the combination.

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
