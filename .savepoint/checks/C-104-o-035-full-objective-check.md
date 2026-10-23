---
id: C-104
scope: {kind: objective, id: O-035}
result: NEEDS WORK
unmet: [SC2]
checked_by: {role: checker, session: o035-full-check-20261023}
executed_session: o035-coordinator-20261023
checked_at: '2026-10-23T06:27:30Z'
health_snapshot: sha256:931172054110a51c0ab41abb9a32a01bbcfff3343c68bd7fc7282b052fe8bfea
reviewed:
  base_commit: 35462f39
  head_commit: 94ae605c
  files: [package.json, vercel.json, tsconfig.json, vitest.config.ts, eslint.config.js, tools/check-engine-alone.mjs, packages/astraeus/package.json, packages/astraeus-demo-apollo11/package.json, packages/astraeus-demo-showers/package.json, packages/astraeus-demo-planets/package.json, packages/astraeus-site/package.json, packages/astraeus-site/vite.config.ts, packages/astraeus-site/src/main.tsx, packages/astraeus-site/tests/packageBoundaries.test.ts, packages/astraeus-site/tests/packageCredits.test.ts, packages/astraeus-site/tools/site/package-credits.mjs, packages/astraeus-site/tools/validate/public-build-assets.mjs, packages/astraeus-demo-planets/src/experiences/planets/systems/saturn.ts, packages/astraeus-demo-showers/src/experiences/showers/measuredOrbits.ts, AGENTS.md, README.md, packages/astraeus/README.md, docs/BROWSER_CHECKS.md, .savepoint/Design.md]
  dependencies: []
issues: [I-076]
supersedes: null
---

# C-104: O-035 Full Objective Check

This is the Full Objective Check for O-035 (T-155 to T-158), diffed from `35462f39` to `94ae605c` with a clean tree. This session is independent: it did not plan, build, coordinate or mark any O-035 work. All times are `date -u` output.

**Verdict: NEEDS WORK, on one low-materiality Issue (I-076).** Everything else is proven: the engine works alone, the commands are unchanged, the site is unchanged, and a fresh clone builds the same public site.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (no lanes used; nothing to evaluate)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (first run; not applicable)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock

1. The criteria under test are SC1 to SC5 and each Task's Done When. The guardrails are ARCH-01, ARCH-03, ARCH-04, PROV-01, PROV-02, TEST-01 and TEST-03. The release gates are lint, typecheck, build, `test:full`, `check:engine-alone`, the public build with the load budget, `public-build-assets` and `public-addresses`, the health check, and `check:browser` once.
2. The changed files are the five manifests, the root config, `tools/check-engine-alone.mjs`, the boundary and credit tests and tools, `main.tsx`, `vite.config.ts`, the planet system globs and the docs. The entry points are the root npm scripts and Vercel's `buildCommand`.
3. Relied-on behaviour: npm workspaces and their links, Vite glob resolution from the site root, and the Vitest include over `packages/*/tests`.
4. The matrix is below. Not applicable: text classes (no text handling changed) and output sinks (CLI output only, nothing interactive).
5. An Issue must breach a named SC, Done When or guardrail, be reproducible from the repository root, and have a credible consequence.

## Coverage Matrix

| Row | Normal | Boundary / bypass | Failure | Result |
|---|---|---|---|---|
| SC1 engine alone | `check:engine-alone` pass, 06:22:02-06:22:25Z (typecheck, lint, 65 files: 647 pass, 1 skip) | Scratch root with planted engine tests: relative import into a demo → typecheck FAIL; bare `astraeus-demo-showers/...` → typecheck FAIL; glob into a demo → matches nothing, test FAIL | The script stops at the first failing step and removes its scratch folder | Proven |
| SC2 declared entries | 534 specifiers go through names; boundary test green | Its regex skips `import.meta.glob`; `main.tsx:43-45` globs `astraeus-demo-planets/src/.../systems/*.ts` (code) by relative path; the planets systems glob engine `data/` | A moved demo file empties the glob silently and the build stays green | **Issue I-076** |
| SC2 engine imports no demo | Boundary test (b), plus the engine-alone probes above | Engine `src/experiences/{apollo11,showers}/` hold generic helpers (`spacecraftMetrics`, `showerChoice`) under demo-named folders; no demo import | — | Proven (observation) |
| SC3 demo-owned data and credits | Each demo has `data/`, `credits/`, `tests/` and its own `tools/` where it has one; core data is in the engine; `public-build-assets` ok | `packageCredits.test.ts` picks up a made-up demo; the engine is missing a licence → the gate fails (code read) | — | Proven |
| SC4 same site | Load budget: every page ok, 99 files, 26,012,296 B (T-155 recorded 26,012,195 B; +101 B from the T-158 fetch-command text) | Two never-read `panels-*.json` are no longer emitted. Confirmed unread: the showers glob only resolves `gmn-iau-*.json` (`measuredOrbits.ts:100-102`) | — | Proven; owner look recorded ("all fine, run the check") |
| SC5 same commands and deploy | lint, typecheck, build, test:full and check:browser all run from the root | Fresh `git clone` of HEAD, then `npm ci`, then `ASTRAEUS_PUBLIC_BUILD=1 npm run build` (vercel.json `buildCommand`) gives 99 files, the same file list as the local dist, and the same bytes, with load budget and assets ok | — | Proven locally; a real Vercel deploy has not run (owner's next deploy) |

External boundary (dev server, preview server, browser runner, npm): the runner started its own servers and the check passed. Ports 5490 and 5491 belong to the owner and were left as they were. `npm ci --dry-run` exits 0 and a real `npm ci` in the fresh clone exits 0. Redirects, timeouts and secrets do not apply: no network code changed.

Workflow lock (`check-engine-alone.mjs`): mkdtemp, then copy the engine and config, then symlink every dependency except `astraeus*`, then link the engine copy, then typecheck, lint and test, then rm. A failure exits 1 after cleanup. One observation: the copy also takes the git-ignored `tools/import/.horizons-cache` (about 2.5 GB). No test reads it, so this costs time and disk only.

## Adversarial Pass

- **Bypass of the boundary.** Found I-076: globs are not checked, and one of them is code, contrary to the test header and Design ("data paths, never code"). Runtime file reads in demo tests (`demoPlanets`, `planetSystems`, `mapOrientation`, `timeline`, `elementsBody`) reach engine files by path. They are tests only, so this is an observation.
- **Does engine-alone isolate?** Yes for imports, names and globs (the probes above). An engine glob that reaches outside matches nothing silently and is caught only if a test asserts on its content. This is an observation.
- **Same build from a clean checkout.** Yes. No ignored file (caches, `data/local`) is needed.
- **Negated planet globs.** These were rewritten from `!**/` to full paths. The file list is unchanged and `planetSystems.test.ts` passes, so the shipped chunk sets are equal.

## Gates

| Gate | Time (UTC) | Result |
|---|---|---|
| `git diff --check 35462f39 HEAD` | 06:20:50Z | Flags trailing whitespace in the byte-copied Horizons fixtures (expected) and one blank line at EOF in T-156. Non-material |
| `npm run lint` | 06:20:50-06:20:54Z | pass |
| `npm run typecheck` | 06:20:54-06:20:58Z | pass |
| `npm run build` | 06:20:58-06:20:59Z | pass |
| `npm run test:full` | 06:20:59-06:22:02Z | 116 files, 1529 pass, 1 skip; coverage: lines 74.89%, branches 70.4% |
| `npm run check:engine-alone` | 06:22:02-06:22:25Z | pass, 23.5 s |
| Public build + `load-budget.mjs dist` | 06:22:25-06:22:27Z | all ok |
| `public-build-assets.mjs dist` / `public-addresses.mjs dist` | 06:22:27-06:22:29Z | ok / ok |
| `savepoint health check O-035` | 06:22:42-06:22:48Z | snapshot `sha256:9311720541…`; "does not block clearance"; all instances report no finding |
| `npm run check:browser` (once) | 06:22:51-06:24:11Z | pass: smoke, smoke-public-showers, planets-phone, meteor-shower, public-build-assets, public-addresses; evidence `docs/evidence/browser-20261023T062251Z`; no screenshots |
| Fresh clone + `npm ci` + public build | 06:25:21-06:25:34Z | pass; same 99-file list as the local dist |

## Owner Decisions Carried Forward

- **T-156, "Accept broad doorways (Recommended)" (patterns per folder; O-036 narrows).** Honest: the exports are as described, and the test still rejects undeclared and deep entries. It applies unchanged. It is recorded as prose in the Task and Design, not as a structured `exception:`. It does not cover the glob reaches (I-076).
- **T-157, "Finish it, short (Recommended)".** Honest: the `assets.html` credits are byte-identical, and each demo has `credits/CREDITS.md` with copied rows. Applies. Observation (STYLE-07): the same credit rows now exist in two places and can drift.
- **I-075 (assets page too long).** Outside O-035 scope; not a finding.
- **T-158 owner look.** Recorded verdict: "all fine, run the check". `owner_validation.accepted_check` is still for the owner to record.

## Materiality

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-076 boundary test misses globs, one of them code | Medium (any demo file move) | Low (the planets view breaks at run time while the build and guard stay green; tests in the planets package likely catch most cases) | Low | Fix now as a narrow repair: check glob patterns in the boundary test, and have planets export its systems map. Or the owner accepts it by name and the docs are corrected |

## Observations (non-blocking)

- The engine holds `src/experiences/apollo11/spacecraftMetrics.ts` and `src/experiences/showers/showerChoice.ts`. They are generic, but their folders carry demo names. O-036 could rename them.
- `docs/BROWSER_CHECKS.md` and an AGENTS.md project rule name `tests/...` files (`streamCheck`, `domSetup`, `browserDriverGuard`) without saying which package holds them: some are in the site package, some in the engine.
- The demos reach engine data and files by relative path (for example `vite.config.ts` PLACEHOLDER). This is fine inside the workspace, but will need rethinking when the engine ships from npm (O-036).
- SC1 says "builds". The engine has no build step, by plan ("build (if it has one)"), so typecheck stands in for it.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [ ] STYLE-05 **Build only what is needed**: the engine exports pattern groups wider than current use (`packages/astraeus/package.json`), under the owner's exception.
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth**: credit rows are duplicated in `assets.html` and the demos' `credits/CREDITS.md`, and the Horizons fixtures are copied into `packages/astraeus/tests/fixtures/o019-t078/`.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs**: about 9,900 renames is unavoidable for the move, and it was committed alone as planned.

## Owner Validation Still Needed

- Resolve I-076: repair and recheck, or accept it from the board.
- Record T-158's owner acceptance against the current Check.
- A real Vercel deploy at the next release.
