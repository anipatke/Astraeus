---
id: C-098
scope: {kind: objective, id: O-038}
result: NEEDS WORK
unmet: [SC4, SC6]
checked_by: {role: checker, session: o038-full-check-20261022}
executed_session: o038-orchestration-20261023
checked_at: '2026-10-22T20:46:00Z'
health_snapshot: sha256:bb177d71cb55e85c89e36b18f151606a5fcd73ea3813b70d48b49ace453a9cbc
reviewed:
  base_commit: '21085122'
  head_commit: e8d58f30
  files: [src/app/App.tsx, src/app/viewLink.ts, vitest.setup.ts, package.json, package-lock.json, AGENTS.md, README.md, docs/BROWSER_CHECKS.md, .savepoint/Design.md, tools/validate/browser-smoke.mjs, tools/validate/journey-planets-phone.mjs, tools/validate/journey-meteor-shower.mjs, tools/validate/run-browser.mjs, tools/validate/runner.mjs, tools/validate/driver.mjs, tools/validate/driver-guard.mjs, tests/browserDriverGuard.test.ts, tests/domSetup.ts, tests/domShell.test.ts, tests/domPhone.test.ts, tests/domStory.test.ts, tests/domEmbedded.test.ts, tests/domMenuAndLink.test.ts, tests/domApollo.test.ts, tests/domMoonPanel.test.ts, tests/domDemoStories.test.ts, tests/demoShowers.test.ts, tests/demoPlanets.test.ts, tests/demoRules.test.ts, tests/orbitLook.test.ts, tests/sceneTransforms.test.ts, tests/sceneFrame.test.ts, tests/sceneBodies.test.ts]
  dependencies: [happy-dom@^21.0.4]
issues: [I-071, I-072]
supersedes: null
---

# C-098: O-038 Full Objective Check

Independent session: did not plan, build, coordinate or mark any O-038 Task. Full mode. Diff `21085122..e8d58f30` (17 commits, 97 files, +3710 / -6325). The owner's unrelated actions on the branch (O-023 deleted, G-005 and G-009 closed on the board, `a8f87755`, `d7c92f18`) are out of scope. T-143 to T-146 are `done` with owner `check_waiver`s; T-147 is `in_progress`, `stage: audit`, `owner_validation: required`, with a `check_waiver`. All five Tasks are reviewed here. Timestamps are `date -u` output.

**Verdict: NEEDS WORK** on two Issues: I-071 (some retired scenarios are mapped to a smoke check that does not run them: the public build is no longer opened in any browser, and no browser check requires a meteor stream to be drawn) and I-072 (a new T-144 test timed out in the first of two fresh full-gate runs). Everything else is proven: the browser command takes 44 s, the journeys passed five runs in a row, lint, typecheck, build and the fast suite pass, and nothing visitors see changed.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: first run)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock

1. **Requirements tested:** O-038 Success Conditions SC1 to SC6 and Confirmed Decisions 1 to 5; each Task's Done When (T-143 to T-147); Guardrails ARCH-01, ARCH-03, ARCH-04, CODE-01, CODE-02, TEST-01, TEST-03, TEST-04; Astraeus Project Rules on browser checks, screenshots, the driver, evidence retention and deferred Design reconciliation; the G-007 boundary (nothing visitors see gets worse); release gates: lint, typecheck, build, `npm test`, `npm run test:full`, `npm run check:browser` once.
2. **Changed files and entry points:** `npm run check:browser` (`run-browser.mjs` → `runner.mjs` → `browser-smoke.mjs`, `journey-planets-phone.mjs`, `journey-meteor-shower.mjs`, `public-build-assets.mjs`, `public-addresses.mjs`); `driver.mjs` and `driver-guard.mjs`; the 11 new and 4 extended test files and `tests/domSetup.ts`; `vitest.setup.ts`; `src/app/viewLink.ts` `shareViewLink` and its caller in `src/app/App.tsx`; `package.json` scripts and `happy-dom`; `docs/BROWSER_CHECKS.md`, `AGENTS.md`, `README.md`, `.savepoint/Design.md`; 37 deleted scripts.
3. **Relied-on runtime:** Vite dev server (port 5479), scratch public build, Playwright Chromium via `harness.mjs`, the scene's `data-*` readouts, Vitest with happy-dom per file and v8 coverage.
4. **Matrix axes:** success condition × proof; retired-script scenario map (sampled against named cases); browser workflow steps × failure; `src/` change × visitor effect; rules text × location. Not applicable: text classes and serialization (no text-width or format code changed); colour/redirected output (the runner prints plain lines to a file and the console only).
5. **Issue boundary:** a reproducible gap against an SC, a Done When or a Guardrail, on a supported path, in files this Objective added or changed. Old scripts' own weaknesses and other Objectives' records are out.

## Gates (fresh, this session, clean tree at e8d58f30)

| Gate | Command | Time (UTC, 2026-10-22) | Result |
|---|---|---|---|
| Lint | `npm run lint` | 20:39:37 | pass (2.4 s) |
| Typecheck | `npm run typecheck` | 20:39:40 | pass (4.0 s) |
| Build | `flock /tmp/astraeus-build.lock npm run build` | 20:39:44 | pass, chunk-size warning only |
| Full gate, run 1 | `npm run test:full` | 20:39:45 to 20:40:45 | **FAIL**: 110 files, 1 failed, 1499 passed, 1 skipped (55.7 s); `tests/orbitLook.test.ts` "keeps the arc head on its body ..." timed out at 5000 ms (I-072) |
| Full gate, run 2 | `npm run test:full` | 20:41:36 to 20:42:32 | pass: 110 files, 1500 passed, 1 skipped (53.1 s); fresh `coverage/coverage-final.json`: statements 71.98%, branches 69.99%, functions 71.75%, lines 74.81%; the same case 4665 ms |
| Fast gate | `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml` | 20:42:50 | pass: 110 files, 1500 passed, 1 skipped; vitest 29.9 s, wall 33.1 s; the same case 2408 ms |
| Diff whitespace | `git diff --check 21085122..HEAD` | 20:45 | one trailing space, `tests/domShell.test.ts:64` (observation) |
| Browser, once | `npm run check:browser` | 20:43:36 to 20:44:20 | pass, **44 s** total (wall 44.7 s): smoke 27 s (14 loads, 0 failed), planets-phone 9 s, meteor-shower 5 s, public-build-assets 1 s, public-addresses 0 s, 0 error lines; folder `docs/evidence/browser-20261022T204336Z`; logs `/tmp/astraeus-check-logs-7Nr21e` |

The isolated reruns of `tests/orbitLook.test.ts` (1271 ms alone; 2638 ms with coverage) were diagnosis for I-072, not gate evidence. The owner's preview on 5490 was left alone; ports 5479 and 5480 were free after the run. No screenshot was taken, no old set run.

## Code Health

`savepoint health check O-038` at 20:43:26 to 20:43:31, after the full gate: snapshot `sha256:bb177d71cb55e85c89e36b18f151606a5fcd73ea3813b70d48b49ace453a9cbc` (created, official, commit e8d58f30, clean). Verdict: **does not block clearance** (overall watch). Highest complexity 20 (was 27: the runner split; watch), coverage 72.0% (watch, within range), duplication 0.92%, vulnerabilities 0, failing tests 0. The tests signal read the `junit.xml` written by the passing fast gate after full-gate run 2; full-gate run 1's failure is not in the snapshot and is recorded here and in I-072. Observations only.

## Coverage Matrix: Success Conditions

| SC | Rule (general form) | Evidence | Class |
|---|---|---|---|
| SC1 | One command runs smoke and journeys, one browser at a time, about 3 min or less, time recorded | `package.json` `check:browser` → `run-browser.mjs` (5 steps, `spawnSync` one after another). Fresh run 44 s; T-145 44/45/46 s, T-147 44 s | Proven |
| SC2 | Smoke opens every public page and demo view once at desktop and phone and fails on page/console error or a page that does not draw | Views: Apollo, planets, showers, Geminids, Perseids (dev), `index`, `assets`; desktop 1440x900, phone 390x844 touch; `watchErrors` plus scene content `bodies + dots + paths > 0` polled 10 s; 14/14 loads ok with content (e.g. Geminids desktop 51,115 dots). `DEFINITIONS` in `src/main.tsx` holds only `...SYNTHETIC`, so the regex adds no made-up scene, as intended. Weakness: "draws" is any content, and only the dev server is opened (I-071, counted under SC4) | Proven for the stated rule |
| SC3 | Two confirmed journeys, each passing three runs in a row | `journey-planets-phone.mjs` (375x667 touch: Mercury → Jupiter, Io from the moons panel, focus asserted, place card `io:ra-patera` headed by its name) and `journey-meteor-shower.mjs` (Perseids 1280x720: play moves clock, seek half, story panel `stream-shape` opens). Five consecutive passing runs on the same journey and smoke files (`202311Z`, `202358Z`, `202444Z`, `203701Z`, `204336Z`; scripts unchanged since f65954a6; T-147 only removed the unused `scaleMenu` from the driver) | Proven |
| SC4 | Every retired scenario mapped to a fast test, the smoke/journey that covers it, or the owner's look; nothing unmapped | 37 files deleted; `docs/BROWSER_CHECKS.md` table covers all 26 scripts plus `browser-lite`; line maps in T-143 (84), T-144 (54), T-146 (~120). Sample of 21 named cases all exist and assert the stated thing (below). But PS1/PS3 (public build in a browser) and W10/W12/W18/W22 (stream dots drawn) are mapped to S, which does not run them | **Issue I-071** |
| SC5 | AGENTS.md rules, the Full Check routine and `check-method` usage say: one command once per Full Check, no per-Task runs, no demo sets | AGENTS.md Astraeus Project Rules (outside the managed block) say exactly this; Build line updated; `check-method.md` names no set (checked: no `check:engine`, `check:demo`, set names); README updated | Proven (owner read owed, T-147) |
| SC6 | Fast gate under about a minute; typecheck, build, lint, test pass | Fast 29.9 s; lint, typecheck, build pass; full gate failed once and passed once on a timing-bound new case | **Issue I-072** |

Confirmed Decisions: 1 journeys as confirmed (Proven); 2 happy-dom pretend page, exact layout to the owner (Proven: `package.json` devDependency, 9 files opt in, `vite.config.ts` stays `environment: "node"`); 3 six on-request number checks are fast tests, seven scripts retired, probe retired (Proven: `sceneTransforms`, `sky`, `sceneBodies`, `bodyMarkers`, `longOrbitPaths`, `sunCentred`, `demoRules`; `on-request/` gone); 4 five steps, lanes (Proven by commits); 5 `depends_on: [O-039]` (Proven).

## Coverage Matrix: Mapping Spot-Check (SC4)

Each named case was found by exact title in `tests/` and its body read where marked.

| Row | Mapped to | Exists | Asserts the scenario (read) |
|---|---|---|---|
| T-143 S8 info, provenance, Sources | `domShell` "information, provenance and Sources" | yes | — |
| T-143 V1-V3, V5, V6, V7 view link | `domMenuAndLink` "Copy view link" | yes | yes: url params, clipboard equals url, address updated, round trip, refused clipboard → field and "Clipboard unavailable", malformed link → undefined |
| T-143 M1-M7 scale menu | `domMenuAndLink` "the scale menu" | yes | yes: hidden, ArrowDown, wrap, Home/End, Escape returns focus, Enter renames |
| T-143 P10 drag opens no drawer | `domPhone` "a drag on the scene opens no drawer" | yes | — |
| T-143 G11 auto-open off | `domStory` | yes | — |
| T-144 44, 52 precision | `sceneTransforms` "position precision far from the Sun" | yes | yes: Float32-narrowed `FloatingOrigin.toLocal`, Float64 projection, 60 frames, ≤ 1 px at 1 AU (3 distances) and 50 AU (2). Its "still" part is deterministic and cannot fail (observation) |
| T-144 34 sky fixed | `sky` "moves no star on screen when the camera's position..." | yes | — |
| T-144 39 halo order | `sceneBodies` "reads the halo as over the stream dots..." | yes | — |
| T-144 25 arc head | `orbitLook` "keeps the arc head on its body..." | yes | yes (and see I-072) |
| T-144 29-30 picking | `scenePicking` "allows a finger a wider wobble than a mouse" | yes | — |
| T-144 2 stops | `timeline` "stops Previous/Next at event times..." | yes | — |
| T-144 19 30,000 members | `listedOrbitGroup` "fills 30,000 members..." | yes | — |
| T-146 B5 speed vs range | `domApollo` "... rate of change one simulated minute later ... wrong expectation is rejected" | yes | yes: three times, 8% bound, negative probe at 1.5x |
| T-146 B6 USNO phases | `domApollo` "%s is %s percent lit within one point" | yes | — |
| T-146 W8 absent orbits | `demoShowers` "... GMN fetch command ..." | yes | yes: "not fetched", exact fetch command, no `--source`, bodies unchanged |
| T-146 W10 loop | `showers` "draws the stream at the first and last instants..." | yes | — |
| T-146 O2 clock kept | `planetSystems` "the switch keeps the clock time..." | yes | — |
| T-146 SP2 markers | `storyMarkers` "never stack two markers..." | yes | — |
| T-146 M5 moon pressed | `domMoonPanel` "hands a pressed moon..." | yes | — |
| T-147 M7 sheet vs info | `domMoonPanel` "never show together on a wide screen" | yes | yes: real shell on Jupiter, sheet open → info absent, pick Io → info present and sheet closed, reopen → info gone |
| T-146 PS1/PS3, W18, W22 | S | — | **no**: S runs the dev server only and accepts any content (I-071) |

## Workflow And Side-Effect Lock: `npm run check:browser`

| Order | Operation | Side effect | Failure → owner, final state | Cleanup | Oracle |
|---|---|---|---|---|---|
| 1 | `makeContext` | new `docs/evidence/browser-<UTC>/`, scratch and log temp dirs, `summary.txt` "logs:" line | mkdir throws → command fails before servers | none needed | folder `browser-20261022T204336Z` created, fresh |
| 2 | `startServers`: dev server `vite --strictPort 5479` | child process group | port busy → strictPort exit; `waitFor` throws → caught, ok=false | `stop` kills process groups | port 5479 free after run |
| 3 | scratch public build (`ASTRAEUS_PUBLIC_BUILD=1`) | files in temp scratch | build fails → throw, ok=false | `rmSync(scratch)` in `stop` | public steps exit 0 against it |
| 4 | preview server | **not started** (no public browser step) | — | — | `needsPreview` false (I-071) |
| 5 | each step `spawnSync` | `results.json` in step dir; log to temp | non-zero exit or an error line → that step false, later steps still run, overall exit 1 | — | summary lines exit=0, error-lines=0 |
| 6 | `finally ctx.stop()`, total line | kills servers, removes scratch | SIGINT handler also stops | yes | no leftover listeners; evidence keeps only `summary.txt` and `results.json` (retention rule) |

External boundary: configured target equals runtime target (dev URL in summary); startup ordering waits on each URL; connection refusal → `waitFor` throws → fail; non-success page loads surface as console errors or missing shell; timeouts 60 s per load, 10 s draw poll; no secrets printed; partial side effect is the evidence folder, which stays for diagnosis. Not run as live negative probes (a second browser run is forbidden for this change); classified from the code.

## `src/` Changes And Visitors (G-007 boundary)

- `shareViewLink` (`src/app/viewLink.ts`) is the old `copyViewLink` body moved verbatim: same `viewLinkSearch(window.location.search, state)`, same `replaceState`, same origin+path+search URL, same clipboard try/catch; `App.tsx` passes the same four fields and sets the result. `viewLinkSearch` is no longer imported by `App.tsx` and typecheck passes. No visible change. Proven by `domMenuAndLink` "Copy view link" cases plus reading.
- `vitest.setup.ts` is test-only (folder resolution); not bundled.
- `happy-dom` is a devDependency; build output unaffected (build passes, public file checks pass). No other `src/` file changed.

## Adversarial Pass

- **Smoke "draws" strength:** reads per-frame scene readouts, so it proves the render loop ran and placed content in view, not pixels (correct under the no-screenshot rule). It accepts any content, so a demo missing its main content (a shower with no stream) passes: I-071 part 2.
- **Bypass of the public path:** the only check that ran the built site in a browser was retired; the dev server reads fetched `data/local/` files on this machine, which the public build never ships: I-071 part 1. The no-browser `public-build-assets` still fails a build that ships `data/local/` content.
- **Journey forcing:** `openStoryPanel(page, id, { force: true })` skips actionability, so a covered timeline marker would not fail the meteor journey. Observation (overlap is the owner's look by rule).
- **Timing under load:** I-072, the new T-144 case at 93% of its limit.
- **Guard bypass:** `driver-guard.mjs` now scans only `tools/validate/` (the `on-request/` folder is gone); a script added in a new subfolder would not be scanned. Observation; no such folder exists.
- **Tautology:** the precision test's "still" figure compares pure function output with itself. Observation; the sweep bound is the real claim.

## File Reality

Every file named in T-143 to T-147 evidence exists or is recorded deleted (37 `git rm` in e8d58f30, matching the T-147 list; `tools/validate/` now holds the 17 files listed there). The three replaced T-145 run folders (`201927Z`, `202014Z`, `202056Z`) are recorded as deleted (uncited, f65954a6). Searches for `check:engine`, `check:demo`, `run-engine`, `run-demo`, `on-request/` in `src`, `tools`, `tests`, `package.json` find only comments (`runner.mjs` line 1, `tests/demoRules.test.ts` line 1). No phantom files.

## Design Reconciliation

Design.md's `tools/validate/` row, Current browser validation line, precision paragraph, synthetic row and the new O-038 paragraph account for T-143's and T-145's drift notes (pretend page; one command) and name `shareViewLink`, `vitest.setup.ts`, scene sums, demo rules and the M7 case. Reflected. The Design row says "about 45 s", matching the measured run.

## Guardrails

ARCH-01, ARCH-04: no `src/` layering change. ARCH-03: `tests/domSetup.ts` mounts the real shell on the made-up experience. CODE-01: lint passes; runner largest function CCN 10 by lizard (was 27). CODE-02: no per-frame work added. TEST-01: met except where I-071 maps a scenario to a check that does not prove it. TEST-03: existing cases named exactly (sample above all found). TEST-04: each Task carries an owner `check_waiver`. Browser rules: no screenshots (guard passes in the fast suite), driver only, fresh run folder, retention shape kept.

## Owner Validation Still Needed

T-147 `owner_validation: required`: the owner reads `docs/BROWSER_CHECKS.md` and the AGENTS.md browser lines and says whether they read right ("Check first, you read after"). This is owed, not failed.

## Issues And Materiality

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-071 public build and stream dots mapped to a smoke that does not run them | Medium: the public orbit path and stream loading changed in O-025, O-033 and O-039 | Medium: the live site could show showers without a stream and every check would pass | Medium | Fix now, small: open the showers views (or the whole smoke) on the scratch public build too (the runner already serves it) and require dots in view where the view declares a point group, with one negative probe; or re-map the rows and have the owner accept |
| I-072 arc-head test times out under the full gate | Medium: 1 of 2 fresh runs | Low to medium: a red full gate at random Full Checks, no product effect | Medium | Fix now, one case: fewer frames or an explicit timeout; combine with the I-071 repair |

## Observations (non-blocking)

- AGENTS.md's Build browser line sits inside the `<!-- SAVEPOINT:BEGIN/END -->` block (lines 1 to 179), which Savepoint may refresh on upgrade. The binding rule is the Astraeus Project Rules bullet, outside the block, which already says the same; an upgrade that reset the Build line would leave a stale line, not a wrong rule. The same block's Codebase Map row for `src/synthetic/` still says "feed the engine browser set" (T-147 recorded it). Low; the owner may want to re-check both after any Savepoint upgrade.
- `tools/validate/runner.mjs` line 1 still says "Shared by run-engine.mjs and run-demo.mjs".
- `git diff --check`: trailing space at `tests/domShell.test.ts:64`.
- The smoke loads one planet view; the other local-only planets are not public (public site is Jupiter only) and Mercury and Jupiter are opened by the phone journey.
- Several driver functions are now unused (T-147 limitation; kept on purpose).
- The precision test's "still" figure cannot fail (see Adversarial Pass).

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function** — runner split into `startServers`, `makeContext`, `runSet`, `runStep`.
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [ ] STYLE-08 **Comments explain why** — `tools/validate/runner.mjs:1` comment names the deleted `run-engine.mjs` and `run-demo.mjs`.
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs** — the diff is 97 files, mostly deletions and new test files; expected for retiring 37 scripts, noted only.

## Closure

Not ready to close. To close O-038: (1) repair I-071 and I-072 (direct repairs under the Issues, or the owner accepts either as `accepted` with a recorded `exception` on SC4 or SC6); (2) a recheck that supersedes C-098 (one fresh `npm run test:full`; one `npm run check:browser` only if the repair changes the browser scripts or runner, which an I-071 fix would); (3) the owner reads `docs/BROWSER_CHECKS.md` and the AGENTS.md browser lines, records acceptance on T-147, and sets T-147 `done`; (4) the owner closes the Objective. T-143 to T-146 keep `done`.
