---
id: C-163
scope: {kind: objective, id: O-065}
result: NEEDS WORK
checked_by: {role: checker, session: o065-check-20261110}
executed_session: o065-run-20261110
checked_at: '2026-11-10T04:58:00Z'
health_snapshot: sha256:0031ce376baa97678bb375e96cf80e5234c1a7ce71c52191cf3888293d5456bc
reviewed:
  base_commit: 46d71011
  head_commit: 79ba2307
  files: [packages/astraeus/src/api/planSkyFigures.ts, packages/astraeus/src/api/skyFigureInput.ts, packages/astraeus/src/api/skyTraceInput.ts, packages/astraeus/src/api/assembleScene.ts, packages/astraeus/src/api/scene.ts, packages/astraeus/src/api/viewerLink.ts, packages/astraeus/src/api/viewerHandle.ts, packages/astraeus/src/api/look.ts, packages/astraeus/src/api/lookInput.ts, packages/astraeus/src/api/index.ts, packages/astraeus/src/app/SkyFiguresView.ts, packages/astraeus/src/app/skyFigures.ts, packages/astraeus/src/app/SceneLabels.ts, packages/astraeus/src/app/sceneFrame.ts, packages/astraeus/src/app/App.tsx, packages/astraeus/src/app/labelStyle.ts, packages/astraeus/src/app/look.ts, packages/astraeus/src/app/viewerPort.ts, packages/astraeus/src/core/skyTrace.ts, packages/astraeus/src/core/lookValues.ts, packages/astraeus/src/assets/sky.ts, packages/astraeus/src/assets/stars/hyg-v42-naked-eye.json, packages/astraeus/src/shell/style.css, packages/astraeus/src/shell/phone.css, packages/astraeus/src/app/style.css, packages/astraeus/src/shell/AstraeusShell.tsx, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, packages/astraeus/api-surface.lock.json, packages/astraeus/tools/data/fetch-hyg-stars.mjs, packages/astraeus-site/src/skyTraceControl.ts, packages/astraeus-site/src/synthetic/syntheticLookOutScene.ts, packages/astraeus-site/src/main.tsx, packages/astraeus-site/tools/validate/journey-look-out.mjs, packages/astraeus-site/tools/validate/driver.mjs, packages/astraeus-site/tools/validate/load-budget.mjs, packages/astraeus-site/tests/apiTypeLint.allowlist.json, packages/astraeus/tests/fixtures/computed-look.baseline.json, .savepoint/Design.md, docs/BROWSER_CHECKS.md]
  dependencies: []
issues: [I-164, I-165, I-166]
unmet: [O-065-SC9-browser-gate, API-07]
supersedes: null
---

# C-163: O-065 Full Objective Check

**Verdict: NEEDS WORK.** The engine work is sound: every Success Condition's behaviour is proven by the fresh full gate and an independent 84-case harness, Design is reconciled, and the two owner-approved changes are recorded as their rules require. But the Objective's own release gate, `npm run check:browser` once at the Full Check, **failed** on two steps:

1. **I-164 (blocker, deterministic):** `public-build-assets` — the engine's first download is 1,745,198 B raw / 501,483 B gzip against the owner's engine limit 1,735,000 / 497,000. It passed in both O-064 runs earlier today, so O-065's engine code pushed it over. Owner decision needed: shrink, or raise the engine limit (as for the API page).
2. **I-165 (blocker, intermittent):** `look-out` failed at 375x667 in the official run (a Developer-drawer fold wait timed out after the new sky-trace checks); a focused rerun alone passed (59 s). The step also runs 59 to 90 s against its 30 s limit.

Plus **I-166 (low, combine with the repair):** published texts still offer the dropped `after: "clear"` (the `SkyFigureInput.shown` doc comment on the API page, CHANGELOG, browser map) and the CHANGELOG omits `SkyClearOptions`.

## Full Check Progress Checklist

- [x] Establish Scope
- [x] Freeze The Check Scope
- [x] Turn Acceptance Into Invariants
- [x] Build The Mandatory Coverage Matrix
- [x] Finite External-Boundary Matrix
- [x] Workflow And Side-Effect Check Lock
- [x] Matrix Completion Lock
- [x] Parallel Planning Advice (not a feature here; lanes not used)
- [x] Perform The Adversarial Pass
- [x] Re-check After Remediation (not applicable: first Check)
- [x] Verify File Reality
- [x] Verify Evidence And Gates
- [x] Collect Code Health Evidence
- [x] Complete The Issues Pass
- [x] Summarize Materiality
- [x] Review Code Style

## Scope Lock

1. **Criteria and rules.** O-065 Success Conditions SC1 Star ids, SC2 Sky figures, SC3 Reference lines and switches, SC4 Tracing on command, SC5 Colours configurable, SC6 Label size and font, SC7 Star brightness only, SC8 Sun glow never hides a figure, SC9 API lock/README/CHANGELOG, Design reconciled, `check:browser` once, owner look; preamble (made-up figures only, no real constellation name in `src/`). Decisions: when a trace runs, label font/size, Sun-only glow, **Hidden until traced**, **Removing a trace**. Guardrails API-01..07, ARCH-01/02/03/04/06, CODE-01/02, PROV-01, DATA-01, TEST-01/03, STYLE-01..10 (advisory). Release gates: `quality_gates`, `test:full`, `check:engine-alone`, `check:pack`, `check:node-consumer`, `check:browser` (once), health snapshot.
2. **Changed files / entry points.** `git diff main...o065-sky-figures` (77 files): public `scene.addSkyFigures`, `scene.skyFigures`, `handle.skyFigures`, `handle.traceSkyFigure`, `handle.clearSkyTrace`, `setSwitches`/`setSwitch` ids `skyFigures`, `skyBoundaries`, `ecliptic`, `celestialEquator`, `setLook`/`handle.setLook` `skyLines` and `labels`; Developer drawer Labels fold; codes `bad-sky-figure`, `unknown-star`, `unknown-sky-figure`, `bad-sky-trace`; star file fifth column and `starIdsOf`; the site scene `synthetic-lookout` and `skyTraceControl.ts`; `journey-look-out.mjs` and driver helpers.
3. **Relied-on orchestration.** `assembleScene` `prepare` (star list load, `unknown-star`/`missing-data` at `ready`), host call order through `controls.skyTraces` queue and frame stages 4b/4c, the draw rule (`state.wakes`), `SceneLabelLayer` collision/hysteresis, render passes (`TRACK_LAYER` after the Sun's halo), the engine's `eclipticJ2000ToEqjMatrix`.
4. **Axes.** Input shape (normal, empty, missing, wrong type, non-finite, boundary ±90/8/24/0.1/60, duplicate, mutation after the call, atomic call); state (trace start, restart, stay, fade, clear request mid-trace/after stay/during fade, at once vs eased, no trace, reduced motion, switch off/on, hidden-until-traced); representations (reads on both paths, CSS variables, computed-look baseline, `data-sky-lines`); environment (mount vs `AstraeusScene`, phone 375x667 and desktop 1280x720, reduced motion); boundaries (size and time ranges). Not applicable: text classes beyond ASCII (labels are host text drawn by the existing layer, no width or truncation logic added), serialization round trips (no new address parameter by design, API-06).
5. **Admission boundary.** Supported public API and the site's dev scene; Issues only against the criteria, Guardrails or release gates above.

## Coverage Matrix

Independent harness `probe/o065.probe.ts` in this session's scratchpad (own Vitest config, imports repo source by absolute path, nothing written to the repo): **84 cases, 84 pass**. Independent oracles: SIMBAD J2000 positions, the IAU J2000 obliquity 23.4393 deg, hand-computed timing milestones.

| Row | Cells | Expected | Actual | Class |
|---|---|---|---|---|
| SC1 star ids | real file: 8,920 rows, every row five numbers, HIP non-negative integer, 50 zeros, no repeated non-zero HIP; columns `[raDeg, decDeg, vMag, bMinusV, hip]`; provenance attribution names the added column (PROV-01) | as stated | as stated | Proven |
| SC1 oracle | HIP 91262, 27989, 24436, 69673, 11767 against SIMBAD J2000 | within 5 arcsec | all within | Proven |
| SC1 site ids | the nine Hipparcos numbers in `LOOKOUT_SKY_FIGURES` | all in the list | all in | Proven |
| SC2 shape | 38 cases: empty list, non-array, null/number figure, empty/numeric id, missing label, bad kind, figure with points, boundary with segments, 2-point boundary, empty segments, triple, star 0/-3/1.5/"32349", ra NaN/Infinity, dec 90.0001, missing dec, bad labelAt, bad `shown`, bad/empty colour, blank/`;` font, size 7.99/24.01/NaN | `bad-sky-figure` at the call | all | Proven |
| SC2 boundary/normal | dec ±90, size 8 and 24, colour `red`, `shown: "whenTraced"`, 3-point boundary | accepted | accepted | Proven |
| SC2 ids | repeat in a call; figure vs body id, either order | `duplicate-id` | both | Proven |
| SC2 atomic / copy | a bad figure after a good one adds none; input mutated after the call | reads unchanged | unchanged | Proven |
| SC2 `unknown-star` | planner with a table lacking the id | `unknown-star` (at build, `ready` rejects; Design (2) and README say so) | `unknown-star` | Proven (see Observation 1) |
| SC2 both paths | `handle.skyFigures` via `mount` and `AstraeusScene` | `tests/viewerHostDom.test.ts`, `tests/lifecycle.test.ts` READS | pass in `test:full` | Proven |
| SC3 circles | ecliptic max/min dec vs 23.4393; solstice point at RA 90; equator dec 0 | within 1e-3 deg | as expected | Proven |
| SC3 switches | defaults figures on / rest off; browser toggles each set | `tests/displaySwitches.test.ts`; browser desktop pass | pass | Proven |
| SC4 checks | 17 trace cases (0.1/0.0999/60/60.001/NaN/"2", `after: "clear"`, unknown key, null/array/number options, unknown/number/undefined id) and 6 clear cases (0, -0.001, 60, 60.01, `after`) | codes as documented, unknown id before bad options | all | Proven |
| SC4 timing | 3 s fade trace milestones; negative delta never rewinds; hide holds drawn share | oracle values | match | Proven |
| SC4 state | through `SkyFiguresView`: hidden figure has no base lines, label 0; trace shows label 1; stay settles (no wake); retrace restarts; clear 0 removes at once; clear with no trace and unknown id no-op; switch off runs unseen, on shows | as Decisions | as Decisions | Proven |
| SC4 order / wall time / reduced motion | `tests/skyTrace.test.ts` (call order, clock spy, `matchMedia` stub) | pass | pass | Proven |
| SC5/SC6 looks | colour/font checks (hex, names, comma rgb/hsla accepted; `#ggg`, `blurple`, space-form `rgb`, `url()` refused; font with `}` refused); `tests/skyLooks.test.ts`, `tests/look.test.ts` (API-06 `param: null`) | as documented | pass | Proven |
| SC6 default label look | computed-look baseline before vs after, keyed by element path | no label row changes | 0 changed label rows; the only changed rows are Developer-drawer `label.setting > input` rows renumbered by the added inputs; 592 added drawer rows | Proven |
| SC7 | no star size look added (`LookInput` diff) | none | none | Proven |
| SC8 glow | lines on `TRACK_LAYER` after the halo pass, depth write off (`tests/skyFigures.test.ts`); owner looked | pass | pass | Proven (look is owner's) |
| SC9 lock/README | `api-surface.lock.json`, README rows, generated error table | match types | tests pass | Proven |
| SC9 docs honesty | CHANGELOG, doc comments, browser map | no dropped option offered | `after ... clear` still offered | **Issue I-166** |
| SC9 browser gate | `npm run check:browser` once | pass | `public-build-assets` and `look-out` fail | **Issues I-164, I-165** |
| SC9 Design | drift notes of T-294..T-298 each reflected or marked non-architectural | yes | yes (Observation 3) | Proven |
| SC9 owner look | T-298 owner validation | recorded | recorded in prose (Observation 4) | Proven |
| Preamble | real constellation names in changed `packages/astraeus/src` and tests | none | none (grep of 30 names) | Proven |

### Finite External-Boundary Matrix

| Boundary | Cell | Classification |
|---|---|---|
| Star list fetch (`loadStarCatalogue`) | unreadable list | `missing-data` at `ready` (code path read, `assembleScene.ts` `starsOf`); not fetched when no end names a star (`needsStars`) — Proven by reading and existing tests |
| Star list | success, id not listed | `unknown-star` — Proven |
| Redirect, timeout, retry, secrets | — | Not applicable: a same-origin static asset loaded by the existing loader; no secrets |
| Browser runner | dev server start, run, cleanup | Ran; servers stopped; evidence `docs/evidence/browser-20261110T044726Z` |

### Workflow And Side-Effect Check Lock

| Order | Operation | Side effect | Failure owner / final state | Oracle |
|---|---|---|---|---|
| 1 | `addSkyFigures` | plan map (all or none) | `bad-sky-figure`/`duplicate-id`, plan unchanged | atomic probe |
| 2 | `mount` → `prepare` | star load, layers filled | `unknown-star`/`missing-data`, `ready` rejects | planner probe |
| 3 | host `traceSkyFigure`/`clearSkyTrace` | checked, pushed to `controls.skyTraces` | throw at call, queue unchanged | check probes |
| 4 | frame 4c | queue spliced in order, overlay created/removed, `wakes` | removed overlay geometry/material disposed | view probe, `skyTrace.test.ts` |
| 5 | unmount | `dispose` clears group | — | `lifecycle.test.ts` (not-mounted after unmount) |

Matrix Completion Lock: every cell above is classified; no cell left open.

## Adversarial Pass

- Bypass of shape checks through another entry: `addSkyFigures` is the only input; `SkyFigurePlan.add` checks before copying; reads come from frozen copies. None found.
- Mixed end `{ star, raDeg, decDeg }` is taken as a star end (`"star" in end`); harmless, no contradiction reported (Observation 2).
- Transitions: retrace during fade, clear during fade, clear after removal, trace of an unknown id inside the view (defensive no-op) — all defined.
- Call order: a `setSwitch` before a trace is in force when it starts; a `setLook` after a trace recolours the running trace (looks are live; consistent with "last host call winning").
- Throttled tab: trace time is the frame's real delta, so a background tab finishes sooner (recorded in T-297 drift; non-architectural).

## Verify File Reality

Every file named in T-294..T-298 evidence and drift notes exists at 79ba2307 (`git diff --stat`), except focused browser outputs, which T-298 records as scratch (session scratchpad, not `docs/evidence`). No phantom file.

## Verify Evidence And Gates (fresh, 79ba2307, idle machine)

| Gate | Result | Time / limit |
|---|---|---|
| `git diff --check main...o065-sky-figures` | pass | — |
| `npm run lint` | pass | 3.6 s / 15 |
| `npm run typecheck` | pass | 5.9 s / 20 |
| `npm run build` | pass | 2.5 s / 15 |
| `npm test` (junit) | 241 files, 3,562 passed, 2 skipped | 45.8 s / 65 |
| `npm run test:full` | 241 files, 3,562 passed, 2 skipped; statements 92.7%, lines 94.87% | 73.0 s / 105 |
| `npm run check:engine-alone` | pass (170 files, 2,460 passed) | 21.1 s / 40 |
| `npm run check:pack` | pass | — |
| `npm run check:node-consumer` | pass (10 tests) | — |
| `npm run check:browser` (once, 04:47:26Z–04:52:44Z) | **FAIL**: smoke, smoke-public-showers, planets-phone, meteor-shower, views, hello-scene, hello-react, hello-planets, public-addresses pass; **look-out exit 1** (phone), **public-build-assets exit 1** (engine budget) | total 318 s / 320; look-out 90 s / 30 (warning) |
| focused `journey-look-out.mjs` alone (diagnosis only, not a gate rerun) | pass, both sizes | 59 s |

Evidence: `docs/evidence/browser-20261110T044726Z/` (summary.txt, per-step results.json); step logs `/tmp/astraeus-check-logs-xNDeEj/`.

Owner-approved changes, verified against their rules:
- `star` on the API-04 `unitless` allowlist (`packages/astraeus-site/tests/apiTypeLint.allowlist.json`) carries `approved: { by: "owner", at: "2026-11-10", reason: ... }`, the shape `allowlistGrowth.test.ts` `approvalOk` requires; the growth test passes. Recorded correctly.
- API page gzip limit 40,000 → 44,000 in `load-budget.mjs` with an inline owner/date/reason comment; `apiReference.test.ts` passes and the browser step's page budgets pass. Recorded correctly.

## Code Health

Snapshot `sha256:0031ce376baa97678bb375e96cf80e5234c1a7ce71c52191cf3888293d5456bc` (created). Verdict: "Code Health does not block clearance." complexity, duplication, dependency vulnerabilities: no finding; coverage and tests (optional): reported stale by the collector even though `test:full` wrote fresh reports before it ran — a collection staleness statement, not a code finding. No Issue from health.

## Issues

| Issue | Rule | Smallest scenario | Expected / actual |
|---|---|---|---|
| I-164 | SC9 browser gate; TEST-01 | `npm run check:browser` → `public-build-assets` | engine first download ≤ 1,735,000 / 497,000 B; actual 1,745,198 / 501,483 B |
| I-165 | SC9 browser gate; TEST-01 | `npm run check:browser` → `look-out` at 375x667 | pass; actual timeout in `expandDeveloperGroups` (journey line 121); focused rerun passes; 59–90 s vs 30 s limit |
| I-166 | API-07, API-01 | read `SkyFigureInput.shown` doc / CHANGELOG line 27 / browser map | Stay, Fade, Hide; actual still "clear", "the three"; `SkyClearOptions` not in CHANGELOG |

## Materiality

| Issue | Likelihood | Impact | Materiality | Recommendation |
|---|---|---|---|---|
| I-164 | High (every build) | Medium: owner's size budget for every host's first download exceeded by 0.6% raw / 0.9% gzip; the release gate fails | Medium | Fix now: owner chooses shrink or a recorded new limit; add the fast-suite size check |
| I-165 | Medium (failed 1 of 2 runs seen) | Medium: the one browser gate is not reliably green; the cause is unknown | Medium | Fix now in the shared driver/journey; the re-check run must pass; restate the step's time limit |
| I-166 | Medium (anyone reading the API page or CHANGELOG) | Low: a clear `bad-sky-trace` error follows | Low | Combine with the I-164/I-165 repair (a few lines of text) |

`unmet` (front matter): `O-065-SC9-browser-gate` (I-164, I-165) and `API-07` (I-166).

## Observations (non-blocking)

1. `unknown-star` is thrown when the scene is built (`ready` rejects), not at the `addSkyFigures` call, because the star list loads asynchronously. The Success Condition does not say "at the call" for this code, API-04's at-the-call rule is about shape errors, and Design, README and CHANGELOG state it. A host can learn the list early only by awaiting `ready`.
2. An end with both `star` and `raDeg`/`decDeg` is accepted as a star end without comment.
3. Design "Sky figures" is reconciled and accounts for every drift note; two small inaccuracies: (2) says `src/api` reaches `app/skyFigures` "for the type" but `planSkyFigures.ts` also imports the function `meanDirection`; (7) says "on both paths through `viewerHostDom`" (a test file name). The "(8) drawn end not read back" sentence is in I-166.
4. T-298 has `owner_validation: {required: true}` with the owner's acceptance recorded in prose ("looks ok"; "Go once tests pass" for the Hide change), without the structured `accepted_check`/`accepted_by` shape. The owner may record it against the clearing re-check.
5. The open site trace control is allowed to overlap the open switch panel on the phone (`journey-look-out.mjs` filters `switches`); it is site-only, closed by default.
6. CODE-02 asks for the stage's node test in `tests/sceneFrame.test.ts`; `advanceSkyTraces` is tested in `tests/skyTrace.test.ts` (`placeSkyFigures` is in `sceneFrame.test.ts`).
7. The Objective file still says `status: planned` while every Task is done.

## Owner Validation Still Needed

- I-164: choose to shrink the engine's first download or record a new engine limit.
- After repair, one re-check with one `npm run check:browser` run; the owner's look (given) carries forward unless the repair changes what is drawn.

## Code Style Review

- [x] STYLE-01 **One job per file**
- [x] STYLE-02 **One job per function**
- [x] STYLE-03 **Test branches**
- [x] STYLE-04 **Types document intent**
- [x] STYLE-05 **Build only what is needed**
- [x] STYLE-06 **Handle errors at boundaries**
- [x] STYLE-07 **One source of truth**
- [x] STYLE-08 **Comments explain why**
- [x] STYLE-09 **Content lives in data**
- [ ] STYLE-10 **Small diffs** — one Objective adds ~2,700 lines across 77 files (five steps); expected for a new capability, noted only.
