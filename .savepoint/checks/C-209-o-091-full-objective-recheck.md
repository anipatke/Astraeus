---
id: C-209
scope: {kind: objective, id: O-091}
result: CLEAR
checked_by: {role: checker, session: recheck-o091-20261122}
executed_session: repair-o091-c208-20261122 (I-198 repair); orchestrate-g024-20261121 / orchestrate-g024-20261122 (T-413..T-416)
checked_at: '2026-11-22T02:42:59Z'
health_snapshot: sha256:dad64e1ccb2fc8af04f892c347627edf7d7de1d5e8ec3d09a01ed5d0f0858730
reviewed:
  base_commit: 276614b3
  head_commit: ccfae6a6
  files: [packages/astraeus-site/tests/workflowParity.test.ts, .github/workflows/ci.yml, .github/workflows/publish.yml]
  dependencies: []
issues: []
supersedes: C-208
---

# C-209: O-091 Full Objective re-check

This is a fresh session. It did not plan, build or repair any O-091 work, and it is not the C-208 session. It uses C-208's frozen scope lock and matrix. The repair is `d6bdf464..ccfae6a6`: `git diff --stat` shows only `packages/astraeus-site/tests/workflowParity.test.ts` plus `.savepoint/` records. No code, workflow, fixture, dependency or gate definition changed.

**Result: CLEAR.** I-198 is repaired and verified. T-417 is still `planned`. As in C-208, it is the post-merge `main` CI run (owner rule: no red-branch push and no GitHub workflow runs). The Objective cannot close until T-417 is done after the merge.

## Closure map of prior Issues

| Issue | State | Evidence |
|---|---|---|
| I-198 | **closed (verified)** | Proof Needed is met verbatim. Details below. |

## I-198 Proof Needed

- **In-file table.** The repair adds 12 plants (23 in total), and each is named by rule and expected text. Seven parts of Proof Needed are covered: `paths-ignore` and `branches-ignore` on push; `if` and `continue-on-error` on a step and on a job, in both ci.yml and publish.yml (8 plants); `npm publish` in a ci.yml job; and publish-packages without `--dry-run` in a ci job. The step plants target `npm run lint` in ci and `npm run check:browser` in publish, which are real gate and check steps. The existing 11 plants still pass, and `every rule has a plant` passes. The real files are clean.
- **My own plants.** The setup was a scratch mirror with copies of the real `ci.yml`, `publish.yml`, `config.yml`, `package.json`, `RELEASING.md`, `browser-steps.mjs` and the test. I edited the YAML text, then ran the test, so the real parse path is exercised. The baseline is 25/25 green. Each of these plants failed `every rule passes on the real files`, naming the problem:
  - C-208 gaps:
    - Q1 `if: false` on the ci lint step → `ci.yml job gates step lint has if`
    - Q2 `continue-on-error` on the ci test step
    - Q3 `continue-on-error` on the publish browser step
    - Q4 `if: false` on the ci gates job → `ci.yml job gates has if`
    - Q5 `paths-ignore` and Q6 `branches-ignore` under push → `ci triggers`
    - Q7 a second ci job running `npm publish --workspaces` → `ci never publishes`
  - Adjacent cases on the same axes:
    - Q8 job-level `continue-on-error` in publish
    - Q9 an expression `if` on the publish three-newest step
    - Q10 an expression `continue-on-error` on the ci job
    - Q11 `if: always()` on `npm ci`
    - Q12 a `tags` push filter
  - C-208 caught cells re-run: P7 (changed `quality_gates.lint`), P3 (a differing checkout SHA) and P5 (three-newest removed) are still caught.

## Re-check of the original matrix (C-208 rows 1–12)

Rows 3, 5 and 6 were the Issue rows, and they are now **Proven** (above). Rows 1, 2, 4 and 7–12 cover workflows, scripts, the peer range, docs and Design. None of their inputs changed in this repair (diff above), so C-208's evidence stands for them. The test file's own rules for those rows still pass on the real files, and each of their plants still fails. There are no new axes.

## Gates

**Fresh, on head ccfae6a6 (Node v24.16.0, 2026-11-22T02:41:11Z to 02:42:29Z):**

| Gate | Result |
|---|---|
| `npm run lint` | pass (15 s) |
| `npm run typecheck` | pass (7 s) |
| `npm run build` | pass (3 s) |
| `npm run test:full` (full gate; it stands in for `quality_gates.test`) | 325 files, 5346 passed, 2 skipped (C-208 had 5334, plus the 12 new plants); 53 s |
| `git diff --check d6bdf464..HEAD` | clean |
| `savepoint health check O-091` | snapshot above (created): "does not block clearance". All instances are optional with no finding. The coverage and tests instances now read the fresh `test:full` reports, so they are no longer stale. |

**Reused from C-208 (head d6bdf464, 2026-11-22):**

- `check:engine-alone`, `check:pack`, `check:node-consumer`, `check:react-consumer`, `check:three-newest`, `measure:example` and `check:public-build`.
- The quick browser tier: `docs/evidence/browser-quick-20261122T023312Z`.

**Why reuse is allowed:**

- The rule in `docs/agents/verification.md` requires a fresh run when tests change. That applies to the test gate, which was run fresh (`test:full`).
- The reused gates do not read `packages/astraeus-site/tests/`. Their inputs are engine and package source, tools, manifests and examples, and none of those changed.
- `docs/agents/browser-policy.md` says "one tier, once … a later check reuses the earlier run". The repair also touches no browser-policy path.

## Prior owner decisions

The Objective has no owner acceptances or exceptions; the T-413..T-417 `check_waiver`s are Task-check waivers, not decisions under Closure Rules. There is nothing to carry forward.

## Observations (non-blocking, outside the frozen cells)

- In `ci never publishes`, a ci step whose text contains both `publish-packages.mjs` and `--dry-run` (an if/else like publish.yml's) would pass. The frozen cell, "no workflow runs npm publish", is covered.
- The step plants fall back to `job.steps[0]` (checkout) if the lint or browser step is renamed. The plant would still fail, but on a non-gate step.
- C-208's observations still stand.

## Owner validation still needed

None for this Check. Next: the owner merges `o091-ci-every-push` to `main`, then T-417 runs on the first `main` push (CI green, plus the planned red/green proof as T-417 states), and then the owner closes T-417 and the Objective.

## Full Check Progress Checklist

- [x] Establish Scope (C-208 lock reused)
- [x] Freeze The Check Scope (unchanged)
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix (unchanged; inputs untouched)
- [x] Workflow And Side-Effect Check Lock (row 5 hole closed)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (advisory; not evaluated)
- [x] Perform The Adversarial Pass (Q1–Q12)
- [x] Re-check After Remediation
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass (none new)
- [x] Summarize Materiality (no open Issues)
- [x] Review Code Style

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches** (each new rule branch has a plant)
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data** (the plants are generated from key × level × file tables)
- [x] STYLE-10 **Small diffs** (one test file)
