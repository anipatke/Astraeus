---
id: C-052
scope: {kind: task, id: T-071}
result: CLEAR
checked_by: {role: checker, session: o017-orchestrator-check-20261017}
executed_session: t071-builder-20261017
checked_at: '2026-10-17T15:10:00Z'
reviewed:
  base_commit: 331c899
  head_commit: 331c899
  files:
    - tools/validate/run-full.sh (new)
    - tools/validate/contact-sheet.mjs (new)
    - tools/validate/on-request/ (moved scripts)
    - tools/archive/validate/ (archived one-off tools)
    - docs/archive/ (archived briefs)
    - docs/BROWSER_CHECKS.md (new)
    - tools/validate/browser-showers.mjs, browser-spike02.mjs, browser-story-panels.mjs, browser-sky.mjs
    - tests/listedOrbitGroup.test.ts
    - AGENTS.md (project rule, outside the Savepoint block)
  dependencies: ['T-067 (C-048 CLEAR)', 'T-068 (C-049 CLEAR)']
issues: []
supersedes: null
---

# C-052: T-071 Task Check (Quick)

## Scope Lock

1. T-071 Done When 1–8: lite negative probe; owner direction (keep automated only what eyes cannot judge, under 10 minutes); contact sheet; trimmed full run with every scenario mapped; committed full-run script with measured time; archive without removing anything still referenced; I-033 proof; AGENTS.md rule names the trimmed set; gates; flaky frame-time test handled.
2. Uncommitted work on `o017-simplify` at `331c899` (32 paths outside evidence).
3. Browser evidence per O-017 Decision 8 (lite and pictures), plus the builder's committed full run, which is this Task's subject.

## Invariants and probes

| Criterion | Actual | Evidence |
|---|---|---|
| DW1 lite catches a broken page | Builder appended a `throw` to `jupiterIo.ts`: lite exit 1, FAIL on jupiter-io at desktop and phone; restored byte-identical: exit 0, 26/26. | `o017-t071-lite-probe-broken-20261017T005354Z/`, `o017-t071-lite-probe-restored-20261017T010041Z/` |
| DW2, DW4 trimmed run, mapping | `run-full.sh` keeps lite, public-build licence gate, public showers, pictures with pixel diff and contact sheet, and the per-area scripts that check numbers and credits; Perseids desktop full plus light phone, Geminids light, sky on Apollo only. Moved to `tools/validate/on-request/`: sun, synthetic-belt, synthetic-eccentric, marker-existing, precision; each mapped on `docs/BROWSER_CHECKS.md`. | `docs/BROWSER_CHECKS.md` |
| DW3 contact sheet | Checker viewed `docs/evidence/o017-t071-contact-sheet-20261017T021053Z/contact-sheet.png`: ten views, before beside after at desktop and phone, with the over-16-level figure; nothing flagged (max 0.0231%); assets page differs in size by design. Sent to the owner. | contact sheet |
| DW5 committed script, time | Last run `o017-t071-full-20261017T020209Z/summary.txt`: 20 steps, all exit 0, `error-lines=0` (the grep no longer counts "zero console errors"), total 509 s. Trial runs varied 8–10 min under other load. `bash -n` passes. | summary |
| DW6 archive | Checker grep for the moved and archived names outside evidence, archives and historical records: remaining hits are history in spike docs, closed Issues, older Goal records naming the archived briefs, and the candidates page, none executable. `capture-site-pictures` and `tools/apollo11/` kept because they are referenced. | grep |
| DW7 I-033, AGENTS.md | AGENTS.md Full bullet now names `tools/validate/run-full.sh` and the contact sheet. I-033 left open by the builder; its proof is in this record for the owner or a later Check to close. | git diff |
| DW8 gates, flaky test | Checker: `npx tsc --noEmit` exit 0; `npx vitest run` 48 files, 885 passed, 1 skipped (frame-time assertions now behind `ASTRAEUS_PERF=1`); lite exit 0. Builder: build and public build plus validator pass. | `docs/evidence/c052-*/` |

## Issues Pass

DW1–DW8 Proven. No Issues. No materiality actions are required.

## Observations (non-blocking)

1. The pixel diff meets tolerance only on a quiet machine (0.0455% with other runs in parallel, 0.0234% alone). `run-full.sh` takes pictures first and alone for that reason; keep it that way.
2. Three script races fixed (showers phone Pause covered by a story panel, spike02 continuity bound, story-panels read before render): script defects, not app defects.
3. Older Goal records (G-002, G-003, G-004) name `docs/*_BRIEF.md` paths that moved to `docs/archive/`; historical, left unchanged.
4. Design.md updates deferred to T-072 (Drift Notes).

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
