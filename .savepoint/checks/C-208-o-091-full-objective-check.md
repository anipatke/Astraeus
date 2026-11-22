---
id: C-208
scope: {kind: objective, id: O-091}
result: NEEDS WORK
checked_by: {role: checker, session: check-o091-20261122}
executed_session: orchestrate-g024-20261121 / orchestrate-g024-20261122 (T-413..T-416 builders)
checked_at: '2026-11-22T02:37:39Z'
health_snapshot: sha256:13d6e386bc182c68f838bb499a04f7b10cf56f757a9326c4f8b9527ff2e8954c
reviewed:
  base_commit: 276614b3
  head_commit: d6bdf464
  files: [.github/workflows/ci.yml, .github/workflows/publish.yml, packages/astraeus-site/tests/workflowParity.test.ts, tools/check-engine-alone.mjs, tools/check-react-consumer.mjs, package.json, package-lock.json, packages/astraeus/package.json, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, docs/RELEASING.md, docs/agents/build.md, .savepoint/Design.md]
  dependencies: [yaml@2.9.1]
issues: [I-198]
supersedes: null
unmet: [T-416 Outcome, T-416 Done When rule 6]
---

# C-208: O-091 Full Objective Check

This is a fresh session. It did not plan, build or repair any O-091 work. The diff is `276614b3..d6bdf464`, where `git merge-base main HEAD` = `276614b3` (O-088 merged). T-413..T-416 are `done`, each with an owner `check_waiver`. T-417 is `planned`.

**Result: NEEDS WORK.** The workflows, the release steps, the newest-three check and the narrowed peer range are all correct, and every gate is green. One Issue: the parity test that is meant to keep CI honest passes when a gate step is switched off (`if: false`) or its failure is ignored (`continue-on-error`), when a `paths-ignore`/`branches-ignore` push filter is added, and when ci.yml runs `npm publish` (I-198). It is low materiality, and the fix touches the test file only.

**T-417 and the GitHub red run.** T-417 is treated as a post-merge check, not as evidence missing from this Check. By the owner rule in the Objective's Decisions, no throwaway red branch was pushed and no release workflow ran on GitHub, not even a dry run. Success condition 1's GitHub red run is therefore recorded as **not run, by owner rule**. In its place this Check takes the local evidence:

- T-416's planted copies, re-run here with my own plants;
- T-413's fresh-clone gate runs on Node 22 and 24;
- T-414's local release steps;
- this session's own gate runs.

The condition is judged on whether the workflow would fail on a failing gate. As written it would. I-198 shows the test that protects that property has holes. The Objective cannot close until T-417 is done after the merge (Closure Rules: every owned Task done). No Objective-level exception covers it, and none is needed.

## Scope lock

1. Criteria: the 4 Objective success conditions, and the Done When of T-413..T-416. T-417 is post-merge (see above). Guardrails: SEC-01, API-07, TEST-01, TEST-03, CODE-01, STYLE (advisory). Gates: `quality_gates`, the full gate, the `docs/agents/build.md` gates, and the browser tier from the policy.
2. Changed files: the `reviewed.files` above. Entry points: the two workflows, as GitHub would run them; `check-engine-alone.mjs` with and without `--three`; `check:three-newest`; `check-react-consumer.mjs`; the parity test; and the published peer range.
3. Relied-on externals: the npm registry (`npm view`, install), GitHub action tags (SHA lookup), and the Chromium download in the release workflow. None of these was run on GitHub, by owner rule.
4. Matrix axes: workflow triggers, step neutralisers, gate list, permissions and refs; the release order before publish; the three version (below floor / floor / middle / newest admitted / first excluded / malformed / missing); and the docs and the test kept in step.
5. Admission: the item must be reachable by editing the workflow files (the very path the test guards), be inside T-413..T-416, and have a credible consequence.

## Coverage matrix

| # | Criterion / cell | Result | Evidence (this session) |
|---|---|---|---|
| 1 | SC1 / T-413: ci.yml on push + pull_request, Node 22/24, `quality_gates` verbatim, `contents: read`, no network/browser step | Proven | File read. Plant P7 (changed `quality_gates.lint`) fails the test. My own gate run on Node 22 (local) is green. |
| 2 | SC1: a failing gate turns CI red | Proven locally; GitHub run not run (owner rule) | No step or job has `continue-on-error`/`if`, so a non-zero gate fails the job. T-413 records fresh-clone runs. |
| 3 | SC1 guard: the parity test fails when ci.yml stops running or enforcing the gates on every push | **Issue I-198** | Not caught: P12 `if: false` on lint, P14 `if: false` on the job, P10 `continue-on-error` on test, P1 `paths-ignore`, P9 `branches-ignore`. Caught: P0 baseline clean, P7, extra step in the gates job, P4 id-token on the ci job. |
| 4 | SC2 / T-414: publish.yml runs node-consumer, react-consumer, three-newest, Chromium install and the four `--step` examples before the unchanged publish step | Proven | File read. Plant P5 (three-newest removed) is caught. The T-416 plants (node consumer moved after publish, hello-sky dropped) are re-run in the mirror. |
| 5 | SC2 guard: a release check cannot be neutralised | **Issue I-198** | P11 `continue-on-error` on the browser step is not caught. A release would publish after a failed browser check. |
| 6 | T-416 rule 6: the publish step has `--dry-run`; no workflow runs `npm publish` | **Issue I-198** (second half) | `--dry-run` removal is caught (T-416 plant). P2b, an `npm publish` in a second ci.yml job, is not caught: the rule scans `publish.yml` only (`workflowParity.test.ts:94-95`). |
| 7 | SC4 / SEC-05: SHA pins, the same SHA in both files, `id-token` on the publish job only | Proven | `git ls-remote`: checkout `v7.0.1` = `v7` = `3d3c42e5…`; setup-node `v7.1.0` = `v7` = `949feb24…`. Both match the files. P3 (differing SHA) and P13 (tag ref) are caught. |
| 8 | SC3 / T-415: `--three newest` reads the range from the manifest and links a single copy | Proven | `check:three-newest` gives three 0.180.0 (REVISION 180), @types 0.180.0, 4204 tests passed. Negative cells: `--three 0.181.0`, `0.168.0` and `banana` each exit 1 naming the range; a missing value exits 1 with its message. |
| 9 | SC3: the peer range matches what is proven (API-07) | Proven | Middle minors run here: 0.170.0, 0.173.0 and 0.175.0 each pass typecheck, lint and tests. First excluded: 0.181.2 run through a scratch copy with the range widened. It fails typecheck with `useBodyTexture.ts(8,12)` TS2416 and `glowAndHooksDom.test.ts(31,71)` TS2739, which match I-195. The narrowing is honest. README, CHANGELOG, Design and the lock (one line) all say `<0.181.0`. I-195 stays open and out of scope. |
| 10 | T-415: no-flag engine-alone unchanged; react-consumer prints three | Proven | `check:engine-alone` passes (4204/1 skipped). `installed: react 19.3.1, react-dom 19.3.1, three 0.180.0`. |
| 11 | T-416: `yaml` exact-pinned; RELEASING table, paragraph and build.md CI bullet | Proven | `"yaml": "2.9.1"`. The lock diff is yaml plus the peer line only. The docs name every release check and ci.yml. |
| 12 | Design reconciliation | Proven | `Design.md` "CI on every push (O-091)" plus the three-peer sentence under Honest versions. The T-415/T-416 drift notes are reflected. |

External boundary: registry resolution and install are exercised (newest, literal, out of range). Their non-success paths exit non-zero, naming the cause. Timeout and redirect cells do not apply (npm's own handling). The Chromium `--with-deps` install on the runner is unverified locally (T-414 dry-run only) and falls to T-417 and the first release. Secret-safe output: there are no secrets (SEC-01 is satisfied; neither workflow needs a token).

Workflow/side-effect lock (publish.yml): every check runs before the single externally visible effect, `publish-packages.mjs`, and a failure stops the job before it. The release branch publishes with `--tag`; a manual run uses `--dry-run`. Per-package skips make a re-run idempotent (unchanged). The one hole is a step-level `continue-on-error` (row 5).

## Gates (this session, head d6bdf464, Node local)

| Gate | Result |
|---|---|
| `npm run lint` / `typecheck` / `build` | pass (7 s / 8 s / 3 s) |
| `npm run test:full` | 325 files, 5334 passed, 2 skipped; 56 s |
| `npm run check:engine-alone` | 247 files, 4204 passed, 1 skipped; 29 s |
| `npm run check:pack` | pass; engine 1,836,426 B raw (limit 1,838,000), 525,714 B gzip (limit 527,000); 24 s |
| `npm run check:node-consumer` | 12 passed |
| `npm run check:react-consumer` | pass (react 19.3.1, three 0.180.0) |
| `npm run check:three-newest` | pass, three 0.180.0 / @types 0.180.0; 33 s |
| `npm run measure:example` | first-open 1,836,426 B raw / 525,714 B gzip |
| `npm run check:public-build` | pass; `docs/evidence/public-build-20261122T023258Z` |
| `git diff --check 276614b3..HEAD` | clean |
| Browser, `npm run check:browser -- --tier quick` | exit 0, 124 s (limit 200), all 7 steps, including hello-scene/react/planets/sky, error-lines 0; `docs/evidence/browser-quick-20261122T023312Z` |
| `savepoint health check O-091` | snapshot above (created): "does not block clearance". The coverage and tests instances report "stale". They are optional, and this is a collection statement, not a finding (as in C-205..C-207). |

Browser decision: the diff touches none of the policy's full-tier paths. The peer range is not an `exports`/`files` field, and `tools/check-engine-alone.mjs`/`check-react-consumer.mjs` are not `build-*`/`check-packs`. So the quick tier runs, once. It includes the four packed-example steps the release workflow now runs.

## Materiality

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-198 | Low: needs a later workflow edit, though `continue-on-error` is a common "make it pass" edit | Medium: CI green on a failing gate, or a release published past a failed check | Low | Fix now. It is one narrow edit to `workflowParity.test.ts` (new plants, plus reading `if`/`continue-on-error` and the push filter keys), then a re-check |

## Observations (non-blocking)

- Rule 9 checks the RELEASING table for the five `check:*` scripts but not for the `check:browser` row. The row is present.
- If the publish step were removed entirely, `publishIndex` would give -1, so `beforePublish` would drop the last step. Rule 6 would still catch the missing publish step.
- RELEASING step 4's local list does not include `check:node-consumer`/`check:react-consumer`/`check:three-newest`. That is by design (the workflow runs them).

## Owner validation still needed

None for this Check. After the repair: a fresh re-check, then the merge and T-417's post-merge `main` CI run.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (advisory; not evaluated)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: first run)
- [x] Verify File Reality (every file named in the Task evidence exists; the T-414 clone at /tmp is scratch)
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth** (gates come from `quality_gates`, examples from `STEPS`, the range from the manifest)
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**
