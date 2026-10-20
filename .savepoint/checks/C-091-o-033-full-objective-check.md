---
id: C-091
scope: {kind: objective, id: O-033}
result: NEEDS WORK
checked_by: {role: checker, session: o033-full-check-20261020}
executed_session: o033-run-20261020
checked_at: '2026-10-20T14:06:45Z'
health_snapshot: sha256:225ed84c2f35268c5fe0206d5203ab737ad9dfd8809928290eba784f250a1f82
reviewed:
  base_commit: a6f5c71
  head_commit: 9d1707bc
  files: [src/core/bodies/moonSystem.ts, src/core/bodies/planetMoons.ts, src/core/bodies/outerPlanets.ts, src/core/bodies/outerPlanetData.ts, src/core/bodies/jupiterMoons.ts, src/core/bodies/io.ts, src/core/bodies/planetTrajectory.ts, src/core/chebyshevEphemeris.ts, src/core/iauRotation.ts, src/core/keplerAnomaly.ts, src/core/planetSeries.ts, src/assets/bodies/planetSystemMaps.ts, src/assets/catalogue.ts, src/assets/compositions.ts, src/experiences/planets/planetDefinition.ts, src/experiences/planets/planetSettings.ts, src/experiences/planets/planetChoice.ts, src/experiences/planets/planetSystemParts.ts, src/experiences/planets/systems/saturn.ts, src/experiences/showers/showerBasics.ts, src/experiences/showers/showerChoice.ts, src/shell/SwitchControl.tsx, src/main.tsx, data/planets/saturn.json, data/planets/pluto.json, data/planets/uranus.json, data/planets/neptune.json, tools/import/horizons-moons.mjs, tools/site/assets-sections.mjs, tools/validate/load-budget.mjs, tools/validate/run-demo.mjs, tools/validate/browser-outer-planets.mjs, tools/validate/browser-planet-switch.mjs, index.html, assets.html, README.md, .savepoint/Design.md]
  dependencies: []
issues: [I-048, I-049, I-050, I-051, I-052]
unmet: [O-033-SC1, O-033-SC2, O-033-SC9, T-118-Outcome, T-118-DW5, T-120-DW3, T-121-DW1]
supersedes: null
---

# C-091: O-033 Full Objective Check

Independent session (did not build or coordinate any O-033 Task; an earlier checker attempt ran nothing). Full mode. Scope: O-033 Objective (Outcome, Owner Decisions 2026-10-20, Success Conditions 1-9, Boundaries) and T-114 to T-120 (done, Task Checks waived by owner, each with `check_waiver`) and T-121 (stage audit, `owner_validation.required`, owner look pending). Diff `a6f5c71..9d1707bc`: 7,113 files, about 7,000 of them fit data; code and records read in full, data sampled.

## Progress

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (lanes used; advice only, not a finding)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: first Check)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope lock

1. O-033 SC1-9 and the Outcome; T-114 DW1-4, T-115 DW1-3, T-116 DW1-5, T-117 DW1-5, T-118 Outcome and DW1-5, T-119 DW1-4, T-120 DW1-3, T-121 DW1-4 (DW5 is the owner's); Guardrails ARCH-01..05, PROV-01, PROV-02, DATA-01, TEST-01, TEST-03, TEST-04; project rules on browser checks (one run per set, no screenshots, driver only).
2. Entry points: `app.html?experience=planets&planet=<id>` and `?experience=jupiter-io`; the top-bar switch; `parsePlanetSettings`, `buildPlanetDefinition`, `choosePlanet`, `switchAddress`; `createMoonSystem` and the five system configurations; catalogue bodies Saturn to Pluto and 11 moons; `planets.json`; `tools/import/horizons-moons.mjs --system`; `index.html` shelf, `assets.html` generated sections; `tools/validate/load-budget.mjs`, `public-build-assets.mjs`, `run-demo.mjs planets`.
3. Relied on: JPL Horizons (as the independent oracle, live), Vite dev server and public build, playwright-core runner.
4. Not applicable: text classes and Unicode (no text-width behaviour in scope), auth/billing/secrets, Windows portability.
5. Materiality: an Issue must break a named SC/DW/guardrail through a shipped, supported path.

## Owner decisions applied (facts, not findings)

Task Checks waived for T-114 to T-121 ("waive checks for tasks one big check at end"); T-114 to T-120 marked done by the coordinator under the owner's instruction; "minimise browser checks": engine set and planets set run once each here, not rerun; textures kept at original quality (owner decision 2026-10-17), so Saturn's view is 23.3 MB raw; the planets set's two new scripts had never been run.

## Gates (fresh)

| Gate | Time (UTC) | Result |
|---|---|---|
| `npm run typecheck` | 13:54:44Z | exit 0 |
| `npm run build` | 13:54:45Z | exit 0 (chunk-size warning only; `saturn-*.js` 2,016 kB raw / 1,344 kB gzip because the build inlines small fit chunks; `jupiter-*.js` 1,114 kB is the same pattern) |
| `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml` | 13:54:45Z-13:55:18Z | exit 0, 86 files, 1,234 passed, 1 skipped |
| `git diff --check a6f5c71..HEAD` | | 71 trailing-whitespace lines, all in `tests/fixtures/outer-planets-horizons-source.txt` (verbatim archived Horizons text; cosmetic) |

Logs: `/tmp/claude-1000/-home-user-code-Astraeus/827ddc8a-e534-43b0-98b9-9af4e2acda26/scratchpad/{typecheck,build,test}.log` (scratch).

## Browser checks (one run each, never in parallel, not rerun)

| Set | Command | Window (UTC) | Evidence | Result |
|---|---|---|---|---|
| engine | `npm run check:engine` | 13:55:56Z-14:00:31Z | `docs/evidence/engine-20261020T135556Z/` | 16 steps exit 0, 0 error lines, total 275 s |
| planets | `npm run check:demo -- planets` | 14:00:51Z-14:05:11Z | `docs/evidence/demo-planets-20261020T140051Z/` | FAILED: smoke 19 s, jupiter-io 148 s, moon-panel 49 s, jupiter-tap 10 s, story-panels 17 s, planet-switch 14 s exit 0 with 0 error lines; outer-planets exit 1 after 3 s (I-052); total 260 s |

No screenshot was taken by any script (driver readouts only).

## Public build asset checks

`ASTRAEUS_PUBLIC_BUILD=1 npm run build` exit 0 (14:05:38Z); `node tools/validate/load-budget.mjs` exit 0, every page set ok: index 399,236 / 600,000 raw; assets 629,684 / 670,000; Apollo 4,195,338 / 4,370,000; planets jupiter 6,781,196 / 7,130,000; saturn 23,317,280 / 24,490,000 (gzip 20,240,166 / 21,260,000); uranus 4,090,623 / 4,300,000; neptune 4,383,685 / 4,610,000; pluto 3,822,413 / 4,020,000; mercury 2,929,628 / 3,080,000; venus 2,944,392 / 3,100,000; earth 4,203,236 / 4,420,000; mars 2,787,041 / 2,930,000; showers 9,759,411 / 10,090,000; geminids 12,243,884 / 12,700,000; whole build 52,007,323 / 54,610,000 (gzip 42,021,287 / 44,130,000). `node tools/validate/public-build-assets.mjs dist` exit 0: ok true, 201 files checked, selfProof, budgetSelfProof and syntheticSelfProof true, no synthetic modules in the build, no local-only bytes.

## Code Health

`savepoint health check O-033 .` after the full gate: snapshot `sha256:225ed84c2f35268c5fe0206d5203ab737ad9dfd8809928290eba784f250a1f82` (created), "Code Health does not block clearance". Complexity, dependency vulnerabilities, duplication: no blocking finding. Coverage and tests instances reported stale (optional; collection state, not a finding). To let the tool load the index, the five new Issue files were held outside `.savepoint/issues/` for the duration of that one command and put back unchanged (they name this Check, which did not exist yet).

## Independent probes

A temporary vitest file (`tests/zzCheckerProbeO033.test.ts`, copied to the scratchpad and deleted from the tree before the health check) against live JPL Horizons vectors fetched 2026-10-20 (geometric, ICRF, UT, JD 2457703.0 = 2016-11-10T12:00Z, saved in the scratchpad `hz/`):

| Body | Shipped value vs Horizons | Result |
|---|---|---|
| Titan (606 about 699) | 0.189 m | within index figure 0.55 m |
| Rhea (605) | 0.024 m | ok |
| Iapetus (608) | 0.017 m | ok |
| Triton (801 about 899) | 0.064 m | ok |
| Charon (901 about 999) | 0.088 m | ok |
| Phobos (401 about 499) | 0.021 m | ok |
| Pluto heliocentric (barycentre fit + offset) vs 999 about Sun | 0.116 km | ok |
| Saturn heliocentric (VSOP87A fit) vs 699 | 2,311.7 km | matches the stated VSOP87A model error (2,256 km at six dates) |

Facing (angle between body +X prime meridian and direction to the planet, 2016-02-11 + 0.3..290 d, step 2.71 d), every IAU-locked new moon, not one per system: Mimas 6.69, Enceladus 4.83, Tethys 0.95, Dione 1.00, Rhea 2.88, Titan 5.36, Iapetus 6.38, Triton 2.77, Charon 1.49 degrees; Deimos (orbit-derived) 0.00. All keep the near side; Mimas and Iapetus exceed the 6-degree figure the suite states for Titan (observation).

Settings and switch: nine planet files, exactly one default (Jupiter), unique orders, one shared window; every planet builds with unique object ids; unknown, empty, null and case-variant `planet=` fall back to Jupiter; empty entries return undefined; strict settings refuse an unknown key, a follow that is not mapped, bodyFeatures naming a non-mapped body, a lone `featuredFamilyId`, an empty window, a zero rate, a non-story panels path, a duplicated mapped moon. Centre places shown per view: earth 20, mars 30, mercury 16, venus 19; jupiter, saturn, uranus, neptune, pluto 0 (I-048).

## Coverage matrix

| Criterion | Evidence | Result |
|---|---|---|
| SC1 each planet centred on itself | `startView.focus` = centre in all nine files; `composition.defaultCenter` asserted for outer planets | Proven |
| SC1 with its tagged places | Outer four planets show none of their own package places; Pluto's 12 positioned places absent (I-048) | Issue |
| SC1 switching keeps the clock date | switch carries only the address `t` (I-051) | Issue |
| SC1 no names in generic code (ARCH-01) | grep of planetDefinition/Settings/Choice/SystemParts, SwitchControl, moonSystem, iauRotation, keplerAnomaly, chebyshevEphemeris: names only in comments | Proven |
| SC1 builder proven on made-up planet (ARCH-03) | `tests/planetDefinition.test.ts` made-up planet from settings alone; not a dev page (T-117 drift, accepted as non-architectural in Design) | Proven |
| SC2 every listed moon fitted with measured error | indexes: mars 2, saturn 292, uranus 28, neptune 16, pluto 5 moons, each with `accuracy`; live Horizons probe above | Proven |
| SC2 fit pipeline reruns Jupiter unchanged | `jupiter-moons/` untouched since a6f5c71 (empty diff; sha256 list re-verified, 2,321 files); rerun proven for Jupiter and Io only, cache absent, other 113 policies unchanged | Proven with limitation (observation) |
| SC2 / PROV-01 cited error shown | dot-moon record says "within 1 m" for all systems; 18 moons measured 6-61 m (I-050) | Issue |
| SC3 mapped moons as globes with places, licences, budget | 13 textures, licences in `planetSystemMaps.ts`, `tests/textureLicence.test.ts`; load budget ok | Proven |
| SC3 synchronous moons keep the right face, by test | suite tests one moon per system; probe covers all nine (above) | Proven |
| SC4 outer planets catalogued once; Io one source | definitions only in `outerPlanets.ts`/`planetMoons.ts` (grep); `IO_MEAN_ELEMENTS` read from `data/orbits/io.json`; `trueAnomalyFromMean` in `keplerAnomaly.ts` | Proven |
| SC5 moon families per planet with sources | `data/moons/*.json` families and sources; moons panel built from them; browser moon-panel step (Jupiter) passed; outer-planet panel scenario unrun (I-052) | Proven by unit test; browser unverified |
| SC6 Jupiter unchanged | `tests/planetDefinition.test.ts` against `jupiter-view-before.json`; jupiter-io, moon-panel, jupiter-tap, story-panels steps passed | Proven |
| SC7 only the chosen planet's data; stated limit per planet | `tests/planetSystems.test.ts`, `tests/planetSwitchInner.test.ts`; load budget nine page sets ok | Proven |
| SC8 shelf and catalogue | index.html one row of Sun + nine planets with "+N moons" links, anchors exist, counts tested; assets.html rows; "shown in the app" wrong for five bodies (I-049) | Issue (T-120 DW3) |
| SC9 configured gates | fresh, pass | Proven |
| SC9 engine set | pass, 275 s | Proven |
| SC9 planets set at phone and desktop, zero console errors | outer-planets step failed; its scenarios unrun (I-052) | Issue |
| SC9 public build with asset validator | pass | Proven |
| SC9 owner's look | pending (T-121 DW5) | Owner |
| T-114 DW1-4 | system table, data, planets.json eight planets, README | Proven |
| T-115 DW1-3 | lists parse, ids equal fit indexes, families cited, estimates marked | Proven |
| T-116 DW1-5 | generic loader, definitions, wrapper, Io, maps (Dione resized beyond list, recorded) | Proven |
| T-117 DW1-5 | builder, switch, alias, made-up planet (unit test), Jupiter unchanged | Proven (clock part: I-051) |
| T-118 Outcome / DW1-5 | settings-only, rings, chunks, framing proven; Pluto's own places absent (I-048); written browser scenarios fail (I-052) | Issue |
| T-119 DW1-4 | four settings files, Apollo untouched, per-view downloads tested, browser planet-switch passed | Proven |
| T-120 DW1-3 | shelf, card, credits; shown flag wrong (I-049) | Issue |
| T-121 DW1-4 | set assembled but its outer-planets step fails (I-052); budget, Design, README, gates proven | Issue (DW1) |
| PROV-02 | every new texture has a source and licence; public build validator ok | Proven |
| ARCH-04 | no `src/core` import from assets/app/shell/experiences (grep) | Proven |
| ARCH-05 | as SC4 | Proven |
| DATA-01 | no destructive change; Jupiter data untouched; planets.json first four byte-identical (T-114/T-116 claim, consistent with fit tests) | Proven |
| TEST-04 | `check_waiver` on all eight Tasks with task, reason, actor, time | Proven |

External boundary (moon loader, runner): configured vs actual chunk URLs (shipped glob set equals fetched set, tested); HTTP non-ok throws with the URL; a chunk the build does not ship is refused before fetching (`chunksNeeded`, tested); a failed load leaves `loading` as the rejected promise, so a second `load` cannot retry in the same page (observation, same as Jupiter before); Pluto's offset callback returns null outside the loaded chunks, so Pluto falls back to the barycentre (stated in its record). Runner: ports 5479/5480 strict, servers stopped, evidence dir fresh. Redirect, secrets: not applicable.

Workflow lock (planet page): parse settings -> import system and panels -> build definition -> `prepare` awaits `system.load(window)` (index, window chunks, history chunks) -> render. Failure before render fails the boot loader (`failBootLoader`); no partial persistence. Proven by reading and by the per-view `prepare` tests.

## Adversarial notes

- Bypass: `?experience=jupiter-io&planet=saturn` opens Saturn (same builder); harmless.
- The outer-planets clock scenario compares with the address time, so even passing it could not detect I-051.
- `tests/planetSystems.test.ts` checks that bodyFeatures equal the settings file, so missing centre places pass (I-048).
- `tests/assetsSections.test.ts` only checks the page equals the generator, so a wrong "shown" rule passes (I-049).

## Issues

- I-048 (SC1, T-118 Outcome): Saturn, Uranus, Neptune and Pluto open without their own tagged places.
- I-049 (T-120 DW3, PROV-01): assets.html says Jupiter, Saturn, Uranus, Neptune and Pluto places are shown in the app; Mars 32 vs 30.
- I-050 (PROV-01, SC2): every dot moon says "within 1 m"; 18 moons measured 6-61 m.
- I-051 (SC1, T-117/T-118 carried item): the switch keeps only the address's `t`, not the clock time.
- I-052 (SC9, T-118 DW5, T-121 DW1): `browser-outer-planets.mjs` fails on its first exact clock read; all its scenarios unrun.

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-048 | High (every outer-planet view) | Medium (a stated outcome missing; Pluto's main surface features unseen) | Medium | Fix now: Pluto's centre in bodyFeatures; decide and record the gas giants' 0/0 entries |
| I-049 | High (static page) | Low (a wrong label on the catalogue) | Low | Combine with I-048: take "shown" from bodyFeatures |
| I-050 | Medium (seen when a viewer opens one of 18 moons' information) | Low (metres at planet scale; Horizons-internal for most) | Low | Combine: per-moon figure from the index |
| I-051 | High (any switch after the clock moved) | Medium (a stated success condition; user lands on another date) | Medium | Fix now: carry the runtime clock time |
| I-052 | High (fails every run) | Medium (six outer-planet scenarios unverified) | Medium | Fix the script with I-051, then one planets-set run |

## Owner validation still needed

T-121 `owner_validation.required`: the owner's look at each planet on the preview (localhost:5490). Not recorded here. Items for that look and the owner's judgement (already flagged, not findings): Saturn view about 23.3 MB raw (seven 4k moon maps; owner decision 2026-10-17); Iapetus marker frame (yaw 0 by reasoning in T-118; Design still says "flagged 180 degrees off"); outer planets left out of shower views (`BEYOND_SHOWER_VIEWS`); repository growth about 110 MB of new fit data on disk (saturn 52 MB, uranus 33, neptune 18, mars 5.4, pluto 2.0) plus about 20 MB of textures; S/2009 S 2 stand-in radius 0.15 km marked estimate; Io now IAU-faced (0.8 degrees measured, 1 degree tolerance); Pluto and Charon licence wording from Astraeus's own records; ring looks and framing.

## Observations (non-blocking)

- Jupiter rerun proof covers Jupiter and Io only (cache absent); the importer's half-hour snap and calibration alignment could change Jupiter policies only under `--recalibrate`.
- Facing tests cover one moon per system; Mimas 6.69 and Iapetus 6.38 degrees exceed the largest stated tolerance (6) though within the IAU model's libration class.
- README's asset and credit tables still list maps only up to Jupiter and Io (Saturn to Pluto, Saturn's moons, Triton, Charon and the Galilean moons are credited on assets.html and in-app, not in README).
- T-116 evidence and Design date the work 2026-10-21 though `date -u` and the coordinator's marks are 2026-10-20 (local-clock dates).
- `FEATURE_PROVENANCE` says places were "checked against the map picture" and cites USGS/NASA mosaics for every body, including Earth and the inner planets (Solar System Scope / Blue Marble maps).
- I-032 (donor pictures beyond Jupiter) is now largely addressed by O-033 except Ceres; left open for its own proof (Ceres).
- Demo summaries print `scene=?` for Jupiter steps.

## Code Style Review

- [x] STYLE-01 **One job per file** — loader, systems, settings, builder, choice split.
- [ ] STYLE-02 **One job per function** — `buildPlanetDefinition` is about 120 lines doing validation, objects, panel, features and config (`src/experiences/planets/planetDefinition.ts` 124-244).
- [ ] STYLE-03 **Test branches** — the "shown in app" rule and centre places per planet have no failing-case test (I-048, I-049).
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries** — strict settings, chunk refusal, HTTP errors.
- [ ] STYLE-07 **One source of truth** — importer `SYSTEMS` GMs (e.g. Saturn 37931207.8) differ from the body definitions (37931206.234); a generic "within 1 m" sentence duplicates per-moon figures wrongly (I-050).
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data** — one settings file per planet.
- [ ] STYLE-10 **Small diffs** — 7,113 files, about 44,600 lines (mostly data).

## Result

NEEDS WORK. Five Issues (three medium, two low): I-048, I-051 and I-052 block SC1 and SC9; I-049 and I-050 are low and can ride with them. Every other criterion is proven, including fresh gates, the engine set, the public build checks and independent Horizons agreement. Remediation is a direct repair under the recorded Issues (the T-118/T-120 owners' code paths); completed Tasks keep their status; T-121 stays at audit for the owner's look. After repair, one run of the planets set (not the engine set unless scene, camera, controls or UI code changes) and a re-check.
