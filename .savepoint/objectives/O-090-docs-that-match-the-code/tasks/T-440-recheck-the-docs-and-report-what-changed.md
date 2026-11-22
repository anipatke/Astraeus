---
id: T-440
objective: O-090
title: Recheck the docs and report what changed
status: done
depends_on: [{task: T-439, requires: clear}]
owner_validation: {required: false}
check_waiver: {task: T-440, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on orchestrating G-024" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-22T05:30:31Z'}
planned_by: {role: planner, session: orchestrate-g024-20261122}
lane: docs
planned_reads: [docs/README.md, README.md, packages/astraeus/README.md, packages/astraeus/CHANGELOG.md, .savepoint/Design.md]
planned_writes: [packages/astraeus/CHANGELOG.md, docs/README.md, README.md, docs/BROWSER_CHECKS.md, docs/ASTRONOMY_VALIDATION.md]
---

# Recheck the docs and report what changed

## Outcome

Owner plan step 5. The original contradictions (workspace count, planetary provider, browser workflow and timing, release status, API intro, package guidance) are rechecked against code, config, generated output and dated evidence; the site's API reference is built and its lead inspected; the packed engine README is inspected; touched examples and links pass the gates in force. An independent fresh read-through (a separate session given only the repo) answers "How do I run the right checks?", "How do I build and extend my first scene?" and "Where is the current contract for this subsystem?", recording the path taken and any ambiguity; ambiguities are fixed or recorded with a reason. Before/after word counts for every edited guide, the duplicated claims retired and the deliberate duplication kept (with its reader) are reported here, with no percentage target. The changelog's top section gets one docs line.

## User Check

The owner reads the word-count and duplication report in this Task's evidence.

## Done When

| Item | Evidence |
|---|---|
| Each original contradiction rechecked and now true, with its source | table |
| The site build that renders the API page runs; the lead shows the manifest version and no "preview" | command + grep of output |
| `npm pack --dry-run -w astraeus` and README links checked | command |
| Fresh read-through: three questions, path, ambiguities, fixes | evidence (coordinator spawns the reader; its answers quoted) |
| Word-count table (before from `git show main:<file>`, after), retired duplicates, kept duplicates + reader | table |
| Changelog line added in the top section only | diff |

## Context Files

All O-090 sibling Tasks' Technical Evidence; `docs/README.md`; `packages/astraeus/CHANGELOG.md` top section only.

## Design References

None beyond the sibling Tasks.

## Guardrails

PROV-01, PROV-02 (provenance labels kept); TEST-01..04; ARCH-06 (mechanise a trap where cheap).

## Implementation Plan

1. Recheck table.
2. Build and pack inspection; link check over all edited files.
3. The coordinator runs the fresh read-through and passes its answers; fix small ambiguities in place (log files) or record them.
4. Word-count and duplication report; changelog line.

## Boundaries

Fixes are limited to small ambiguities in files earlier O-090 Tasks edited; anything larger becomes an Issue via the coordinator.

## Technical Verification

prettier on changed files; the build and pack commands above.

## Technical Evidence

Builder session orchestrate-g024 T-440, 2026-11-22. Router unchanged (coordinator rule). No browser run. Stage moved build -> audit (step checks waived).

### Reads

Context Files: Technical Evidence, Drift Notes and Coordinator sections of T-434..T-439; O-090 Objective Decisions (owner's NOTICE decision, commit 64eb7f9e); `docs/README.md` (via link check); `packages/astraeus/CHANGELOG.md` top section (`## 0.10.0 (proposed)`) only. Extra reads (logged; each to fix a read-through ambiguity or recheck a source): `README.md` lines 105-135 (`Develop`, `Running the checks`); `docs/agents/browser-policy.md` lines 1-40 (tier rules, to word the README pointer); `tools/gate-limits.json`; `browser-steps.mjs` `selectSteps`/`addedStepsLimit` (lines 100-130) and step names; `run-browser.mjs` grep `total|skipExamples|tier` (how totals apply); `docs/BROWSER_CHECKS.md` grep `limit|total`; `docs/ASTRONOMY_VALIDATION.md` lines 1-30, 100-136, headings, grep `VSOP`; `planets.json` `worstErrorKm` per planet (node); `packages/astraeus/README.md` lines 384-395 (planet accuracy table); `planet-accuracy-o063.md` grep `pluto|1.5|worst`; `packages/astraeus/tests/planetMoonSystems.test.ts` 224-252 (Pluto centre tolerance); `outerPlanetFits.test.ts` grep; `planetModels.ts` 50-60; `tools/build-packages.mjs` grep README; `packages/*/package.json` `private`; `git grep` for inbound references to the renamed ASTRONOMY_VALIDATION heading (none).

### Fresh read-through (coordinator, 2026-11-22)

Run by the coordinator: a separate Sonnet session with no knowledge of O-090, reading only user-facing docs. Its answers, as passed:

| Question | Path taken | Answer | Ambiguities found | Fix (this Task) |
|---|---|---|---|---|
| Q1 "How do I run the right checks?" | README `Running the checks` -> BROWSER_CHECKS `Running it` / `Measured time` -> browser-policy (tier) -> build.md (hand-off gates); 3 hops | Reached correctly: gates lint/typecheck/build/test; a Check runs `--tier quick --skip-examples`, plus `--step look-out` for camera/layout/shader/sky/packaging; release runs full; results in `docs/evidence/browser-<stamp>/summary.txt`; dated 2026-11-22 full 310 s, quick 124 s against limits 450/200 | (a) README quick-tier line says it includes "the packed examples" but not that a Check passes `--skip-examples`; README does not link browser-policy. (b) `tools/gate-limits.json` tier totals are not sums of step limits (13 steps sum 485 vs 450; quick 185 + look-out 100 = 285 vs `quickLookOutTotal` 280) and no doc says totals are separate caps | (a) README `Running the checks`: one sentence names the usual Check command with `--skip-examples`, when the examples run, that a Task runs no browser check unless it changes a browser script, and links the [browser policy]. (b) BROWSER_CHECKS `Where things live`, **Time limits** bullet (the one place limits are described): each total is its own cap on the whole run, not the sum of step limits, may be smaller or larger than it; added steps other than `look-out` add their limits to `quickLookOutTotal` (`addedStepsLimit`); `--skip-examples` leaves totals unchanged (`run-browser.mjs:45`). Worded without copying any number, so it cannot drift; no limit value changed |
| Q2 "How do I build and extend my first scene?" | engine README `Install` -> `A scene in about 20 lines` -> "Sky, camera, looks and views" -> "Views of one scene"; 0-1 hops | No false statement; peers match `package.json` | No inline custom-look example (only the `setLook` row plus API page link) | Recorded only: acceptable, the API page holds `InterfaceLook`/`LookInput` docs (T-437 moved them there) |
| Q3 "Where is the current contract?" | Viewer handle/lifecycle: Design "One handle, one lifecycle" -> "Detail as built, 2026-11-22"; 2 hops, clear. Planet positions: Design "Planet positions from Horizons" -> `planet-accuracy-o063.md`; alternate via docs/README -> ASTRONOMY_VALIDATION | Reached | (c) ASTRONOMY_VALIDATION line 3 opened "Research performed 2026-10-06 ... not yet a claim about the Astraeus implementation" before the current table. (d) Present-tense VSOP87A in the superseded section (lines ~112, ~125) under an undated heading "Planets: Mercury, Venus, Mars and Jupiter". (e) Line ~14 "within 1 km of Horizons" vs engine README "Pluto within 1.5 km" | (c) Line 3 now says the first section is the present and every later one a dated record; the research sentence moved verbatim under `## Provider comparison`, prefixed "Dated record.". (d) Heading dated: "(O-014 / T-048, 2026-10-12; position superseded by O-063, 2026-11-10)"; history wording unchanged (no inbound reference to the heading: `git grep`). (e) Source checked: `planets.json` `worstErrorKm` is the barycentre-fit error, all eight under 1 km (max Uranus 0.837, Pluto 0.786); the engine README's 1.5 km is Pluto's end-to-end centre accuracy with its moon package, asserted `< 1.5` in `planetMoonSystems.test.ts:241`. Both were true but measured different things. The table row now says each series is within 1 km of Horizons' system barycentre (importer target, `worstErrorKm`) and points to the engine README accuracy table for the planet-centre figures (looser for Pluto). The superseded banner's "under 1 km from 1972 when a planet's moon package is loaded" was false for Pluto: now "for Mercury to Neptune ... (Pluto within 1.5 km, 2010 to 2029)" |

Stale-term sweep (coordinator's reader, and rerun here over the 13 edited guides plus `index.html`, `assets.html`): no VSOP87-as-current (remaining hits are "no longer VSOP87A", dated history and the superseded section), no "0.2 preview", no workspace count, no undated elapsed time outside tables (the `gateLimits.test.ts` regex, applied by grep to every edited guide, not only its five files).

Also fixed while link-checking (small, same file): ASTRONOMY_VALIDATION had 12 broken fixture links `../tests/fixtures/...` (already broken on `main`; fixtures moved into packages): 7 now point to `../packages/astraeus/tests/fixtures/`, 5 (Swift-Tuttle, Phaethon, Showers year) to `../packages/astraeus-demo-showers/tests/fixtures/`. Link text and prose unchanged.

### Recheck of the original contradictions (2026-11-22)

| Contradiction (AH-38 / T-434) | Now says | Checked against |
|---|---|---|
| Workspace count "five" (C1, C24) | README: no count; names engine, `astraeus-data` + `astraeus-data-*` (published), demos + site (private); codebase-details carries a dated amendment | root `package.json` `workspaces: ["packages/*"]`; 13 dirs with `package.json` (9 public, 4 private by `private`) |
| Planet provider VSOP87A (C2-C6c) | README, site copy, Design, ASTRONOMY_VALIDATION table, ephemerides README, state-and-assets/codebase-details amendments: Horizons system-barycentre fits; orb.js for Earth/Sun/Moon. NOTICE credits Horizons only (owner, commit 64eb7f9e) | `planetModels.ts:57-59` doc; `planets.json` `worstErrorKm` (all < 1 km); `astronomyAdapter.ts`; grep: no current-tense VSOP87 |
| Browser workflow "the one quick browser check" / two journeys (C7-C10, C12d) | README: quick and full commands, the Check command and a policy link; BROWSER_CHECKS command table + step table; policy owns selection | `run-browser.mjs:48` default `tier ?? "full"`; `browser-steps.mjs` STEPS (13); `browser-policy.md` tiers |
| Timing "under a minute", 230 s, about 125/196/320 s (C11, C12, C12a-b, C19) | One dated measurement in BROWSER_CHECKS `Measured time` (2026-11-22: full 310 s, quick 124 s) and the dated test-cost report; limits only in tables copied from `gate-limits.json` | `tools/gate-limits.json`; `gateLimits.test.ts` (tables match; undated elapsed times rejected in 5 files): 111 tests green with the release tests below |
| Release status / roadmap "package the engine", "put the demos live" (C13, C14) | Roadmap removed; changelog linked | `packages/astraeus/package.json` 0.9.5; `PACKAGES` 9 in `tools/build-packages.mjs` |
| API intro "0.2 preview" (C15) | "This is version 0.9.5; before 1.0 ..." from the manifest | built page (below); `apiReference.test.ts` case (T-437) |
| Package guidance: eight packages, 10.5 MB, limits in the doc, dead repo links (C16-C21, C26-C28) | RELEASING: nine, setup dated history; NPM_PACKAGING dated with limits linked to `LIMITS`; engine README links absolute | `PACKAGES` (9); `LIMITS` in `tools/check-packs.mjs:19-` (`astraeus` 8 MB / 9.5 MB); packed README check below |

### Build, pack and links

- `npm run build` (vite build of `packages/astraeus-site`, whose `astraeus-api-reference` plugin calls `buildApiPages()`): exit 0; `dist/api/index.html` and `shelf.html` written 17:21:11 local. `grep -o 'This is version [^;<]*' dist/api/index.html` -> "This is version 0.9.5"; manifest `node -p require("./packages/astraeus/package.json").version` -> 0.9.5; `grep -ci preview` -> 0 in both pages; `grep -c '0\.2'` -> 0.
- `npm pack --dry-run -w astraeus` -> fails, `npm error code ERR_OUT_OF_RANGE data is too long` (as T-437 found: the source workspace is not the published pack). Used the built dist as T-437 did: `node tools/build-packages.mjs astraeus` ("built astraeus: 11 pictures rewritten"), then `npm pack --dry-run` in `packages/astraeus/dist`: astraeus 0.9.5, 675 files, 7.2 MB, README.md 39.3 kB, CHANGELOG.md, NOTICE. `cmp dist/README.md README.md` identical. Packed README: 39 links, all absolute except 2 `./CHANGELOG.md` (packed); its 27 distinct API anchors all exist as `id=` in the built API page (missing: none). `grep -ci vsop` NOTICE and README: 0. Finding: `data/ephemerides/README.md` is not in the pack (`build-packages.mjs` copies only README, CHANGELOG, NOTICE at the root and the data files), contrary to T-434's "packed in npm" note; it is a repository file. No change needed (it is now true either way).
- Link and anchor check (scratch script, GitHub slug rule, relative paths and `#anchors` into Markdown) over all 16 O-090-edited Markdown files plus `docs/agents/verification.md`: 167 relative links, bad 0 after the fixture-link repair (12 bad before, all pre-existing on `main`).

### Word counts (`wc -w`; before `git show main:<file>`, after the working tree)

| File | Before | After | Change |
|---|---:|---:|---:|
| `README.md` | 2,359 | 1,537 | -822 |
| `packages/astraeus/README.md` | 18,907 | 5,898 | -13,009 |
| `docs/README.md` (new) | 0 | 532 | +532 |
| `docs/BROWSER_CHECKS.md` | 5,958 | 3,278 | -2,680 |
| `docs/agents/browser-policy.md` | 859 | 878 | +19 |
| `docs/agents/build.md` | 1,526 | 1,364 | -162 |
| `docs/agents/verification.md` | 507 | 507 | 0 |
| `.savepoint/Design.md` | 17,233 | 4,131 | -13,102 |
| `docs/architecture/codebase-details.md` | 3,692 | 3,738 | +46 |
| `docs/architecture/state-and-assets.md` | 3,217 | 3,253 | +36 |
| `docs/NPM_PACKAGING.md` | 2,276 | 2,412 | +136 |
| `docs/RELEASING.md` | 1,381 | 1,496 | +115 |
| `docs/ASTRONOMY_VALIDATION.md` | 8,409 | 8,765 | +356 |
| `docs/MOON_ORBITS.md` | 1,980 | 2,073 | +93 |
| `packages/astraeus/data/ephemerides/README.md` | 1,034 | 1,150 | +116 |
| **Current guides total** | **69,338** | **41,012** | **-28,326** |
| `docs/architecture/reconciliation-history.md` (history, receives moved Design text verbatim) | 10,950 | 26,874 | +15,924 |
| All edited Markdown | 80,288 | 67,886 | -12,402 |

No percentage target (Objective). The two big front doors (engine README, Design) carry most of the cut; science and packaging guides grew a little with date labels and present-state pointers.

### Duplicated claims retired

| Claim | Was repeated in | One owner now |
|---|---|---|
| Browser and gate time limits | README, BROWSER_CHECKS heading/prose, build.md prose, Design `Current Technical State`, RELEASING step 4 | `tools/gate-limits.json` |
| Measured browser/test times (30 s, 40 s, 125/196/320 s, 230 s, T-145 times) | BROWSER_CHECKS, build.md, Design, RELEASING | dated runs: BROWSER_CHECKS `Measured time` (one) + `docs/evidence/test-cost/report.md` |
| Which browser command runs when | BROWSER_CHECKS `Running it`, RELEASING table, README | `docs/agents/browser-policy.md` |
| Browser step list | README, Design `Verification in tiers`, BROWSER_CHECKS prose | `browser-steps.mjs` (`-- --list`); BROWSER_CHECKS step table is a test-checked copy |
| Engine and page size limits | BROWSER_CHECKS paragraph, README page-size table, Design `Size budgets are split`, NPM_PACKAGING limits column | `engine-budget.mjs`, `load-budget.mjs`, `viewLimits.json`, `LIMITS` in `check-packs.mjs` |
| Package list and count | README workspace table, RELEASING "eight", NPM_PACKAGING "both" | `PACKAGES` in `tools/build-packages.mjs` |
| Per-call API guidance (about 13k words) | engine README tables and API page doc comments | exported types' doc comments, rendered on the API page |
| Engine version in the API lead | hard-coded "0.2 preview" | `packages/astraeus/package.json` at generation |
| Asset inventory and credits detail | README assets table, site assets page, package credits | site assets page and package `credits/`, `NOTICE`, `licenses/` |
| Codebase inventory (examples, tools) | Design map, codebase-details | Design map links (`tools/build-example.mjs` `EXAMPLES`, build.md) |

### Deliberate duplication kept (and its reader)

| Kept copy | Owner | Reader | Why kept |
|---|---|---|---|
| build.md and BROWSER_CHECKS limit tables | `gate-limits.json` | maintainer looking up a limit while reading the guide | `gateLimits.test.ts` fails when they differ, so they cannot drift |
| Engine README API tables (`mount(`, `<AstraeusScene`, `handle.x`) and the error table | exported types; `api-rules.mjs` writes the error table | npm package user (the README is the npm page) | `apiRules.test.ts` checks names against `MountOptions`/`MountedScene`/`AstraeusSceneProps` and regenerates the error table |
| Moon-picture sentences in the engine README `addBody` row | `pictureList.test.ts` | package user choosing moons | test-checked verbatim |
| Engine README planet accuracy table, and the 1 km fit target in ASTRONOMY_VALIDATION/ephemerides README | `planets.json` `worstErrorKm`, accuracy tests | package user (npm) and scientific reviewer | npm readers cannot follow repo links to `docs/`; figures are test-backed (`planetMoonSystems.test.ts`, `planetAccuracyFlybys.test.ts`) |
| README one-line quick/full commands and the usual Check command | browser policy | newcomer at the front page | shortest local invocation (owner plan step 2); links to the policy |
| One dated measurement in BROWSER_CHECKS `Measured time` | the run folders and test-cost report | maintainer judging whether a run is slow | labelled with date and run, kept apart from limits |
| Moved Design text in reconciliation-history | history (dated as built 2026-11-22) | anyone tracing why a boundary exists | verbatim move, not a second current source |

### Changelog

`packages/astraeus/CHANGELOG.md`, `## 0.10.0 (proposed)` only: one `- Docs:` line after the last bullet, before `### Breaking changes in 0.10.0` (README shortened and true to this version, detail on the API page, lead version from `package.json`, NOTICE credits Horizons). No heading or migration table touched (`releaseBreaks.test.ts`, `renamedInputs.test.ts` green).

### Done When -> evidence

| Item | Evidence | Outcome |
|---|---|---|
| Each original contradiction rechecked and now true, with its source | Recheck table above | Met |
| Site build renders the API page; lead shows the manifest version and no "preview" | `npm run build` exit 0; grep: "This is version 0.9.5", manifest 0.9.5, "preview" 0 | Met |
| `npm pack --dry-run -w astraeus` and README links checked | Workspace command fails (ERR_OUT_OF_RANGE, recorded); dist pack 0.9.5 / 675 files, README identical, links absolute, 27/27 API anchors present; link check 167/0 bad | Met (pack via dist, as T-437) |
| Fresh read-through: three questions, path, ambiguities, fixes | "Fresh read-through (coordinator, 2026-11-22)" table; (a)-(e) fixed, Q2 note recorded | Met |
| Word-count table, retired duplicates, kept duplicates + reader | three tables above | Met |
| Changelog line in the top section only | `git diff packages/astraeus/CHANGELOG.md`: one added line inside `## 0.10.0 (proposed)` | Met |

### Commands and gates

- `npx vitest run packages/astraeus-site/tests/gateLimits.test.ts packages/astraeus-site/tests/releaseBreaks.test.ts packages/astraeus/tests/renamedInputs.test.ts packages/astraeus-site/tests/workflowParity.test.ts` -> 4 files, 111 passed (gateLimits reads README and BROWSER_CHECKS; releaseBreaks/renamedInputs read the changelog; workflowParity reads RELEASING, unchanged).
- `npx prettier --check README.md docs/BROWSER_CHECKS.md docs/ASTRONOMY_VALIDATION.md packages/astraeus/CHANGELOG.md` -> pass (vacuous: Markdown is Prettier-ignored).
- No typecheck/eslint: no TS/JS changed. `npm run build` and `node tools/build-packages.mjs astraeus` run for inspection only (outputs in ignored `dist/`). `savepoint resume` loads.

### Files changed

`README.md` (`Running the checks`, one sentence); `docs/BROWSER_CHECKS.md` (**Time limits** bullet, two sentences); `docs/ASTRONOMY_VALIDATION.md` (intro line, research line moved under `Provider comparison`, providers row, superseded banner, dated heading, 12 fixture link targets); `packages/astraeus/CHANGELOG.md` (one line); this Task file (`planned_writes` gained `README.md`, `docs/BROWSER_CHECKS.md`, `docs/ASTRONOMY_VALIDATION.md` for the read-through fixes). `docs/README.md` (planned) needed no change: its rows still match.

### Limitations

- The fresh read-through is the coordinator's; it was not rerun after these fixes.
- Test name drift, not fixed (outside Boundaries): `planetMoonSystems.test.ts:228` is titled "within a kilometre of Horizons' Pluto" but asserts `< 1.5` km; docs follow the assertion.
- ARCH-06: the link check is a scratch script, not a test; a cheap follow-up would be a test that relative links and anchors in `docs/**/*.md`, README and Design resolve (it would have caught the 12 fixture links broken since before O-090). Recommend an Issue via the coordinator.
- Full `npm test`/lint not run (builder rule 7).

## Drift Notes

None architectural. Design `Planet positions from Horizons` already states the barycentre-fit rule; the ASTRONOMY_VALIDATION wording now distinguishes the fit target (1 km to the barycentre) from planet-centre accuracy, consistent with it. Follow-up for the coordinator: a mechanised Markdown link/anchor test (ARCH-06), see Limitations.

## Coordinator (gates)

2026-11-22, coordinator (orchestrate-g024-20261122): Reviewed the report: read-through fixes (a)-(e) applied in README, BROWSER_CHECKS and ASTRONOMY_VALIDATION (all edited earlier in O-090, logged in planned_writes); 12 pre-existing broken fixture links repaired; builder ran gateLimits, releaseBreaks, renamedInputs, workflowParity (111 passed) and `npm run build` (exit 0, API page reads 0.9.5, no "preview"). Docs-only since the T-437 full gate. Follow-ups captured as I-205 (doc-link test; misleading test title). Full Objective Check next. Marked done under the standing rule (owner, O-038: "I mark them as they pass") and the owner's "carry on orchestrating G-024".
