---
id: C-140
scope: {kind: objective, id: O-058}
result: CLEAR
checked_by: {role: checker, session: o058-recheck-20261101}
executed_session: o058-repair-20261101
checked_at: '2026-11-01T08:25:00Z'
health_snapshot: sha256:94c9432ac9af2ad272170f64e63844f31a32036d462d47ce2fd5948ddfcbb031
reviewed:
  base_commit: 3b89c3ef
  head_commit: a3c9115c
  files: [packages/astraeus-site/tests/apiRules.test.ts, packages/astraeus-site/tests/publicBuild.test.ts, packages/astraeus-site/tools/validate/load-budget.mjs, packages/astraeus-site/tools/validate/load-budget.d.mts, packages/astraeus-site/tools/validate/public-build-assets.mjs, packages/astraeus/src/api/assembleScene.ts, packages/astraeus/tests/scenePin.test.ts, packages/astraeus/tests/fixtures/scenePin.json, packages/astraeus/tests/viewerLinkPin.test.ts, .savepoint/Design.md, .savepoint/issues/I-135-the-api-rule-scans-time-out-under-the-full-gate-after-the-scene-split.md, .savepoint/issues/I-136-the-public-build-check-fails-on-the-new-story-panel-parser-chunk.md]
  dependencies: []
issues: []
supersedes: C-139
---

# C-140: O-058 Full Objective Check, re-check after remediation

This re-check covers O-058, "Split the scene builder and host link by concern" (G-016), after C-139 returned NEEDS WORK. It reviews repair commit `a3c9115c` (`git diff 3b89c3ef..a3c9115c`: 12 files, +5906/-4399, nearly all of it the regenerated `scenePin.json`). Its scope is C-139's frozen scope lock, unchanged: Objective diff `main..a3c9115c` (11 commits, T-231 to T-239 plus the C-139 record and the repair) and the nine Tasks, all `done` with owner check waivers.

**Independence.** This session did not plan, build, coordinate or repair O-058. It is not a lane (`git rev-parse --git-dir` and `--git-common-dir` both print `.git`). It wrote only: gate outputs (`coverage/`, `junit.xml`, `dist/`, temp folders), one official health snapshot, one browser evidence folder (`docs/evidence/browser-20261101T081242Z/`), temporary planted edits (each restored with `git checkout --` and confirmed by `git diff --quiet -- packages/astraeus/src`), this record and the resolution of I-135 and I-136. It did not touch `docs/prds/`, `docs/research/`, the three modified G-012/G-013/G-014 `Release.md` files or the router. Probe scripts and logs are in the checker scratchpad folder `c140/`.

**Verdict: CLEAR.** Both Issues are repaired and hold. Two `test:full` runs in a row pass and write coverage. The one `check:browser` passes every step, including `public-build-assets` with `loadBudget.ok: true`. Every original matrix cell gives the same result as in C-139, and the three pin gaps (O3) are now closed.

## Closure Map Of Prior Issues

| Issue | State | Proof |
|---|---|---|
| I-135 (API-05/06 scans time out under `test:full`) | **Closed (verified)** | two green `test:full` runs; real-source and made-up plants still fail (rows R1-R3) |
| I-136 (`public-build-assets` misses the new chunk) | **Closed (verified)** | one green `check:browser`; engine-share rule probes (rows R4-R6) |

No owner decision (acceptance or exception) exists on O-058 or its Tasks. All nine Tasks have `owner_validation: {required: false}`, so there is nothing to carry forward.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope (C-139's lock reused unchanged)
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix (C-139 rows 1-42 re-run)
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (advice only; not evaluated)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Admission Ledger

Each re-check probe maps to an exact frozen cell or a named Issue/remediation item. Probes beyond that are observations only.

| # | Re-check item | Prior Issue / claim | Frozen cell | Allowed result |
|---|---|---|---|---|
| R1 | `test:full` twice | I-135 | row 41 | blocking |
| R2 | API-05/06 made-up-folder plants still fail | I-135 Proof Needed (`apiRules.test.ts:106`, `:169`) | row 41 (adjacent, named in the Issue) | blocking |
| R3 | real-source scan still catches a planted break through the `beforeAll` path | I-135 remediation code path | row 41 | blocking |
| R4 | `check:browser` once, `public-build-assets` green | I-136 | row 42 | blocking |
| R5 | engine-share admission: mixed, unnamed or tableless chunks still fail | I-136 Proof Needed and the load budget's "an eager new chunk cannot slip past the limit" rule | row 42 (adjacent, named in the Issue) | blocking |
| R6 | `DEEP_IMPORT_COUNTS` unchanged; scenePin passes without `-u` | I-136 Proof Needed | rows 37, 1-19 | blocking |
| R7 | rows 1-30 plants and old-code replay | scope lock | rows 1-30 | blocking |
| R8 | O3 pin gaps (rows 3, 12, 22) | C-139 O3, remediation claim | rows 3, 12, 22 | non-blocking (were observations) |
| R9 | O5 duplicate return, O7 Design note | C-139 O5, O7 | rows 33, SC6-Design | non-blocking |
| R10 | rows 31-40 structural reads | scope lock | rows 31-40 | blocking |

## Coverage Matrix (re-run)

**How the probes ran.** `c140/runplants.mjs` reads `c140/plants.json`. For each plant it makes one exact replacement in `packages/astraeus/src/api/<file>` (it refuses unless exactly one match), runs `npx vitest run` on the named pin, restores the file with `git checkout --` and checks `git diff --quiet -- packages/astraeus/src`. Every row printed `restored`. Output: `c140/plants-summary-main.txt`.

| C-139 row | Plant | Test | C-139 result | C-140 result |
|---|---|---|---|---|
| — | none (clean) | scenePin | pass | `P00-clean exit=0`, `Tests 1 passed (1)` |
| 1 | clock default rate `?? 60` to `61` | scenePin | fail | fail (`P01 exit=1`) |
| 2 | default rates `DAY_MS / 1000` to `/ 100` | scenePin | fail | fail |
| 3 | pacing base rate `timeline.rate ?? 60` to `30` | scenePin | **passed (O3 gap)** | **fail** (`P03 exit=1`): gap closed by the new "pacing with no rate set" case |
| 4 | group `check` message text | scenePin | fail | fail |
| 5 | `lateGroups` ignores `seriesIn` | scenePin | fail | fail |
| 6 | `groupPlan.check` before `story.panels` | scenePin | fail | fail |
| 7 | group metrics branch never taken | scenePin | fail | fail |
| 8 | `fault.error ??=` to `=` | scenePin | equivalent | passed (`P08b exit=0`), still equivalent |
| 9 | start view elevation `?? 30` to `31` | scenePin | fail | fail |
| 10/11 | path cover factor `2 *` to `3 *` | scenePin | fail | fail |
| 12 | `PATH_COVER_SAMPLES` 400 to 40 | scenePin | **passed (O3 gap)** | **fail** (`P11 exit=1`): gap closed by the "path that peaks between its end samples" case |
| 13 | auto stretches not resolved | scenePin | fail | fail |
| 14 | auto root radius `Infinity` to `1` | scenePin | equivalent in pinned scene | passed (`P13 exit=0`), unchanged |
| 15 | label reach floor 500 to 501 | scenePin | fail | fail |
| 16 | Sun-orbit colour default `""` to `"#fff"` | scenePin | fail | fail |
| 17 | moon loop `endFadeOn: false` dropped | scenePin | fail | fail |
| 18 | own event provenance always emitted | scenePin | fail | fail |
| 19 | resolved views get `panels: []` | scenePin | fail | fail |
| 20 | zones before clock in `publish` | viewerLinkPin | fail | fail ("reports change before zones …") |
| 22 | zones listener set iterated live | viewerLinkPin | **passed (O3 gap)** | **fail** (`V02 exit=1`): "calls the listeners that were set when a report began …" (new case) |
| 21 | clock listener set iterated live | viewerLinkPin | fail | fail |
| 23 | `setRate(n)` sets `"scene"` | viewerLinkPin | fail | fail |
| 24 | no re-arm on detach | viewerLinkPin | fail | fail |
| 25 | `setCamera` message text | viewerLinkPin | fail | fail |
| 26 | zone reset on attach removed | viewerLinkPin | fail | fail |
| 27 | host publish after `setView` removed | viewerLinkPin | fail | fail |
| 28 | `NOT_OPEN` message text | viewerLinkPin | fail (2) | fail (`Tests 2` failed) |
| 29 | zone `via` always `"time"` | viewerLinkPin | fail | fail |
| 30 | **pins describe the old code**: main's `scene.ts` and `viewerLink.ts` over HEAD | scenePin, viewerLinkPin, viewerHostDom, eventZonesDom, hostCameraDom | `Tests 59 passed` | `exit=0`, `Test Files 5 passed (5)`, `Tests 60 passed (60)` (the new zone case also passes on the old code); restored, `git diff --quiet` clean. Log `c140/M1-main-code.log` |
| 31 | pin written first | `git diff 0db0b36c HEAD -- scenePin.*` | empty | not empty now, by design: the repair added two cases. `c140/pindiff.mjs` over the 3b89c3ef and a3c9115c fixtures prints only `ADDED` for the two new case names under `seriesLoaded` and `seriesNotLoaded`. No existing entry is `REMOVED` or `CHANGED` (the line churn is re-serialisation). Row 30 shows the new entries describe main's code. Pass |
| 33 | "moved as-is", plus O5 | `grep -c "return definition;" assembleScene.ts` | 2 (O5) | `1`. The repair's only `src/` change is that deleted line (`git diff --name-only 3b89c3ef HEAD -- packages/astraeus/src` lists only `assembleScene.ts`) |
| 36 | api import rule | apiImports | pass | not changed by the repair; passes in both full runs |
| 37 | nothing public moved | `git diff main -- api-surface.lock.json`, `DEEP_IMPORT_COUNTS` files, `--diff-filter=M` tests | empty | lock file and `allowlistGrowth.test.ts`/`packageBoundaries.test.ts` (`DEEP_IMPORT_COUNTS`) unchanged against main. `--diff-filter=M` on `*.test.ts(x)` now lists `apiRules.test.ts` and `publicBuild.test.ts`, both edited by the repair as C-139 and I-135/I-136 prescribed. Read: `apiRules.test.ts` moves the two scan calls into `beforeAll` and asserts the same values; `publicBuild.test.ts` only adds two `expect` lines. No existing expectation changed. Pass (see O8) |
| 38 | sizes | `wc -l` | within | scene 350; planBodies 209, planPaths 204, assembleScene 172, planCamera 124, planGroups 85, planTimeline 65, planStory 49, planViews 30; viewerLink 146, viewerClock 72, viewerZones 51, viewerCamera 42, viewerViews 19. Pass |
| 39 | no top-level function in `scene.ts` | grep | 0 | 0. Pass |
| 40 | back edges type-only | `grep 'from "./scene"\|"./viewerLink"' api/*.ts \| grep -v "import type"` | type-only | only `index.ts` (public re-exports) and `mount.ts` (the link's creator), neither a planner or part; every planner/part back edge is `import type`. `grep -rnE "shell/storyPanels\|app/viewLink" src/api/` empty. Pass |
| 41 | full gate | `npm run test:full` twice | failed twice (I-135) | **passed twice** (below) |
| 42 | browser gate | `npm run check:browser` once | `public-build-assets exit=1` (I-136) | **every step exit=0** (below) |

### I-135 probes (R2, R3)

- R2: the made-up-folder cases ran green in both full runs (`errors (API-05) > fails on a plain throw …` 1.515 s and 1.312 s; `settings mapping (API-06) > fails on a made-up address setting …` 1.454 s and 1.317 s). Each asserts its plant fails.
- R3, real source through `beforeAll` (log files `c140/I135-*.log`):
  - A: appended `export function c140Probe(x) { if (x > 1) throw new Error("c140"); }` to `src/api/planViews.ts` → `apiRules.test.ts` exit 1, `× throws only SceneError from src/api/ …`, offence `errors: new break throw planViews.ts: throw new Error("c140");`. Restored.
  - B: appended a `new URLSearchParams(search).get("c140look")` reader to `src/app/viewLink.ts` → exit 1, `× gives every setting …`, `address setting "c140look" has no public setting key …`. Restored.
  - C: clean → `Tests 18 passed (18)`.
- Strategic-fix judgement: the cost now sits in one hook per scan with a stated 60 s limit (the I-080 pattern), so a growing `src/` no longer pushes a case past the 5 s default. The executor did not add a guard that flags a default-limit case calling a whole-source scan; I-135 said "consider", and the reason is in its history. See O9.

### I-136 probes (R5, R6)

`c140/budgetprobe.mjs` calls `checkLoadBudget` on made-up builds: one page `["app.html", "app.js"]` with limits of 3,000 B and a listed `app.js` that imports an unlisted `x.js`. Output `c140/budgetprobe.out`:

| Case | Expected | Actual |
|---|---|---|
| b1: `x` not named in the share table | fail | `ok=false`, "imports assets/x-AbCdEf12.js, which the page set does not list" |
| b2: no share table at all | fail | `ok=false`, same problem |
| b3: `x` entry `total: 0` | fail | `ok=false` |
| b4: `x` 999 of 1000 engine (one demo byte) | fail | `ok=false` |
| b5: engine `x` imports mixed `y` (chain) | fail on `y` | `ok=false`, "assets/x-… imports assets/y-…, which the page set does not list" |
| b6: engine `x` imports engine `y` | pass, both counted | `ok=true raw=62 engineRaw=25` |
| b7: 10 kB wholly-engine `x` | pass, the whole chunk counted as engine | `ok=true raw=10037 engineRaw=10000 ownRaw=37` |
| b8: 10 kB demo `x` (engine 0) | fail | `ok=false`, unlisted |
| b9: share entry claims engine > total | fail | `ok=false` |

- Protective intent. Demo code cannot slip in unlisted: any demo byte (b4), an unnamed chunk (b1), a missing table (b2) or a mixed link in the chain (b5) still fails. An admitted chunk is added to the page's files, so it counts in the page's raw total and in the whole-build limit. Its bytes come off the page's own share exactly as they would if the chunk were listed (b7, `engineShareOf`). So the rule changes only whether a wholly-engine chunk must be named, not how it is measured. Engine growth in the code the plain example loads stays bounded by `ENGINE_LIMIT` (this run: 1,662,849 / 1,735,000 raw, 479,775 / 497,000 gzip). The table comes from Rolldown's own module list (`vite.config.ts:60-80`: bytes from modules under `packages/astraeus/`), not from the page sets. The rule keeps the budget's intent. See O10 for one pre-existing limit.
- The fast proof: `publicBuild.test.ts` asserts `engineChunk` passes with 4 files and `mixedChunk` fails; `public-build-assets.mjs` self-proof requires `engineChunk.ok && !mixedChunk.ok`. The browser run reported `budgetSelfProof` true and `engineSplitProof` true.
- R6: `DEEP_IMPORT_COUNTS` files unchanged (`git diff --stat main..HEAD` on them is empty). scenePin passes in both full runs; the fixture gained only the two new cases (row 31).

**External boundary.** Unchanged from C-139: the browser runner's scratch public build and preview servers started and stopped (logs `/tmp/astraeus-check-logs-jOu5RO`). `check:react-consumer` reached the registry and installed React 19.3.1. Redirect, timeout and secret-output cells: not applicable, as in C-139.

**Workflow lock.** Unchanged code paths (the repair touched `src/` only to delete one dead line), so C-139's `toDefinition`/`prepare` and host-link sequences stand. Rows 5, 6, 8, 13 and 20-30 were re-run against them above.

## Acceptance Coverage

| Criterion | Status | Evidence |
|---|---|---|
| SC1 same output, pinned first | Proven | rows 1-19, 30, 31; the new pin cases pass on main's code |
| SC2 planners, assembler, check order, sizes | Proven | rows 6, 33, 38, 39 |
| SC3 `ViewerLink` in four parts | Proven | rows 20-30, 38 |
| SC4 parsers in `core/`, api import test | Proven | rows 36, 40 |
| SC5 nothing public moves | Proven | row 37; O8 records the two test-file edits the repair made |
| SC6 gates | **Proven** | every gate below passes; R1-R6 |
| SC6 Design.md describes the layout | Proven | the O-058 paragraph; the O-044 paragraph now names `TimelinePlan.span` in `api/planTimeline.ts` (`grep -n spanOf .savepoint/Design.md` is empty; O7 closed) |
| Every Task's Done When (T-231..T-239) | Proven | C-139 per-Task evidence re-read; T-239's full-gate line and the Objective's browser gate now pass |

## Gates

All ran fresh on HEAD `a3c9115c` on 2026-11-01, with the tree clean apart from the three untouched Release.md files and the untracked owner docs. Logs: checker scratchpad `c140/gate-*.log`, `c140/gates-summary.log`.

| Command | Result |
|---|---|
| `npm run lint` | exit 0 (08:08:52-08:08:56Z) |
| `npm run typecheck` | exit 0 |
| `npm run build` | exit 0 (chunk-size warning only) |
| `npm run check:engine-alone` | `engine alone: pass in 19.2 s` |
| `npm run check:pack` | `pack check: pass (17.3 s)` |
| `npm run check:node-consumer` | `node consumer: pass` |
| `npm run check:react-consumer` | `installed: react 19.3.1, react-dom 19.3.1; AstraeusScene rendered 60 characters on the server` / `react consumer: pass` |
| `git diff --check main..HEAD` | clean |
| `npm run test:full` run 1 (08:09:52-08:11:04Z, load 3.3) | **exit 0**: `Test Files 186 passed (186)`, `Tests 2259 passed \| 1 skipped (2260)`; `coverage/coverage-final.json` written (2,901,012 B). apiRules cases: every real-source case ≤ 0.008 s (the scans run in the hooks); made-up plants 1.53 / 1.52 / 1.45 s. scenePin 5.55 s |
| `npm run test:full` run 2 (08:11:04-08:12:15Z, load 6.9) | **exit 0**: same counts; coverage written (2,893,574 B). apiRules made-up plants 1.46 / 1.31 / 1.32 s. scenePin 4.36 s |
| `npm run check:browser` (once, 08:12:41-08:18:47Z) | **exit 0**: smoke, smoke-public-showers, planets-phone, meteor-shower, views, hello-scene, hello-react, public-build-assets and public-addresses all `exit=0` with `error-lines=0`; total 365 s. `loadBudget.ok: true`, every page within its limits (for example Apollo 11 own 4,035,559 / 4,240,000 raw); engine 1,662,849 / 1,735,000 raw. The build still emits `assets/storyPanels-BiQHMCgc.js` (2.67 kB), which now passes as wholly engine. Evidence `docs/evidence/browser-20261101T081242Z/summary.txt` |

`npm test` (configured `quality_gates.test`) is the same Vitest suite that `test:full` runs with coverage, so it was not run separately.

## Code Health

`savepoint health check O-058` ran after both full runs (08:12:29Z) and created snapshot `sha256:94c9432ac9af2ad272170f64e63844f31a32036d462d47ce2fd5948ddfcbb031`. **"Code Health does not block clearance."** Complexity, coverage, dependency vulnerabilities, duplication and tests: "reported only; no finding". The verdict supports this result; it does not grant it.

## Issues

None opened. No materiality actions are required.

## Observations (non-blocking)

- O1-O2, O4, O6 from C-139 stand unchanged. They are outside the supported path or are process notes.
- O3 (closed). The three pin gaps are pinned now (rows 3, 12, 22 fail on their plants). Under full load scenePin still takes 4.4-5.5 s, against T-231's "target under 5 s" (its own limit is 600 s).
- O5 and O7 closed (rows 33 and SC6-Design).
- O8 (in scope; judged not a violation). SC5 says "no existing test file is edited". The repair edited `apiRules.test.ts` and `publicBuild.test.ts`, as C-139's recommendation and the I-135/I-136 Proof Needed asked. No existing expectation changed: the scans moved into hooks with the same assertions, and two assertions were added. The owner may read SC5 more strictly; if so, that is an owner call, not a new remediation round.
- O9 (outside the frozen scope). No mechanised guard stops a future default-limit case from calling a whole-source TypeScript scan in its body. I-135 listed this as "consider", and the repair records why it was not added. A follow-up under the strategic-fix rule would be reasonable.
- O10 (outside the frozen scope; pre-existing design from O-051). `ENGINE_LIMIT` measures only what the plain example loads. Engine code that only a demo page reaches is counted as engine share on that page, so it falls under neither the page's own limit nor the engine limit; only the whole-build limit holds it. Before this repair the same was true of a listed engine chunk, so the engine-share rule does not widen the gap. It does let such a chunk appear without a page-set edit.

## Closure

CLEAR. I-135 and I-136 are closed as `verified` against this Check. No Task retreats, and every Task is already `done`. No owner decision exists to carry forward. The owner may now accept the O-058 outcome and close the Objective. Owner validation still needed: none for the refactor; the owner may look at the preview (`localhost:5490`) as usual. The owner commits after closing, per the project rules.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [ ] STYLE-02 **One job per function**: `assembleScene` (`assembleScene.ts:84-162`) is still one 79-line function, carried over from `toDefinition` as-is by design.
- [x] STYLE-03 **Test branches**: the C-139 gaps are now pinned.
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs**: the repair regenerates the 10k-line `scenePin.json` (+5906/-4399) to add two cases; the content diff is two added entries per series order (row 31), but the line diff is hard to review.
