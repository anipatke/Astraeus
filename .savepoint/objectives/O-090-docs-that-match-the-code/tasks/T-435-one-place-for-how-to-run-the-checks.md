---
id: T-435
objective: O-090
title: One place for how to run the checks
status: done
depends_on: [{task: T-434, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-435, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on orchestrating G-024" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-22T05:30:31Z'}
planned_by: {role: planner, session: orchestrate-g024-20261122}
lane: docs
planned_reads: [docs/README.md, docs/BROWSER_CHECKS.md, docs/agents/browser-policy.md, docs/agents/verification.md, docs/agents/build.md, README.md, packages/astraeus-site/tests/gateLimits.test.ts, packages/astraeus-site/tools/validate/run-browser.mjs]
planned_writes: [docs/BROWSER_CHECKS.md, docs/agents/browser-policy.md, docs/agents/verification.md, docs/agents/build.md, README.md, packages/astraeus-site/tests/gateLimits.test.ts, docs/README.md, packages/astraeus-site/tools/validate/run-browser.mjs]
---

# One place for how to run the checks

## Outcome

Owner plan step 2. The root README's checks section gives the shortest local invocation and links on; the browser policy keeps tier selection; `docs/BROWSER_CHECKS.md` is trimmed to what each class of check protects, how to diagnose a failure, and where the runner, limits and results live, keeping the retired-scenario → replacement mapping only where it explains coverage. Copied elapsed-time claims ("under a minute", "230 s", "about 320 s") are removed or replaced by one dated, labelled measurement that points to its evidence; time limits (thresholds) have one maintained source, kept distinct from observations. A short "how to find the latest run's evidence" instruction exists in one place. Any test that reads a doc table (`gateLimits.test.ts` reads the BROWSER_CHECKS limit table) still passes, or now reads the source of truth instead, consistent with O-088's outcome checks.

## User Check

From the root README, a maintainer finds the command, what it covers, and a measured result in at most one link.

## Done When

| Item | Evidence |
|---|---|
| Every browser/verification contradiction in the T-434 list fixed | before/after table |
| No undated elapsed-time claim left in README, BROWSER_CHECKS, browser-policy, verification, build (grep for seconds/minutes reviewed) | grep output |
| One maintained source for time limits, named in `docs/README.md` | file + test |
| Evidence-lookup instruction present (one place) | file |
| `gateLimits.test.ts` green; if its doc-table read is kept, the reason is recorded; existing test setup unchanged (new cases allowed) | vitest run |
| Before/after word counts of edited files | wc -w |

## Context Files

T-434 Technical Evidence (contradictions + consumed material); `docs/README.md`; `docs/BROWSER_CHECKS.md`; `docs/agents/browser-policy.md`; `docs/agents/verification.md`; `docs/agents/build.md`; `README.md` under `Running the checks` and `Develop`; `packages/astraeus-site/tests/gateLimits.test.ts`; `packages/astraeus-site/tools/validate/run-browser.mjs` (tiers, limits, where results are written).

## Design References

Design `Verification in tiers (O-086)`.

## Guardrails

PROV-01, PROV-02 (provenance labels kept); TEST-01..04; ARCH-06 (mechanise a trap where cheap).

## Implementation Plan

1. Read the runner to confirm tiers, step list, limit source and evidence output path.
2. Rewrite BROWSER_CHECKS.md around: running it (link to policy), what each class protects, diagnosing, where things live, retired mapping (trimmed), evidence lookup.
3. Trim duplicate tier/timing prose in verification.md, build.md and browser-policy.md to links; the policy keeps tier selection.
4. README `Running the checks`: the shortest commands and one link.
5. Keep or redirect the limit-table test; run it.

## Boundaries

Coordinator widening (T-434 C12d): correct the stale first-line comment in `run-browser.mjs` (comment only, no behaviour change). No change to runner behaviour, tiers, limits or browser steps. Evidence folders untouched. AGENTS.md and CLAUDE.md untouched.

## Technical Verification

`npx vitest run packages/astraeus-site/tests/gateLimits.test.ts`; prettier on changed files; typecheck and eslint if the test changes.

## Technical Evidence

Builder session orchestrate-g024 T-435, 2026-11-22. Router unchanged (coordinator rule). No browser run.

### Reads

Context Files: T-434 Technical Evidence (tables C, M); `docs/README.md`; `docs/BROWSER_CHECKS.md`; `docs/agents/browser-policy.md`, `verification.md`, `build.md` (whole); `README.md` `Run it locally`, `Develop`, `Running the checks`; `gateLimits.test.ts`; `run-browser.mjs`; Design `Verification in tiers (O-086)`.

Extra reads (logged; to confirm limit source, evidence paths and the dated measurement): `tools/gate-limits.json`; `packages/astraeus-site/tools/validate/browser-steps.mjs` lines 1-40 (STEPS, env); `runner.mjs` (grep evidence/stamp, lines 40-70); `browser-smoke.mjs` (grep `ASTRAEUS_*`); `docs/evidence/test-cost/report.md` headings, lines 1-40, 125-180; `summary.txt` of `browser-20261121T214027Z`, `browser-quick-20261121T213822Z` (tracked), `browser-20261122T032627Z`, `browser-quick-20261122T051538Z`, `public-build-20261122T051348Z` (untracked, read only); one `results.json`; repo grep for inbound `BROWSER_CHECKS` references (none use a heading anchor).

### Done When -> evidence

| Item | Evidence | Outcome |
|---|---|---|
| Every browser/verification contradiction in the T-434 list fixed | before/after table below (C7, C8, C9, C10, C11, C12, C12a, C12d, C30; C19 is in RELEASING.md, T-439's file) | Met for T-435's files |
| No undated elapsed-time claim left in README, BROWSER_CHECKS, browser-policy, verification, build | grep (`[0-9]+ ?(s\|min...)`, `about N`, `minute`) over the five files: remaining hits are limit-table cells and the one dated measurement (BROWSER_CHECKS `### Measured time`, 2026-11-22). Mechanised (ARCH-06): new `gateLimits.test.ts` case "<file> quotes no undated elapsed time outside its tables" x5; red first on HEAD copies (README 1, BROWSER_CHECKS 3, build.md 2 offending lines), green after | Met |
| One maintained source for time limits, named in `docs/README.md` | `tools/gate-limits.json`; `docs/README.md` "Time limits" row now says "the one maintained source" and the doc tables are checked copies; BROWSER_CHECKS `Where things live` says the same | Met |
| Evidence-lookup instruction present (one place) | `docs/BROWSER_CHECKS.md` `### Finding the latest run's evidence`; `docs/README.md` new row points to it; README and build.md link to BROWSER_CHECKS | Met |
| `gateLimits.test.ts` green; doc-table read reason; setup unchanged | `npx vitest run packages/astraeus-site/tests/gateLimits.test.ts` 28 passed (23 before + 5 new). Doc-table reads kept: the tables are where a reader looks a limit up, and the test makes them checked copies of `gate-limits.json` (no second maintained source); removing them would delete existing cases. No existing case or setup edited; BROWSER_CHECKS step table reshaped to Step / Tier, script / Protects / Limit, first cell `name` and last cell `<n> s` as the test reads | Met |
| Before/after word counts | table below (`wc -w`) | Met |

### Contradictions: before -> after

| # | Before | After |
|---|---|---|
| C7 | README: "`npm run check:browser` # the one quick browser check, under a minute" | README shows `-- --tier quick` and plain (full, release run) commands; no time |
| C8 | README: "loads every public page and demo view and runs two short journeys" | Per-command comments; full list in BROWSER_CHECKS step table (one link) |
| C9 | BROWSER_CHECKS: quick tier runs "the two public-build file checks" | Public-build checks listed as `npm run check:public-build`, "not a `check:browser` step" |
| C10 | BROWSER_CHECKS: "then `npm run check:browser`. Run it once at a Full Objective Check" | Command table; "Which command a Task, a Full Objective Check and a release run is decided in the browser policy" |
| C11 | BROWSER_CHECKS: "`npm test`, about 30 s" | No time; dated measurement only in `Measured time` (browser) and build.md link to test-cost report §2 (gates) |
| C12 | BROWSER_CHECKS heading "full tier about 320 s, quick tier about 125 s; ... 413 s ... 353 s"; T-145 times; Before/After columns and history prose | Heading "What each class of step protects"; one dated measurement (2026-11-22: full 310 s `browser-20261122T032627Z`, quick 124 s `browser-quick-20261122T023312Z`, via test-cost report §3); history left to the evidence folders and git |
| C12a | build.md: engine-alone "about 20 s", quick "about 125 s", "about 196 s", full "about 320 s", public-build "about 4 s", shelf split "about 1 minute", react-consumer "about 6 s" | All removed; browser gate bullet is links (policy for selection, BROWSER_CHECKS for commands and measurement); timed-gates bullet links the dated test-cost report §2 |
| C12d | `run-browser.mjs:1` "The one quick browser check (O-038 T-145)" | "The browser check (O-038 T-145; tiers O-086 T-388)"; line 3 names the `browser-quick-`/`browser-steps-` folders. Comment only |
| C30 | BROWSER_CHECKS size-limit paragraph with every number and its history | One line: engine limit in `engine-budget.mjs` (`check:pack`), page shares in `load-budget.mjs`, Design "Size budgets are split" |

### Commands

- `npx prettier --check packages/astraeus-site/tests/gateLimits.test.ts packages/astraeus-site/tools/validate/run-browser.mjs` -> all formatted (after `--write` re-wrapped the new `it.each`). Markdown is Prettier-ignored.
- `node --require ./tools/lint/use-typescript6.cjs node_modules/eslint/bin/eslint.js` on the same two files -> exit 0.
- `npm run typecheck` -> exit 0.
- `npx vitest run packages/astraeus-site/tests/gateLimits.test.ts packages/astraeus-site/tests/browserExitPath.test.ts` -> 2 files, 33 passed (runner comment change; exit-path test runs the real `run-browser.mjs`).
- `savepoint resume` -> loads.

### Word counts (`wc -w`, before -> after)

| File | Before | After |
|---|---|---|
| `docs/BROWSER_CHECKS.md` | 5958 | 3213 |
| `docs/agents/build.md` | 1526 | 1364 |
| `docs/agents/browser-policy.md` | 859 | 878 |
| `docs/agents/verification.md` | 507 | 507 (unchanged: no timing or contradiction; already links to policy and build.md) |
| `docs/README.md` | 480 | 510 |
| `README.md` | 2359 | 2369 (`Running the checks` 100 -> 110) |

### Files changed

`docs/BROWSER_CHECKS.md` (rewritten: running it, where things live, evidence lookup, measured time, diagnosing, classes + step table, retired map trimmed, harness, driver rules, readouts); `docs/agents/build.md`; `docs/agents/browser-policy.md` (intro line); `docs/README.md` (two rows); `README.md` (`Running the checks` only); `packages/astraeus-site/tests/gateLimits.test.ts` (5 new cases); `packages/astraeus-site/tools/validate/run-browser.mjs` (comment lines 1, 3); this Task file.

### Removed material (and where it is now)

- Per-step prose (driver function names, waits, scenario detail): steps' own scripts and the `scene` line in `browser-steps.mjs`; the Protects column keeps each step's assertions in short form.
- Driver function table: the exports of `driver.mjs` (stated in the doc). No test or code reads the table.
- O-041 T-169 driver-function removal paragraph and the showers row's orbit-set helper note: history (git, `reconciliation-history.md` already records T-169/T-176); the coverage fact kept is the accepted loss of Apollo's typed date and telemetry cards.
- Retired map: kept whole except the `two-viewers` row (a current step, not retired; its scenarios are in the step table). The `views`/`catalogue` row kept because it explains coverage moved to Vitest.
- `look-out` "Measured alone about 59 to 62 s, over its 50 s limit" (stale: limit is 100 s).

### Limitations

- The cited 2026-11-22 run folders `browser-20261122T032627Z` and `browser-quick-20261122T023312Z` are untracked; the tracked `docs/evidence/test-cost/report.md` §3 records both totals and step times, which is what the doc links. If the owner keeps evidence, those two folders should be committed (or the link stands on the report alone).
- C19 (RELEASING "about 5 minutes") is in T-439's file and was not touched. Design copies (C11, C12b, C12c) are T-438's.
- No browser run (none needed: no runner behaviour change).

## Drift Notes

- Design `## Current Technical State` (line ~285) still copies "quick about 125 s, quick plus look-out about 196 s, full about 320 s" and points at BROWSER_CHECKS for "tiers and times": BROWSER_CHECKS now holds one dated measurement (`### Measured time`) and no time history. T-438 should replace the copy with a link (C12b).
- Design `### Verification in tiers (O-086)` omits `two-viewers` from the full tier (C12c, T-438).
- New mechanised rule: `gateLimits.test.ts` fails when README, BROWSER_CHECKS, browser-policy, verification or build.md quote an elapsed time outside a table without a date on the line. Design `Verification in tiers` may mention it when T-438 reconciles.

## Coordinator (gates)

2026-11-22, coordinator (orchestrate-g024-20261122): Reran `npx vitest run packages/astraeus-site/tests/gateLimits.test.ts`: 28 passed. Reviewed the diff: runner change is comment-only; the README checks section and new test cases match the plan. Docs-only wave otherwise; the full gate runs at the next code-touching Task (T-437) and again in the Full Check. Marked done under the standing rule (owner, O-038: "I mark them as they pass") and the owner's "carry on orchestrating G-024".
