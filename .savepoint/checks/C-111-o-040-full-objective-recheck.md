---
id: C-111
scope: {kind: objective, id: O-040}
result: CLEAR
checked_by: {role: checker, session: o040-full-recheck-20261023}
executed_session: o040-repair-builder-20261023
checked_at: '2026-10-23T11:47:00Z'
health_snapshot: sha256:96e134025d47717edddb0b2865b4c6961dfbe7f11c8562ace7967497185291c9
reviewed:
  base_commit: c984e989
  head_commit: 57ad92e3
  files: [packages/astraeus-site/tests/apiReference.test.ts, packages/astraeus-site/tools/validate/load-budget.mjs, packages/astraeus-site/tools/site/api-reference.mjs, packages/astraeus-site/tools/validate/public-build-assets.mjs, .savepoint/issues/I-080-the-api-reference-listing-test-times-out-under-the-full-gate.md, .savepoint/issues/I-081-the-perseids-showers-page-is-over-its-load-budget-after-the-react-19-move.md]
  dependencies: []
issues: []
supersedes: C-110
---

# C-111: O-040 Full Objective Recheck

Recheck of C-110 (NEEDS WORK) for O-040 (T-163, T-164, T-165), under C-110's frozen scope lock and the shared convergence limit. This is the one full re-check after remediation. This session is independent: it did not plan, build, coordinate, repair or run C-110. Repair diff `git diff c984e989..57ad92e3` (two files outside `.savepoint/`: `apiReference.test.ts`, `load-budget.mjs`). `git diff f4ecd17e..57ad92e3` (C-110's head to now) changes no source, site, engine, example or browser-script file other than those two; the rest is C-110's own evidence and the Issue records. Tree clean at start. Times are `date -u`.

**Verdict: CLEAR.** Both release gates C-110 found red are green on fresh runs, and nothing else in the frozen scope moved. CLEAR does not close the Objective: T-165's owner look at `/api` is still outstanding, and the I-081 limit raise is the coordinator's provisional choice, not an owner decision (see Owner Validation Still Needed).

## Closure Map Of Prior Issues

| Issue | C-110 finding | State now | Proof |
|---|---|---|---|
| I-080 | `apiReference.test.ts` listing case times out under `test:full`; full gate and health red | **closed (verified)** | `npm run test:full` passed twice in a row (11:41:14-11:42:15, 11:42:15-11:43:16); file total 6.10 s and 5.36 s, cases 0.002 s / 1.34 s / 0.003 s (`junit.xml`), the program build sits in a `beforeAll` with a 60 s hook limit; `coverage/coverage-final.json` written (2,704,897 B, 11:43); health snapshot no longer blocks; made-up-entry case still names `forgotten`, `AlsoForgotten` |
| I-081 | showers page 10,073,636 B raw over 10,070,000; `public-build-assets` and so `check:browser` red | **closed (verified)** | `load-budget.mjs` raises the raw limit to 10,080,000 with the measurement, cause and date beside it (the file's own rule, line 37); fresh public build plus `public-build-assets.mjs` alone: exit 0, ok true, 94 files, showers 10,073,636 / 10,080,000 raw, 7,025,217 / 7,040,000 gzip |

## Owner Context (as given to this Check)

- The owner waived the per-step Task Checks for this run ("Keep going, looks in the morning", 2026-10-23); each Task carries a `check_waiver`.
- Owner looks: T-163 "looks fine", T-164 "looks fine". T-165's look at `/api` is deferred to the morning: **outstanding owner validation**.
- The I-081 raise is recorded in `load-budget.mjs` and in I-081's history as the coordinator's provisional choice under the owner's overnight run, pending the owner's morning review. **The owner has not approved it.**

## Prior Owner Decisions (carry-forward assessment)

No structured owner `exception` or `owner_validation.accepted_check` exists on O-040 or its Tasks, so there is no `carried_forward` list to append to. The owner decisions on record are assessed here:

| Decision | Scope | Changed since C-110? | Applies |
|---|---|---|---|
| T-163 `check_waiver` + look "looks fine" | React 19 move, demos | No: no demo, engine or dependency file changed; the budget constant is a check limit, not what the demos draw | yes |
| T-164 `check_waiver` + look "looks fine" | `AstraeusScene`, `hello-react` | No: neither file changed | yes |
| T-165 `check_waiver` | `/api` page, doc test | The test file changed (I-080 repair); the generator and page did not (`renderApiPage(collectExports()) === buildApiPage()` on the real entry, probe below). A Task-check waiver is about the optional Task Check, which this repair does not touch | yes |
| T-165 owner look at `/api` | the page | not given yet | outstanding |

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope (C-110's lock reused unchanged; no amendment)
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix (C-110's matrix re-run below)
- [x] Finite External-Boundary Matrix (unchanged inputs; reused)
- [x] Workflow And Side-Effect Check Lock (unchanged inputs; reused)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (no lanes used; not a finding)
- [x] Perform The Adversarial Pass (repair paths only)
- [x] Re-check After Remediation
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock

C-110's numbered scope lock (criteria SC1-SC4 and the three Tasks' Done When; Guardrails ARCH-01 to ARCH-04, PROV-02, TEST-01, TEST-03, CODE-01, CODE-02, STYLE rules; release gates lint, typecheck, build, `test:full`, `check:engine-alone`, `check:pack`, `check:browser` once, `savepoint health check O-040`; its axes and admission boundary) applies byte for byte. No axis, dependency layer or interpretation was added.

## Admission Ledger

| Re-check item | Prior Issue / claim | Frozen cell | Allowed result |
|---|---|---|---|
| `test:full` passes, twice | I-080 | Release gate `test:full`; `/api` generator "under coverage load" | Issue if red |
| doc guard still fails on an undocumented export | I-080 Proof Needed | `/api` generator "made-up undocumented entry"; SC4 fast check | Issue if lost |
| listing case still proves every export on the page | I-080 repair (shared `items`, `renderApiPage`) | `/api` generator "every export documented"; SC4 every `.` export | Issue if weakened |
| fresh health snapshot not blocking | I-080 | Release gate `savepoint health check O-040` | Issue if blocks |
| `public-build-assets` passes on a fresh public build | I-081 | Release gate `check:browser` (`public-build-assets` step); "public build, all page sets" | Issue if red |
| limit raised on purpose with the measurement | I-081 Proof Needed | load-budget rule in `load-budget.mjs` | Issue if missing |
| every other page set and whole build within limits | I-081 adjacent | "public build, all page sets and whole build" | Issue if red |
| remaining `check:browser` steps | C-110 run | reused, inputs unchanged | reuse valid only if inputs unchanged |

## Acceptance Coverage

| Criterion | Classification | Evidence |
|---|---|---|
| SC1 React 19, peers in the published manifest, pack guard | Proven (C-110 evidence, inputs unchanged) + fresh `check:pack` pass | no manifest, build tool or dependency file changed since `f4ecd17e` |
| SC1 demos as before | Proven headless (reused run) + owner look given | reused `docs/evidence/browser-20261023T112923Z` smoke, smoke-public-showers, planets-phone, meteor-shower exit 0 |
| SC2 component, shared path, ready/error/rebuild/cleanup, `mount` unchanged | Proven | `npm test` and `test:full` pass (the `publicApi.test.ts` cases); no component or mount file changed |
| SC3 React example from tarballs, browser step | Proven (reused run) | `hello-react/results.json` in the reused run; example and runner unchanged |
| SC4 `/api` from types and doc comments, every export, examples, links | Proven | generator unchanged; 50 exports, 0 undocumented (probe); `api/index.html` 24,544 B raw in the fresh public build |
| SC4 fast check fails on an undocumented export | Proven, now on the full gate too | made-up-entry case passes under `test:full`; independent probe below |
| T-165 load-budget and public-build checks know the page | Proven | `api/index.html` set 24,544 / 100,000 raw in the fresh results |
| T-165 Design reconciled | Proven (C-110; Design unchanged) | |
| Release gate `test:full` | Proven | two fresh passes |
| Release gate `check:browser` | Proven (reused run for seven steps + fresh `public-build-assets`) | see Gates |
| Owner look at `/api` | Outstanding owner validation | not a technical criterion; not satisfied by this Check |

## Coverage Matrix (C-110 cells re-run)

| Surface | Cell | Result now |
|---|---|---|
| `AstraeusScene` | all C-110 cells | passed: code unchanged; repo cases pass in `npm test` and `test:full` (C-110's throwaway probes were not repeated: their inputs did not change) |
| `mount` | unchanged signature, bad element, ready/unmount | passed (repo tests) |
| published manifest, `check-packs` peer guard | peers, planted faults | passed: fresh `check:pack`; guard code unchanged, planted results from C-110 stand; observations 1-2 of C-110 stand |
| `build-example.mjs`, browser runner | both examples, ports | passed (reused run; unchanged) |
| `/api` generator | every export documented | passed: 50 exports, none undocumented |
| | made-up undocumented entry | passed (repo case + probe) |
| | under coverage load | **passed** (was I-080) |
| | anchors and ids | observation (C-110 obs 3 stands) |
| `/api` serving | dev and preview | passed in C-110; `vite.config.ts` unchanged |
| public build | all page sets and whole build | **passed** (was I-081): index 403,946; assets 617,758; api 24,544; Apollo 4,325,834; Jupiter 6,930,343; perseids 10,073,636 / 10,080,000; geminids 12,560,212 / 12,680,000; whole build 25,022,635 / 54,610,000 (raw, all gzip within limit) |
| public addresses | no retired links | passed (reused run) |
| engine boundary | engine alone | passed (fresh) |

External-boundary and workflow/side-effect tables: C-110's rows stand; no runner, build tool, server or example file changed. The only new side effects in this run are the evidence folder, the health snapshot and git-ignored `coverage/` and `junit.xml`.

## Probes (independent of the repo's tests)

- **Doc guard and render path** (node, a made-up entry in scratch with `kept` and class `Fine` documented, `type Bare` and `const alsoBare` not; deleted after): the test's new inline filter gives `['Bare', 'alsoBare']`, the same as `undocumentedExports()`; `renderApiPage(collectExports(e)) === buildApiPage(e)` true on the made-up and the real entry; real entry 50 exports, 0 undocumented, program built in 430 ms without coverage. So the repair changes how often the program is built, not what is checked or rendered.
- **Load-budget headroom**: 10,080,000 - 10,073,636 = 6,364 B; the rounding ("next 10,000 bytes") matches the T-152 entry above it. The gzip limit is untouched and still binds (15,217 B headroom).

## Adversarial Pass (repair paths)

- Can the shared `items` let one case hide another's failure? The cases read `items` only; `renderApiPage` does not change them (render equals a fresh build after the call). If `collectExports` throws, the hook fails and every case fails: no silent pass.
- Does the 60 s hook limit hide a real slowdown? It holds one program build (about 4-5 s under coverage); a hang would still fail at 60 s. The case limits stay at 5 s. Acceptable, and stated in the test's comment.
- Does the raised limit let a real regression through? Only one page's raw limit moved, by 10,000 B (0.1 %); every other limit, the whole-build limit and the perseids gzip limit are unchanged.
- Is the raise the right disposition? Technically it follows the file's rule and I-081's Proof Needed (either route was acceptable). Whether to accept a heavier showers page or ask for a trim is the owner's call, and the owner has not made it (below).

## Verify File Reality

`packages/astraeus-site/tests/apiReference.test.ts`, `packages/astraeus-site/tools/validate/load-budget.mjs`, `packages/astraeus-site/tools/site/api-reference.mjs` (exports `renderApiPage`, `collectExports`, `undocumentedExports`, `buildApiPage`) exist at `57ad92e3`. The repairer's scratch public build is not cited as evidence; this Check made its own. No phantom files.

## Gates (this session, fresh, on `57ad92e3`)

| Command | Time (UTC) | Result |
|---|---|---|
| `git diff --check c984e989..57ad92e3` | 11:44 | clean |
| `npm run lint` | 11:40:34-11:40:37 | pass |
| `npm run typecheck` | 11:40:37-11:40:41 | pass |
| `npm run build` | 11:40:41-11:40:43 | pass |
| `npm test` | 11:40:43-11:41:14 | pass: 120 files, 1577 passed, 1 skipped |
| `npm run test:full` (1st) | 11:41:14-11:42:15 | pass: 120 files, 1577 passed, 1 skipped; `apiReference.test.ts` 6.10 s |
| `npm run test:full` (2nd) | 11:42:15-11:43:16 | pass: same counts; file 5.36 s; `coverage/coverage-final.json` and `junit.xml` written 11:43 |
| `savepoint health check O-040` | 11:43:48-11:43:53 | snapshot `sha256:96e13402…5291c9` (created), "Code Health does not block clearance"; tests, coverage, complexity, duplication, vulnerabilities: no blocking finding |
| `ASTRAEUS_PUBLIC_BUILD=1 npx vite build packages/astraeus-site --outDir <scratch>/public-dist --emptyOutDir` | 11:44:07-11:44:08 | pass |
| `node packages/astraeus-site/tools/validate/public-build-assets.mjs <dist> <results>` | 11:44:08-11:44:10 | exit 0, ok true, 94 files checked; evidence `docs/evidence/browser-20261023T114407Z-public-build-assets/` (`summary.txt`, `public-build-assets/results.json`) |
| `npm run check:engine-alone` | 11:44:45-11:45:01 | pass (16.6 s) |
| `npm run check:pack` | 11:45:01-11:45:14 | pass (12.1 s) |
| `npm run check:browser` | not rerun | owner rule (never twice for one change). Steps smoke, smoke-public-showers, planets-phone, meteor-shower, hello-scene, hello-react, public-addresses reused from C-110's run `docs/evidence/browser-20261023T112923Z/` (all exit 0, 0 error lines). Reuse is sound: since that run only `apiReference.test.ts` (a fast-suite test) and one constant in `load-budget.mjs` (read only by `public-build-assets`) changed; no site, engine, demo, example or browser-script file changed. `public-build-assets` re-run alone above. No screenshots |

Logs (scratch): `/tmp/claude-1000/-home-user-code-Astraeus/ff83c791-2497-4220-98d7-ab430375047a/scratchpad/gates/` (`lint_2.log`, `typecheck_2.log`, `build_2.log`, `test_2.log`, `test_full.log`, `test_full_2.log`, `engine-alone_recheck.log`, `pack_recheck.log`, `times.txt`).

## Code Health

Snapshot `sha256:96e134025d47717edddb0b2865b4c6961dfbe7f11c8562ace7967497185291c9`, taken after the passing `test:full`. Verdict "does not block clearance"; every instance reported with no blocking finding. It supports, and does not grant, this result. C-110's coverage collection failure is gone (a fresh report was written).

## Issues

None opened. No materiality actions are required. I-080 and I-081 are closed as `verified` by this Check.

`unmet`: none.

## Owner Validation Still Needed

- **T-165: the owner's look at `/api`** (`localhost:5490/api` and the public build preview: phone width, nav links, home page link). Deferred to the morning; outstanding. O-040 cannot close without it (`owner_validation.required`).
- **I-081 limit raise (10,070,000 -> 10,080,000 B raw for the perseids page): not owner-accepted.** It was the coordinator's provisional choice under the overnight run. This Check verifies only that it is a measured, deliberate change that meets the file's rule and makes the gate pass. If the owner prefers a trim instead, the owner can reopen I-081 and the limit goes back with the trim.
- T-163 and T-164 looks carry forward unchanged (above).

## Observations (non-blocking)

1. The first test case now repeats `undocumentedExports`'s rule inline (`items.filter((item) => item.doc === "")`) instead of calling it; the probe shows they agree today, but a later change to the helper would not reach the default-entry case. Small STYLE-07 point.
2. C-110's observations 1-10 stand unchanged (peer guard has no repository test; unusual dependency fields; `/api` duplicate `id="scene"` and ids with spaces; preview `/api` without slash; `hello-react` not in `publishWorkflow.test.ts`; Design/AGENTS map rows; manual `SECTIONS`; React `<19.4` peer range; date-only waiver time on T-165; router still selects finished T-165).
3. The showers page now has 6,364 B raw headroom; the next growth there will trip the gate again, as intended.
4. The repairer's `repair_attempted` entries in I-080 and I-081 are stamped `2026-10-23T12:10:00Z`, but the repair commit `57ad92e3` is 11:39:41Z and this Check ran 11:40-11:47Z; the stamps are later than reality, so those Issue histories now read out of order. History is append-only, so this Check leaves them as written.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth** — `apiReference.test.ts:16` repeats the `undocumentedExports` filter inline (observation 1).
- [ ] STYLE-08 **Comments explain why** — unchanged from C-110: the 24 body doc comments restate the name.
- [ ] STYLE-09 **Content lives in data** — unchanged from C-110: page copy and CSS inline in `api-reference.mjs`.
- [x] STYLE-10 **Small diffs** (repair: 2 files, 20 lines)
