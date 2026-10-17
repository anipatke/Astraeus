---
id: C-054
scope: {kind: task, id: T-074}
result: CLEAR
checked_by: {role: checker, session: o017-orchestrator-check-20261017}
executed_session: t074-builder-lane-20261017
checked_at: '2026-10-17T17:05:00Z'
reviewed:
  base_commit: d586a57
  head_commit: 11a4846
  files:
    - index.html
    - site/geminids-gmn.jpg (new)
    - site/earth-moon.jpg (new)
    - site/jupiter-io.jpg (new)
    - tools/validate/load-budget.mjs
    - tools/validate/browser-lite.mjs
    - tests/homePage.test.ts (new)
    - README.md
  dependencies: ['T-070 (C-051 CLEAR)']
issues: []
supersedes: null
---

# C-054: T-074 Task Check (Quick)

## Scope Lock

1. T-074 Done When 1–6 (7 is owner validation): three new cards linking the Geminids, Earth and Moon, and Jupiter and Io; card pictures captured from the app at no visible quality loss; true, plain card text; share text names all five; index budget raised on purpose; gates, lite, pictures and a link assertion.
2. Built in the worktree lane `o017-t074` (commit 11a4846), merged into `o017-simplify`; checked on the merged tree.

## Invariants and probes

| Criterion | Actual | Evidence |
|---|---|---|
| DW1 cards | Checker viewed the desktop home page capture: five demo cards (Apollo 11, The Perseids, The Geminids, Earth and Moon, Jupiter and Io, the last spanning the row), each with an Open button. Lite on the merged tree lists the five addresses in order at desktop and phone: `app.html`, `?experience=shower-perseids`, `shower-geminids`, `earth-moon`, `jupiter-io` (the portfolio's addresses, O-020 Decision 5). | `o017-t074-after-20261017T023820Z/site-index-desktop.png`, `docs/evidence/c054-20261017T025307Z/lite.log` |
| DW2 pictures | 1200x750 JPEG at ffmpeg q 6, finer than the existing Perseids card (q 9); 37–74 kB each. Captures of our own renders (PROV-02). | builder evidence |
| DW3 text | Checked against data: the Geminids card says December 2026, and `data/showers/geminids.json` activity runs 2026-12-04 to 2026-12-18 with the peak on 2026-12-13; 51,115 orbits matches the shipped set; no story-panel claim (the Geminids have none). Jupiter and Io card states the orbit is approximate, as its info panel does. | data, `index.html` |
| DW4 share text | `og:description` names all five; `tests/homePage.test.ts` asserts it. | test |
| DW5 budget | index 567,702 B raw (limit 600,000), 503,261 gzip (530,000); whole build 21,428,373 raw (22,500,000), 14,148,878 gzip (14,860,000); checker `load-budget.mjs` exit 0. | `docs/evidence/c054-20261017T025307Z/budget.txt` |
| DW6 gates | Checker on the merged tree: `npx tsc --noEmit` exit 0; `npx vitest run` 52 files, 905 passed, 1 skipped; public build and validator exit 0; lite exit 0. Builder: app views within tolerance against the before set; site pages differ in height by design. | `docs/evidence/c054-20261017T025307Z/` |

## Issues Pass

DW1–DW6 Proven. No Issues. No materiality actions are required.

## Observations (non-blocking)

1. The lane's `tests/pointsLookAheadShowers.test.ts` failure the builder saw was the stale assertion fixed on the main branch by T-073; the merged tree passes.
2. Owner validation (a look at the home page) is still required before T-074 can be marked done.

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
