---
id: C-165
scope: {kind: objective, id: O-065}
result: CLEAR
checked_by: {role: checker, session: o065-recheck2-20261110}
executed_session: o065-repair2-20261110
checked_at: '2026-11-10T05:50:00Z'
health_snapshot: sha256:84aaeee0c8ca514b57697016dd9e887ab2c4dc674c3da949e7a054f224752c1c
reviewed:
  base_commit: 3e335c9c
  head_commit: a5004070
  files: [packages/astraeus-site/tests/packagePacks.test.ts, packages/astraeus-site/tests/engineBudget.test.ts, packages/astraeus-site/tools/validate/engine-budget.mjs, tools/build-example.mjs, tools/build-example.d.mts, docs/BROWSER_CHECKS.md, .savepoint/objectives/O-065-draw-and-trace-figures-on-the-sky/Objective.md]
  dependencies: []
issues: []
supersedes: C-164
---

# C-165: O-065 Full Objective Targeted Re-check

**Verdict: CLEAR.** The one targeted repair of the C-164 finding (I-164: two test files building `packages/astraeus/dist` in parallel) holds. `engineBudget.test.ts` is gone; the engine size check is now the second test in `packages/astraeus-site/tests/packagePacks.test.ts`, run straight after that file's own `checkPacks()` build, and packs the engine from that dist (`buildExample("hello-scene", { buildPackages: false })`). No other test file builds into `packages/*/dist` or the example folders. Six whole-suite runs and two runs of the file alone all passed; the full gate, the engine-alone, pack and consumer gates and one fresh `npm run check:browser` passed; the size check is honest (fails one byte under the limit, on each count separately) and runs in `npm test`. This is the targeted re-check that the default convergence limit allows; no further autonomous cycle is needed.

## Closure Map Of Prior Issues

| Prior Issue | State | Why |
|---|---|---|
| I-164 (C-163, re-opened evidence C-164) | **Closed, verified** | Size limit proven in the fresh browser run (`public-build-assets` 1,745,198 / 501,483 B within 1,833,000 / 527,000) and in `npm test`; the fast check no longer shares a build folder with another test file; 6 of 6 whole-suite runs and 2 of 2 single-file runs pass; `docs/BROWSER_CHECKS.md` states the current measurement beside the limit. |
| I-165 (C-163) | **Closed, verified** | Proof met at C-164 and again in this run: `look-out` passes at both sizes in 41 s (limit 50 s). |
| I-166 (C-163) | **Closed, verified** | Proof met at C-164; the repair since touched no published sky-trace wording; grep for `after: "clear"` / "stay, fade or clear" over engine src, README, CHANGELOG, browser map, step descriptions, Design and the Objective finds nothing. |

## Full Check Progress Checklist

- [x] Establish Scope (diff 3e335c9c..a5004070: 8 files, 32+/29-)
- [x] Freeze The Check Scope (C-163's lock reused unchanged)
- [x] Turn Acceptance Into Invariants (C-163's)
- [x] Build The Mandatory Coverage Matrix (C-163's; SC1 to SC8 engine rows unchanged since C-164 — the repair touches no engine source; proven by the fresh `test:full`)
- [x] Finite External-Boundary Matrix (unchanged; browser runner ran and stopped its servers)
- [x] Workflow And Side-Effect Check Lock (repair's build side effects below)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (not a feature here)
- [x] Perform The Adversarial Pass (repair code paths only)
- [x] Re-check After Remediation
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Admission Ledger

| Re-check item | Prior Issue / claim | Frozen cell (C-163/C-164) | Allowed result |
|---|---|---|---|
| Repeated `npm test` (whole suite) | I-164 C-164 reproduction | scope lock 1 release gates (`quality_gates` test) | pass / Issue |
| `packagePacks.test.ts` alone, repeated | I-164 C-164 reproduction (each file alone) | same | pass / Issue |
| No other test file builds into `packages/*/dist` or `examples/*` build folders | I-164 repair claim | same | pass / Issue |
| Size check honest: in `npm test`, fails one byte under | I-164 Proof Needed (strategic fix) | SC9 browser gate; release gates | pass / Issue |
| In-test build equals the CLI / browser build | I-164 C-164 (cleanEnv) | SC9 browser gate | pass / Issue |
| `build-example.mjs` change (install `--prefer-offline`, kept npm registry settings) vs the browser steps that use it | I-164 repair's changed code path | SC9 browser gate (`hello-*`, `public-build-assets`) | pass / Issue |
| `docs/BROWSER_CHECKS.md` measured figure | I-164 Further Proof Needed | SC9 docs honesty | pass / Issue |
| Browser `look-out` both sizes | I-165 | SC9 browser gate | pass / Issue |
| Published `after` wording | I-166 | SC9 docs honesty | pass / Issue |
| Objective Outcome wording | C-164 Observation 4 | planner text | observation only |

## Re-check Results

| Item | Command / evidence | Result |
|---|---|---|
| Whole suite ×4 | `npm test` 05:33–05:36Z | 4 of 4 pass: 241 files, 3,563 passed + 2 skipped each; 42, 41, 40, 43 s |
| Whole suite inside `check:gates` | `test` and `test:full` | both pass (3,565 tests, 0 failures in junit.xml) |
| `packagePacks.test.ts` alone ×2 | `npx vitest run --project preloaded packages/astraeus-site/tests/packagePacks.test.ts --reporter=verbose` | 2 of 2 pass, 21 tests; the ENGINE_LIMIT case 2.6 s; file 23–26 s |
| Builders of shared folders in tests | grep of `packages/*/tests` for build-example / build-packages / check-packs / `dist` / `examples` / tools imports | only `packagePacks.test.ts` builds (`checkPacks`, `buildExample`); `publishWorkflow.test.ts` reads `examples/hello-scene/src/main.js`, `package.json`, `.gitignore` (sources, not build output); `packageBoundaries.test.ts` skips `dist`; `hygStars` "dist" is a CSV column; other tool imports are pure functions or scratch-folder probes |
| Order inside the file | Vitest runs a file's tests in sequence; the size case packs `packages/astraeus/dist` before the later planted-file cases write into it, and each planted case restores what it wrote | pass |
| Independent boundary probe (scratch script, not a repo test) | `checkEngineBudget` on the built example | measured 1,745,198 / 501,483; limit equal to measured → ok; raw limit −1 only → fails with the raw problem only; gzip limit −1 only → fails with the gzip problem only |
| In-test build = CLI build = browser build | `node tools/measure-example.mjs` after the test's build; browser `public-build-assets.log` | all three 1,745,198 / 501,483 |
| `docs/BROWSER_CHECKS.md` | Size limits line | now "measured 1,745,198 / 501,483 plus 5%, reset 2026-11-10 … first measured 1,652,588 / 472,895 on 2026-11-01; `npm test` also holds it, in `packagePacks.test.ts`" — correct |
| `engine-budget.mjs` doc comment | names `packagePacks.test.ts` | correct; `engineBudget.test.ts` absent on disk (intentionally deleted in bc2a4194) |

## Verify Evidence And Gates (fresh, a5004070)

| Gate | Result | Time / limit |
|---|---|---|
| `git diff --check main...HEAD` | pass | — |
| `npm run check:gates` (05:39:30Z–05:42:26Z): `lint`, `typecheck`, `build`, `test`, `test:full`, `check:engine-alone`, `check:pack`, `check:node-consumer`, `check:react-consumer` | all pass; 0 over limit | lint 4/15, typecheck 6.1/20, build 2.4/15, test 40/65, test:full 71.6/105 (3,565 tests, 0 failures; junit.xml and coverage written 05:41:34Z), engine-alone 23.2/40, pack 14.5/30, node-consumer 7.6/15, react-consumer 5.6/25; total 175 s |
| `npm run check:browser` once, fresh (05:42:42Z–05:47:09Z) | **pass, every step** | total 266 s / 320; smoke 117/170, look-out 41/50, hello-scene 11/25, hello-react 7/12, hello-planets 6/15, public-build-assets 2/8 |
| `savepoint health check O-065` (after the full gate) | snapshot created; "does not block clearance" | — |

Toolchain: Node v24.16.0, npm 12.2.1.

**Browser run reuse decision.** C-164's run (`docs/evidence/browser-20261110T051452Z/`) was **not** reused. The repair changed `tools/build-example.mjs`, which the `hello-scene`, `hello-react` and `hello-planets` steps run to build the examples from the packed tarball and whose `hello-scene` output `public-build-assets` measures: the nested `npm install` gained `--prefer-offline` (with no lockfile, the example may now resolve its dependencies from cache) and the install environment changed. That is an input to what the browser run proved, so the metadata-only reuse rule does not apply; one fresh run was taken. Evidence: `docs/evidence/browser-20261110T054242Z/` (summary.txt and each step's results.json); step logs `/tmp/astraeus-check-logs-3m7qn2/`; `public-build-assets.log` `engineBudget { ok: true, raw: 1745198, gzip: 501483, rawLimit: 1833000, gzipLimit: 527000, problems: [] }` — the same bytes as C-164's run, so the install flag change did not alter the build. No screenshots were taken.

## Workflow And Side-Effect Lock (repair rows)

| Order | Operation | Side effect | Failure owner / final state |
|---|---|---|---|
| 1 | `checkPacks()` (test 1) | deletes and rebuilds all eight `packages/*/dist`, packs dry-run | test 1 fails; size case then fails on the stale/missing dist, both reported |
| 2 | `buildExample("hello-scene", { buildPackages: false })` | `npm pack` from `packages/astraeus/dist` into `examples/hello-scene/.packs`, `npm install --prefer-offline`, `vite build` → `examples/hello-scene/dist` | throws with the failing command; test fails |
| 3 | `checkEngineBudget()` | reads `examples/hello-scene/dist` only | assertion |
| 4 | later planted cases | write then restore files in `packages/*/dist` | `finally` restores |

No other worker touches these folders (re-check table above).

## Issues

None. No materiality actions are required.

## Owner Decisions Carried Forward

No structured `exception` or `owner_validation.accepted_check` record exists in scope (C-163 Observation 4, C-164), so there is no `carried_forward` list to append to; assessed here:

| Decision | Changed since C-164? | Applies |
|---|---|---|
| T-298 owner look ("looks ok", "Go once tests pass") | No: the repair touches no scene, site or engine code | Yes |
| API-04 `star` allowlist approval (owner, 2026-11-10) | No | Yes |
| API page gzip limit 44,000 (owner, T-296) | No; page budgets pass | Yes |
| I-164 "Reset limit, add fast test" | No: limit unchanged; the fast test kept in the ordinary gate | Yes |
| I-164 "Fold into one build" (owner, after C-164) | New; applied as stated (size check in `packagePacks.test.ts`, one owner of the dist build, five-plus repeated `npm test` runs pass) | Yes |
| I-165 look-out limit 30 → 50 s | No; run 41 s | Yes |

## Observations (non-blocking)

1. The size case depends on the build made by the case before it in the same file. Run alone (for example `vitest -t ENGINE_LIMIT`) it packs whatever `packages/astraeus/dist` holds, possibly stale or missing. Ordinary runs always run the file whole, so this does not affect the gate; a `beforeAll` build would make the order explicit.
2. `npm install --prefer-offline` with `--no-package-lock` lets the example resolve dependency versions from the local cache rather than the registry's newest within range. Today it builds the same bytes as before; on a machine with an old cache the measured size could differ slightly from a fresh install's. The size test still needs the registry on a cold cache.
3. The new I-164 history entry is stamped `2026-11-10T17:30:00Z`, local time (+11:00) marked as UTC (the repair commit is 05:34:27Z); same as C-164 Observation 2, which the executor noted and left.
4. C-164 Observation 4 is resolved: the Objective's Outcome and the "Tracing on command" line now match the "Removing a trace" and Sun-glow decisions (planner text).
5. `savepoint resume` warns "router still selects finished Task T-298"; router handling is outside this Check.
6. C-163 Observations 1–3, 5–7 and C-164 Observations 3 and 5 stand unchanged.

## Code Health

Snapshot `sha256:84aaeee0c8ca514b57697016dd9e887ab2c4dc674c3da949e7a054f224752c1c` (created after the full gate). Verdict: "Code Health does not block clearance." complexity, coverage, dependency vulnerabilities, duplication, tests (all optional): reported, no finding. Coverage and tests were not stale this time. No Issue from health.

## Closure Readiness

- Every owned Task (T-294 to T-298) is `done`; this mandatory Objective integration Check is `CLEAR` and current; I-164, I-165 and I-166 are closed `verified` by it. The owner may record O-065 done.
- Owner validation still needed: none beyond the owner's own Objective close; the T-298 look carries forward.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches** — the size case proves both the pass and the one-byte-below failure.
- [x] STYLE-04 **Types document intent** — `build-example.d.mts` declares the new option.
- [x] STYLE-05 **Build only what is needed** — one dist build per test run now.
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth** — one test file owns the `packages/*/dist` build (C-164's unticked item resolved).
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs** — 32 insertions, 29 deletions over 8 files.
