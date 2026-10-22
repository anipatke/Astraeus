---
id: C-099
scope: {kind: objective, id: O-038}
result: CLEAR
checked_by: {role: checker, session: o038-full-recheck-20261022}
executed_session: o038-orchestration-20261023
checked_at: '2026-10-22T21:02:00Z'
health_snapshot: sha256:1cfaf33bc8f0ba5fc4c7539e7b31d89aff02bce1819ed9d1d5adf5a1f62f3da5
reviewed:
  base_commit: 4210ea3a
  head_commit: 0cb31e89
  files: [tools/validate/stream-check.mjs, tools/validate/stream-check.d.mts, tools/validate/browser-smoke.mjs, tools/validate/journey-meteor-shower.mjs, tools/validate/run-browser.mjs, tools/validate/runner.mjs, tests/streamCheck.test.ts, tests/orbitLook.test.ts, tests/domShell.test.ts, docs/BROWSER_CHECKS.md, .savepoint/objectives/O-038-cut-the-browser-checks-to-a-few-minutes/tasks/T-148-repair-the-public-build-stream-check-and-the-arc-head-test-c-098.md]
  dependencies: []
issues: []
supersedes: C-098
---

# C-099: O-038 Full Objective Recheck

Independent session: did not plan, build, coordinate or mark any O-038 Task, and is not the C-098 session. Full mode, targeted recheck on the owner's decision after C-098 ("Fix both, short recheck"). It uses C-098's frozen scope lock and matrices unchanged; no new axis was added. Diff `4210ea3a..0cb31e89` (2 commits, 18 files, +408 / -13): the T-148 repair, its evidence folder `browser-20261022T205400Z`, the router and task-id bookkeeping. No `src/`, `package.json`, `package-lock.json`, `vite.config.ts`, `vitest.setup.ts`, `AGENTS.md`, `README.md`, `.savepoint/Design.md`, `driver.mjs`, `driver-guard.mjs` or `journey-planets-phone.mjs` change (`git diff --stat` over those paths is empty). Timestamps are `date -u` output; the clock reads 2026-10-22 UTC.

**Verdict: CLEAR.** Both C-098 Issues are repaired and proven; every C-098 result whose inputs are unchanged carries forward; the full gate, lint, typecheck, build and one browser run pass fresh. The T-147 owner read is still owed (owner validation, not a technical gap).

## Closure Map Of Prior Issues

| Issue | Status after this recheck | Proof |
|---|---|---|
| I-071 public build and stream dots mapped to a smoke that does not run them | **closed, verified** | New step `smoke-public-showers` ran on the scratch public build (`http://localhost:5480/app.html`, preview started by the runner) and drew the shipped stream in all 6 loads; smoke and the meteor journey now require stream dots; negative probe on a scratch public build with both shipped orbit files removed fails 6/6 on "the meteor stream is not drawn (0 dots in view)" |
| I-072 arc-head test times out under the full gate | **closed, verified** | Case 1.58 s in this run's `test:full` `junit.xml` (T-148's two runs: 1.68 s), against the 5000 ms limit; C-098 saw 4665 ms and a timeout |

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope (C-098's lock reused unchanged)
- [x] Turn Acceptance Into Invariants (SC4, SC6 re-stated; others carried)
- [x] Build The Mandatory Coverage Matrix (C-098's rows; changed rows re-run)
- [x] Finite External-Boundary Matrix (preview server row re-run)
- [x] Workflow And Side-Effect Check Lock (row 4 re-run)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (not a feature in scope)
- [x] Perform The Adversarial Pass (on the remediation code only)
- [x] Re-check After Remediation
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Admission Ledger

| Re-check item | Prior Issue or claim | Frozen cell (C-098) | Allowed result |
|---|---|---|---|
| Public build opened in a browser | I-071 part 1 | SC4 row; Mapping row "T-146 PS1/PS3, W18, W22"; Workflow row 4 (preview not started) | blocking |
| Stream required to be drawn (smoke, journey) | I-071 part 2 | SC2 "draws" weakness; Mapping row PS1/PS3, W18, W22; Adversarial "Smoke draws strength" | blocking |
| Assertion fails on zero dots (fast test, live probe) | I-071 Proof Needed (a) negative probe | same Mapping row | blocking |
| Arc-head case margin under the full gate | I-072 | SC6 row; Adversarial "Timing under load" | blocking |
| `BROWSER_CHECKS.md` rows true | I-071 (docs repeat the rows) | SC4 row | blocking |
| Journey now clicks the story panel without `force` | C-098 observation "Journey forcing" | Adversarial pass row | non-blocking |
| `runner.mjs:1` comment, `domShell.test.ts:64` trailing space | C-098 observations | STYLE-08, diff whitespace | non-blocking |
| SC1, SC3, SC5, Confirmed Decisions, `src/` visitor boundary, Design reconciliation | C-098 Proven | their rows | carry forward if inputs unchanged; SC1/SC3 re-observed in the fresh run |

## Gates (fresh, this session, clean tree at 0cb31e89)

| Gate | Command | Time (UTC, 2026-10-22) | Result |
|---|---|---|---|
| Lint | `npm run lint` | 20:56:17 to 20:56:19 | pass |
| Typecheck | `npm run typecheck` | 20:56:19 to 20:56:23 | pass |
| Build | `flock /tmp/astraeus-build.lock npm run build` | 20:56:23 to 20:56:24 | pass, chunk-size warning only |
| Full gate | `npm run test:full` | 20:56:30 to 20:57:29 | pass: 111 files, 1502 passed, 1 skipped (1503), 52.96 s; fresh `coverage/coverage-final.json` and `junit.xml` (20:57:29): statements 71.98%, branches 69.99%, functions 71.75%, lines 74.81%; arc-head case 1.577709566 s; `tests/streamCheck.test.ts` 2 cases pass |
| Browser, once | `npm run check:browser` | 20:57:38 to 20:58:36 | pass, **58 s** total: smoke 28 s (14 loads, 0 failed), smoke-public-showers 9 s (6 loads, 0 failed), planets-phone 12 s, meteor-shower 5 s, public-build-assets 1 s, public-addresses 0 s, 0 error lines; folder `docs/evidence/browser-20261022T205738Z`; logs `/tmp/astraeus-check-logs-RLjDeG` |
| Diff whitespace | `git diff --check 4210ea3a..HEAD` | 21:00 | one new blank line at EOF of the T-148 record (observation) |

The fast gate (`npm test`) was not run separately: the full gate runs the same suite with coverage, and SC6's "under about a minute" fast-gate figure (29.9 s, C-098) carries forward because no test input changed except the two cases above, which got faster or are 2 ms. The owner's preview on 5490 was left alone (listening before and after); ports 5479, 5480, 5481 were free after the runs. No screenshot was taken; no old set run.

## I-071: Fresh Evidence

- **Public build in a browser.** `run-browser.mjs` adds `{ name: "smoke-public-showers", script: "browser-smoke.mjs", public: true, env: { ASTRAEUS_VIEWS: "showers" } }`. In `runner.mjs`, `needsPreview` is now true, so the scratch `ASTRAEUS_PUBLIC_BUILD=1` build is served on 5480 and the step's `ASTRAEUS_URL` is `ctx.publicUrl` (`runStep`, `step.env` spread last). This run's `smoke-public-showers/results.json`: `appUrl` `http://localhost:5480/app.html`, 6 loads, 0 failed; dots in view: showers 24,218 desktop / 7,486 phone, Geminids 51,115 / 49,632, Perseids 24,218 / 7,486.
- **Stream required.** `browser-smoke.mjs` `drawsSomething(page, view)`: for any view whose id starts with `showers`, waits up to the same 10 s deadline for `dots > 0`, then `assertStreamDrawn(drawn.dots, view.id)` (`stream-check.mjs`: throws unless `dots > 0`, so 0, NaN and undefined all fail). `journey-meteor-shower.mjs` asserts `bodies + paths > 0` and `assertStreamDrawn(drawn.dots, ...)` after the seek; this run: 24,903 dots, panel `stream-shape`.
- **Fast proof.** `tests/streamCheck.test.ts`: 0 and NaN throw naming the view; 1200 passes. It tests the helper, not the wiring; the live probe below covers the wiring.
- **Negative probe (independent, not a full browser run).** 20:59:17 `ASTRAEUS_PUBLIC_BUILD=1 npx vite build --outDir <scratch>/probe-public`; moved `assets/gmn-iau-4-Bsd20Dtd.json` and `assets/gmn-iau-7-BeRRPk6y.json` (the two shipped orbit files) out of the scratch build; `vite preview` on 5481; 20:59:26 to 21:00:29 `ASTRAEUS_VIEWS=showers node tools/validate/browser-smoke.mjs` alone: **exit 1, 0/6 loads passed**, each "showers…: the meteor stream is not drawn (0 dots in view)". The first check (`bodies + dots + paths > 0`) passed in every load, so the old sum would have passed this broken build: the new assertion is what catches it. Scratch build and preview removed; no project file touched. Scratch evidence: `/tmp/claude-1000/-home-user-code-Astraeus/63b9db12-e889-466f-9d8d-4dd371aceb80/scratchpad/probe-evidence/results.json`.
- **Rows true.** `docs/BROWSER_CHECKS.md` now says the stream drawn is S and J "on the public build too (`smoke-public-showers`)" and lists the new step. T-146's rows PS1, PS3, W18, W22 still say "S"; with the repair, S requires dots on every showers view on both servers, so those rows are now true as written. W22's "start, peak, end" is the opening view (S) plus the seek (J) plus the fast `showers` loop case (W10), as C-098 already mapped. The "no `data/local/` or CAMS file served" part of PS1 stays with the no-browser `public-build-assets` (unchanged; passed).

## I-072: Fresh Evidence

`tests/orbitLook.test.ts:307`: the playback loop goes from 240 frames at 3 h to 60 frames at 12 h, the same 30 days. The assertions (head gap under 0.002, longest segment under 0.1 of the orbit) are unchanged and checked every frame; larger steps make the chord bound harder to meet, not easier. Under the full gate the case took 1.58 s (this run) and 1.68 s (T-148), about a third of the 5000 ms limit, against 4665 ms and a timeout in C-098. One fresh full-gate run here passed; T-148 recorded two consecutive passes (20:51:58 and 20:53:00).

## Carried Forward From C-098 (inputs unchanged)

| C-098 result | Why it carries | Fresh observation |
|---|---|---|
| SC1 one command, one browser at a time, about 3 min or less | runner logic unchanged except the preview now starts | 58 s (was 44 s; the added public step and public build); still far under 3 min |
| SC2 smoke opens every public page and view at two sizes | `discoverViews` unchanged when `ASTRAEUS_VIEWS` is unset | 14/14 loads on the dev server, same views |
| SC3 two journeys, three passes in a row | planets journey unchanged; meteor journey only adds the dots assertion and drops `force` | both passed here; T-148's run `205400Z` also passed: two passes of the changed journey, plus five of the earlier version (C-098). Not re-run three times: the owner rule allows one browser run per change |
| SC5 rules text | `AGENTS.md`, `README.md`, `check-method.md` unchanged | owner read still owed (T-147) |
| Confirmed Decisions 1 to 5; `src/` visitor boundary; Design reconciliation | no change to those inputs | — |
| Health (C-098 snapshot) | superseded: tests changed, so a new snapshot was taken | see below |

Owner decisions on the Objective: no owner `exception` or `owner_validation` acceptance is recorded on O-038 or its Tasks, so there is no `carried_forward` entry to write. The `check_waiver`s on T-143 to T-148 are Task-check waivers; they do not depend on the scope that changed, and this Full Objective Check covers T-148.

## Code Health

`savepoint health check O-038` at 20:58:47 to 20:58:51, after the full gate and the browser run: snapshot `sha256:1cfaf33bc8f0ba5fc4c7539e7b31d89aff02bce1819ed9d1d5adf5a1f62f3da5` (created, official, commit 0cb31e89, `dirty: true`). Verdict: **does not block clearance** (overall watch). Highest complexity 20 (watch), coverage 72% (watch), duplication 0.9%, vulnerabilities 0, failing tests 0 of 1503. The coverage and tests instances are marked **stale**: this run's untracked browser evidence folder was in the tree when the snapshot was taken (C-098 took its snapshot before its browser run, on a clean tree). A collection-order matter, not unhealthy measurement: the values equal this session's full-gate output exactly (8029/11154 statements; 1503 tests, 0 errors, 1 skipped). Both instances are optional; nothing blocks.

## Adversarial Pass (remediation code only)

- **Bypass by view id.** The stream rule keys on `view.id.startsWith("showers")`; every showers view discovered (`showers`, `showers-<name>` from `data/showers/*.json`) matches. A shower named elsewhere would not be required to draw, but none exists.
- **Filter typo.** `ASTRAEUS_VIEWS` with no match yields 0 views and the step passes with "0/0 loads". Not reachable through `run-browser.mjs` (the value is fixed and matched 6 views here). Observation.
- **Wait loop.** The dots wait shares the 10 s deadline with the content wait; a stream slower than 10 s would fail, which is the intended direction. The probe loads took about 10.4 s each, confirming the deadline is honoured.
- **Other dots.** In showers views the only point group is the stream (bodies and paths are counted separately), so `dots > 0` is the stream; the probe confirms 0 dots when the orbit files are gone.
- **Journey `force` removed.** A covered story marker would now fail the journey; it passed. Resolves the C-098 observation.

## File Reality

Every file named in T-148 evidence exists: `stream-check.mjs`, `stream-check.d.mts`, `streamCheck.test.ts`, the edited scripts and docs, and `docs/evidence/browser-20261022T205400Z` (`summary.txt` and four `results.json`, retention shape). This run's folder `docs/evidence/browser-20261022T205738Z` has the same shape. No phantom files.

## Guardrails

TEST-01: the remapped scenarios now name checks that run them (I-071 closed). Browser rules: driver only (the new code reads `ui.sceneDrawsSomething`/`sceneDotsInView`; `tests/browserDriverGuard.test.ts` passes in the full gate), no screenshots, fresh run folder, one browser run. CODE-01: lint passes. No other Guardrail input changed since C-098.

## Issues And Materiality

No Issues found; no materiality actions are required.

## Owner Validation Still Needed

T-147 `owner_validation: required`: the owner reads `docs/BROWSER_CHECKS.md` (now including the `smoke-public-showers` line) and the AGENTS.md browser lines (Build section and Astraeus Project Rules) and says whether they read right. Owed, not failed.

## Observations (non-blocking)

- Health coverage and tests instances stale because the browser evidence folder was uncommitted at collection; next time take the snapshot before the browser run, or commit the folder first.
- `git diff --check`: new blank line at EOF of the T-148 record.
- `ASTRAEUS_VIEWS` that matches nothing passes with 0 loads (only reachable by hand).
- The SC1 time grew from 44 s to 58 s with the public step; `docs/BROWSER_CHECKS.md` "Measured (T-145)" and Design.md's "about 45 s" are older figures, still well inside "about 3 min".
- O-038's `Objective.md` still says `status: planned` although Tasks have been in progress and done; the owner's close will set it.
- C-098's still-open observations stand: the AGENTS.md Build browser line and the `src/synthetic/` Codebase Map row ("feed the engine browser set") sit inside the Savepoint-managed block; unused driver functions; the precision test's "still" figure cannot fail.

## Code Style Review

- [x] STYLE-01 **One job per file** — `stream-check.mjs` holds only the stream assertion.
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches** — throw and pass branches both tested.
- [x] STYLE-04 **Types document intent** — `stream-check.d.mts`.
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth** — smoke and journey share one assertion.
- [x] STYLE-08 **Comments explain why** — `runner.mjs:1` corrected.
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs** — 18 files, most of them evidence.

## Closure

O-038 is technically clear. To close it: (1) the owner reads `docs/BROWSER_CHECKS.md` and the AGENTS.md browser lines and, if they read right, records acceptance on T-147 (`owner_validation: {required: true, accepted_check: C-099, accepted_by: {role: owner, ...}}`) and sets T-147 `done`; (2) the owner closes O-038 (all six Tasks done, C-099 current, I-071 and I-072 resolved as verified); (3) commit at Objective close. T-143 to T-146 and T-148 keep `done`.
