---
id: C-047
scope: {kind: task, id: T-066}
result: CLEAR
checked_by: {role: checker, session: o017-orchestrator-check-20261017}
executed_session: t066-builder-20261017
checked_at: '2026-10-17T08:05:00Z'
reviewed:
  base_commit: 4f10505
  head_commit: 4f10505
  files:
    - docs/ASTRAEUS_SIMPLIFY_CANDIDATES.md
    - tools/validate/capture-experience-pictures.mjs
    - docs/evidence/o017-before-20261016T205125Z
  dependencies: []
issues: []
supersedes: null
---

# C-047: T-066 Task Check (Quick)

## Scope Lock

1. T-066 Done When 1–4: ranked candidate page with overlaps marked; before numbers; reproducible before pictures of every real experience and both site pages at desktop and phone; health-config exclusion proposed, not applied. Guardrails TEST-01, TEST-03, CODE-01.
2. Reviewed as uncommitted work on branch `o017-simplify` at `4f10505`.
3. Out of scope: the owner's pick (owner validation).

## Invariants and probes

| Criterion | Actual | Evidence |
|---|---|---|
| DW1 ranked list | `docs/ASTRAEUS_SIMPLIFY_CANDIDATES.md` §1: ten ranked rows C1–C10 with file, signal, proposal, lines, risk and owning Task; rows owned by T-067, T-068, T-070, T-071 listed separately (X1–X5). Checker re-read the lizard CSV in the evidence: the six functions over CCN 20 match the page (138, 45, 41, 25, 21, 21). The page's note that lizard attributes 138 to `LayeredRender` although that function ends near line 198 (the rest of the file's frame callback is fused into it) matches the source: `LayeredRender` starts at `src/app/AstraeusScene.tsx:169` and closes 36 lines later. | `scans/`, source read |
| DW2 before numbers | §3 lists src/tests/tools lines and files, 21 address switches, first-load bytes and gzip per page from the public build (`first-load.json`, e.g. Apollo overview 4,046,212 bytes, 2,724,405 gzip), test and browser run times traced to `objective-check-20261016T190443Z/summary.txt`. | `first-load.json` |
| DW3 before pictures | 20 PNGs (Apollo overview and Moon close-up, Earth–Moon wide and close, Jupiter–Io wide and close, Perseids, Geminids, index, assets; each at 1440×900 and 390×844) with `manifest.json`; fixed `view`, `scale` and `t` in every URL; reusable tool `tools/validate/capture-experience-pictures.mjs` with `--out`, `--url`, `--only`. A repeat run differed by at most 0.024% of pixels, so T-072 must compare with a tolerance (stated). Zero console errors. | evidence directory |
| DW4 health config | Proposed in §2 with the exact change; `.savepoint/health/config.json` untouched. | `git diff` empty for config |
| Boundaries | `git diff --stat` empty for `src/`, `tests/`, `data/` and the health config. | git |

Gates (builder, recorded in T-066): typecheck and build exit 0; tests 906 passed, 1 skipped. No scene code changed, so no browser scripts were required.

## Issues Pass

DW1–DW4 Proven. No Issues. No materiality actions are required.

## Owner validation still needed

T-066 declares `owner_validation.required`: the owner's pick of candidates for T-069.

## Observations (non-blocking)

1. Site-page first-load figures are what the captured page fetched (lazy pictures), not an upper bound; T-070 should measure the upper bound for its budget.
2. The unused-export scan is a word-match script, so it may over-count use; the five reported unused exports are certain.

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
