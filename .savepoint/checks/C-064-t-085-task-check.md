---
id: C-064
scope: {kind: task, id: T-085}
result: CLEAR
checked_by: {role: checker, session: o017-orchestrator-check-20261017}
executed_session: t085-builder-20261017
checked_at: '2026-10-17T21:22:00Z'
reviewed:
  base_commit: ff13b53
  head_commit: 9b695cd
  files:
    - src/experiences/apollo11/apollo11Definition.tsx
    - src/shell/ScaleControl.tsx
    - src/shell/scaleModel.ts
    - src/shell/TopBar.css
    - src/app/App.tsx
    - tests/controls.test.ts
    - tests/experiences.test.ts
    - tools/validate/driver.mjs
    - tools/validate/browser-shell.mjs, browser-earth-moon.mjs, browser-jupiter-io.mjs, browser-sky.mjs, browser-spike02.mjs, browser-spike03.mjs
  dependencies: ['T-079 (C-060 CLEAR)', 'T-083 (C-062 CLEAR)']
issues: []
supersedes: null
---

# C-064: T-085 Task Check (Quick)

## Scope Lock

1. T-085 Done When 1-5; 6 is owner validation (Apollo and Earth-Moon), still pending.
2. Lane commit afb194b merged into `o018-o019` at 85453b1, then T-084 at 9b695cd; no conflicts.
3. Browser evidence: the full run on the merged head.

## Invariants and probes

| Criterion | Actual | Evidence |
|---|---|---|
| DW1 Apollo True only, fallback | `scaleChoices: ["true-scale"]`; `startScaleFor("readable-scale", ["true-scale"])` gives true-scale (test). Other experiences unchanged. | diff, `tests/controls.test.ts` |
| DW2 no button for one scale | `ScaleControl` returns null when fewer than two choices (generic, no experience names); browser-shell, spike02, spike03, jupiter-io assert `hasScaleControl` false on Apollo. | diff, full run |
| DW3 ⓘ one tap | `ScaleExplanation` beside the toggle and the menu, accessible name "About the scales", `aria-expanded`/`aria-controls`, closes on second tap, Escape or outside press; 44 px on phones asserted in browser-earth-moon. | diff, full run |
| DW4 scenarios moved | Readable scenarios moved to Earth-Moon through new driver helpers; driver guard passes; mapped in the Task evidence. | Task evidence, driver guard |
| DW5 pictures | Apollo pictures are True scale; differences against the O-017 baseline are the O-020 bar and timeline and the I-035 orbit look, not scale. Checker gates and full run as in C-063: 22/22, error-lines 0. | `docs/evidence/o020-t084-t085-merged-20261017T100445Z/contact-sheet.png`, `docs/evidence/o020-t084-t085-merged-20261017T100445Z/summary.txt` |

## Issues Pass

DW1-DW5 Proven. The builder's Drift Note on `browser-orbit-look.mjs` asking for `scale=readable` is recorded as I-036 (open). No materiality actions are required.

## Observations (non-blocking)

1. Owner validation (Apollo has no scale button; Earth-Moon toggle and ⓘ) is required before T-085 can be marked done.

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
