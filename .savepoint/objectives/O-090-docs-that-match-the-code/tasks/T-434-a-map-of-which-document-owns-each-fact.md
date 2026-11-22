---
id: T-434
objective: O-090
title: A map of which document owns each fact
status: done
depends_on: []
owner_validation: {required: false}
check_waiver: {task: T-434, reason: 'Owner said "work through this list of objectives one by one. Orchestrate each objective to completion" (G-024 decision 7) and "carry on orchestrating G-024" (2026-11-22): standing orchestration rules waive the optional step checks; the mandatory Full Objective Check covers the whole diff.', actor: {role: owner, session: orchestrate-g024-20261122}, recorded_at: '2026-11-22T05:30:31Z'}
planned_by: {role: planner, session: orchestrate-g024-20261122}
lane: docs
planned_reads: [README.md, packages/astraeus/README.md, docs/BROWSER_CHECKS.md, docs/agents/browser-policy.md, docs/agents/verification.md, docs/agents/build.md, docs/NPM_PACKAGING.md, docs/RELEASING.md, .savepoint/Design.md, package.json, packages/astraeus-site/tests/gateLimits.test.ts, packages/astraeus-site/tests/apiRules.test.ts, tools/api-rules.mjs, packages/astraeus-site/tools/site/api-reference.mjs]
planned_writes: [docs/README.md]
---

# A map of which document owns each fact

## Outcome

One short page, `docs/README.md`, says for each drifting fact (package list and versions, workspace count, check commands and tiers, browser scenarios, time limits and measured timings, size budgets, public API surface and error codes, planet/moon providers, release procedure, architecture boundaries) which file or generated output owns it, and which docs only link to it. The Task evidence carries the full contradictions list (each false or stale statement found: file + heading, quote, owning source, true value) that later O-090 Tasks fix, and the list of doc material that code or tests consume (generated README error table, README API tables, the BROWSER_CHECKS limit table, packed README, site API page) so no later Task removes it blindly.

## User Check

None visual. The owner can open `docs/README.md` and find where to change a browser tier, a package version or a public API.

## Done When

| Item | Evidence |
|---|---|
| `docs/README.md` exists, under ~600 words: one table fact → owner → readers, plus one line on where history lives (archive, release notes, dated evidence) | file |
| Contradictions list in Technical Evidence covers at least the six named in the Objective (workspace count, planetary provider, browser workflow and timing, release status/roadmap, API "0.2 preview" intro, package guidance) plus any others found, each with owning source and true value checked against code/config | evidence table |
| Consumed-material list (what code/tests parse or generate in docs) recorded with file:line | evidence table |
| No other doc edited | git diff --stat |

## Context Files

`README.md`; `packages/astraeus/README.md` headings only (`grep -n '^## '`) plus sections a grep hit lands in; `docs/BROWSER_CHECKS.md`; `docs/agents/browser-policy.md`; `docs/agents/verification.md`; `docs/agents/build.md`; `docs/NPM_PACKAGING.md` under `The short version`; `docs/RELEASING.md`; `.savepoint/Design.md` headings plus `Components/Codebase Map` and `Current Technical State`; `package.json` (workspaces, scripts); `.savepoint/config.yml` (`quality_gates`); `packages/astraeus-site/tests/gateLimits.test.ts`; `packages/astraeus-site/tests/apiRules.test.ts`; `tools/api-rules.mjs`; `packages/astraeus-site/tools/site/api-reference.mjs`; the O-090 Objective Decisions.

## Design References

Design `Components/Codebase Map`, `Verification in tiers (O-086)`, `Size budgets are split`.

## Guardrails

PROV-01, PROV-02 (provenance labels kept); TEST-01..04; ARCH-06 (mechanise a trap where cheap).

## Implementation Plan

1. List the facts that drift (Objective Decisions step 1 sources). For each, find the source that owns it (manifest, release config, runner/gate limits, generated API reference, Design, subsystem guide).
2. Grep the top-level docs for each fact; record every stale or contradictory statement.
3. Grep tests and tools for docs they read or write; record them.
4. Write `docs/README.md`: purpose line, the owner table, a history pointer. Link, don't copy values.

## Boundaries

Only `docs/README.md` is written. Fixes happen in later Tasks. No history, Savepoint records, provenance, licence notices or evidence edited.

## Technical Verification

`npx prettier --check docs/README.md`. No tests change.

## Technical Evidence

Builder session orchestrate-g024 T-434, 2026-11-22. Router left unchanged (coordinator rule).

### Reads

Context Files read: `README.md` (whole); `packages/astraeus/README.md` headings plus lines 1-20, 474-560 (grep hits); `docs/BROWSER_CHECKS.md` lines 1-60 plus grep; `docs/agents/browser-policy.md`, `verification.md`, `build.md` (whole); `docs/NPM_PACKAGING.md` `The short version` and grep hit `Size limits for the pack check (step 3)`; `docs/RELEASING.md` (whole); `.savepoint/Design.md` headings, `Components/Codebase Map`, `Verification in tiers (O-086)`, `CI on every push (O-091)`, `Size budgets are split`, `Current Technical State`; `package.json`; `.savepoint/config.yml` `quality_gates`; `gateLimits.test.ts` lines 100-200; `apiRules.test.ts` (grep); `tools/api-rules.mjs` lines 352-425, 650-670; `api-reference.mjs` (grep, line 381).

Extra reads (logged; each to find an owning source or verify a true value): `packages/*/package.json` (name, version, private, peers, `files`); `tools/build-packages.mjs` `PACKAGES` (lines 30-42); `tools/gate-limits.json`; `.github/workflows/publish.yml` lines 1-80; `packages/astraeus-site/tools/validate/browser-steps.mjs` (STEPS, selectSteps) and `run-browser.mjs` (grep `tier`); `packages/astraeus/src/core/planetModels.ts` lines 1-62, `planetSeries.ts` (grep), `astronomyAdapter.ts` (grep); `packages/astraeus/data/ephemerides/README.md` `planets/` section; `packages/astraeus/NOTICE` line 14; `vitest.config.ts` (grep timeout); `engine-budget.mjs` (grep limits); `load-budget.mjs` lines 113-236 (limits); `tools/check-packs.mjs` lines 1-30; `docs/evidence/test-cost/report.md` lines 1-35, 128-146; `docs/evidence/browser-quick-20261122T051538Z/summary.txt` (untracked); `docs/architecture/codebase-details.md` lines 7, 12; `docs/architecture/state-and-assets.md` line 33 (grep); `docs/ASTRONOMY_VALIDATION.md` grep `VSOP`; `packages/astraeus-site/index.html`, `assets.html` grep `VSOP`; `workflowParity.test.ts` lines 24-37, 160-175; `pictureList.test.ts` lines 1-40; `releaseBreaks.test.ts`, `renamedInputs.test.ts` (grep CHANGELOG); `tools/site/assets-sections.mjs`, `package-credits.mjs` headers; repo-wide greps for workspace counts, `under a minute`, `0.2 preview`, `eight packages`, `VSOP`.

### Done When -> evidence

| Item | Evidence | Outcome |
|---|---|---|
| `docs/README.md` exists, under ~600 words, one fact -> owner -> readers table plus one history line | `wc -w docs/README.md` = 480; 19 table rows; `## Where history lives` (release notes, CHANGELOGs, `archive/`, reconciliation history, dated evidence) | Met |
| Contradictions list covers the six named plus others, each with owning source and checked true value | Table C below: C1 workspace count, C2-C6 planetary provider, C7-C12 browser workflow and timing, C13-C14 release status/roadmap, C15 API "0.2 preview", C16-C21 package guidance, C22-C35 others | Met |
| Consumed-material list with file:line | Table M below (12 rows) | Met |
| No other doc edited | `git diff --stat`: only this Task file; `git status`: `?? docs/README.md` new (plus the pre-existing untracked evidence and `docs/research`) | Met |

### Commands

- `npx prettier --check docs/README.md` -> exit 0, "All matched files use Prettier code style!". Limitation: `npx prettier --file-info docs/README.md` reports `"ignored": true` (`.prettierignore` leaves out Markdown), so this gate is vacuous for any `.md`. With `--ignore-path /dev/null` Prettier would only re-pad the table cells; left compact like every other repo doc, since Markdown is outside Prettier's scope by project rule (build.md, Formatting).
- `wc -w docs/README.md` -> 480. `savepoint resume` -> loads (T-434 in progress). No tests run (none changed; Task says no tests).

### Table C: contradictions (input for T-435..T-439)

True values verified on 2026-11-22 against the named source.

| # | File, heading (line) | Stale statement (quote) | Owning source | True value | Fix Task |
|---|---|---|---|---|---|
| C1 | `README.md`, `## Architecture` (69, table 71-77) | "The repository is five npm workspaces under `packages/`" | root `package.json` `workspaces: ["packages/*"]`; `ls packages` | 13 workspaces: engine, `astraeus-data`, 7 `astraeus-data-*` (jupiter, saturn, uranus, neptune, mars, pluto, constellations), 3 demos, site; 9 public, 4 private. Table lists 5 | T-436 |
| C2 | `README.md`, `## Assets, science and credits` table (167) | "Planet positions \| VSOP87A via orb.js, Bretagnon & Francou 1988 \| Published theory" | `packages/astraeus/src/core/planetModels.ts:55-58`, `astronomyAdapter.ts:16`, `tools/import/planet-fits.mjs` | Piecewise Chebyshev fits of JPL Horizons system-barycentre states (DE441 plus satellite ephemerides), within 1 km, 1950-2045, since O-063 T-290; orb.js remains only for Earth/Sun (EPV00), Moon (Luna) and frame/time transforms | T-436 |
| C3 | `README.md`, `## How it knows` (31) and credits line (184) | "like the planets from VSOP87"; "VSOP87, Bretagnon & Francou 1988" | as C2 | Planets are Horizons fits (Modelled label still right; example source wrong) | T-436 |
| C4 | `README.md`, `## Architecture` mermaid (64) | "Sources ... ephemerides (orb.js)" | as C2 | Ephemerides: orb.js (Earth, Sun, Moon) plus Horizons curve fits (planets, moons) | T-436 |
| C5 | `docs/architecture/state-and-assets.md` (33) | "Saturn, Uranus and Neptune are VSOP87A fits like the first four"; "Chebyshev fits of VSOP87A stored in `data/ephemerides/planets/planets.json`" | as C2 | All eight are Horizons fits since O-063 (Design `Planet positions from Horizons` already right) | T-438/T-439 |
| C6 | `docs/architecture/codebase-details.md` (12) | "`planetModels.ts` builds the four planet models from the stored curve fits of VSOP87A" | `planetSeries.ts` `PLANET_IDS` (8), `planetModels.ts:55` | Eight planet models, Horizons fits | T-438 |
| C6a | `packages/astraeus/data/ephemerides/README.md`, `## planets/` (39), packed in npm (`files: data`) | "Mercury to Neptune are refits of Orb's full VSOP87A series (each within 1 km of it); Pluto ... is a fit of JPL Horizons" | as C2 | All eight from Horizons since O-063 | T-439 |
| C6b | `packages/astraeus/NOTICE` (14), packed | "fits of VSOP87A series (through Orb, MIT) and JPL Horizons states" | as C2 | Horizons only. Licence notice: out of O-090 scope per Boundaries; owner decides | owner |
| C6c | Site copy, not a doc: `packages/astraeus-site/assets.html` (267, 278: "VSOP87A full series via orb.js", "VSOP87A · two-body Kepler"); `index.html` (253, tag "VSOP87") | as quoted | as C2 | Horizons fits. Outside the doc set; record as Issue or include if planner widens | planner |
| C7 | `README.md`, `## Running the checks` (144) | "`npm run check:browser` # the one quick browser check, under a minute" | `run-browser.mjs` (default tier full), `browser-steps.mjs`, `gate-limits.json` `browser.total` 450 | Plain command is the full tier, 13 steps, limit 450 s; quick tier is `-- --tier quick`, limit 200 s | T-435/T-436 |
| C8 | `README.md`, `## Running the checks` (147) | "loads every public page and demo view and runs two short journeys" | `browser-steps.mjs` | Full tier: smoke, synthetic-journey, public showers, planets-phone, meteor-shower, views, look-out, two-viewers, catalogue, 4 packed examples | T-435/T-436 |
| C9 | `docs/BROWSER_CHECKS.md`, `## Running it` (7) | quick tier runs "... the shipped showers stream and the two public-build file checks" | `browser-steps.mjs` (no such step); same file line 30; build.md line 10 | Public-build checks are `npm run check:public-build`, not a browser step | T-435 |
| C10 | `docs/BROWSER_CHECKS.md`, `## Running it` (7) | "then `npm run check:browser`. Run it once at a Full Objective Check" | `docs/agents/browser-policy.md` line 21 | Full Check runs `-- --tier quick --skip-examples` (plus `--step look-out` / own-path steps); plain command (full) is the release run | T-435 |
| C11 | `docs/BROWSER_CHECKS.md` intro (3) | "`npm test`, about 30 s" | `docs/evidence/test-cost/report.md` lines 18, 130-144 (measured 2026-11-22) | 34.3 s wall (33.5 s in `check:gates`); limit 55 s (`gate-limits.json`). Design line 285 says "about 40 s": both unlabeled copies | T-435/T-438 |
| C12 | `docs/BROWSER_CHECKS.md` heading (11), line 32, `## Time limits` prose (36) | heading "full tier about 320 s, quick tier about 125 s; ... 413 s before O-086 and 353 s before O-060"; "Measured (T-145): ... 44 s ... 58 s"; Before/After history | dated runs: `browser-quick-20261121T213822Z` (122 s, tracked), `browser-20261121T214027Z` (345 s); latest `browser-quick-20261122T051538Z` quick+look-out+two-viewers skip-examples 141 s (untracked) | Timings are dated observations; heading should not carry them; T-145 numbers are 2026-10-22 history (one-command era) | T-435 |
| C12a | `docs/agents/build.md` (9, 10, 11) | engine-alone "about 20 s"; quick "about 125 s"; quick+look-out "about 196 s"; full "about 320 s"; `check:public-build` "about 4 s"; shelf split "about 1 minute" | `test-cost/report.md` lines 130-144 | engine-alone 32.1 s, public-build 7.8 s (2026-11-22). 196 s is a sum (124+72 in `gateLimits.test.ts:127`), never measured as such | T-435 |
| C12b | `.savepoint/Design.md`, `## Current Technical State` (285) | "quick browser tier ... about 125 s, quick plus look-out about 196 s (O-094), full tier about 320 s"; "`npm test` is about 40 s" | as C11/C12 | Dated measurements; Design should link, not copy | T-438 |
| C12c | `.savepoint/Design.md`, `### Verification in tiers (O-086)` (128) | "full adds the synthetic journey (its own step), meteor shower, views, look-out and catalogue" | `browser-steps.mjs` | Full also adds `two-viewers` (O-092 T-427) | T-438 |
| C12d | Code comment: `run-browser.mjs:1` | "The one quick browser check (O-038 T-145)" | same file line 1 "default full" | Not a doc; flag for T-435 only if it touches the runner (Boundaries) | T-435 (optional) |
| C13 | `README.md`, `## Status and roadmap` Next (204) | "Put the demos live at astraeus.anipatke.com." | README's own links (line 22-23) to `astraeus.anipatke.com/app.html` | Live already | T-436 |
| C14 | `README.md`, `## Status and roadmap` Later (207-208) | "Package the engine so others can build a story on it."; "The view from the ground." | `packages/astraeus/package.json` version 0.9.5, nine packages published (`docs/release-notes-0.9.5.md`); look-out (`journey-look-out.mjs`, `examples/hello-sky`) | Engine on npm since 0.2.0; looking out from Earth exists. Owner plan: drop the roadmap | T-436 |
| C15 | Generated API page lead, `packages/astraeus-site/tools/site/api-reference.mjs:381` | "The package is a 0.2 preview, so the API may still change between `0.x` versions" | `packages/astraeus/package.json` `version` 0.9.5 | Read the version from the manifest at generation | T-437 |
| C16 | `docs/RELEASING.md`, `## One-time setup` (11, 15, 20, 30) | "(eight times)"; lists eight; loop over eight; "Do this for all eight packages" | `PACKAGES` (9) in `tools/build-packages.mjs:30-40` | Nine published; the one-time setup is 2026-10-23 history (eight then), constellations added via "Adding a package" (0.9.0). Mark historical, keep line 3's nine | T-439 |
| C17 | `docs/RELEASING.md` (16) | "within minutes for all seven data packages" | as C16 | Dated observation of first publish; label as 2026-10-23 | T-439 |
| C18 | `docs/RELEASING.md`, `## What is checked where` (75) | "`npm run check:browser` (step `hello-scene`) at a Full Objective Check" | `browser-policy.md` line 33 | Full Check runs the `hello-*` steps only for packaging, `examples/` or public API changes; release and `publish.yml` always. Table is parsed by `workflowParity.test.ts:165-172` (keep `npm run ...` strings and `ci.yml`) | T-439 |
| C19 | `docs/RELEASING.md`, `## Each release` (40) | "the full browser tier ... (about 5 minutes ...)" | dated run (full tier 345 s, 2026-11-21) | Copied timing; cite run or drop | T-435/T-439 |
| C20 | `docs/NPM_PACKAGING.md`, `## The short version` (7-9) | "`astraeus` (about 10.5 MB to download) holds ... the eight planets plus the Milky Way"; "a GitHub release publishes both" | `LIMITS` in `tools/check-packs.mjs:20` (8 MB packed / 9.5 MB unpacked); Design `Components/Codebase Map` (`astraeus-data` holds the Milky Way since O-076 T-321); `PACKAGES` (9) | Dated 2026-10-23 decision note: mark historical; Milky Way and moon pictures in `astraeus-data`; nine packages | T-439 |
| C21 | `docs/NPM_PACKAGING.md`, `## Size limits for the pack check (step 3)` (44); `tools/check-packs.mjs:3` comment says "Limits come from docs/NPM_PACKAGING.md" | "`astraeus` \| 10.5 MB / 12.0 MB / 387 \| 12 MB / 14 MB / 450" | `tools/check-packs.mjs:19-30` `LIMITS` | `astraeus` 8 MB packed / 9.5 MB unpacked, no file count (strayFiles instead). Other rows match the code. Code is the owner; the code comment pointing at the doc is backwards (fix comment only if a Task may touch it) | T-439 |
| C22 | `README.md`, `## Develop` Page size (118, table 120-136) | "Measured on the public build of 2026-10-21 ..."; first-load limits e.g. "`app.html` (Apollo 11) ... 4,370,000 B", "venus ... 3,100,000 B" | `load-budget.mjs:113-236` | Since O-051 limits are each page's own share (engine share excluded): Apollo 4,240,000 / 2,850,000; Jupiter 6,570,000 / 4,560,000; Saturn 23,510,000 / 20,570,000; Venus 16,860,000 / 15,650,000 (8k map); Perseids 8,970,000 / 6,760,000; Geminids 10,630,000 / 7,340,000; only index, assets and whole build (54,610,000 / 44,130,000) match. Replace table with link | T-436 |
| C23 | `README.md`, `## Develop` (116) | "`node packages/astraeus-site/tools/validate/public-build-assets.mjs dist` then checks ..." | `package.json` script `check:public-build` (`tools/check-public-build.mjs`) | The maintained command is `npm run check:public-build` | T-436 |
| C24 | `README.md`, `## Architecture` table (73-77) and `docs/architecture/codebase-details.md` (7) | five-row package table; "five npm workspaces" | as C1 | 13 workspaces | T-436/T-438 |
| C25 | `.savepoint/Design.md`, `## Components/Codebase Map` | `examples/` rows: hello-scene, hello-planets ("The third consumer app"), hello-sky; no hello-react row; `tools/` row omits `time-gates`, `api-rules`, `api-surface`, `check-public-build`, consumers, `measure-example`, `owner-preview` | `ls examples`; `ls tools` | Four examples incl. `hello-react`. Owner plan: replace inventory with links | T-438 |
| C26 | `packages/astraeus/README.md`, `## What it holds` (523-533) | folder table lists core, assets, app, shell, presentation, data | `ls packages/astraeus/src` | Also `src/api/`, `src/shelf/`, `src/types/` | T-437 |
| C27 | `packages/astraeus/README.md`, `## Interface modules`, `## Working on the engine in the repository` (519-541) | relative pointers `docs/architecture/viewer-interface.md`, `docs/RELEASING.md`, `tests/...` | `packages/astraeus/package.json` `files` (no docs/, tests/) | Dead from the npm copy; owner plan: contributor link that works from npm (absolute GitHub URL) | T-437 |
| C28 | `packages/astraeus/README.md`, `## What astraeus-data adds` (480) | "`astraeus-data` ... about 39 MB" | `LIMITS` 39 MB is the limit; Design map "about 35.5 MB packed" | Download is ~35.5 MB; 39 MB is the limit (minor) | T-437 |
| C29 | `.savepoint/Design.md`, `## Current Technical State` (287) | "Vitest's timeout is one 30 s constant" | `vitest.config.ts:52` `testTimeout: 30_000`; commit 071a0b00 adds a 10 s `vi.waitFor` default | Still true for `testTimeout`; add nothing unless Design mentions waitFor (no contradiction, recorded so T-438 does not "fix" it) | none |
| C30 | `docs/BROWSER_CHECKS.md`, `## What it runs` first bullet (29) | size-limit paragraph (values match code today) | `engine-budget.mjs:21`, `load-budget.mjs` | Values right but duplicated in a browser map and in Design `Size budgets are split`; one owner per budget | T-435/T-438 |

### Table M: material that code or tests read or write (do not remove blindly)

| # | Doc material | Consumer (file:line) | Rule |
|---|---|---|---|
| M1 | `packages/astraeus/README.md` error table between `<!-- error-table:start ... -->` (416) and `<!-- error-table:end -->` (458) | Written by `tools/api-rules.mjs:352-364, 658-664` (`npm run api:errors`); compared in `packages/astraeus-site/tests/apiRules.test.ts:213-225` | Keep both markers and the heading's table; regenerate, never hand-edit |
| M2 | Engine README API tables: the row whose first cell starts `` `mount( `` (its options object and `Returns {…}`), the row starting `` `<AstraeusScene scene `` and every `handle.x` named in a first cell (rows must start with a pipe, space, backtick) | `readmeApiBreaks` in `tools/api-rules.mjs:382-425`; `apiRules.test.ts:377-411` | Rows must list exactly the `MountOptions`, `MountedScene`, `AstraeusSceneProps` names |
| M3 | Engine README text "Moons with pictures: …." and "Every other listed moon, among them Uranus's …, draws flat-coloured" (in the `scene.addBody` row, line 85) | `packages/astraeus/tests/pictureList.test.ts:9, 28-36` (also `packages/astraeus-data/README.md`) | Keep both sentences verbatim |
| M4 | `docs/agents/build.md` limits table rows (14-28), incl. `` `check:browser -- --tier quick --step look-out` `` row | `packages/astraeus-site/tests/gateLimits.test.ts:136-143, 158-170` | One row per gate in `gate-limits.json`, last cell `<n> s`; `check:browser` and quick rows required |
| M5 | `docs/BROWSER_CHECKS.md` step table (38-52) | `gateLimits.test.ts:172-179` | One row per `browser.steps` key, first cell `` `name` ``, last cell `<n> s` (O-088 reconcile: tests read only the Limit column) |
| M6 | `docs/RELEASING.md` `## What is checked where` table | `packages/astraeus-site/tests/workflowParity.test.ts:37, 165-172` | Keep heading text; table must contain `npm run <script>` for each release script and `.github/workflows/ci.yml` |
| M7 | `packages/astraeus/CHANGELOG.md` sections and migration table | `packages/astraeus-site/tests/releaseBreaks.test.ts:28, 85-88` (open `## x.y.z (proposed)` section, dated headings); `packages/astraeus/tests/renamedInputs.test.ts:262-280` (migration table) | Out of O-090 trim scope; never reshape headings |
| M8 | `docs/APOLLO11_RECONSTRUCTION.md` | Generated by `packages/astraeus-demo-apollo11/tools/apollo11/reconstruct.ts:281`; compared in `apollo11Reconstruction.test.ts:258` | Generated; do not edit |
| M9 | Packed README: `packages/astraeus/README.md`, `CHANGELOG.md`, `NOTICE` copied to `dist` | `tools/build-packages.mjs:249`; `tools/check-packs.mjs:349` requires README.md and LICENSE in every pack; `files` in each `package.json` | README is the npm page: links must work from npm (C27) |
| M10 | Site API page (`api/index.html`, `api/shelf.html`) | Generated from exported types and doc comments by `packages/astraeus-site/tools/site/api-reference.mjs` (lead text at 381); `tests/apiReference.test.ts`; size limits `load-budget.mjs:138-140` | The lead is code (C15); page has raw/gzip limits |
| M11 | Demo `credits/CREDITS.md` files | Read by `packages/astraeus-site/src/demoAbout.ts:2, 14` (About panel); `tests/demoAbout.test.ts` | Provenance; out of scope |
| M12 | `packages/astraeus-site/assets.html` marked blocks | Rewritten by `tools/site/assets-sections.mjs`; `tests/assetsSections.test.ts` | Site page, generated sections |
| M13 | `tools/check-packs.mjs:3` comment names `docs/NPM_PACKAGING.md` "Size limits for the pack check" as the limits' source | comment only (not parsed) | Code owns the numbers (C21) |

### Files changed

- `docs/README.md` (new, 480 words).
- This Task file (status/stage, evidence).

### Limitations

- `prettier --check` is vacuous for Markdown (ignored by `.prettierignore`).
- Root README credits section, `In numbers` figures and the asset table rows other than planet positions were not re-verified against the licence records (out of the drifting-fact list); scientific guides (`ASTRONOMY_VALIDATION.md`, spikes, `MOON_ORBITS.md`) were grep-checked for VSOP only. `ASTRONOMY_VALIDATION.md` already marks its VSOP87A text as superseded (line 94).
- The newest browser run cited in C12 (`browser-quick-20261122T051538Z`) is untracked; evidence retention keeps only cited, committed folders.
- No inbound-link check for `docs/README.md` (new file; nothing links to it yet: T-436 may link it from the root README).

## Drift Notes

- Design `Verification in tiers (O-086)` omits `two-viewers` from the full tier (C12c); Design `Components/Codebase Map` lacks `examples/hello-react` and most root tools (C25); `Current Technical State` copies dated timings (C12b). Deferred to T-438 (Design trim), which accounts for each.
- New doc `docs/README.md` is the fact-owner map; Design `Components/Codebase Map` `docs/` row may name it (T-438).

## Coordinator (gates)

2026-11-22, coordinator (orchestrate-g024-20261122): only `docs/README.md` (new, 480 words) and this Task file changed (`git status`). Prettier ignores Markdown in this repo, so no formatter gate applies; `savepoint resume` loads. Marked done under the standing rule (owner, O-038: "I mark them as they pass") and the owner's "carry on orchestrating G-024". Out-of-scope findings routed: C12d (`run-browser.mjs:1` comment) added to T-435; C6c (site copy in `assets.html`, `index.html`) added to T-436; C21/M13 (`check-packs.mjs:3` comment) added to T-439; C6b (`NOTICE`) left for the owner (licence notice, out of scope).
