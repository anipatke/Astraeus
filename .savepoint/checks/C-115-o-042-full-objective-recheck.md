---
id: C-115
scope: {kind: objective, id: O-042}
result: CLEAR
checked_by: {role: checker, session: o042-full-recheck-20261024}
executed_session: o042-run-20261024
checked_at: '2026-10-24T01:06:00Z'
health_snapshot: sha256:8b283659dd7d005165e0a7f03bb2bebb75b5897d861b496fb40c31cc0261039a
reviewed:
  base_commit: ecf1b3f2
  head_commit: 5475a815
  files: [packages/astraeus-demo-showers/tests/showersMeasured.test.ts, .savepoint/issues/I-083-the-geminids-solar-longitude-test-times-out-under-the-full-gate.md]
  dependencies: []
issues: []
supersedes: C-114
---

# C-115: O-042 Full Objective Re-check

This is the re-check of the O-042 Full Objective Check (T-171 to T-177), "Show groups of objects by rebuilding a shower on the public API". It supersedes C-114 (NEEDS WORK), whose only unmet item was O-042 Success Condition 6, the full gate, because of I-083. C-114 is left unchanged.

**Independence.** This session did not plan, build, coordinate or repair any O-042 work or the I-083 repair. It started fresh from the coordinator's request and `savepoint resume` (`Check O-042`). It wrote only to its own scratchpad, the gate outputs (`coverage/`, `junit.xml`, `dist/`), the new health snapshot, this record and I-083.

**Baseline.** HEAD `5475a815` on `o042-shower-groups`. Not a worktree lane (`git-dir` = `git-common-dir`). The tree was clean apart from the untracked `docs/prds/` and `docs/research/`, which were not read or touched. Times are UTC. Note: the host clock prints local time as +11:00; every time below is UTC from `date -u`.

**Verdict: CLEAR.** The I-083 repair is test-only, keeps the same facts, and the full gate passed twice in a row with a coverage report. The official health snapshot does not block clearance. Every other C-114 cell rests on inputs that have not changed since C-114 checked them.

## Closure Map Of Prior Issues

| Issue | State before | State now | Evidence |
|---|---|---|---|
| I-083 (Geminids DW3(ii) times out under `npm run test:full`; Perseids fill indicator) | open | **closed, verified** by this Check | Full gate 2/2 pass; DW3(ii) 5.5 ms / 3.1 ms in junit; fill 15.0 and 15.8 ms (best of 5); coverage written; health does not block |

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope (C-114's lock reused unchanged; immutable for a re-check)
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix (C-114's matrix; see the admission ledger)
- [x] Finite External-Boundary Matrix (unchanged inputs; see below)
- [x] Workflow And Side-Effect Check Lock (unchanged inputs; see below)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (no lanes; not a finding)
- [x] Perform The Adversarial Pass (on the repair)
- [x] Re-check After Remediation
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock

C-114's numbered scope lock (criteria SC1 to SC6, Decisions 1 to 7, the Done When lists of T-171 to T-177, Guardrails ARCH-01 to ARCH-05, PROV-01, PROV-02, DATA-01, TEST-01 to TEST-03, CODE-01, CODE-02, and the AGENTS.md gates) is reused as frozen. No axis, layer or interpretation was added.

## What Changed Since C-114

`git diff --name-only 2975f1bf..5475a815` (C-114's reviewed head to HEAD): C-114's own record, its health snapshot, the router, the C-114 browser evidence folder, I-083, and one source file: `packages/astraeus-demo-showers/tests/showersMeasured.test.ts`. `git diff ecf1b3f2..HEAD` (the repair commit alone) touches only that test file (+11/-6) and I-083's history. `git diff --check ecf1b3f2..HEAD` is clean. No product source, data, build tool, browser script, dependency, lock file or gate definition changed.

The repair:

- DW3(ii): each row's solar longitude is computed once per shower in a `beforeAll` (120 s hook limit, reason in a comment), and both bin widths read the cached array. The assertion (`|centre - MDC| < 1`) and the MDC values (140.1, 261.6) are unchanged.
- Perseids fill indicator: the best of five single fills, against the same 100 ms budget (it was the mean of five).

## Re-check Admission Ledger

| Re-check item | Prior Issue or claim | Frozen cell | Allowed result | Result |
|---|---|---|---|---|
| Full gate passes twice in a row | I-083 Proof Needed 1 | SC6 / gate `npm run test:full` | pass or Issue | **Pass** 2/2 |
| DW3(ii) for both showers well inside its limit under the full gate | I-083 reproduction | SC6 gate cell, `showersMeasured.test.ts` DW3(ii) | pass or Issue | **Pass**: Perseids 5.5 ms, Geminids 3.1 ms per case (junit, run 1) |
| Fill indicator does not fail on load | I-083 Proof Needed 2 | SC6 gate cell, `showersMeasured.test.ts` fill case | pass or Issue | **Pass**: 15.0 ms and 15.8 ms (best of 5), budget 100 ms |
| Same facts still hold | I-083 Proof Needed 3; TEST-01 | SC4 / TEST-01 measured-orbit facts | pass or Issue | **Pass**, independent oracle below |
| Coverage report written | I-083 Proof Needed 4 | gate cell | pass or Issue | **Pass**: `coverage/coverage-final.json` written by both runs (01:00:07Z, 2,835,115 B; 01:01:32Z, 2,836,138 B; deleted between runs to prove the second wrote it) |
| Health does not block on tests | I-083 Proof Needed 5 | gate cell (health) | pass or Issue | **Pass**: snapshot below, "does not block clearance" |
| Browser run reused | I-083 Proof Needed 6; project browser rule | SC6 `check:browser` | reuse if inputs unchanged | **Reused**: only a test file changed since `docs/evidence/browser-20261024T004507Z/` (00:45:07-00:47:00Z, 8 steps exit 0, error-lines 0); that file is not shipped or read by any browser step |
| Every other C-114 matrix cell (SC1 to SC5, D1 to D7, Done When, Design reconciliation, external-boundary and workflow locks) | C-114 results | the same cells | reuse if inputs unchanged | **Carried**: their inputs (product source, data, scripts, fixtures, Design.md) are byte-identical to 2975f1bf; the repo tests behind them pass in both fresh full runs and the fresh `npm test` |

**Independent oracle for the facts.** The pre-repair version of the test (`git show ecf1b3f2:...showersMeasured.test.ts`) was run as a temporary sibling file (`zzOldI083Probe.test.ts`, removed straight after; `git status` clean afterwards), filtered to DW3(ii). Old logic: Perseids busiest 0.5-degree bin 140.0-140.5 (5,747 orbits, centre 140.25), 1-degree bin 140-141 (6,416); Geminids 261.5-262.0 (12,563, centre 261.75), 261-262 (20,028). The repaired test prints the same figures in both full runs. The cached longitudes therefore give the same bins as the per-row loop, and both centres stay within 1 degree of the MDC (0.15 and 0.15).

## Adversarial Pass (repair)

- **Shared state across showers.** `longitudes` and its `beforeAll` sit inside the `describe.each` body, so each shower gets its own array and hook; the two showers cannot read each other's values (they print different bins).
- **Weakened assertion.** DW3(ii) asserts the same rule on the same rows. The fill case moves from mean to best of five. That is slightly more lenient, but the case is explicitly "an indication only", the budget is unchanged, and the measured 15 ms is far inside it. Observation O2.
- **Hook limit masking a hang.** 120 s bounds the hook; the per-row work takes about 1 to 2 s alone.

## Gates (fresh, this session)

| Gate | Result | Time (UTC) |
|---|---|---|
| `npm run test:full` (run 1) | **pass**: 129 files, 1738 passed, 1 skipped; 59.6 s; coverage written | 00:59:02-01:00:07 |
| `npm run test:full` (run 2) | **pass**: 129 files, 1738 passed, 1 skipped; 61.4 s; coverage written (statements 75.02%, lines 77.57%) | 01:00:27-01:01:32 |
| `npm run lint` | pass | 01:02:00-01:02:03 |
| `npm run typecheck` | pass | 01:02:03-01:02:07 |
| `npm run build` | pass (chunk-size advisory only) | 01:02:07-01:02:09 |
| `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml` | pass: 129 files, 1738 passed, 1 skipped | 01:02:25-01:03:00 |
| `git diff --check ecf1b3f2..HEAD` | clean | |

**Reused from C-114, with input proof.** `npm run check:engine-alone` (pass, 00:44:15-00:44:30), `npm run check:pack` (pass, 00:44:30-00:44:45), `npm run build:example` (pass, 00:44:45) and `npm run check:browser` (pass, 00:45:07-00:47:00, `docs/evidence/browser-20261024T004507Z/`), all run by C-114 on 2975f1bf with the same toolchain. Since then no file under `packages/astraeus`, `packages/astraeus-site`, `packages/astraeus-data*`, `examples`, `tools`, the package and lock files, `eslint.config.js`, the tsconfigs or `vitest.config.ts` changed (`git diff --stat 2975f1bf..HEAD` over those paths is empty). The one changed file is a demo test: it is not in the engine copy, the packed tarballs, the example or any browser step. The browser command was not run again (project rule).

## Code Health

`savepoint health check O-042`, run at 01:02:12Z after both full runs and before `npm test` rewrote `junit.xml`: snapshot `sha256:8b283659dd7d005165e0a7f03bb2bebb75b5897d861b496fb40c31cc0261039a` (official, created 01:02:20Z). **Code Health does not block clearance.** Every instance (complexity, coverage, dependency vulnerabilities, duplication, tests) reports "no blocking finding", all fresh. This supports, but does not grant, the verdict.

Non-blocking measurements: coverage 75.0% statements (watch range, steady); the snapshot summary rates complexity "needs attention" at a highest CCN of 29. Its evidence lists files under the untracked `docs/research/` (outside O-042, not read by this Check); see O3.

## Owner Decisions And Validation

- **Structured decisions.** There are no structured `exception`s or recorded `owner_validation` acceptances on O-042 or its Tasks, so no `carried_forward` entries are due.
- **Task-check waivers** for T-171 to T-177 (`check_waiver` on each Task) apply to the optional Task Checks only. C-114 and this Check covered every Task.
- **Perseids gzip limit (C-114 O1).** As relayed by the coordinator, the owner on 2026-10-24 chose to keep it at 7,040,000 (told of the formula's 7,100,000, said "do it"). That is the value in `load-budget.mjs`, so the limit was not raised and SC4/D5 stand as proven. It is an owner choice, not an exception.
- **T-176 `owner_validation.required: true`.** The owner's look is in T-176 "## Owner Look" ("looks fine", desktop and phone, after the flagged differences). Formal acceptance (`owner_validation: {required: true, accepted_check: C-115, ...}`) is still the owner's to give, against this Check. The I-083 repair does not touch anything the owner looked at.
- **Objective closure.** All seven Tasks are `done`. With this CLEAR, the remaining steps are the owner's: the T-176 acceptance above, and accepting the O-042 outcome.

## Issues

None. I-083 is closed as `verified` by this Check. No new Issue.

No materiality actions are required.

## Observations (non-blocking)

- **O1. I-083 repair timestamp.** The repairer's `repair_attempted` entry is stamped `2026-10-24T11:59:00Z`, but the repair commit is 00:58:47Z (11:58:47 +11:00): the local time was written with a `Z`. History is append-only, so it stays; the order of events is clear from the commit. I-080's repair entry has the same slip.
- **O2. Fill indicator is now best of five.** Slightly more lenient than the mean, but it remains an indication and the budget is unchanged.
- **O3. Health scans untracked `docs/research/`.** The highest-complexity evidence points at Python files in the untracked `docs/research/` folder, which the lizard exclusions do not skip. Not O-042 code; the owner may add the exclusion.
- C-114's observations O2 to O8 (Outcome wording for `hello-scene`, the inert `stream.quality.default` setting, the `addGroup` error-code doc wording, `{none, loop}`, late `prepare` errors, Apollo page headroom, engine comment examples) still stand unchanged; none is a finding.

## Code Style Review

Scope: the repair (`showersMeasured.test.ts`).

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**: the `Record<"all", number[]>` keyed by set mirrors the existing `for (const set of ["all"])` loop; minimal.
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [x] STYLE-08 **Comments explain why**: both changes carry a comment naming I-083 and the reason.
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**: +11/-6 in one test file.

## Next

The owner's step: give T-176's formal acceptance against C-115 and accept the O-042 outcome, then close and commit O-042 (with the untracked health snapshot) per the run rules.
