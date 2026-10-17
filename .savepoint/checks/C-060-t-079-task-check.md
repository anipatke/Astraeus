---
id: C-060
scope: {kind: task, id: T-079}
result: CLEAR
checked_by: {role: checker, session: o017-orchestrator-check-20261017}
executed_session: t-079-builder-lane-20261017
checked_at: '2026-10-18T02:10:00Z'
reviewed:
  base_commit: 0d917d6
  head_commit: efb2c34
  files:
    - see the Task's Technical Evidence and its "Repair after merge" section
  dependencies: []
issues: []
supersedes: null
---

# C-060: T-079 Task Check (Quick)

## Scope Lock

T-079 Done When as written, checked on the merged tree (`o018-o019`: lanes o020-t079 and o020-t080 merged, `style.css` conflict resolved by keeping neither lane's removed rules) plus the post-merge repair of three browser scripts. Scope: top bar: one row of icon buttons with tooltips and unchanged accessible names (scale toggle renamed by design), cog alone at top right, top-bar CSS in its own sheet, orbit lines out of the Object list by a generic listed/partOf rule with each orbit reachable from its body, the option-B menu for three or more scales (tested in a harness; no shipped experience has three).

## Invariants and probes

| Criterion | Actual | Evidence |
|---|---|---|
| Build and tests | Checker on the merged tree: `npx tsc --noEmit` 0; `npx vitest run` 57 files, 939 passed, 1 skipped; `npm run build` 0. | merge commit 8f4fa33 run |
| Full browser run | Checker's first full run on the merge (`docs/evidence/c060-*/`) failed three scripts (showers-perseids rate readout, spike02 event time, sky probe count); none was an app regression: two scripts read the old layout (the live rate line moved into the Events popover; two scale buttons became one toggle), one was a fixed 150 ms wait under load. Repaired in `browser-showers.mjs`, `browser-sky.mjs`, `browser-spike02.mjs` with every scenario kept. Re-run: `docs/evidence/o020-repair-full2-053144/summary.txt` every step exit 0, zero console-error lines, 539 s. | repair evidence |
| Pictures | Differ from the O-017 baseline by design (max 13.1% over 16 levels, interface changes); the owner looked at the merged bar and timeline on the preview and asked for changes recorded as T-084 and T-085, not defects here. A new baseline follows T-082. | `o020-repair-full2-*/diff.json` |
| Owner look | Preview of the merged build: owner asked to keep the scale explanation one tap away and drop Readable for Apollo (T-085), and to replace the purple activity graph with a glow in the line (T-084). | O-020 Decisions 10–11 |

## Issues Pass

Proven for the stated scope. No Issues. No materiality actions are required.

## Observations (non-blocking)

1. Showers have two scales, so the menu is harness-only (O-020 Decision 12). The scale explanation is only a tooltip now; T-085 restores a one-tap ⓘ (owner). Design.md reconciliation deferred to T-082.
2. The repair shows the coupling the owner named: scripts reach into the interface directly; T-083 (shared driver) is next.

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
