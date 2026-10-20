---
id: C-090
scope: {kind: objective, id: O-034}
result: CLEAR
checked_by: {role: checker, session: o034-recheck-20261020}
executed_session: o034-run-20261020
checked_at: '2026-10-20T10:45:47Z'
health_snapshot: sha256:13c51697dec869af108e25bbee5646a7a09756bd6877c7f1cc93ea5f129427bf
reviewed:
  base_commit: df577a8
  head_commit: f87da4c
  files: [docs/BROWSER_CHECKS.md, .savepoint/Design.md, .savepoint/objectives/O-034-slim-the-browser-checks-so-anyone-can-run-them/tasks/T-113-simplify-the-browser-check-rules-and-write-the-reuser-note.md, AGENTS.md, README.md]
  dependencies: []
issues: [I-047]
supersedes: C-089
carried_forward:
  - check: C-089
    applies: true
    assessed_by: {role: checker, session: o034-recheck-20261020}
    assessed_at: '2026-10-20T10:45:47Z'
    reason: 'Owner decisions on O-034 (per-Task Check waivers on T-110..T-113, sky to on-request, Showers 390 s / Jupiter 248 s accepted, no browser rerun, Objective Amendments 2026-10-20T10:36:35Z) have unchanged scope; this repair touches documentation only.'
---

# C-090: O-034 Full Objective recheck (supersedes C-089)

Independent session (did not build or repair O-034). Full mode, re-check after remediation under the C-089 scope lock (unchanged; no new axis).

## Closure map of prior Issues

- I-047: closed (repair proven below).
- Observations from C-089: Design row third cell is fixed (below). Others (T-113 text about rerunning the engine set, 5-vs-4 test count, trailing blank line, Windows portability, `scene=?`) remain non-blocking observations.

## Progress

- [x] Establish Scope
- [x] Freeze The Check Scope (C-089 lock reused)
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix (C-089 cells carried; only SC4 and T-113 DW2 re-tested)
- [x] Finite External-Boundary Matrix (unchanged)
- [x] Workflow And Side-Effect Check Lock (unchanged)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (not a feature here)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence (C-089 snapshot reused; no code changed)
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Carry-forward basis

`git diff --stat HEAD -- src tests tools package.json` is empty. Changes since C-089 (10:42:21Z), by mtime and diff: `docs/BROWSER_CHECKS.md` (10:43:28 UTC), the `src/synthetic/syntheticDefinition.ts` row of `.savepoint/Design.md`, and a repair note at the end of the T-113 Task file. AGENTS.md and README.md are unchanged since C-089 (mtimes earlier). So every C-089 "Proven" finding, the browser evidence reuse table (engine 275 s, jupiter 248 s, apollo 227 s, showers 390 s; no set rerun by owner rule "never run the same set twice for one change") and the Code Health snapshot stand.

## I-047 repair verification

"Dropped, with reasons" in docs/BROWSER_CHECKS.md now names:

| Group | Map says | At HEAD | At df577a8 | Result |
|-----|-----|-----|-----|-----|
| Apollo anchor labels | moved from 40 Apollo anchors to the made-up scene's 12, desktop and phone; Apollo's own no longer checked | browser-anchor-labels.mjs: `?experience=synthetic`, asserts 12, runs "desktop" and "phone" | opened default (Apollo), 40 anchors, phone run | True |
| Demo view links | Perseids and default (Apollo) runs moved to the made-up scene | browser-view-link.mjs: only `?experience=synthetic` | `[["perseids","?experience=showers"],["default",""]]` | True |
| Jupiter-Io orbit motion | Jupiter-Io run dropped, made-up run kept | browser-orbit-motion.mjs: `["synthetic"]` | `["jupiter-io","synthetic"]` | True |
| Sky demo and phone runs | Apollo and Perseids runs and phone pass dropped on move to on-request (owner 2026-10-20); now made-up, desktop | on-request/browser-sky.mjs: `EXPERIENCES=[["synthetic",...]]`, `SAMPLED={"synthetic-desktop"}` | apollo + perseids, apollo-desktop/mobile sampled | True |
| Apollo-only shell cases | "Kept, not dropped", asserted in browser-apollo-shell | 30 events (l.26), Unavailable (l.44), Observed badge (l.123), mission readout stability (l.50-79), UTC field (l.190) | n/a | True |

The Expected section of I-047 is met: four groups named with moved/dropped and reason; the Apollo-shell bullet corrected.

Design.md `src/synthetic/syntheticDefinition.ts` row: now exactly two cells (`awk -F'|'` gives 4 fields, i.e. two cells plus the outer pipes) with the T-111 note inside the second cell. Cosmetic: a sentence break is missing before "O-034 T-111 added" ("...same contract O-034 T-111 added..."); observation only.

## Gates (fresh, 2026-10-20T10:45:47Z window)

`npm run typecheck` exit 0; `npm run build` exit 0 (chunk-size warning only); `npm test` exit 0, 79 files, 1143 passed, 1 skipped. No browser set run (documentation-only repair; owner rule). 

## Coverage

SC1, SC2, SC3, SC5: Proven (C-089, inputs unchanged). SC4: Proven now (every moved or dropped scenario mapped with reason). T-110, T-111, T-112 DW: Proven. T-113 DW1-6: Proven; DW2 now met.

## Observations (non-blocking)

Carried from C-089 as listed above; the Apollo negative speed probe and Windows runner portability remain observations. Design row lacks a sentence break.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [ ] STYLE-03 **Test branches** (runner failure paths untested; advisory, as C-089)
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs** (advisory, as C-089)

## Owner validation pending

T-113 `owner_validation.required`: the owner said "Ok" after reading the AGENTS.md "Browser checks" rule and the README note; the coordinator records it. Pending, not a blocker for this technical result.

## Result

CLEAR. No materiality actions are required. This is technical clearance; the Objective closes only after owner validation of T-113 is recorded and the owner accepts.
