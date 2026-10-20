---
id: C-092
scope: {kind: objective, id: O-033}
result: NEEDS WORK
checked_by: {role: checker, session: o033-full-recheck-20261020}
executed_session: o033-repair-builder-20261021
checked_at: '2026-10-20T14:27:00Z'
health_snapshot: sha256:0bb43c68e1dd2f1a5fe57b05949dc0f095f2327caef17bdb4360e3f3bd6ce628
reviewed:
  base_commit: 9d1707bc
  head_commit: ff1d8d80
  files: [src/app/App.tsx, src/shell/SwitchControl.tsx, src/experiences/planets/planetDefinition.ts, src/experiences/planets/surfacePlace.mjs, src/experiences/planets/surfacePlace.d.mts, src/experiences/planets/systems/mars.ts, src/experiences/planets/systems/saturn.ts, src/experiences/planets/systems/uranus.ts, src/experiences/planets/systems/neptune.ts, src/experiences/planets/systems/pluto.ts, data/planets/saturn.json, data/planets/uranus.json, data/planets/neptune.json, data/planets/pluto.json, data/moons/fit-errors/mars.json, data/moons/fit-errors/saturn.json, data/moons/fit-errors/uranus.json, data/moons/fit-errors/neptune.json, data/moons/fit-errors/pluto.json, tools/import/moon-fit-errors.mjs, tools/site/assets-sections.mjs, tools/validate/browser-outer-planets.mjs, tools/validate/run-engine.mjs, assets.html, tests/assetsSections.test.ts, tests/planetDefinition.test.ts, tests/planetFitErrors.test.ts, tests/planetSystems.test.ts, .savepoint/Design.md]
  dependencies: []
issues: [I-053]
unmet: [O-033-SC9, T-118-DW4, T-121-DW1]
supersedes: C-091
---

# C-092: O-033 Full Objective recheck

Independent session: did not build, repair or coordinate any O-033 work. Full mode, recheck of C-091 (NEEDS WORK) after the direct repair of I-048 to I-052 in `ff1d8d80` (34 files, 256 insertions, 66 deletions; code, tests and records read in full). C-091's scope lock is frozen and reused unchanged; C-091's evidence is reused for everything the repair did not touch (owner rule: a later check reuses the earlier run). This record covers the repaired scope, its integration, and every original matrix cell the repair could reach.

## Closure map of prior Issues

| Issue | Proof Needed | State after this recheck |
|---|---|---|
| I-048 outer planets without their own places | met (see matrix) | proof met; stays open only because this Check is NEEDS WORK (verified closure needs a CLEAR Check) |
| I-049 catalogue "shown in the app" | met | proof met; open for the same reason |
| I-050 "within 1 m" for every dot moon | met | proof met; open for the same reason |
| I-051 switch drops the running clock | met, including the browser scenario at both sizes | proof met; open for the same reason |
| I-052 outer-planets script fails on its first clock read | 1 met; 2 not met (the set failed later in the same script, I-053) | still open |

New: I-053 (Pluto's phone view puts Charon out of view; the planets set fails).

## Progress

- [x] Establish Scope
- [x] Freeze The Check Scope (C-091's lock reused unchanged; no new axis)
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix (unchanged by the repair; C-091's classification stands)
- [x] Workflow And Side-Effect Check Lock (unchanged except the switch press, below)
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (not used by the repair; not a finding)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Admission ledger

| Recheck item | Prior Issue / claim | Frozen cell (C-091) | Allowed result |
|---|---|---|---|
| Outer planets show own places | I-048 | SC1 "with its tagged places"; T-118 Outcome | blocking |
| Places rule for 0/0 ring and moon entries | I-048 Proof 2 | SC1; scope lock 5 | blocking |
| Catalogue shown flag and count | I-049 | T-120 DW3 / SC8 | blocking |
| Per-moon accuracy text | I-050 | SC2 / PROV-01 cited error shown | blocking |
| Switch carries the clock time | I-051 | SC1 "switching keeps the clock date" | blocking |
| Outer-planets script and the planets set at phone and desktop | I-052 | SC9 planets set at phone and desktop; T-118 DW5; T-121 DW1 | blocking |
| Pluto and Charon framed at open | (scenario in the same frozen script) | T-118 DW4 framing; SC9 planets set at phone | blocking |
| Jupiter unchanged after the builder change | regression of the repair | SC6 | blocking |
| Engine set reuse | owner rule | SC9 engine set | reuse if the repair cannot reach it |
| Design reflects the repair | integration | Objective Check Design reconciliation | observation unless architectural |

## Gates (fresh, at HEAD ff1d8d80, clean tree)

| Gate | Time (UTC) | Result |
|---|---|---|
| `npm run typecheck` | 14:15:40Z | exit 0 |
| `npm run build` | 14:15:41Z | exit 0 (chunk-size warning only, as in C-091) |
| `npm test -- --reporter=default --reporter=junit --outputFile.junit=junit.xml` | 14:15:42Z-14:16:14Z | exit 0, 87 files, 1,246 passed, 1 skipped |
| `git diff --check 9d1707bc..ff1d8d80` scoped to the repair (`bdc63c14..ff1d8d80`) | 14:25Z | clean (the one hit over `9d1707bc..` is C-091's committed evidence log, cosmetic) |

Log: `/tmp/claude-1000/-home-user-code-Astraeus/827ddc8a-e534-43b0-98b9-9af4e2acda26/scratchpad/gates.log` (scratch).

## Browser checks (one run, never in parallel, not rerun)

| Set | Command | Window (UTC) | Evidence | Result |
|---|---|---|---|---|
| planets | `npm run check:demo -- planets` | 14:16:53Z-14:23:18Z | `docs/evidence/demo-planets-20261020T141653Z/` | FAILED, total 384 s: smoke 20 s, jupiter-io 157 s, moon-panel 45 s, jupiter-tap 9 s, story-panels 15 s, planet-switch 14 s, each exit 0 with 0 error lines; outer-planets exit 1 after 121 s, 0 error lines |

outer-planets detail (`outer-planets.log`): the desktop pass (1280 x 800) completed every scenario (clock read, five-day seek and switch to Saturn keeping that time, Saturn rings at the data's radii, Saturn moon families, place presses on Titan Kraken Mare, Charon Mordor Macula and Pluto Sputnik Planitia, Pluto and Charon in view, Uranus rings and dots). The phone pass (390 x 844) completed the clock, switch, Saturn and all three place presses, then failed at line 117: `phone: charon is drawn as a sphere in view ({"id":"charon","as":"sphere","radiusPx":8.972,"x":-0.001,"y":0.702,"inView":false,...})` (I-053). The phone Uranus scenario did not run (unverified). No screenshot was taken by any script.

Engine set not rerun (owner rule; C-091 ran it: pass, 275 s, `docs/evidence/engine-20261020T135556Z/`). Verified rather than assumed: `tools/validate/run-engine.mjs` STEPS are shell, synthetic, synthetic-ring, synthetic-listed, orbit-look, controls, phone, layout, embedded, anchor-labels, tap-focus, view-link, orbit-motion (all `?experience=synthetic*`), scale-menu (harness page, no experience) and the no-browser public-build-assets and public-addresses. A `switcher` is set only in `src/main.tsx` lines 50 (planets) and 67 (showers); the synthetic definitions have none, `TopBar.tsx` line 35 renders `SwitchControl` only when a switcher exists, and the `App.tsx` change passes `undefined` through unchanged when `definition.switcher` is undefined. The repair touched no scene, camera or controls code. So no engine step can reach the changed code; reuse stands.

## Public build asset checks

`ASTRAEUS_PUBLIC_BUILD=1 npm run build` exit 0 (14:24:14Z). `node tools/validate/load-budget.mjs` exit 0, every page set ok: index 399,236 / 600,000 raw; assets 630,527 / 670,000; Apollo 4,195,579 / 4,370,000; planets jupiter 6,782,020 / 7,130,000; saturn 23,338,838 / 24,490,000 (gzip 20,246,513 / 21,260,000); uranus 4,104,677 / 4,300,000; neptune 4,399,048 / 4,610,000; pluto 3,839,432 / 4,020,000; mercury 2,930,452 / 3,080,000; venus 2,945,216 / 3,100,000; earth 4,204,060 / 4,420,000; mars 2,787,919 / 2,930,000; showers 9,759,652 / 10,090,000; geminids 12,244,125 / 12,700,000; whole build 52,073,742 / 54,610,000 (gzip 42,042,206 / 44,130,000). The repair added about 14-22 KB to each outer-planet view (own packages and fit-error files). `node tools/validate/public-build-assets.mjs dist` exit 0: ok true, 201 files checked, selfProof, budgetSelfProof and syntheticSelfProof true, no synthetic modules matched, no local-only bytes, no missing pages.

## Code Health

`savepoint health check O-033 .` after the full gate (14:24:31Z): snapshot `sha256:0bb43c68e1dd2f1a5fe57b05949dc0f095f2327caef17bdb4360e3f3bd6ce628` (created), "Code Health does not block clearance". Complexity, dependency vulnerabilities, duplication: no blocking finding. Coverage and tests instances reported stale (optional; collection state, not a finding). Run before this record and I-053 were written.

## Owner decisions carried forward

No structured owner `exception` or `owner_validation` acceptance exists on O-033 or its Tasks, so no `carried_forward` entry is written. The owner's Task-check waivers (`check_waiver` on T-114 to T-121, 2026-10-20) are unchanged in scope and still apply; they waive Task Checks only. "Minimise browser checks" applied: one planets-set run, engine set reused.

## Coverage matrix (recheck cells; C-091 cells not listed are unchanged and reused)

| Criterion / cell | Evidence | Result |
|---|---|---|
| SC1 own tagged places, outer planets (I-048) | settings now list the centre for Saturn, Uranus, Neptune, Pluto; systems load the centre's package; independent oracle (entries away from 0/0, not the rule) equals the shown set for every planet: Saturn 3/20, Uranus 9/19, Neptune 9/19, Pluto 12/16, Mars 30/32, Mercury 16, Venus 19, Earth 20; `tests/planetSystems.test.ts` own-places test; browser: Sputnik Planitia pressed at both sizes | Proven |
| I-048 Proof 2: ring and inner-moon entries | `isSurfacePlace` (`surfacePlace.mjs`) excludes `ringRadius`/`moonRadius` entries; rule recorded on the Objective as a Planning Decision; made-up-planet test covers surface, ring-gap, inner-moon and position-less entries | Proven |
| SC6 Jupiter unchanged | `data/planets/jupiter.json` unchanged (bodyFeatures the four moons); Jupiter system gives no `fitErrorsM` so its text is unchanged; view-equality test and jupiter-io, moon-panel, jupiter-tap, story-panels browser steps pass | Proven |
| SC8 / T-120 DW3 catalogue shown (I-049) | generator reads bodyFeatures and the same rule; `assets.html` regenerated: Jupiter and Ceres not shown; Mars 30 of 32; Saturn 3, Uranus 9, Neptune 9, Pluto 12 with `data-shown-count`; test fails on a wrong mark or count; credits test passes | Proven |
| SC2 / PROV-01 per-moon figure (I-050) | independent recursive scan of every `worstM` in each index: fit-error files cover every body and are never below its worst (Daphnis 26.18 m, Neptune irregulars 61.43 m); builder throws on a missing figure; test fails if a shown figure is below the index worst | Proven |
| SC1 switch keeps the clock (I-051) | `App.tsx` line 577 passes `runtime.clock.snapshot().timeUtcMs`; `switchAddress` sets `t` (whole seconds) only when `keep` has `t`; showers drop `t`; unit test; browser scenario seeks five days on, switches, reads the later time (within a day; more than four days past the opening) at desktop and phone | Proven |
| SC9 planets set at phone and desktop, zero console errors (I-052) | one run FAILED: outer-planets phone Pluto view (I-053); 0 console error lines anywhere | Issue |
| T-118 DW4 framing "Pluto 12 at 20 deg showing Pluto and Charon" | phone 390 x 844: Charon centre at x -0.001, out of view; desktop passes | Issue (I-053) |
| T-118 DW5 / T-121 DW1 written scenarios run in the set | all run except phone Uranus (after the failure) | Issue (I-052, I-053); phone Uranus unverified |
| SC9 configured gates | fresh, pass | Proven |
| SC9 engine set | reused from C-091 with the reachability check above | Proven (reused) |
| SC9 public build with asset validator; SC7 budget | pass, every page set within its limit | Proven |
| SC9 / T-121 DW5 owner's look | pending | Owner |

Workflow lock, switch press: press -> read the clock now (paused or running) -> build address (set `planet`, set or keep `t`, drop `view`) -> `location.assign`. No persistence; failure modes are a missing clock (never: the app always supplies it when a switcher exists) or a non-keeping switch (drops `t`, tested). The new page plays from its first frame until paused; the script allows a day for that.

## Adversarial notes

- The new switch scenario would fail under I-051 (without the fix Saturn opens at the address time, under four days from the opening), so it is a real oracle, unlike C-091's.
- `stated()` rounds up to 0.1 m and never below 1 m, so no shown figure is smaller than the measured one; a group record states the worst of its dots.
- The assets test and the own-places test re-implement the rule inline rather than importing it, so a wrong rule in `surfacePlace.mjs` would be caught (independent copies), at the cost of a duplicated rule (style note).
- Pluto's framing is one `startView` for every screen shape; the phone failure is the portrait aspect, not timing (the scene was paused and settled 1.2 s).

## Issues

- I-052 (open, from C-091): Proof 1 met; Proof 2 (one clean planets-set run) not met.
- I-053 (new; SC9, T-118 DW4, T-121 DW1): Pluto's phone view puts Charon out of view; the planets set fails.

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-052 | High (the set fails every run while I-053 stands) | Medium (one phone scenario unverified) | Medium | Closes with I-053's repair and one clean planets-set run |
| I-053 | High (every phone open of Pluto at the default time) | Medium (Pluto's partner moon cut off on a phone; owner's phone-first rule; the stated framing fails) | Medium | Fix now: phone-safe Pluto framing in settings, a test at the phone size, then one planets-set run |

## Convergence

This is the one full recheck after remediation. Under the check method's limit, one targeted remediation of I-053 (closing I-052) and one targeted recheck remain; after that the owner decides (fix, waive, follow-up work or close with observations). The next recheck needs the configured gates and one planets-set run only; the engine set stays reused unless scene, camera, controls or UI code changes.

## Owner validation still needed

T-121 `owner_validation.required`: the owner's look at each planet on the preview (localhost:5490), not recorded here. Owner judgement items already flagged (not findings): Saturn view about 23.3 MB raw; Iapetus marker frame; outer planets out of shower views; repository growth; S/2009 S 2 stand-in radius; Io IAU facing; Pluto and Charon licence wording; ring looks and framing; Jupiter's own places deliberately out under SC6, and the catalogue's "Not in the app yet" wording for Jupiter (now true, but it does not say the omission is deliberate).

## Observations (non-blocking)

- Design not updated by the repair: the planets row (`.savepoint/Design.md` line 43) still says the builder "skips package entries with no position" (now also ring-plane entries, by `isSurfacePlace`), does not mention `PlanetSystem.fitErrorsM` and `data/moons/fit-errors/`, and says `PLANET_SWITCH_KEEPS` keeps the clock time without saying the app now supplies the live clock; line 225 still says Iapetus's map is "flagged 180 degrees off". Recommend a short Design reconciliation with the I-053 repair (detail, not architecture; the rule itself is recorded on the Objective).
- Dates written in local time labelled as UTC: the I-048 to I-052 `repair_attempted` entries say `2026-10-21T01:20:00Z` and the Objective's Planet places rule says 2026-10-21, but the repair commit is 2026-10-20T14:15:06Z (01:15 +11:00). Append-only history, so not corrected here.
- `surfacePlace.mjs` sits under `src/experiences/planets/` and is imported by `tools/site/assets-sections.mjs` (a tool importing demo code; acceptable for one source of truth).
- C-091 observations not touched by the repair stand (README credits beyond Jupiter, Jupiter rerun proof limited to Jupiter and Io, Mimas and Iapetus facing above 6 degrees, FEATURE_PROVENANCE wording, I-032 Ceres, `scene=?` in summaries).

## Code Style Review

- [x] STYLE-01 **One job per file** — the places rule and the fit-error generator are their own files.
- [x] STYLE-02 **One job per function** — repair adds small helpers (`stated`, `dotProvenanceOf`, `shownPlaces`); `buildPlanetDefinition` remains long (C-091 note) but the repair did not grow it materially.
- [x] STYLE-03 **Test branches** — each repaired branch has a failing-case test (ring/inner-moon/no-position, wrong shown flag, low accuracy figure, kept and dropped `t`).
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries** — missing fit figure throws a `PlanetBuildError`.
- [ ] STYLE-07 **One source of truth** — the places rule is shared by builder and generator, but three tests restate it inline (`tests/assetsSections.test.ts`, `tests/planetSystems.test.ts`); the importer GM duplication from C-091 is unchanged.
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data** — per-moon figures are generated data files.
- [x] STYLE-10 **Small diffs** — 34 files, 256 insertions for five Issues.

## Result

NEEDS WORK. Four of C-091's five Issues (I-048, I-049, I-050, I-051) have their Proof Needed met; they stay open only because verified closure needs a CLEAR Check. I-052 stays open and I-053 is new: the one planets-set run failed at the phone Pluto view, where Charon opens out of view, so Success Condition 9 and T-118 Done When 4 are unmet. Gates, the public build checks, the reused engine set and the health snapshot pass. Remediation is a direct repair under I-053 (Pluto's settings framing, T-118's path); completed Tasks keep their status; T-121 stays at audit for the owner's look.
