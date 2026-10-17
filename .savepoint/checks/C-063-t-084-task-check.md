---
id: C-063
scope: {kind: task, id: T-084}
result: CLEAR
checked_by: {role: checker, session: o017-orchestrator-check-20261017}
executed_session: t084-builder-20261017
checked_at: '2026-10-17T21:20:00Z'
reviewed:
  base_commit: ff13b53
  head_commit: 9b695cd
  files:
    - src/shell/timelineGlow.ts (new)
    - src/shell/TimelineBar.tsx
    - src/shell/TimelineBar.css
    - src/shell/timelineModel.ts
    - src/shell/AstraeusShell.tsx
    - src/app/App.tsx
    - src/app/SettingControls.tsx
    - tests/timeline.test.ts
    - tools/validate/driver.mjs
    - tools/validate/browser-showers.mjs
    - tools/validate/browser-synthetic.mjs
    - docs/BROWSER_CHECKS.md
  dependencies: ['T-080 (C-061 CLEAR)', 'T-083 (C-062 CLEAR)']
issues: ['I-037']
supersedes: null
---

# C-063: T-084 Task Check (Quick)

## Scope Lock

1. T-084 Done When 1-6; 7 is owner validation (both showers), still pending.
2. Lane commit 60cc616 merged into `o018-o019` at 9b695cd together with T-085 (85453b1); no conflicts.
3. Browser evidence: the full run on the merged head.

## Invariants and probes

| Criterion | Actual | Evidence |
|---|---|---|
| DW1 strip removed, gradient in the line | Strip markup, CSS and `timelineModel` curve helpers removed; `.timeline-glow` behind the range input with ahead and played layers clipped at the playhead; alpha = quiet + (1 - quiet) * rate^curve. | diff, `tests/timeline.test.ts` |
| DW2 generic | `glowProfile` reads only `TimelineWindow` rates and bounds; returns null without a rate (Apollo keeps the plain track). Event and panel marks stay; the peak mark rides above the line so marks on the peak stay pressable. | `src/shell/timelineGlow.ts`, story-panels in the full run |
| DW3 readable text | Hover tooltip gives the rate there or the peak; glow `aria-label` with the peak; slider `aria-valuetext` carries the rate at the clock. | unit tests, browser-showers |
| DW4 settings | Colour pickers, quiet brightness, curve, played floor, thickness, halo, Reset, in Display settings; browser-showers drags the quiet slider and sees the gradient change live. | browser-showers |
| DW5 heights | Showers 52 px desktop and 110 px phone (from 101 and 173), equal to the other experiences. | builder evidence `docs/evidence/o020-t084-*` |
| DW6 scripts and pictures | Strip reads moved to driver glow readouts; scenarios mapped in code comments and `docs/BROWSER_CHECKS.md`; driver guard passes. Checker: `npx tsc --noEmit` 0; `npx vitest run` 957 passed, 1 skipped; `npm run build` 0; `run-full.sh` 22/22 exit 0, error-lines 0, 617 s. Contact sheet viewed: differences are the intended T-079/T-080/T-084 bar and timeline and the I-035 orbit look; scenes intact; site pages 0%. | `docs/evidence/o020-t084-t085-merged-20261017T100445Z/summary.txt`, `docs/evidence/o020-t084-t085-merged-20261017T100445Z/contact-sheet.png` |

## Issues Pass

DW1-DW6 Proven. The builder's Drift Note 1 (the Overview comet-orbit violet count was passing on the old strip and is now recorded, not asserted) is a pre-existing check defect exposed by this Task, not a T-084 defect: recorded as I-037. No materiality actions are required.

## Observations (non-blocking)

1. Owner validation (both showers) is required before T-084 can be marked done.
2. The pictures baseline `o017-baseline-20261017` predates O-020's look; a new baseline is T-082's job.
3. Evidence directories from the lane total about 85 MB; the first (failed) full run `o020-t084-full-20261017T092928Z` is kept as history.
4. `glowTooltip` off-window text repeats the description prefix ("No activity here. Activity along the timeline, ..."); wording only.

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
