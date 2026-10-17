# Astraeus: what could be simplified (O-017, T-066)

Written 2026-10-17 on branch `o017-simplify` (from `main` 4f10505). Analysis only: nothing in `src/`, tests, data or the health config was changed. Raw outputs and the scan script are in `docs/evidence/o017-before-20261016T205125Z/scans/`.

**How to read this:** the table in section 1 is for the "simplify the code you picked" Task (T-069). Tick the rows you want. Rows marked with another Task (T-067 CAMS/Yale, T-068 switches and made-up experiences, T-070 load size, T-071 browser checks and tools) are already planned there and are listed only so nothing is done twice. Savings are estimates, not promises.

## 1. Ranked candidates

Owner pick, 2026-10-17 (structured question): C1–C5, C7 and C8. Not picked: C6 (low value; the phone layout work, O-020, reshapes the shell), C9 (display switches stay) and C10.

Ranked by what they would buy (complexity removed, duplicated code removed) against the risk of changing how things look. "Lines" is the code the change touches, then the estimated net saving.

| Pick | # | Where | Signal | Proposed simplification | Lines touched / net saving | Risk | Belongs to |
|---|---|---|---|---|---|---|---|
| [x] done | C1 | `src/app/AstraeusScene.tsx`, `SceneContents` and its per-frame callback (lizard reports it under the name `LayeredRender`) | CCN 138, 342 lines. Lizard mis-reads the file: `LayeredRender` really ends at line 198, so the 138 is the rest of the file (`SceneContents`, about 370 lines, one frame callback doing camera, placement, marker swap, sky readouts, lights and labels). The file is also 575 lines, the second largest in `src/` | Move the frame callback's steps into small named functions in their own files (camera step, body placement and marker swap, light placement, debug dataset publishing). Behaviour unchanged. Splitting also makes the health number honest | about 380 moved, net saving about 20 (plus about 25 more when T-068 drops the single-sun branch) | High: it is the render path; needs the browser scripts (`tools/validate/`) and the before/after pictures | T-069 (do after T-068, which deletes `singleSun` and the `merged` branch of `LayeredRender`) |
| [x] done | C2 | `src/app/experienceDefinition.ts`, `validatePathSpec` (lines 311-366) | CCN 45, 51 lines; second highest in `src/` | A small table of field checks instead of one chain of `if`s | about 60 touched, about 15 saved | Low: path validation has its own tests | T-069 |
| [x] done | C3 | `src/core/elementsBody.ts`, `parseElementsBodyRecord` (118-293) and the same reading code in `src/experiences/showers/showerSettings.ts` | CCN 41, 132 lines; jscpd finds the same 32 lines in both files (`elementsBody.ts` 89-110 and `showerSettings.ts` 144-166) | One shared set of field readers (number, text, record) used by both parsers; split the long parser by section | about 200 touched, about 40-60 saved | Medium: both parsers guard real data, tests exist for both | T-069, after T-067 (T-067 edits `showerSettings.ts`) |
| [x] done | C4 | `src/experiences/showers/showerDefinition.ts` (595 lines, the largest file in `src/`) | Many small exported helpers (most used only inside the file and by tests); builds the stream, the paths, the panel text and the source switch in one file | Split into stream layer, path layers and text files, no behaviour change. The CAMS/GMN source sentence and the "Orbits from CAMS" option (lines 90, 515-516) go with T-067 | about 600 moved, about 0 saved (readability, not size); re-measure after T-067 | Low to medium | T-069 for the split; CAMS lines are T-067 |
| [x] done | C5 | `src/core/listedOrbitGroup.ts` and `src/core/orbitGroup.ts` | Duplicated sampling code: 9 + 9 lines (`listedOrbitGroup.ts` 249 and 280, `orbitGroup.ts` 123 and 161) | One shared helper for placing a member on its orbit | about 40 touched, about 15 saved | Medium: engine core, covered by the astronomy tests | T-069 |
| [ ] | C6 | `src/shell/AstraeusShell.tsx` (`AstraeusShell` CCN 21, `selectObject` CCN 20) and `src/shell/TimelineBar.tsx` (112 lines in one component) | Next highest in the shell | Pull the selection logic and the timeline's marker and window drawing into named pieces | about 250 touched, about 0-20 saved | Low to medium: shell tests exist; the browser shell script covers it | T-069 (low value) |
| [x] done | C7 | `tests/showersMeasured.test.ts` and `tests/showersMeasuredGeminids.test.ts` | Largest test duplication: 48 lines shared between them plus 46 inside the first | One parametrised test over both showers. The CAMS-only cases go with T-067 | about 250 touched, about 100 saved | Low | T-069, after T-067 |
| [x] done | C8 | Unused exports (scan below) | 5 exports nothing uses; 12 used only by tests or tools; 266 `export`s never imported by another file in `src/` | Delete the 2 dead ones that are not other Tasks' (`BODY_FIXED_TO_MESH_NOTE` in `renderCoordinates.ts`, `MetricKind` in `shell/metrics.ts`); dropping the `export` keyword from the rest is churn with no saving, so not proposed | about 5 lines | Very low | T-069 for the 2 named; the other 3 (`FETCH_STARS_COMMAND`, `FETCH_SKY_MAP_COMMAND` in `assets/sky.ts`, `forgetMeasuredOrbitRequests` in `measuredOrbits.ts`) go with T-067 and T-068 |
| [ ] | C9 | Comparison-only address overrides that stay after T-067 and T-068: `?milkyway=on\|off`, `?sky=off`, `?labels=`, `?loop=`, `?markerpx=`, `?sunglow=`, `?sunbrightness=`, `?sunglowscale=`, `?stars=<n>`, `?milkywaybrightness=` | Each is read by one small function with one test; the browser scripts use `?sky=off` (7 files) and `?milkyway=` (2). The Objective does not name them and the owner's decisions keep only up, orbit quality and timeline span | Owner decision: keep as developer conveniences, or retire the ones that have a live control. Retiring means updating the browser scripts that use them | about 150 touched (code, tests, scripts), about 100 saved | Low for code, medium for the scripts that rely on them | Needs your choice; T-069 if you tick it |
| [ ] | C10 | Tiny duplications: `syntheticListedDefinition.ts` / `syntheticRingDefinition.ts` (7 lines), `sunCentredSources.ts` inside itself (6 lines) | Below the useful size | Not worth a change on their own | about 10 saved | Low | Not recommended |

### T-069 results (2026-10-17): the ticked rows, before and after

Measured with the same tools as section 5 (lizard CSV over `src/`; jscpd 5.4.0 `--min-lines 5 --workers 1`), before = the tree at the start of T-069 (after T-067 and T-068), after = the finished Task. Full figures and the commands are in the T-069 Task evidence. Behaviour is unchanged: 877 tests passed before, 879 after (C7 split two checks into one per shower set), the 20 public pictures differ from the T-066 set by at most 0.0231% of pixels (the noise bound is 0.024%; the assets page differs in size by design).

| # | Done | Before | After |
|---|---|---|---|
| C8 | Deleted `BODY_FIXED_TO_MESH_NOTE` and `MetricKind`. The other three dead exports were already gone with T-067 and T-068. | 2 unused exports | 0 unused exports; 8 lines removed |
| C2 | `validatePathSpec` split into a one-line check helper plus four small named checks (rule, rolling span, fixed span, source probe). | CCN 45, 56 lines in one function | largest piece CCN 10, 30 lines; `experienceDefinition.ts` 399 to 412 lines |
| C5 | One shared `memberStatesOf` and `propagatedPositionOf` in `orbitGroup.ts`, used by both groups. | 2 clones, 18 duplicated lines (9 + 9) | 0 clones between the two files; `src/` clones 6 to 4 |
| C3 | New `src/core/fieldReaders.ts` (object, text, number, time readers) used by both parsers; `parseElementsBodyRecord` split by section. | CCN 41, 176 lines; 32 duplicated lines (21 + 11) between the two parsers | `parseElementsBodyRecord` CCN 5, 17 lines; largest section reader CCN 14; 0 duplicated lines |
| C7 | `tests/showersMeasured.test.ts` now runs one parametrised suite over Perseids and Geminids; the Geminid file is gone. | 2 files, 357 lines; 46 duplicated test lines between them | 1 file, 240 lines; `tests/` duplicated lines 104 to 58 |
| C4 | `showerDefinition.ts` split into basics, stream layer, stream text, path layers, activity, body items and the assembler; it re-exports the names callers used. | 1 file, 581 lines (largest in `src/`) | 7 files of 41 to 151 lines (assembler 134); 624 lines in all, since each file has its own imports |
| C1 | The frame callback is split into named functions in `sceneTargets.ts`, `sceneCamera.ts`, `sceneBodies.ts`, `sceneLights.ts`, `sceneSky.ts`, `sceneDebug.ts` and `sceneHooks.ts`; `LayeredRender` has its own file. | `AstraeusScene.tsx` 542 lines; lizard block CCN 126, 377 lines | `AstraeusScene.tsx` 298 lines; lizard block CCN 54, 164 lines; every new function CCN 9 or less |

`src/` over CCN 20 went from 5 functions to 3 (`AstraeusScene` 54, `parseShowerSettings` 21, `AstraeusShell` 21); `src/` duplicated lines went from 63 (0.44%) to 13 (0.09%).

### Rows that belong to other Tasks (not for T-069)

| # | Where | Signal | Task |
|---|---|---|---|
| X1 | `src/main.tsx` (`?source=`, `offeredSources`), `src/assets/sky.ts` (`yale`, `?stars=yale`, `LOCAL_STAR_URL`, `FETCH_STARS_COMMAND`), `showerSettings.ts` (`"cams"` source, 11 mentions), `showerDefinition.ts` (4), `measuredOrbits.ts` (6, `/data/local/` URLs), `skyModel.ts` (2); `tools/data/fetch-meteoroid-orbits.mjs`, `fetch-stars.mjs`; tests `hygStars`, `showers`, `showersMeasured`, `fetchMeteoroidOrbits`, `publicBuild`, `sky`, `assetsPageCredits`; `tools/validate/browser-showers-gmn.mjs` (22 mentions), `browser-showers.mjs` (14), `browser-sky.mjs`; `data/local/` (453 MB on disk, git-ignored) | CAMS and Yale: local-only paths that can never ship | T-067 |
| X2 | `src/app/lighting.ts` (78 lines), `singleSun` and the `merged` branch in `AstraeusScene.tsx`, `?lighting=`, `?sunLight=`; `SkyView.ts` `skyMapFromSearch` / `?skymap=`, the nasa/eso choice in `src/assets/sky.ts` (`parseSkyManifest` CCN 25 sits here); `browser-lighting.mjs` (120 lines), `browser-sky-map.mjs` (55) | The two comparison switches | T-068 |
| X3 | `src/synthetic/` (620 lines, 4 files) and the ids in `main.tsx`' `DEFINITIONS` | Made-up experiences: stay in the dev server, leave the public build. Not a deletion candidate | T-068 |
| X4 | Pictures and stream files: `gmn-iau-4` 5.6 MB and `gmn-iau-7` 2.9 MB (measured orbits), `milky-way-left/right.jpg` 1.8 + 2.0 MB, `earth-bmng-july-4k.jpg` 1.6 MB, `planetModels` chunk 1.4 MB, `app` chunk 1.2 MB | Weight; see first-load sizes below | T-070 |
| X5 | `tools/validate/*.mjs` duplicate boilerplate: jscpd finds 827 duplicated lines of 10,323 (8.0%) across 56 files; one-off tools `conversion-proof.mjs` (619), `anchor-consistency.mjs` (268), `capture-apollo-compare.mjs` (116); `tools/apollo11/` (18 files, 2,473 lines); `package.json` script `apollo11:reconstruct` | Browser checks, tools, briefs | T-071 |

### Dependencies no longer imported

None. Every `dependencies` and `devDependencies` entry of `package.json` is imported or used: `@lizard-isana/orb`, `@react-three/fiber`, `react`, `react-dom`, `three` in `src/`; `@types/*` and `typescript` by `tsc`; `vite`, `vitest` and `@vitest/coverage-v8` by the build, tests and health tooling; `playwright-core` by `tools/validate/`. (Command and method in the evidence below.)

### Settled options still in code

CAMS and Yale (X1), the lighting comparison and Milky Way picture choice (X2). Kept by decision: sky "up" direction (`?up=`), orbit quality (`?orbits=`), timeline span (`?span=`). Open: row C9.

## 2. Health config: proposed change (not applied)

The official snapshot `sha256:f56641d2...` reports duplication 40.2% (72,307 of 179,678 lines in 1,293 clones). That figure is almost all `docs/evidence/` logs and generated data, not source. Measured on source only, the figures are far lower (section 3). To make the number mean source code, the owner can add `docs/evidence/**` and `data/**/generated/**` to the duplication entry of `.savepoint/health/config.json`, both in the `--ignore` argument (after `**/.git/**`) and in the capability's `exclusions` list:

```
--ignore "node_modules/**,dist/**,.savepoint/**,**/*.pb.go,**/*_generated.*,**/*.min.js,**/testdata/**,**/.git/**,docs/evidence/**,data/**/generated/**"
"exclusions": [ ..., "**/testdata/**", "docs/evidence/**", "data/**/generated/**" ]
```

Not proposed but worth knowing: `tests/fixtures/*-horizons-source.txt` are NASA Horizons text excerpts; jscpd calls 925 of their 1,456 lines duplicated (63.5%) because Horizons tables repeat. They are test data, not code. Adding `tests/fixtures/**` would remove that too; your call.

## 3. Before numbers (O-017 Success Condition 8)

The after figures and the comparison are in `docs/O017_RESULTS.md` (T-072).

Tree: `main` 4f10505 plus this branch's `.savepoint` edits. All counts are lines of text (`cat | wc -l`).

### Lines and files

| Area | Files | Lines |
|---|---|---|
| `src/` total (`.ts`, `.tsx`, `.css`) | 122 | 14,552 |
| `src/app/` | 36 | 4,921 |
| `src/shell/` | 18 | 2,703 |
| `src/core/` (incl. `bodies/`) | 36 | 3,092 |
| `src/experiences/` (apollo11 781, earth-moon 46, jupiter-io 52, showers 1,218) | 12 | 2,097 |
| `src/assets/` (code only; the HYG star file and textures are data) | 14 | 953 |
| `src/synthetic/` | 4 | 620 |
| `src/types/` | 1 | 103 |
| `src/main.tsx` | 1 | 63 |
| `tests/` (all files: 52 at the top level 10,328 lines, `helpers/` 6 files 262, `fixtures/` 18 files 2,606) | 76 | 13,196 |
| `tools/` (all files: `validate/` 31 files 6,951, `apollo11/` 18 files 2,473, `data/` 8 files 1,037) | 56 | 10,461 |

Tests: 907 (1 skipped), from the snapshot.

### Address switches the app reads: 21

`experience`, `view`, `t`, `scale`, `up`, `span`, `orbits`, `source`, `stars` (catalogue, and brightness: one name), `milkyway`, `milkywaybrightness`, `sky`, `skymap`, `lighting`, `sunLight`, `markerpx`, `sunglow`, `sunbrightness`, `sunglowscale`, `labels`, `loop`. The in-page "Data" buttons also write one (`alternate.param`, today `source`). After T-067 and T-068 expect 17 names (`source`, `skymap`, `lighting`, `sunLight` gone; `stars` stays as the brightness value).

### First-load size per page (public build, served uncompressed by `vite preview`; gzip is `zlib` on each file)

Measured by `capture-experience-pictures.mjs`: every file the browser fetched from the page request to 4 s after the scene settled, at the pinned view. Whole public build on disk: 22,107,479 bytes. The home and assets pages load their pictures lazily, so their figure is the page as captured (full-page screenshot, 1 s after network idle), not an upper bound.

| Page | Files | Bytes | Gzip bytes |
|---|---|---|---|
| `index.html` | 17 | 630,024 | 577,211 |
| `assets.html` | 16 (15 on the phone) | 551,506 (530,438) | 509,886 (488,845) |
| `app.html` Apollo 11 (default) | 15 | 4,046,212 | 2,724,405 |
| `app.html?experience=earth-moon` | 13 | 3,678,856 | 2,605,465 |
| `app.html?experience=jupiter-io` | 13 | 3,809,334 | 1,898,009 |
| `app.html?experience=shower-perseids` | 24 | 10,922,682 | 7,313,022 |
| `app.html?experience=shower-geminids` | 24 | 13,692,592 | 8,372,209 |

Largest single files in the build: `gmn-iau-4` 5,630,107 (Geminids' stream), `gmn-iau-7` 2,860,197 (Perseids'), `milky-way-right` 1,951,626, `milky-way-left` 1,751,810, `earth-bmng-july-4k` 1,559,348, `planetModels` chunk 1,391,800, `app` chunk 1,185,130 bytes.

### Test and browser run times

From `docs/evidence/objective-check-20261016T190443Z/summary.txt` (the Full Objective Check of 2026-10-16):

- Full test run (`npx vitest run`): 30 s (19:04:44 to 19:05:14).
- Full browser run: 23 scripts, 37 min 51 s of script time added up (19:05:21 to 19:43:17 on the clock, 37 min 56 s). Longest: `showers-geminids` 6 min 24 s, `showers-perseids` 5 min 30 s, `sky` 4 min 50 s, `lighting` 2 min 40 s, `synthetic-belt` 2 min 14 s, `spike02` 2 min 11 s.
- Typecheck, build and public build: about 1 s together.

### Complexity and duplication

- Lizard over `src/` only (935 functions): 29 functions over CCN 10, 6 over 20. The six: `LayeredRender` (really the rest of `AstraeusScene.tsx`) 138, `validatePathSpec` 45, `parseElementsBodyRecord` 41, `parseSkyManifest` 25, `parseShowerSettings` 21, `AstraeusShell` 21. (The snapshot counts 10 over 20 because it also measures `tests/` and `tools/`.)
- jscpd (min 5 lines): `src/` alone 63 duplicated lines of 14,548 (0.43%, 6 clones); `tests/` without fixtures 152 of 10,580 (1.4%, 13 clones); `tools/` 827 of 10,323 (8.0%, 90 clones). `src tests tools` together, fixtures included: 1,995 of 38,059 (5.2%); 1,850 of those lines are the Horizons text fixtures.

## 4. Before pictures

Directory: `docs/evidence/o017-before-20261016T205125Z/` (22 files: 20 pictures, `manifest.json`, `first-load.json`, plus `scans/`).

- Experiences, desktop 1440x900 and phone 390x844, from the public build: Apollo 11 (overview, and Moon close-up), Earth-Moon (wide and Earth close-up), Jupiter-Io (wide and Jupiter close-up), Perseids, Geminids. The site pages `index.html` and `assets.html`, full page, at both sizes.
- Each experience uses a fixed `&view=` and `&t=` (listed once, in `VIEWS` in the tool). Playback is paused, time is set again exactly, story panels and the info panel are closed (auto-open needs playback), the Developer button is hidden, then the scene waits 4 s. The timeline's own reading is in `manifest.json` (it snaps to the slider's steps: Apollo reads 20:18:00.6 for a pinned 20:17:39, Perseids 11:59:43 for 12:00:00; the same on every run).
- Still moving: nothing in the scene advances while paused. Pictures are not bit-identical between runs: a second full run differed by at most 0.024% of pixels per picture, up to 52 levels at single anchor-label and ring edge pixels (`scans/repro-diff-vs-trial.json`). T-072 should compare with a tolerance, not equality.
- Made-up experiences are not photographed (T-068 removes them from the public build).

Reproduce (about 2 minutes; builds, serves on port 5460, shoots, stops the server, deletes the scratch build):

```
PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js \
  node tools/validate/capture-experience-pictures.mjs --out docs/evidence/o017-after-<UTC> --port 5460
```

`--out` must be a fresh directory; `--url` shoots an already running public-build preview instead.

## 5. Evidence (commands)

- Lizard: `lizard --csv src/ > scans/lizard-src.csv` (the project's `lizard` at `/home/user/.local/bin/lizard`, version not printed by its CSV).
- jscpd 5.4.0, `--min-lines 5 --workers 1 --reporters json`: `jscpd src`, `jscpd --ignore "**/fixtures/**" tests`, `jscpd tools`, `jscpd src tests tools` (reports `scans/jscpd-*.json`).
- Unused exports, unreachable files and unused dependencies: a one-off node script (`scans/scan-unused.mjs`; no `ts-prune` or `knip` is installed and nothing was installed). It lists every top-level `export` in `src/` and counts word matches in other `src/` files, `tests/` and `tools/`; follows static and dynamic `import`s from `src/main.tsx` and the three HTML pages to find unreachable files (none: only `src/types/orb.d.ts`, a types file); and checks each `package.json` dependency name against imports. A name match is not proof of use (it can over-count, never under-count), so the 5 "unused" are certain and the "test-only" rows are the ones to double-check.
- Switch names: `grep` for `URLSearchParams(...).get("...")`, `boundedParam(search, "...")` and `.has(...)` in `src/`.
- Pictures: the command in section 4; first-load figures from `first-load.json` of the same run.
