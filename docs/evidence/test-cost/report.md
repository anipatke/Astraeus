# Where verification time goes (O-094 T-423)

Measured on branch `o094-tests-earn-their-time`, head `cb402861`, 2026-11-22, on the owner's desk machine (16 cores, WSL2), one run at a time, no browser run. Figures marked **measured** come from runs made in this Task or from recorded run folders; figures marked **estimate** are derived from those measurements and say how.

## In plain words

- One Full Objective Check spends about **454 s (7.6 min) of machine time** when it runs the full browser tier, which it did in four of the five Checks since tiers arrived (O-086). Of that, the **browser run is 310 s (68%)**; all the ordinary gates together are 144 s, and Vitest is 55 s of those.
- Vitest is not where most of the waiting comes from. A plain `npm test` takes 34 s, and **one file (the Apollo 11 rebuild) sets that floor**: the other 327 files finish while it is still running.
- Across a whole Objective, **process repeats cost more than any single test**: the browser ran about twice per Objective on average once builder step runs, rechecks and repeat runs are counted; half of G-024's Objectives needed a repair and a recheck, and each such loop added 4-12 minutes of wall clock.
- The recommended cuts reach **about 228 s per full-tier Full Check (50%)**, with nothing on the protected list touched. Half of that is one rule change: run the quick browser tier plus the look-out step instead of the whole full tier.

## 1. Vitest

### Runs (measured)

| Command | Wall (`/usr/bin/time`) | Vitest duration | CPU (user+sys) | Files / tests | Result |
|---|---|---|---|---|---|
| `npm test` | 34.3 s | 30.26 s | 388 s | 328 / 5,424 passed, 2 skipped | exit 0 |
| `npm run test:full` | 54.5 s | 45.51 s | 584 s | 328 / 5,424 passed, 2 skipped | exit 0; coverage 93.47% statements, 94.74% lines |

Vitest's own phase split (vitest 5 prints shares of summed phase time, not seconds):

- `npm test`: tests 49%, transform 24%, import 18%, environment 6%, setup 2%.
- `test:full`: tests 61%, transform 16%, import 16%, environment 4%, setup 3%, worker 1%.

So in a plain run **about half of all worker time is fixed overhead** (transforming and importing modules, environment, setup), not test bodies. Coverage adds **20 s wall and 196 s CPU** (test:full minus test).

From `junit.xml` (test:full): file times sum to 337.7 s; test-case times sum to 243.7 s; the **94 s gap is per-file `beforeAll`/import work**, of which 41.0 s is one file (Apollo 11) and 23.7 s another (apiRules). 4,200 of 5,426 tests take under 10 ms; 46 tests take over 1 s and hold 130.5 s (54% of all case time). The 10 slowest files hold 58% of file time, the 20 slowest 74%, the 80 slowest 95%.

By package (file time): astraeus 153 s, astraeus-site 76 s, astraeus-demo-showers 54 s, astraeus-demo-apollo11 45 s, astraeus-data-constellations 8 s, astraeus-demo-planets 0.6 s.

**Why wall time is 30-45 s:** with 16 workers the ideal is 337.7 / 16 = 21 s, but a run cannot finish before its longest file. `apollo11Reconstruction.test.ts` is 41.1 s in test:full against a 45.5 s total, so it is the critical path. The next three are 30.2 s, 27.4 s and 19.7 s. Cutting tests from files that are not on that path saves CPU (which matters when a browser run or another builder shares the machine) but little wall time.

The plain `npm test` run printed totals only (vitest's default reporter prints no per-file lines without a terminal), so per-file figures below are from test:full; plain-run file times scale at roughly 30.26 / 45.51 = 0.66.

### 40 slowest files (test:full, seconds; setup = file time minus case time, blank = under 0.5 s)

| s | setup | tests | file |
|---|---|---|---|
| 41.12 | 41.0 | 30 | packages/astraeus-demo-apollo11/tests/apollo11Reconstruction.test.ts |
| 30.17 | 23.7 | 19 | packages/astraeus-site/tests/apiRules.test.ts |
| 27.45 | | 11 | packages/astraeus/tests/pointsLookAhead.test.ts |
| 19.74 | | 6 | packages/astraeus-demo-showers/tests/keplerShader.test.ts |
| 16.53 | 4.2 | 19 | packages/astraeus-demo-showers/tests/showersMeasured.test.ts |
| 15.30 | | 142 | packages/astraeus/tests/sceneInputCopies.test.ts |
| 14.26 | 5.6 | 10 | packages/astraeus-site/tests/apiSurface.test.ts |
| 10.13 | | 101 | packages/astraeus/tests/twoViewers.test.ts |
| 10.06 | | 9 | packages/astraeus/tests/computedLook.test.ts |
| 9.59 | 9.5 | 5 | packages/astraeus-site/tests/demoAbout.test.ts |
| 7.84 | | 8 | packages/astraeus-data-constellations/tests/finder.test.ts |
| 6.98 | | 4 | packages/astraeus-demo-showers/tests/pointsLookAheadShowers.test.ts |
| 6.92 | 5.6 | 6 | packages/astraeus-site/tests/apiReference.test.ts |
| 6.43 | | 1 | packages/astraeus-demo-showers/tests/pointsBlendCorner.test.ts |
| 5.61 | | 30 | packages/astraeus/tests/developerDrawerFolds.test.ts |
| 5.44 | | 11 | packages/astraeus-site/tests/loadingCoverChain.test.ts |
| 4.98 | | 13 | packages/astraeus/tests/pacingOverlaps.test.ts |
| 4.38 | | 73 | packages/astraeus/tests/lifecycle.test.ts |
| 3.73 | | 7 | packages/astraeus/tests/cold/sceneMoonIsolation.test.ts |
| 3.11 | | 8 | packages/astraeus/tests/cold/sceneLoad.test.ts |
| 3.07 | | 31 | packages/astraeus/tests/selectionOwner.test.ts |
| 2.95 | 2.9 | 31 | packages/astraeus/tests/sceneLoadOrder.test.ts |
| 2.86 | | 28 | packages/astraeus/tests/listedOrbitGroup.test.ts |
| 2.57 | | 14 | packages/astraeus-site/tests/gateLimits.test.ts |
| 2.34 | | 13 | packages/astraeus/tests/developerToolsOption.test.ts |
| 2.27 | | 7 | packages/astraeus/tests/pointsKepler.test.ts |
| 2.23 | | 5 | packages/astraeus-site/tests/browserExitPath.test.ts |
| 2.21 | | 36 | packages/astraeus-demo-apollo11/tests/paths.test.ts |
| 2.21 | | 17 | packages/astraeus/tests/orbitLook.test.ts |
| 2.13 | | 92 | packages/astraeus-demo-showers/tests/showers.test.ts |
| 2.08 | | 8 | packages/astraeus/tests/viewerIds.test.ts |
| 2.01 | | 21 | packages/astraeus/tests/shownDuringMenu.test.ts |
| 1.77 | | 26 | packages/astraeus-demo-showers/tests/demoShowers.test.ts |
| 1.77 | | 14 | packages/astraeus/tests/escapeScope.test.ts |
| 1.75 | | 35 | packages/astraeus/tests/viewerHostDom.test.ts |
| 1.74 | | 18 | packages/astraeus/tests/selectionCauseDom.test.ts |
| 1.64 | | 1 | packages/astraeus-site/tests/browserDrawnControl.test.ts |
| 1.59 | | 222 | packages/astraeus/tests/sceneFaultOrder.test.ts |
| 1.55 | | 7 | packages/astraeus/tests/groupLookRender.test.ts |
| 1.49 | | 29 | packages/astraeus/tests/setSelected.test.ts |

### 40 slowest tests (test:full, seconds)

| s | file | test |
|---|---|---|
| 11.17 | keplerShader | Geminids shipped set > matches every member across the timeline |
| 10.10 | sceneInputCopies | addBody (options): each leaf edited alone, … |
| 7.52 | pointsLookAhead | fill look-ahead on a large group > drops the work and keeps exact positions when the clock turns round |
| 7.45 | finder | gives every direction of a whole-sky grid exactly one constellation, … |
| 6.43 | pointsBlendCorner | Geminids members near the Sun, half way between two fills > … |
| 6.02 | showersMeasured | Geminids from the shipped GMN orbits > DW3(iii), all orbits: Earth is nearest … |
| 5.30 | keplerShader | Perseids shipped set > matches every member across the timeline |
| 5.20 | pointsLookAhead | matches whole fills across a scale change mid-fill |
| 4.76 | pointsLookAhead | plays backward with the same positions, making only the first two fills whole |
| 4.62 | pointsLookAheadShowers | Geminids fill look-ahead > draws the same positions as whole fills … |
| 4.58 | apiSurface | allows no public type declared outside src/api/ … beyond the allowlist |
| 3.62 | pointsLookAhead | never draws a half-finished fill … |
| 3.37 | pointsLookAhead | plays forward with the same positions as whole fills … |
| 2.74 | cold/sceneMoonIsolation | A then B: A's Jupiter does not move when B loads |
| 2.61 | cold/sceneLoad | stateOf before load > a planet throws missing-data … |
| 2.35 | pointsLookAheadShowers | Perseids fill look-ahead > draws the same positions as whole fills … |
| 2.29 | showersMeasured | Perseids from the shipped GMN orbits > DW3(iii) … |
| 2.27 | keplerShader | the 64-bit fill from the elements > reproduces the group's own positions to a part in 10^9 … |
| 1.91 | pointsKepler | a large two-body group under a scaling policy is placed by the shader > … |
| 1.85 | loadingCoverChain | back and forward open the address now in the location … |
| 1.75 | listedOrbitGroup | builds and fills 110,000 main-belt orbits in one group |
| 1.71 | computedLook | the two bundle orders give the same look > phone / synthetic |
| 1.63 | browserDrawnControl | zero stream dots in view fails naming the stream … |
| 1.62 | pacingOverlaps | two slow spans whose ramps meet across a gap … |
| 1.59 | computedLook | the two bundle orders give the same look > desktop / synthetic |
| 1.43 | apiRules | settings mapping (API-06) > fails on a made-up address setting … |
| 1.42 | loadingCoverChain | mounts through the public mount with the page address … |
| 1.41 | apiSurface | fails on a type made reachable from a made-up entry … |
| 1.38 | apiSurface | treats a type the root names as public wherever it is declared … |
| 1.37 | apiRules | public-type lint (API-04) > fails on a made-up public type with every kind of break |
| 1.33 | apiRules | errors (API-05) > fails on a plain throw and on a message match … |
| 1.32 | computedLook | embedded-phone / synthetic |
| 1.29 | apiReference | names an export that has no doc comment (proved on a made-up entry) |
| 1.28 | apiSurface | descends into a type the root names … (T-275) |
| 1.23 | sceneInputCopies | camera.fitOrbit: each leaf edited alone … |
| 1.23 | apiRules | errors (API-05) > also judges the throws of a function or class index.ts re-exports … |
| 1.23 | gateLimits | a timed gate over a planted limit prints a warning and still passes |
| 1.21 | groupLookRender | 25 setGroupLook-sized changes take a fraction of a frame |
| 1.21 | apollo11/paths | draws the same vertices as the formula it replaced |
| 1.18 | gateLimits | the timed command exits 0 over a planted limit through the real command |

The Apollo 11 file's 30 cases take 0.09 s together; its 41 s is one `beforeAll` that rebuilds the whole reconstruction (`apollo11Reconstruction.test.ts:237`, `reconstruct(adapter, raw)`) on every run, although the file already skips the second, byte-identical rebuild when `tests/fixtures/apollo11ToolsProven.json` holds the tools' hash. apiRules builds the public surface or a TypeScript view of `src/api` in four `beforeAll`s (lines 71, 159, 231, 379); apiSurface (line 47) and apiReference (line 19) build it again, about six builds per run.

## 2. Gates

`npm run check:gates`, 2026-11-22 03:59:15-04:02:16 UTC, exit 0, 3 min 0.6 s wall (**measured**):

| Gate | Time | Limit (s) | Notes |
|---|---|---|---|
| lint | 7.3 s | 15 | |
| typecheck | 7.1 s | 20 | |
| build | 3.2 s | 15 | |
| test | 33.5 s | 55 | |
| test:full | 55.2 s | 80 | re-runs every `test` case, with coverage |
| check:engine-alone | 32.1 s | 40 | re-runs typecheck, lint and the engine's tests (about 245 files, 3,940 tests per C-205) in a scratch copy |
| check:pack | 20.6 s | 35 | builds every publishable package |
| check:public-build | 7.8 s | 10 | builds the public site; `check:browser` builds the same site again for its public steps (this run's evidence: `docs/evidence/public-build-20261122T040154Z`) |
| check:node-consumer | 7.0 s | 15 | builds and packs `astraeus` again |
| check:react-consumer | 6.5 s | 25 | network; release workflow |
| total | 180 s | | 0 over limit |

Also timed once: `npm run measure:example` 3.7 s, exit 0 (reuses the packed tarballs). Not timed: `savepoint health check` (agents may run it only inside a Full Objective Check), `check:three-newest` (network; release and three-related Objectives only), `check:shelf-split` (shelf Objectives only).

**Gates that redo another gate's work:**

- `test:full` runs all of `test`'s cases; where both run in one pass, `test` is pure repeat (the rules already say test:full replaces test in the Full Check).
- `check:engine-alone` re-runs typecheck, lint and about three quarters of the test files for the engine, inside a copy. Its unique value is catching an import or file that reaches outside the engine package; no Check or Issue from G-020 onward records it catching a defect (its recorded reds, O-080 T-336 and O-086 builders, were a test flake and a sibling builder's in-flight file).
- The packed build is made by `check:pack`, again by `check:node-consumer`, and again by `check:browser` (packages, examples and the public site); the public site is built by both `check:public-build` and `check:browser`.

## 3. Browser (recorded runs, no new run)

Full tier, `docs/evidence/browser-20261122T032627Z/` (O-089 T-421, reused by C-210), exit 0, **310 s** (limit 450):

| Step | Tier | s |
|---|---|---|
| smoke | quick | 44 |
| synthetic-journey | full only | 67 |
| smoke-public-showers | quick | 5 |
| planets-phone | quick | 12 |
| meteor-shower | full only | 16 |
| views | full only | 21 |
| look-out | full only | 72 |
| catalogue | full only | 6 |
| hello-scene | quick | 12 |
| hello-react | quick | 3 |
| hello-planets | quick | 4 |
| hello-sky | quick | 22 |
| steps sum | | 284 |
| servers and public build | | 26 |

Quick tier, `docs/evidence/browser-quick-20261122T023312Z/` (C-208), exit 0, **124 s** (limit 200): smoke 45, smoke-public-showers 5, planets-phone 8, hello-scene 16, hello-react 2, hello-planets 3, hello-sky 19 (sum 98) + 26 s servers and build.

The five full-only steps cost **182 s**; look-out alone is 72 s and synthetic-journey 67 s. The four packed-example steps cost 40 s in the quick run (41 s in the full run).

**How often the browser actually ran.** Run folders from 2026-11-21 04:08 to 2026-11-22 03:31 UTC (O-079 to O-089, 13 Objectives, Checks C-191 to C-210) hold 19 full-tier runs (12 before O-086 at 377-413 s each; 7 after at 252-319 s), 4 quick runs (517 s), 9 `--step` runs (700 s) and 2 profiling runs (705 s): **about 8,650 s (2.4 h) of browser time, about 11 min per Objective**, against the policy's one run per Check. Each run also holds 3-4 cores. Only one fresh Full Check since tiers arrived used the quick tier (C-208, O-091); C-203 and C-205 ran full, and C-207 and C-210 reused a full run made by a builder or the coordinator, because their diffs touched a full-tier path (layout CSS, camera, packaging) or the browser scripts.

## 4. Repeat map

Rules read: `docs/agents/verification.md`, `docs/agents/build.md`, `docs/agents/browser-policy.md` (Browser tiers), `.savepoint/config.yml` `quality_gates`, `agent-skills/savepoint-check/SKILL.md`, `/home/user/savepoint-orchestrate/g024-drafts/builder-rules.md`, plus the coordinator's standing rules given in the brief.

| Who | What runs | How often per Objective (G-024) | Machine s each | s per Objective |
|---|---|---|---|---|
| Builder (from 2026-11-22) | typecheck + eslint/prettier on own files + vitest on own/covering files | ~8 Tasks (O-082..O-093 had 2-12, mean 8.2) × ~2 runs (red-first, handoff) | ~15 (typecheck 7.1 measured; focused lint and vitest not measured) | ~240 (estimate) |
| Builder (before 2026-11-22) | typecheck + full lint + full `npm test`, serialised by `flock` when builders overlap | same | 47.9 (measured parts) | ~770 (estimate; the focused-gate rule already removed this) |
| Builder | browser `--step` runs and profiles where a Task changes a browser script or measures frames; extra full/quick runs | recorded: 9 step runs, 2 profiles, 3 extra quick, 2 extra full in 13 Objectives | per run folder | ~180 (recorded total / 13) |
| Coordinator | typecheck + `npm run lint` + `npm test`, once per wave | 2-4 waves (3 used) | 47.9 | ~144 |
| Full Check | typecheck, lint, build, test:full, engine-alone, pack, node-consumer, measure:example, public-build, health check, one browser tier | 1 | 144.0 gates + 310 full (or 124 quick) + health (not measured) | **454** (full tier) / 268 (quick) |
| Recheck | most of the Full Check list again; browser reused unless the repair touches a browser path | 0.5 (5 rechecks for 10 G-024 Objectives: C-200, C-201, C-204, C-206, C-209; 3 of 5 had a fresh full browser run) | ~144 + 0.6 × 310 = ~330 | ~165 |
| **Total** | | | | **~1,180 s (about 20 min) per Objective** |

Full Check baseline used for the target: **454 s** (gates 7.1 + 7.3 + 3.2 + 55.2 + 32.1 + 20.6 + 7.0 + 3.7 + 7.8 = 144.0 s, plus the full tier's 310 s; health check left out because it could not be measured). Half is **227 s**.

How each piece repeats in one Objective: lint and typecheck run ~16 (builders) + 3 (coordinator) + 1 (Check) + 0.5 (recheck) times; the full test suite 3 + 1 + 0.5 times (it was ~20 times before the focused-gate rule); the packed build 3-4 times inside each Full Check; the browser about twice on average.

**Wall clock, from commit and Check times** (local time; agent time is what remains after machine time):

| Check | Wall | Machine inside | Remainder (agent) |
|---|---|---|---|
| C-205 (O-087), router 12:58:34 → record 13:09:51 | 11.3 min | ~7.7 min (gates 144 s + full tier 315 s) | ~3.6 min |
| C-210 (O-089), 14:43:47 → 14:49:38 | 5.9 min | ~2.4 min (gates; browser reused) | ~3.5 min |
| C-207 (O-088), 13:21:01 → 13:28:47 | 7.8 min | ~2.4 min (browser reused) | ~5.4 min |
| C-208 (O-091), 13:29:02 → 13:39:41 | 10.6 min | ~4.5 min (gates + quick 124 s) | ~6 min |
| NEEDS WORK loop O-087: C-205 → repair 13:14:54 → recheck 13:20:31 | +10.7 min | | |
| NEEDS WORK loop O-086: C-203 08:57:39 → repair 09:07:25 → recheck 09:09:14 | +11.6 min (the repair re-ran the full tier, 319 s) | | |
| NEEDS WORK loop O-091: C-208 → repair 13:40:36 → recheck 13:43:56 | +4.3 min | | |

When the browser runs fresh, machine time is about two thirds of a Check's wall clock; when it is reused, agent time dominates. **The bigger lever is process, not tests:** each NEEDS WORK loop costs 4-12 minutes of wall clock and ~330 s of machine time, and five of ten G-024 Objectives had one; a fresh full browser run costs five minutes every time it is not reused. A cut inside Vitest saves seconds per run.

## 5. Catch evidence (G-020 onward)

NEEDS WORK Checks: C-180, C-183, C-186, C-188, C-191, C-193, C-198, C-203, C-205, C-208 (C-190 opened I-183 from an observation).

| Record | What | Caught by |
|---|---|---|
| I-178 (C-180, O-073) | README/CHANGELOG time-error wording | Check reading docs against code |
| I-179 (C-183, O-075) | story panel never closes when its span passes in one frame | Check probe (temporary DOM test through `tests/domSetup.ts`) |
| I-180 (C-186, O-076) | 0.9.2 notes say nothing needs a change | Check reading notes against code and `git show v0.9.1` |
| I-181, I-182 (C-188, O-077) | Design and README wording on groups | Check reading |
| I-183 (C-190, O-078) | option setters accept a Map or Date | Check probe (observation A4b) |
| I-184 (C-191, O-079) | browser driver not migrated for the phone bar | full browser run: smoke, planets-phone, look-out red (`browser-20261121T040852Z`) |
| I-185 (C-191) | synthetic journey on a phone finds no free scene point | browser synthetic journey (then inside smoke; now the full-only `synthetic-journey` step) |
| I-186 (C-191) | timeline glow ignores the accent | Check code review plus probe |
| I-187 (C-191) | contributor guide out of step | Check reading |
| I-188 (C-193, O-080) | catalogue journey fails its own assertion | full tier `catalogue` step (`browser-20261121T064004Z`) |
| I-189 (C-193) | host setOpen undone heard as a visitor | Check probe (scratch test) |
| I-190 (C-193) | bad-part doc incomplete | Check reading |
| I-191 (C-198, O-084) | engine first download over its raw cap | `packagePacks.test.ts` engine cap, `check:pack`/`measure:example` figure, browser `public-build-assets` (now `check:public-build`) |
| none (O-087 T-400) | look-out labels overlap after the label rework | full tier `look-out` (`browser-20261121T224645Z`: "no labels overlap with kettle shown") |
| I-192 (C-203, O-086) | look-out reads the sky camera mid-glide | full tier `look-out` (`browser-20261121T215119Z`; red in 3 of ~6 runs) |
| I-193 (O-088 T-408) | clump group order depends on load order | the load-order comparison, now `sceneLoadOrder.test.ts` |
| I-194 (O-088 T-410) | button look depends on stylesheet order | `computedLook.test.ts` bundle-order cases (all 8 failed before the fix) |
| I-195 (O-091 T-415) | engine does not typecheck on three 0.181+ | `check:three-newest` |
| I-196 (C-205, O-087) | orbit-set lines stop catching up while paused | Check probe; now `orbitSetSync.test.ts` "orbit-set lines with a stale backlog when the clock stops (I-196)" |
| I-197 (C-205) | Design/changelog call data-frames-drawn opt-in | Check reading plus grep |
| I-198 (C-208, O-091) | workflow parity test misses disabled steps, push filters, publish in ci.yml | Check reading the test against its promise |
| I-200 | planets Focus after Overview does nothing | owner look on localhost:5490 |
| I-201 | owner preview served stale code | owner |

Counted over 24 findings: **12 were caught by the Check session reading or probing** (8 of them wording drift in docs), 6 by a browser step (5 by full-only steps: look-out three times, synthetic-journey, catalogue; plus smoke/planets-phone in I-184), 3 by a standing test or size gate (I-191, I-193, I-194), 1 by `check:three-newest`, 2 by the owner. **No G-020+ record shows** `check:engine-alone`, `check:node-consumer`, `check:react-consumer`, the `hello-*` example steps, `meteor-shower`, `views`, test coverage, or any of the slow showers or Apollo data tests catching a defect.

### Protected list (no proposal removes these)

- Browser `look-out` step (full tier): O-087 label overlap, I-192 (and I-184 in G-023). Proposals keep it in every Check whose diff touches a full-tier path.
- Browser `smoke` and `planets-phone` (quick tier): I-184.
- `sceneLoadOrder.test.ts` (load orders compared after `prepare`, group order included): I-193.
- `computedLook.test.ts` "look rules: the two bundle orders give the same look" (all 8 layout × definition cases): I-194.
- `orbitSetSync.test.ts` "orbit-set lines with a stale backlog when the clock stops (I-196)", and the Check's temporary-probe practice it came from.
- `check:three-newest` (release workflow and three-related Objectives): I-195.
- `packagePacks.test.ts` engine size caps, `check:pack`, `measure:example`, `check:public-build` load budgets: I-191.
- `workflowParity.test.ts`: I-198.
- Also kept, caught in G-023: the `synthetic-journey` (I-185) and `catalogue` (I-188) steps, run whenever their own paths change.

## 6. Duplicate clusters

1. **Two viewers, three mount pairings.** `packages/astraeus/tests/twoViewers.test.ts`: "two viewers on one page: mount + mount" (33 cases, 3.8 s), "AstraeusScene + AstraeusScene" (33, 3.2 s) and "mount + AstraeusScene" (33, 2.9 s) assert the same isolation per setter (setTime, setRate, setPlaying, setView, …). The mixed pairing exercises both mounts at once; the other two repeat it. `lifecycle.test.ts` "lifecycle: mount" vs "lifecycle: AstraeusScene" (32 each) covers two distinct public entries and is not a duplicate.
2. **Look-ahead on made-up data and again on shipped streams.** `pointsLookAhead.test.ts` ("fill look-ahead on a large group", 11 cases, 27.4 s) proves whole-fill equality forward, backward, at a turn-round, at a scale change and after a seek; `astraeus-demo-showers/tests/pointsLookAheadShowers.test.ts` ("Geminids/Perseids fill look-ahead > draws the same positions as whole fills …", 7.0 s) asserts the same invariant on demo data. `pointsBlendCorner.test.ts` (6.4 s, Geminids near the Sun) is the same shader path on one demo corner case.
3. **Shader twin on two shipped sets plus a made-up group.** `keplerShader.test.ts`: "Geminids shipped set > matches every member across the timeline" (11.2 s) and "Perseids shipped set > …" (5.3 s) repeat what "shader twin against the group's own positions > matches a made-up group with eccentricities up to 0.99 across two years" (0.95 s) and "the 64-bit fill from the elements … on a made-up group and both shipped sets" (2.3 s) already cover.
4. **Demo-data fidelity in the fast suite.** `showersMeasured.test.ts` "DW3(iii), all orbits" for Geminids (6.0 s) and Perseids (2.3 s) check the demo dataset against published values; by the project rule a demo dataset's fidelity is not an acceptance target, and the data changes only when the showers data is rebuilt.
5. **Public surface built about six times.** `apiRules.test.ts` (four `beforeAll`s: `publicTypeBreaks`, `errorBreaks`, `currentSurface`+`addressParameters`, `currentSurface`), `apiSurface.test.ts` (`currentSurface`) and `apiReference.test.ts` (`collectExports`): 35 s of setup building overlapping TypeScript views of `src/api`.
6. **Apollo 11 rebuild on every run.** `apollo11Reconstruction.test.ts` "Apollo 11 reconstruction pipeline > matches the committed data package and report" and the other cases reading the same rebuild re-derive the committed data each run; the file's own `alreadyProven` hash already skips the second rebuild, and the same kind of hash could skip the first when tools, raw input and the committed package are unchanged.
7. **One leaf walk dominates a table test.** `sceneInputCopies.test.ts` "addBody (options): each leaf edited alone, …" (10.1 s of the file's 15.3 s) walks every leaf of the largest option object; the other 132 rows take 5 s together.
8. **Gate-level repeats** (section 2): test vs test:full, engine-alone vs root typecheck/lint/test, three packed builds and two public-site builds per Full Check.
9. Text pins next to outcome tests: O-088 already retired them (`browserAssertions`, `scenePin`, the look lock baseline, `migrationTable`, the 0.7.0 surface pin; C-207). No further text-pin cluster found among the 40 slowest files.

## 7. Proposals and the target

Full list with seconds, records and risks: `docs/evidence/test-cost/proposals.json` (ranked by seconds saved per Full Check). The recommended set:

| id | Saves per full-tier Full Check | Basis |
|---|---|---|
| P01 quick tier + look-out instead of the whole full tier | 114 s | measured step times (310 − 124 − 72) |
| P02 packed-example browser steps only when packaging or the public API changes | 40 s | measured (quick run) |
| P03 engine-alone at release and boundary changes only | 32 s | measured |
| P04 no coverage in the Full Check | 22 s | measured (55.2 − 33.5) |
| P05 Apollo rebuild skipped when unchanged, public surface built once | ~13 s | estimate: removes the 41 s critical-path file and shrinks the next (apiRules); plain-run times scaled at 0.66 |
| P06 public site built once per Check | ~7 s | estimate: most of `check:public-build`'s 7.8 s is the build the browser run repeats |
| **Total** | **~228 s of 454 (50%)** | |

This reaches half for a full-tier Check in the common case where look-out is the only full-only step the diff needs. When an Objective also touches the phone shell (synthetic-journey, +67 s) or the catalogue (+6 s), P01 saves less and the set falls to about 161 s (35%). A quick-tier Check (268 s) drops by about 114 s (42%). Going further means touching the protected list or using the process levers, which save per Objective rather than per Check:

- P07 the coordinator skips its final wave gate when the Full Check follows straight after (−48 s per Objective);
- P08 a recheck re-runs only the gates whose inputs the repair changed (−~72 s per Objective);
- P09 builders check their own doc claims against the code before audit, aimed at the commonest NEEDS WORK cause (8 of 24 findings were wording drift; each loop costs 4-12 min of wall clock);
- P10 run the Full Check's non-browser gates side by side (wall clock only; same machine time).

Smaller CPU-only cuts (P11-P15: duplicate clusters 1-4 and 7) help when the browser or other builders share the machine, but barely move wall clock because those files are not on the critical path.

## 8. Could not measure

- `savepoint health check` time (agents may run it only inside a Full Objective Check).
- Per-file times of the plain `npm test` run (the reporter printed totals only without a terminal); test:full's are used, scaled by 0.66 where needed.
- Builders' focused gate times (no code changed in this Task); the ~15 s figure is typecheck's measured 7.1 s plus an allowance.
- Agent reading time is inferred from commit and Check timestamps; builder Task commits are batched by merges, so only the Check rows above are reliable.
- The savings of P05 and P06 are estimates until those cuts land and the gates are timed again.
