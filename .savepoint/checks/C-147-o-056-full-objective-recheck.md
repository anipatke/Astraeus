---
id: C-147
scope: {kind: objective, id: O-056}
result: CLEAR
checked_by: {role: checker, session: o056-recheck-20261103}
executed_session: o056-i142-repair
checked_at: '2026-11-03T11:26:00Z'
health_snapshot: sha256:1198ef8f2debb9b16f662dd1ca85cb8fbb10427d23e4a31a45424c06cf07742c
reviewed:
  base_commit: 43157c80
  head_commit: 99d9608b
  files: [packages/astraeus-site/tools/validate/load-budget.mjs, packages/astraeus-site/tests/apiReference.test.ts, packages/astraeus/tests/eventZonesDom.test.ts, .savepoint/Design.md]
  dependencies: []
issues: []
supersedes: C-146
---

# C-147: O-056 Full Objective Check, re-check after remediation

Full re-check of O-056 after C-146 returned NEEDS WORK. It uses C-146's frozen scope lock and matrix unchanged. The repair under review is commit `99d9608b` ("Repair I-142"; diff `909fbdad..99d9608b`: `load-budget.mjs`, `apiReference.test.ts`, `Design.md`, one whitespace line in `eventZonesDom.test.ts`, and the I-142 file). The whole Objective (`main...99d9608b`, base 43157c80) was re-gated.

**Verdict: CLEAR.** I-142 holds under independent evidence: the one `check:browser` passes all 10 steps, `public-build-assets` included, and the new fast test fails when the page exceeds either limit. Every frozen matrix cell passes again, and every gate passes.

## Closure Map Of Prior Issues

| Issue | State | Proof |
|---|---|---|
| I-142 (API reference page over its raw load budget) | **closed, verified** | `check:browser` 11:17:39-11:23:48Z, `public-build-assets` exit 0: `api/index.html` raw 118,927 / limit 150,000, gzip 26,965 / limit 30,000. The new test fails one byte under the raw limit (M1) and under a lowered gzip limit (M2), and passes at the exact limits (M3) |

**Prior owner decisions.** No structured `exception` or `owner_validation.accepted_check` is recorded on O-056, so no `carried_forward` entries are needed. The Task-check waivers on T-259 to T-264 are waivers, not exceptions. The owner's 2026-11-03 decision to raise the `api/index.html` raw limit to 150,000 B (gzip unchanged) is a rule change, recorded in the I-142 history and the `load-budget.mjs` comment and reflected in the code; it is not an exception. The 2026-11-03 `allowlistGrowth` decision is likewise in the code and unchanged since C-146.

**Independence.** This session did not plan, build, coordinate, repair or look at any O-056 step or the I-142 repair, and it is not the C-146 checker session. It treated the I-142 repair note and commit message as claims. It is not a lane: `git rev-parse --git-dir` equals `--git-common-dir`; branch `o056-headless-looks` on the main checkout.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope (re-check: C-146's lock reused unchanged)
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix (C-146 matrix, every cell re-run)
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (not a feature of this scope)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Admission Ledger

| # | Re-check item | Prior Issue / claim | Frozen cell | Allowed result |
|---|---|---|---|---|
| A1 | `check:browser` once, `public-build-assets` | I-142 | Row 21 (release gates), `check:browser` | exit 0, `api/index.html` within its recorded limits |
| A2 | New test fails above the raw limit | I-142 Proof Needed ("shown to fail when the limit is set below the current size") | Row 21 | test fails |
| A3 | New test fails above the gzip limit; passes at exact limits | I-142 Proof Needed (raw and gzip from one source) | Row 21 | fails / passes |
| A4 | Test measures the same page the build ships | I-142 Proof Needed (`buildApiPage()` against `load-budget.mjs`) | Row 21 | equal bytes |
| A5 | Design.md slips (C-146 O2) and trailing space (O5) | repair claim | Row 19 (Design reconciled); row 21 `git diff --check` | fixed |
| A6 | C-146 probes P (warm, cold) re-run | C-146 matrix rows 1-3, 5, 8-10, 15 | those rows | 63/63 pass |
| A7 | Every other gate | Row 21 | Row 21 | pass |

## Re-check Matrix Results

Evidence key as in C-146: **G** = the Objective's own tests in this run's `test:full`; **P** = C-146's probe files `docs/evidence/check-o056-20261103/warm.test.ts` and `cold.test.ts`, re-run here from byte-identical scratch copies with C-146's `vitest.probe.config.ts` (2 files, 63/63 passed); **B** = this run's browser evidence `docs/evidence/browser-20261103T111739Z/`; **N** = `check:node-consumer`.

| # | Row (SC) | Result | Evidence |
|---|---|---|---|
| 1 | Cold `stateOf` before load (SC1) | pass | P cold; G `tests/cold/sceneLoad.test.ts`; N |
| 2 | `load` then reads (SC1) | pass | P cold; G; N |
| 3 | `load` refusals (SC1) | pass | P cold; G |
| 4 | `check` vs `mount` (SC2) | pass | G `sceneCheck.test.ts` |
| 5 | Reads (SC3) | pass | G `sceneReads.test.ts`; P scene reads |
| 6 | Reads built from plans (SC3) | pass, code unchanged since C-146 | `git diff 180535a4 HEAD -- packages/astraeus/src` empty |
| 7 | Migration table (SC3) | pass, CHANGELOG unchanged | same diff |
| 8 | `setLook` input classes (SC4) | pass | P; G `look.test.ts` |
| 9 | `setLook` semantics (SC4) | pass | P; G |
| 10 | Address over set look over default (SC4) | pass | P (11 rows); G |
| 11 | One table through the address door (SC4) | pass, code unchanged | G `addressRule.test.ts` |
| 12 | `addressOnly` empty, allowlist rule (SC4) | pass | G `allowlistGrowth.test.ts` |
| 13 | Live host controls on both paths (SC4, SC5) | pass | G lifecycle, `twoViewers.test.ts`; B hello-planets exit 0 |
| 14 | `addBody` readouts (SC5) | pass | G `publicApiPaths.test.ts`; B hello-planets |
| 15 | Event zones (SC6) | pass | P event zones (11 rows); G `eventZonesDom.test.ts` (only change: trailing space removed at line 262) |
| 16 | Zones stay presentation (SC6, ARCH-02) | pass, code unchanged | same diff |
| 17 | Example (SC7) | pass | B hello-planets exit 0, desktop and phone; `build:example` pass |
| 18 | Surface and docs (SC8) | pass | G `apiSurface`, `apiRules`; lock unchanged since C-146 |
| 19 | Design reconciled (SC8) | **pass (C-146 O2 fixed)** | `Design.md` tests row now says O-056 "extended the existing `sunLook.test.ts` and `eventZonesDom.test.ts`" (both exist on main: `git cat-file -e main:...` checked in this run); the O-056 paragraph now says `camera.reach` and `camera.fitted` "are existing members that now read the same way" |
| 20 | Owner look before the Check (SC8) | recorded | T-264 Technical Evidence 2026-11-03T10:45:35Z, "looks right"; the repair touches no example, look or engine source |
| 21 | Release gates | **pass (I-142 fixed)** | Gates table; `mutations.txt` |

**I-142 remediation path.** `load-budget.mjs:41-42` now has `rawLimit: 150_000, gzipLimit: 30_000` for `api/index.html`, with a comment naming I-142, the owner decision and date. `apiReference.test.ts` reads the `api/index.html` entry from `PAGES` (one source, no copied numbers), throws if the entry is missing, renders the page with `renderApiPage(items)` from `collectExports()` (which is exactly `buildApiPage()`, `api-reference.mjs:196`) and asserts raw and gzip bytes `<=` the limits. The comparison matches `load-budget.mjs:280` (`>` limit is over), so the test and the browser step agree at the boundary. Independent oracle: the browser step measured the built `api/index.html` at 118,927 raw / 26,965 gzip, the same bytes the test reported in M1 and M2.

**Mutation probes** (`docs/evidence/check-o056-recheck-20261103/mutations.txt`; `npx vitest run packages/astraeus-site/tests/apiReference.test.ts -t "I-142"`; `load-budget.mjs` restored from a copy after each, `git diff --quiet` clean):

| Mutation | Result |
|---|---|
| M1: raw limit 118,926 (one byte below the page) | fails: `expected 118927 to be less than or equal to 118926` |
| M2: gzip limit 20,000 | fails: `expected 26965 to be less than or equal to 20000` |
| M3: raw 118,927 and gzip 26,965 (exact) | passes |

The test runs in the fast suite (`npm test`/`test:full` include `packages/astraeus-site/tests`): it ran in this run's `test:full` (`apiReference.test.ts`, 4 tests) and is in `junit.xml`.

**Finite external-boundary matrix and workflow lock.** Unchanged from C-146; the repair touches no runtime path. Browser runner: one run, 10 steps, all exit 0, 0 error lines.

**Adversarial pass (re-check axes only).** Can the page grow past the budget without failing `npm test`? Only if `renderApiPage` and the build's page diverge; they are the same function on the same entry, and the measured bytes agree (A4). Can the limit be dropped silently? A missing `api/index.html` entry throws in the test. The gzip limit is still enforced (M2).

## Gates (this run; `docs/evidence/check-o056-recheck-20261103/gates.log`; HEAD 99d9608b)

| Command | Result | Time (UTC) |
|---|---|---|
| `npm run lint` | exit 0 | 11:14:53-11:14:57Z |
| `npm run typecheck` | exit 0 | 11:14:57-11:15:02Z |
| `npm run build` | exit 0 | 11:15:02-11:15:05Z |
| `npm run test:full` (once; code changed since C-146, so no reuse) | exit 0: 207 files, 2606 passed, 2 skipped; coverage 92.78% statements, 87.98% branches, 95.01% lines | 11:15:08-11:16:19Z |
| `npm run check:engine-alone` | pass | 11:16:24-11:16:48Z |
| `npm run check:pack` | pass | 11:16:48-11:17:02Z |
| `npm run check:node-consumer` | pass | 11:17:02-11:17:11Z |
| `npm run check:react-consumer` | pass (react 19.3.1) | 11:17:11-11:17:17Z |
| `npm run build:example` | pass (hello-scene, hello-react, hello-planets) | 11:17:17-11:17:25Z |
| `npm run check:browser` (once, nothing else running) | exit 0, 10/10 steps, 0 error lines, 369 s; evidence `docs/evidence/browser-20261103T111739Z/`, logs `/tmp/astraeus-check-logs-oC29kw` | 11:17:39-11:23:48Z |
| `git diff --check main...HEAD` | clean (C-146 O5 fixed) | |

## Code Health Evidence

`savepoint health check O-056 .` at 11:24:06Z, after the full gate and the browser run (`health-check.txt`). Snapshot `sha256:1198ef8f2debb9b16f662dd1ca85cb8fbb10427d23e4a31a45424c06cf07742c` (created). Verdict: "Code Health does not block clearance." Complexity (lizard), duplication (jscpd), dependency vulnerabilities (osv): no finding. Coverage and tests: reported **stale**, a collection statement, not a finding; the reports are from this run's `test:full` (11:16:19Z), and since then the tree gained only the browser evidence folder and the snapshot. The verdict neither grants nor withholds clearance.

## Acceptance Coverage

| Criterion | Class | Note |
|---|---|---|
| SC1 / T-259 | Proven | rows 1-3 |
| SC2 / T-259 | Proven | row 4 |
| SC3 / T-260 | Proven | rows 5-7 |
| SC4 / T-261 | Proven | rows 8-12 |
| SC5 / T-262 | Proven | rows 13-14 |
| SC6 / T-263 | Proven | rows 15-16 |
| SC7 / T-264 | Proven | row 17 |
| SC8 / T-264 | Proven | rows 18-20; Design slips fixed |
| Release gates | Proven | row 21 |

## Issues

None. No materiality actions are required.

## Observations (non-blocking)

- **O1.** The `load-budget.mjs` comment and the I-142 repair note give the page's gzip size as 26,894 B; the test and the browser step both measure 26,965 B. The comment is informational only; the limits are correct.
- **O2.** The happy-dom `DOMException [AbortError]` after `loadingCoverChain.test.ts` printed once in this `test:full`, with no "Unhandled Errors" block (C-146 O1, pre-existing since O-055).
- **Carried from C-146, unchanged and outside this re-check:** O3 (API-04 span wording vs the lint, for O-057), O4 (cold `load` refusal names `mount`), O6 (selection-drop cause after a paused look/scale/switch change, near I-137), O7 (hello-planets asserts only the star slider's effect).

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth** (the test reads the limit from `load-budget.mjs`)
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs**: the repair is small; the Objective-wide note from C-146 stands (T-262, 9e3936a5, 31 files, +589/-76).

## Closure

- `CLEAR` does not close the Objective. Every owned Task (T-259 to T-264) is `done`; I-142, the only Issue linked to C-146, is closed as verified by this Check. No Issue is open on this Check.
- Owner validation still needed: T-264 declares `owner_validation.required: true`. The owner may record `owner_validation: {required: true, accepted_check: C-147, accepted_by: {role: owner, ...}}`; the owner's look ("looks right", 2026-11-03T10:45:35Z) needs no repeat, because the repair changed no example, look or engine source. Then the owner may accept the O-056 outcome and close it.

## What This Run Wrote

- This record, and the closing entries on I-142.
- `docs/evidence/check-o056-recheck-20261103/` (`gates.log`, `mutations.txt`, `health-check.txt`).
- `docs/evidence/browser-20261103T111739Z/` (the one browser run).
- One official health snapshot.
- The usual gate outputs (`coverage/`, `junit.xml`, `dist/`, `examples/*/dist`).

`load-budget.mjs` was mutated temporarily three times and restored each time (`git diff --quiet` clean). C-146's probes were run from scratch copies; C-146's evidence folder was not touched. Nothing was committed. The router, `docs/prds/` and `docs/research/` were not touched, and no implementation file was edited.
