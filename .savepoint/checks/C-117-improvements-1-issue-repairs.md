---
id: C-117
scope: {kind: release, id: G-011}
result: CLEAR
checked_by: {role: checker, session: c117-improvements-check-20261024}
executed_session: improvements-1-run-20261024
checked_at: '2026-10-24T03:45:00Z'
reviewed:
  base_commit: 01aef043
  head_commit: c6b17008
  files: [.github/workflows/publish.yml, .savepoint/Design.md, .savepoint/health/config.json, docs/APOLLO11_RECONSTRUCTION.md, packages/astraeus/CHANGELOG.md, packages/astraeus/src/api/scene.ts, packages/astraeus/src/api/story.ts, packages/astraeus/src/app/PanelLoadBoundary.tsx, packages/astraeus/src/core/bodies/moon.ts, packages/astraeus/src/core/moonTrajectory.ts, packages/astraeus/src/shell/AstraeusShell.tsx, packages/astraeus/tests/appScreenDom.test.ts, packages/astraeus/tests/bodyViewDom.test.ts, packages/astraeus/tests/developerSettingsDom.test.ts, packages/astraeus/tests/firstOpenGraph.test.ts, packages/astraeus/tests/moonLibration.test.ts, packages/astraeus/tests/fixtures/moon-rotation-horizons.json, packages/astraeus/tests/fixtures/moon-rotation-horizons-source.txt, packages/astraeus/tests/orientationIllumination.test.ts, packages/astraeus/tests/pointerAndFeatureLayerDom.test.ts, packages/astraeus/tests/publicApiActivity.test.ts, packages/astraeus/tests/publicApiGroup.test.ts, packages/astraeus/tests/sceneHooksDom.test.ts, packages/astraeus/tests/sceneTransforms.test.ts, packages/astraeus/tests/stateResolver.test.ts, packages/astraeus-demo-apollo11/data/apollo11/generated/validation.json, packages/astraeus-demo-apollo11/src/experiences/apollo11/apollo11Scene.ts, packages/astraeus-demo-apollo11/tests/domApollo.test.ts, packages/astraeus-demo-apollo11/tests/rebuildComparison.test.ts, packages/astraeus-demo-apollo11/tools/apollo11/report.ts, packages/astraeus-demo-apollo11/tools/apollo11/validation.ts, packages/astraeus-demo-planets/tests/domMoonPanel.test.ts, packages/astraeus-demo-showers/data/showers/geminids.json, packages/astraeus-demo-showers/data/showers/perseids.json, packages/astraeus-demo-showers/src/experiences/showers/showerSettings.ts, packages/astraeus-demo-showers/tests/showers.test.ts, packages/astraeus-site/tools/validate/load-budget.mjs]
  dependencies: []
issues: [I-092]
supersedes: null
---

# C-117: Issue repairs on branch improvements-1 (I-084 to I-091, I-034 review)

**What this checks.** The direct repairs of Issues I-084, I-085, I-086, I-087, I-088, I-089, I-090 and I-091 (each `in_progress` with `repair_attempted` history) and a review of I-034 (re-measured, no repair; the owner judges it, so it is not closed here). There is no Objective: the Savepoint loader accepts only task, objective or release scopes, so the record is scoped to the router's Goal G-011, under which the improvements were taken; it makes no claim about G-011's Objectives. Full method applied, with Full rigour on the engine-touching repairs I-089 and I-091 (adversarial pass, Design reconciliation).

**Independence.** This session did not plan, build or coordinate any of the repairs. It wrote only: gate outputs (`coverage/`, `junit.xml`, `dist/` folders, example builds), the browser run folder `docs/evidence/browser-20261024T033359Z/`, scratch probes in its own scratchpad (a Python IAU recompute, a TypeScript-AST walker comparison, a measurement of commit 8a0991c7 in a scratch copy, a clock probe on port 5531, a lizard run), this record, Issue I-092, and append-only history and resolution entries on the Issues below. It did not run `savepoint health check` (no Objective), did not edit the router, did not commit, and did not read or touch `docs/prds/` or `docs/research/` other than lizard's file count for the I-087 negative control.

**Baseline.** HEAD `c6b17008` on `improvements-1`; diff base `git diff main...HEAD`, merge base `01aef043` (13 commits). Not a worktree lane (`git-dir` = `git-common-dir` = `.git`). Tree clean apart from the untracked `docs/prds/`, `docs/research/` and this run's evidence folder. Times UTC.

**Verdict: CLEAR** for the frozen scope below. Seven repairs are proven and closed as `verified`: I-084, I-086, I-087, I-088, I-089, I-090, I-091. I-085's file change is proven, but its Proof Needed also asks for a real GitHub Actions dry run, which cannot be produced from an unpushed local checkout; that item is outside this Check (scope lock 1d), so I-085 stays `in_progress` with the dry run owed after push. I-034 stays `in_progress` for the owner. One non-blocking follow-up Issue was captured (I-092).

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (not a feature here; no lanes; not a finding)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: first Check of these repairs; no prior Check or owner exception on their scope. The owner decisions recorded in I-086 ("Raise the limit a little") and I-089 ("Do the small part only") are scope choices recorded in Issue history, not Check exceptions; both are honoured as recorded)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence (no Objective: `savepoint health check` not run, per AGENTS.md CLI Rules; full gate coverage and a lizard run recorded instead, not an official snapshot)
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock

1. Requirements under test: each Issue's Proof Needed.
   a. I-084: doc and code agree on the bad-centre error code; `loop` without a timeline throws a named error or is documented as ignored; the unread `stream.quality.default` is removed or used; CHANGELOG Unreleased lists visible API changes; gates and `check:engine-alone` green.
   b. I-086: a saving or, failing that, the owner's choice; the owner chose to raise the raw limit; the public-build file check passes.
   c. I-087: `docs/research` and `docs/prds` excluded from the complexity and duplication scanners in `.savepoint/health/config.json`; top complexity comes from project code; Design's Code Health paragraph names the exclusion.
   d. I-085: workflow on actions that run on Node 24, runner pinned or confirmed. Out of scope: the live dry run (needs a push; not producible by a local Check).
   e. I-088: behaviour tests for the listed files, before/after `test:full` figures, no new coverage exclusions.
   f. I-089: design note first; owner chose option B; `measure:example` before/after shows a drop; `firstOpenGraph.test.ts` asserts the split modules are not reached; every demo still draws its planets and moons (fast suite; one browser run).
   g. I-090: a planted bare-import case is caught; the walker follows bare imports and `export ... from`; the real graph still passes.
   h. I-091: a published lunar orientation model with its source (PROV-01) drives the Moon in `src/core/`; a test compares with Horizons at several dates and records the residual; landing-site offset re-measured and limitation text updated; ARCH-02 and ARCH-05 hold; Apollo and planets demos still draw the Moon.
   i. I-034: review only (re-measure evidence and the clock-stall note); no closure.
   Guardrails: ARCH-01 to ARCH-05, PROV-01, PROV-02, TEST-01 to TEST-03, CODE-01, STYLE-*. Gates: `quality_gates` (lint, typecheck, build, test), full gate `npm run test:full`, `check:engine-alone`, `check:pack`, `measure:example`, one `check:browser`.
2. Changed files: `reviewed.files` above. Public entry points touched: `Scene.addGroup`/`setTimeline` docs, `MOON` and `MOON_ROTATION` (core), `MoonTrajectory.stateAt`, `AstraeusShell` (moon panel), `PanelLoadBoundary`, showers settings parser, `load-budget.mjs`, publish workflow, health config.
3. Relied-on behaviour: `iauAnglesAt`/`iauBodyToEqjMatrix` (existing, used by the planets), the Orb adapter's Moon position and `daysSinceJ2000Tt`, React.lazy/Suspense, the Vite/rolldown chunking, the reconstruction tool (`tools/apollo11/frames.ts` `lunarFixedToEqj`) for the landing-site figure.
4. Matrix axes: per Issue below; text-class, terminal-output and serialisation axes are not applicable (no text-width, CLI or persistence behaviour in scope).
5. Admission boundary: an Issue needs a reproducible violation of a Proof Needed item or a Required/Blocker guardrail through a supported path inside this lock.

## Coverage Matrix

| Issue / requirement | Cell | Probe (independent where marked) | Result |
|---|---|---|---|
| I-091 model and source | normal | `moon.ts` `MOON_ROTATION` constants compared line by line with NAIF pck00011 BODY301 and BODY3_NUT_PREC_ANGLES (checker's own transcription): pole, W, 13 angles per century, RA/Dec/W coefficients | Pass; citation carried in `MOON_IAU_REPORT` and on the elements (PROV-01) |
| I-091 vs Horizons | independent oracle | **Independent**: Python recompute of the IAU formulas (own code, d² term included, light time 1.34 s) at 2000-01-01 12:00 UTC with a fresh Horizons LT+S geocentric Moon vector (fetched 2026-10-24) gives sub-Earth lon 5.0213°, lat −6.7218°, pole RA 266.8577°, Dec 65.6411° against the fixture's Horizons 5.025824°, −6.720739°, 266.85757°, 65.64324°: residuals 0.0045°, 0.0011°, pole Dec 0.0021° | Pass; matches the recorded ≤0.006°/≤0.003°/≤0.0032° |
| I-091 vs Horizons | several dates | `moonLibration.test.ts` at 7 dates 1969–2050 (fixture equals the raw Horizons text, lines 65–71 and 212–218, checked) | Pass (bound 0.01°) |
| I-091 libration present | boundary | same test: sub-Earth lon > 3°, lat > 4° off the lock at the fixture dates | Pass |
| I-091 generic (ARCH-03) | made-up config | made-up elements with one periodic term | Pass |
| I-091 one definition (ARCH-05) | bypass | grep: Moon orientation in `src/` comes only from `MOON.orientation` and `MOON_ROTATION` via `MoonTrajectory`; `moonOrientationFromOrbit` remains only for Io and `moonSystem` (still `tidal-lock`); the reconstruction tool's `frames.ts` keeps its own copy of the same constants (offline tool, not a runtime definition) | Pass for the runtime; duplicate constant set captured as non-blocking I-092 |
| I-091 presentation unchanged (ARCH-02) | state/presentation | `moonTrajectory.ts` is the only core change; no scene or shell code changed for I-091; texture +X = longitude 0 as before | Pass |
| I-091 loosened tests | regression hiding | `orientationIllumination` (near side cos 10°, pole vs orbit normal cos 14°), `sceneTransforms` (10°, recorded `moonQ` within 10°), `stateResolver` (text and kind), `rebuildComparison`/`domApollo` (wording). Each now admits libration; none can hide a wrong model because `moonLibration.test.ts` pins the sub-Earth point and pole to 0.01° at 7 dates | Pass (bounds are loose; see observation O1) |
| I-091 landing-site re-measure | normal | `validation.json` and report: 0.01 km at touchdown and lift-off (was 254.18 / 275.37 km); by construction (tool and engine share the model, differing in the d² term and time conversion) — stated as such in the docs and the limitation | Pass |
| I-091 limitation text (PROV-01) | wording | `ROTATION_LIMITATION`: names the model, says it is not the JPL ephemeris, states the measured bound and that accuracy elsewhere is not stated by the source; Apollo `MOON_LIMITATIONS` says "a published approximation" | Pass |
| I-091 demos draw the Moon | fast suite + browser | `npm run test:full` (Apollo and planets suites), `check:browser` smoke over every demo view, hello-scene and hello-react with Earth and Moon drawn | Pass |
| I-089 design note and owner choice | sequence | history: design note (05:00), owner "Do the small part only", repair (06:00) | Pass |
| I-089 drop | before/after | **Independent**: `measure:example` on a scratch copy of commit 8a0991c7 (after I-089, before I-091): first-open 1,586,382 B raw / 453,280 B gzip, `MoonFamilyPanel` 3,859 B on demand — exactly the recorded figures. At HEAD: 1,587,659 / 453,973 (I-091's Moon constants add 1,277 / 693 B) | Pass |
| I-089 graph | not reached | `firstOpenGraph.test.ts` asserts `shell/MoonFamilyPanel.tsx` and `shell/moonFamilies.ts` not reached; TS-AST walk (below) agrees | Pass |
| I-089 with / without moon families | state | `domMoonPanel.test.ts` (list appears after the lazy load with `moonFamilies`, absent without) | Pass |
| I-089 load failure | failure | `PanelLoadBoundary` `message` prop; no dedicated test of the moon message | Unverified detail, non-blocking (O5); default text unchanged for developer panels (covered by existing tests) |
| I-089 package export | bypass | `./shell/MoonFamilyPanel` export unchanged; `check:pack` pass | Pass |
| I-090 planted cases | malformed/bypass | four planted cases in the test | Pass |
| I-090 multi-line imports | input shape | **Independent**: the test's regexes vs a TypeScript 6 AST walk (ImportDeclaration/ExportDeclaration, type-only clauses and all-type named lists skipped) over every `.ts`/`.tsx` under `packages/astraeus/src`: 0 files differ (9 files hold multi-line imports); first-open graph 167 = 167 files | Pass. Statements not at column 0 are not matched (none exist; O4) |
| I-088 figures | before/after | fresh `test:full`: overall 9639/10516 = 91.66%; `src/app` 3706/4073 = 90.99%; App 214/256, BodyView 39/39, DeveloperSettings 50/56, FeatureMarkers 130/136, sceneContentsHooks 91/98, sceneHooks 50/57, scenePointer 23/23 — all match the recorded after figures (overall +1 statement from I-089/I-091 code) | Pass |
| I-088 no new exclusions | bypass | `git diff main...HEAD -- vitest.config.ts` empty | Pass |
| I-088 outcomes asserted | test quality | read `appScreenDom.test.ts` (clock play/pause/rate, address parsing, controls); 234 `expect` calls across the five files | Pass |
| I-084 bad centre | boundary | test: uncatalogued centre → `unknown-body`; catalogued but absent → `bad-group`; doc in `scene.ts` matches | Pass |
| I-084 loop without timeline | state | test: `{ none: true, loop: true }` and no `setTimeline` → `loop` undefined; doc in `scene.ts` and `story.ts` | Pass |
| I-084 unread default | removal | `stream.quality.default` gone from type, parser, both JSON files and tests; grep finds no reader; the quality rule is still read (`measuredOrbits.ts:90`) | Pass |
| I-084 CHANGELOG | docs | Unreleased lists the doc-only change and I-091 | Pass |
| I-086 limit | owner decision + gate | raw limit 4,450,000 (dated comment); fresh public-build file check: Apollo 11 page 4,340,642 B raw (97.5%) / 2,812,143 B gzip (97.0% of 2,900,000), 12 files, no problems | Pass |
| I-087 exclusions | config | lizard `-x`, jscpd `--ignore`, osv `--experimental-exclude` and each `exclusions` list name `docs/research` and `docs/prds`; Design Code Health paragraph names them | Pass |
| I-087 top complexity | oracle | lizard with the config's own arguments to a scratch CSV: 6,700 rows, 0 from `docs/research`/`docs/prds`, top CCN 20 (`horizons-client.mjs headerOf`, `PathView.ts` constructor, `driver.mjs` anonymous). Negative control: lizard on the two folders alone tops at CCN 29 (`extract_gmn.py`) | Pass (scratch run, not an official snapshot) |
| I-085 actions | file | `publish.yml` parses; `checkout@v7` and `setup-node@v7` `action.yml` both declare `using: node24` (fetched from GitHub); runner `ubuntu-latest` kept with the reason recorded | Pass |
| I-085 dry run | external | needs a push | Out of scope (lock 1d); owed |

### Finite External-Boundary Matrix

| Boundary | Cells | Classification |
|---|---|---|
| Horizons (fixture source) | target/frame, response | Fixture text checked against its parsed JSON; frame MOON_ME, DE441, quantities 14/20/32. Fetch, timeouts, retries: not applicable (offline fixture, no runtime call) |
| Browser runner (`check:browser`) | startup, servers, cleanup, failure output | One run, exit 0, 8 steps, error-lines 0; its own servers stopped. A stale `vite preview examples/hello-react --port 5497` from 2026-10-23 23:11 (local) belongs to an earlier session, not this run (O9) |
| GitHub Actions | runtime target, success | Not runnable locally; owed (I-085) |
| Lazy chunk load (I-089) | success, failure | success in happy-dom and in all browser views; failure path untested (O5) |

### Workflow And Side-Effect Check Lock

| Order | Operation | Side effect | Failure owner / final state | Oracle |
|---|---|---|---|---|
| 1 | Reconstruction tool `landingSiteOffset` (offline) | writes `validation.json`, report | tool run; committed output only | values re-read; Apollo suites pass |
| 2 | Shell renders moon panel | dynamic import of a chunk | `PanelLoadBoundary` shows the reload message; rest of app draws | happy-dom test (success); failure by reading |
| 3 | `load-budget.mjs` public-build check | none (reads files) | step exit code | fresh run figures |
| 4 | Publish workflow | npm publish (real run) | GitHub | owed |

### Matrix Completion Lock

Every cell above is Pass, Out of scope with a reason (I-085 dry run), or a named non-blocking Unverified detail (I-089 failure message). No criterion inside the lock is Unverified.

## Adversarial Pass

- **Bypass of the Moon model:** could another path still orient the Moon by the old tidal lock? `moonOrientationFromOrbit` is now called only by Io and `moonSystem`; the reconstruction tool imports `MOON_ROTATION` for the offset and keeps its own matrix for anchor conversion (I-092). The planets demo's Earth Moon keeps catalogue facts (`planetDefinition.ts:193`). No bypass.
- **Time scale:** the engine passes `daysSinceJ2000Tt` (TT for TDB, under 2 ms difference); the independent recompute used TDB with light time; residuals are well inside the bound.
- **Omitted term:** the −1.4e-12 d² W term is omitted (0.0005° at 50 years from J2000; 0.0002° at 1969); stated in the source comment.
- **Numeric edges:** `iauBodyToEqjMatrix` rejects non-finite days; quaternion norm checked to 1e-12 in the existing test.
- **Tests on own calculation:** the Horizons fixture and the Python recompute are independent of the engine code; the landing-site 0.01 km is not (stated as by construction).
- **Walker regex:** multi-line, `export *`, type-only and all-type named lists match a compiler parse on the real tree; column-0 assumption noted.
- **Bundle claims:** reproduced at the exact commit rather than trusting the history note.

## Gates (fresh, one at a time)

| Command | Result |
|---|---|
| `npm run lint` | exit 0 |
| `npm run typecheck` | exit 0 |
| `npm run build` | exit 0 (chunk-size warning only) |
| `npm run test:full` (full gate; includes the `npm test` suite with junit) | exit 0: 141 files, 1859 passed, 1 skipped; statements 91.66% (9639/10516), branches 85.93%, functions 91.85%, lines 94.27%; `src/app` 90.99% (3706/4073); fresh `coverage/coverage-final.json` and `junit.xml` |
| `npm run check:engine-alone` | pass in 17.2 s |
| `npm run check:pack` | pass in 12.2 s (astraeus 7.02 MB packed, 435 files) |
| `npm run measure:example` | first-open 1,587,659 B raw / 453,973 B gzip at HEAD; 1,586,382 / 453,280 at 8a0991c7 (scratch copy) |
| `npm run check:browser` (once) | exit 0 in 111 s; smoke, smoke-public-showers, planets-phone, meteor-shower, hello-scene, hello-react, public-build-assets, public-addresses all exit 0, error-lines 0; evidence `docs/evidence/browser-20261024T033359Z/` (summary and results only; public-build figures from the step log `/tmp/astraeus-check-logs-AJy6sj/public-build-assets.log`); no screenshots |
| `git diff --check main...HEAD` | trailing whitespace only in `tests/fixtures/moon-rotation-horizons-source.txt`, the verbatim Horizons text (kept raw on purpose; not a finding) |

## Code Health

No Objective, so no official snapshot (AGENTS.md CLI Rules). Coverage from the full gate above; complexity from the scratch lizard run in the matrix (top CCN 20, project code). Duplication not measured in this run.

## I-034 Review

The 2026-10-24 re-measure (`docs/evidence/i034-frames-20261024T031416Z/`) shows no periodic fill hitch; it is the owner's to judge by eye. The note that the clock "stood still after about 4 s" and "after a seek to 10%" was probed (Perseids, dev server on port 5531, driver.mjs, clock read twice a second): after a seek to 10% (2019-10-27T17:56Z) the clock ran 5 days, paused for about 6 s and resumed by itself. That is the story panel hold: `data/stories/perseids/panels.json` sets `autoOpen: true`, `pauseSeconds: 6`, and the "stream-shape" panel is at 2019-11-01T00:00Z; `useStoryPanels.ts` pauses on a forward crossing and resumes after the hold. Playback from the opening time ran continuously for 60 scene days in 12 s. It is designed behaviour (the probe's auto-open switch did not take), not a playback defect, and it only removed burst time from the measurement. No Issue.

## Design Reconciliation

The new paragraph "Improvement fixes (branch improvements-1, 2026-10-24; Issues I-084 to I-091...)" was checked against the code: the Moon is `"iau-rotation"` through `MOON_ROTATION` and `iauRotation.ts`, applied in `moonTrajectory.ts`; the 0.006° Horizons figure holds; `"tidal-lock"` remains for Io and `moonSystem`; `MoonFamilyPanel` is `React.lazy` inside `PanelLoadBoundary` with a `message` prop; planet and comet tables stay module constants; the Apollo raw limit is 4,450,000; the non-architectural list is accurate. The Spike 02 sentence now says the 254 km offset was under the old tidal lock and is 0.01 km since I-091. Reconciled, with one stale phrase noted (O3).

## Issues Pass

| Requirement | Classification |
|---|---|
| I-084 (all items) | Proven |
| I-086 | Proven (owner decision plus fresh public-build check) |
| I-087 | Proven |
| I-088 | Proven |
| I-089 | Proven |
| I-090 | Proven |
| I-091 | Proven |
| I-085 file change | Proven; live dry run out of scope, owed |
| I-034 | Reviewed, owner's decision |

Issue captured (non-blocking, outside the admission test for a blocker):

- **I-092** — the Apollo reconstruction tool (`packages/astraeus-demo-apollo11/tools/apollo11/frames.ts` lines 89–135) keeps its own copy of the Moon's IAU rotation constants beside the engine's `MOON_ROTATION`, with a different citation ("2018") and per-day angle rates; STYLE-07 drift, ARCH-05 in spirit. It does not violate an in-scope requirement (the tool is offline, and the runtime has one definition), so it does not affect this verdict.

No materiality actions are required: no blocking Issue.

## Observations (non-blocking)

- O1 `orientationIllumination.test.ts`: the comment says the lunar pole is "about 6.7 degrees from the ecliptic pole and the orbit normal by 5.1 degrees more, so up to about 12"; by Cassini's laws the pole is about 1.5° from the ecliptic pole on the far side from the orbit normal, so pole to orbit normal is about 6.7°. The 14° bound is loose; about 8° would still pass and be tighter. The near-side bounds (10°) are likewise loose but the Horizons test pins the model.
- O2 The CHANGELOG and limitation say "within 0.01 degrees (about 0.3 km)"; measured 0.006°; consistent as a rounded bound.
- O3 Design.md "Spike 01 (O-001) behaviour is unchanged: ... near-side Moon locking" is now stale; the Moon librates.
- O4 I-090 walker: regexes need statements to start a line; true of the whole tree today.
- O5 I-089: the moon panel's load-failure message has no test, and it reuses the `developer-loading` class.
- O6 First-open at HEAD is 1,587,659 / 453,973 B (I-091 adds 1,277 / 693 B); still below the pre-I-089 1,589,850 / 454,211.
- O7 Apollo 11 public page now at 97.5% raw / 97.0% gzip.
- O8 I-087 duplication (jscpd) exclusion verified by configuration only; complexity verified by a run.
- O9 A stale `vite preview examples/hello-react --port 5497` (pid 3166050, started 2026-10-23 23:11 local) is still running from an earlier session; the owner may stop it.

## Owner Validation Still Needed

- I-085: push, then run the publish workflow manually (Actions, publish, Run workflow; publishes nothing) and confirm no Node 20 annotation; then resolve I-085.
- I-034: judge the showers by eye on the preview; resolve or reopen.
- I-091: look at the textured Moon on the preview (libration now moves the near side by several degrees).

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [ ] STYLE-07 **One source of truth** — `tools/apollo11/frames.ts` repeats the Moon rotation constants that `core/bodies/moon.ts` now owns (I-092).
- [ ] STYLE-08 **Comments explain why** — `orientationIllumination.test.ts` pole comment states the geometry wrongly (O1).
- [x] STYLE-09 **Content lives in data**
- [x] STYLE-10 **Small diffs**
