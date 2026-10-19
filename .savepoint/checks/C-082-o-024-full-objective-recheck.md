---
id: C-082
scope: {kind: objective, id: O-024}
result: NEEDS WORK
checked_by: {role: checker, session: o024-recheck-20261019}
executed_session: o020-orchestrator-20261018
checked_at: '2026-10-19T10:50:00Z'
health_snapshot: sha256:23e1dfb1b264343bae4683ea8d13f44a9b0af094707b6c9ae0f197b9741af87a
reviewed:
  base_commit: 1707f21
  head_commit: 1707f21
  files:
    - tools/validate/public-addresses.d.mts
    - tools/validate/public-addresses.mjs
    - tests/homePage.test.ts
    - .savepoint/Design.md
  dependencies: []
issues: []
supersedes: C-081
unmet: [design-reconciliation]
---

# C-082: O-024 Full Objective Re-check

Fresh session (started after `/clear`; did not build or remediate O-024). Re-check of C-081 under its frozen scope lock; no new axes.

**Result: NEEDS WORK.** I-041 is fixed and verified. I-042 is mostly fixed, but one Design paragraph still describes the picture steps that T-102 removed.

## Closure map of prior Issues
| Issue | State | Evidence |
|---|---|---|
| I-041 (typecheck gate) | **closed, verified** | `tools/validate/public-addresses.d.mts` declares `DEMO_ADDRESSES: string[]`, `RETIRED_ADDRESSES: string[]`, `danglingLinks(directory: string): string[]`, matching the three exports of `public-addresses.mjs` (lines 6, 8, 11). `npm run typecheck` exit 0 (was TS7016 at `tests/homePage.test.ts:3`). |
| I-042 (Design reconciliation) | **still open** | Fixed: the `src/experiences/`, `tools/validate/` and `src/main.tsx` rows, the Shower builder and Story panels paragraphs, and a new O-024 paragraph (loader, switch, addresses, `vercel.json` caching, drift-note accounting for T-091, T-092, T-094). Not fixed: `.savepoint/Design.md:167` (Public site and launch) still says "The site pictures are made by `tools/validate/capture-site-pictures.mjs`" (the script is archived at `tools/archive/validate/` by T-102, `e06fe7e`) and "(e) the picture baseline `docs/evidence/o017-baseline-20261017/` is what `run-full.sh` compares the pages against" (`run-full.sh:2` now says no script takes, saves or compares a screenshot). This contradicts the corrected `tools/validate/` row at line 37 and I-042's Proof Needed ("reflects ... the trimmed `run-full.sh`"). |

## Admission ledger
| Re-check item | Prior claim | Frozen cell (C-081 scope lock) | Allowed result |
|---|---|---|---|
| Typecheck gate | I-041 | 2. configured gates | pass/Issue |
| Build and test gates | C-081 evidence | 2. configured gates | pass/Issue |
| `git diff --check` | C-081 evidence | 2. | pass/Issue |
| Design reflects the three demos, switch, loader, addresses, trimmed run | I-042 | 4. Design reconciliation | pass/Issue |
| Drift notes T-091, T-092, T-094 accounted for | I-042 | 4. | pass/Issue |
| Success Conditions 1-4, cross-Task integration | C-081 | 1, 3 | pass/Issue |

## Evidence (this session, HEAD 1707f21 plus the uncommitted O-024 tree)
- `npm run typecheck`: exit 0.
- `npm run build`: exit 0.
- `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml`: exit 0, 74 files, 1098 passed, 1 skipped.
- `git diff --check`: clean.
- Full browser run: reused from C-081, `docs/evidence/o024-check-full-20261019T101826Z/` (`tools/validate/run-full.sh`, 22 steps exit 0, error-lines 0, 796 s; `summary.txt` shows the completed run). Reuse basis: since that run the only changes are `.savepoint/` records, `Design.md` and `tools/validate/public-addresses.d.mts`, a declaration file that TypeScript erases and nothing loads at run time; no source, test, fixture, dependency or gate definition changed (file times: run ended 21:31:42 local, `.d.mts` 21:39:56, `public-addresses.mjs` unchanged since 20:40:21).
- Health: `savepoint health check O-024` → snapshot above, "Code Health does not block clearance"; coverage evidence stale (optional, observation only).

## Success conditions (unchanged from C-081, re-confirmed by the gates above)
1. One Showers address with a top-bar switch: met.
2. Earth–Moon removed, nothing else broken: met.
3. Shelf, links and titles show three demos: met.
4. Browser checks through the driver, full run passes: met. Owner look on the preview still pending.

## Carried-forward owner decisions
- T-091 acceptance (C-073) and T-094 acceptance (C-074): scope unchanged since C-081 (no change to the switch, shower choice or boot loader code); both still apply. Recorded here only: the runtime rejects a `carried_forward` entry on a Task acceptance that names an Objective-scoped Check.
- T-092, T-093, T-102 Task-check waivers: unchanged; covered by this Objective Check.

## Findings
- **I-042 (blocking, still open):** two stale sentences in the Public site and launch paragraph of Design.md (line 167), above. Fix through `savepoint-design`: drop or rewrite the `capture-site-pictures.mjs` sentence and item (e) to say the picture baseline is historical and no longer compared.

## Materiality
| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-042 remainder | High (anyone reading the launch paragraph) | Low (a reader would look for a removed script and a comparison that no longer runs; no product effect) | Low | Fix now: a two-sentence Design edit, then one targeted re-check (the last round under the convergence limit), or the owner accepts I-042 on the board |

## Owner validation still needed
T-092 (`owner_validation.required`, no acceptance recorded) and T-093 (`accepted_check` empty): the owner opens the home page, each demo, and plays the Showers year on the preview.

## Observations (non-blocking)
- The O-024 tree is still uncommitted; the project rule asks for a commit at Objective close.
- `src/shell/bootLoader.ts` is described in prose but not listed in a Codebase Map row; not required by I-042.
- Coverage evidence in the health snapshot is stale (optional instance).

## Code Style Review
No new source code apart from a three-line declaration file; no STYLE rule departures noticed.

## Full Check Progress Checklist
- [x] Establish Scope
- [x] Freeze The Check Scope (C-081 lock reused, unchanged)
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix (C-081 matrix; gates rerun)
- [x] Finite External-Boundary Matrix (unchanged; browser run reused, basis above)
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (not applicable)
- [x] Perform The Adversarial Pass (stale claims searched across Design.md)
- [x] Re-check After Remediation
- [x] Verify File Reality (`capture-site-pictures.mjs` is archived, not at the path Design names)
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style
