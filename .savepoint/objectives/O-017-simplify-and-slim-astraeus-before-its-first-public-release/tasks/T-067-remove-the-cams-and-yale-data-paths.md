---
id: T-067
title: Remove the CAMS and Yale data paths
objective: O-017
status: done
depends_on: [{task: T-066, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o017-plan-20261017}
---

# Remove the CAMS and Yale data paths

## Outcome

GMN is the only measured-orbit source and HYG the only star catalogue. Every CAMS and Yale loader, fetch tool, source switch, local-only test and "local only" note is gone, and the shipped Perseids, Geminids and sky behave exactly as before.

## User Check

Open the Perseids, the Geminids and any experience's sky on the public preview: they look the same as before. The Developer panel no longer offers a CAMS source or Yale stars, and the assets page no longer lists CAMS or Yale.

## Done When

1. Code: `src/experiences/showers/measuredOrbits.ts`, `showerSettings.ts`, `showerDefinition.ts`, `src/main.tsx`, `src/assets/sky.ts`, `src/app/skyModel.ts`, `src/app/AstraeusScene.tsx` carry no CAMS or Yale path; `stream.source`, `stream.sources.cams`, the `?source=` and `?stars=` switches and the "not fetched" states for removed sources are gone; settings files `data/showers/*.json` lose their CAMS fields. A shower settings file naming `cams` is refused with a named error (test).
2. Tools: `tools/data/fetch-meteoroid-orbits.mjs` keeps only the GMN path (or is replaced by a GMN-only fetch), `tools/data/fetch-stars.mjs` (Yale) is removed; `.d.mts` files follow.
3. Tests: CAMS and Yale tests and helpers removed or rewritten for GMN/HYG (`tests/fetchMeteoroidOrbits.test.ts`, `tests/showersMeasured.test.ts`, `tests/helpers/measuredOrbits.ts`, `tests/helpers/workbook.mjs`, `tests/helpers/miniWorkbook.mjs`, `tests/helpers/streamFacts.ts`, `tests/sky.test.ts`, `tests/showers.test.ts`, `tests/publicBuild.test.ts`, `tests/solarLongitudeConvention.test.ts`, `tests/assetsPageCredits.test.ts`); no test is left skipping for missing local data. Each removed test is listed with the reason, and each still-needed scenario is mapped to its new test (TEST-03).
4. Browser scripts: `browser-showers.mjs` runs on the shipped GMN data (drop `&source=cams`), and `browser-showers-gmn.mjs` is merged into it or removed with each scenario mapped; `browser-sky.mjs`, `browser-public-showers.mjs` updated.
5. Public-build validator: still proves nothing local-only ships; its CAMS/Yale-specific checks are rewritten, not dropped.
6. Pages and docs: `assets.html` and `README.md` drop the CAMS and Yale rows and the "local only" key where now unused; `docs/ASTRAEUS_SPIKE_04.md` keeps the history and gains one dated line saying CAMS and Yale were removed in O-017. `.gitignore` keeps `data/local/` ignored.
7. Gates: typecheck, tests, both builds, the public-build validator, and the lite browser check pass; plus the full scripts touched (showers, sky, public showers), zero console errors, fresh evidence directory.

## Context Files

`src/experiences/showers/measuredOrbits.ts`, `src/experiences/showers/showerSettings.ts`, `src/experiences/showers/showerDefinition.ts`, `src/main.tsx`, `src/assets/sky.ts`, `src/app/skyModel.ts`, `src/app/AstraeusScene.tsx`, `data/showers/perseids.json`, `data/showers/geminids.json`, `tools/data/fetch-meteoroid-orbits.mjs`, `tools/data/fetch-stars.mjs`, `tools/validate/public-build-assets.mjs`, `tools/validate/browser-showers.mjs`, `tools/validate/browser-showers-gmn.mjs`, `tools/validate/browser-sky.mjs`, `tools/validate/browser-public-showers.mjs`, `assets.html`, `README.md`, `docs/ASTRAEUS_SPIKE_04.md`.

## Design References

Design.md "Shower builder", "Measured orbits from a second source", "The sky", "Texture rights" and the local-data convention.

## Guardrails

DATA-01 (owner approved the removal, O-017 decision 2), ARCH-01, PROV-01, PROV-02, TEST-01, TEST-03.

## Implementation Plan

1. Map every CAMS and Yale reference (grep) and its test.
2. Remove from settings and loaders first, then tools, tests, scripts, pages.
3. Keep GMN and HYG paths byte-for-byte in behaviour; run the before/after picture comparison from Task 1's tool on the shower and sky views.

## Boundaries

No new data source, no change to GMN or HYG data files, no visual change.

## Technical Verification

Configured gates, lite browser check and the touched full scripts. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Executor session (Sonnet), 2026-10-16/17 UTC (machine clock reads 2026-10-16T21:xx-22:xx Z). Stage advanced build, test, audit. No Check, no router edit, status not set to done, nothing committed.

### Per criterion

1. Code: CAMS and Yale paths removed from `measuredOrbits.ts` (MeasuredSource, offeredSources, forgetMeasuredOrbitRequests, pairs flag counts, `/data/local/cams`), `showerSettings.ts` (OrbitSource, `stream.source`, `stream.sources.cams`; `stream.sources.gmn` is now required), `showerDefinition.ts` (CAMS sentence, source switch, `source` parameters), `main.tsx` (`?source=`, offered sources), `sky.ts` (StarSource, `?stars=yale`, LOCAL_STAR_URL, FETCH_STARS_COMMAND, the Yale source line), `skyModel.ts` (Yale names; the sky note now says "HYG star catalogue (CC BY-SA 4.0)"). `AstraeusScene.tsx` carried no CAMS/Yale path (grep hits were `camState`); one comment changed. `data/showers/*.json` lost `stream.source` and `stream.sources.cams`. A file naming `cams` is refused with a named `ShowerSettingsError` (tests/showers.test.ts "refuses a settings file that still names CAMS", plus two table rows). Result: PASS.
2. Tools: `fetch-meteoroid-orbits.mjs` is GMN-only (643 to about 250 lines; `--source` flag removed; default out `data/local/gmn-iau-N.json`), `.d.mts` updated; `fetch-stars.mjs` and `.d.mts` deleted. PASS.
3. Tests: see the removal and scenario map below. `npm test`: 49 files, 883 tests pass; no test skips for missing local data (the GMN real-data suites now read the committed copies under `data/stories/`). PASS.
4. Browser scripts: `browser-showers.mjs` runs on the GMN copy (no `&source=cams`); `browser-showers-gmn.mjs` removed with its scenarios mapped in the script header; `browser-sky.mjs` and `browser-public-showers.mjs` updated. PASS.
5. Public-build validator: `public-build-assets.mjs` keeps proving nothing local-only ships. Its CAMS/Yale fixtures became generic unlicensed-orbits/unlicensed-stars files; the "nothing to check" exit became a self-proof (it must fail a copied or embedded file and pass a clean build), because a clean checkout has no unlicensed `data/local/` files. PASS.
6. Pages and docs: `assets.html` (CAMS cards, CAMS and Yale credit rows, wish-list item, "This machine only" key and its CSS removed), `README.md` (Yale and CAMS bullets, table rows, credit lines removed), `docs/ASTRAEUS_SPIKE_04.md` (one dated line added, history kept), `.gitignore` untouched (`data/local/` stays ignored). PASS.
7. Gates: below.

### Commands and results

- `npx tsc --noEmit`: clean (after every edit batch).
- `npm test` (vitest run): 49 files, 883 tests passed. One run showed tests/listedOrbitGroup.test.ts "1.5x orbit group" timing flake (18.07 ms vs 15.93 ms) under load; the file passes alone (20 of 20). Unrelated to this Task.
- `npm run build`: passes (only the existing chunk-size notice).
- `ASTRAEUS_PUBLIC_BUILD=1 npx vite build --outDir dist-public` then `node tools/validate/public-build-assets.mjs dist-public`: ok true, selfProof true, 13 local data files checked, 52 build files, star asset ok, 0 matches. `dist-public` removed afterwards.
- Pictures: `capture-experience-pictures.mjs --out docs/evidence/o017-t067-after-20261016T211923Z --port 5460` (all 10 views, 20 pictures, 0 errors) compared with `docs/evidence/o017-before-20261016T205125Z/` by `diff-screenshots.mjs` (`diff-vs-before.json` in the after directory). Perseids and Geminids desktop: 0 differing pixels; Geminids phone 0; Perseids phone 0.0374% differing, 0.0052% over 16 levels; every other view at most 0.0237% differing and 0.0234% over 16 levels (apollo, jupiter-io noise, earth-moon-wide-phone 1 level); site-index under 0.001%; site-assets desktop and phone differ in size on purpose (the CAMS and Yale cards and rows are gone). A repeat of the two showers (`o017-t067-after-repeat-20261016T212116Z`): Perseids phone 0.0036% / 0.0009% over 16, others 0, so the first Perseids phone figure was run noise. GMN and HYG pictures are unchanged within the 0.024% tolerance.
- Lite tier: `browser-lite.mjs` against the dev server on 5461, evidence `docs/evidence/o017-t067-lite-20261016T212154Z`: 26 of 26 loads passed, zero console errors.
- `browser-showers.mjs` (both showers, dev server 5461), evidence `docs/evidence/o017-t067-showers-20261016T215051Z`: 2 of 2 showers passed, zero console errors (started 21:40 UTC, about 20 minutes with the earlier failed attempts). Earlier attempts failed on my own new assertions (a CAMS word inside the cited rule quote; a request-URL check that matched the page address) and on an old defect (below); the evidence directory of those attempts was removed.
- `browser-public-showers.mjs` against a public preview on 5460: evidence `docs/evidence/o017-t067-public-showers-20261016T220609Z`: passed for geminids and perseids, zero console errors.
- `browser-sky.mjs` against the dev server: evidence `docs/evidence/o017-t067-sky-20261016T220654Z`: exit 0, 0 errors (about 5 minutes).
- Servers on 5460 and 5461 stopped. Ports 5301, 5302, 5303, 5310 untouched. `browser-anchor-labels.mjs` not run.

### Removed tests and scenarios, with reasons, and where each still-needed scenario now lives (TEST-03)

Unit tests:
- fetchMeteoroidOrbits: the whole "workbook reader" describe (7 tests: reads a workbook, chunking, header text change, shifted columns, shifted quality columns, 1904 date convert, showerFile writes) removed with the xlsx reader. Kept: the layout check ("verifies the layout from the values", moved to its own describe), the GMN reader, the file writer, the shipped copy. The "refuses to ship a CAMS file" test is rewritten as "refuses to ship a file with no licence or a non-shippable licence" on a GMN file. `tests/helpers/workbook.mjs` and `miniWorkbook.mjs` deleted (only used by those).
- showersMeasured (Perseids CAMS suite, 11 tests) removed; each still-needed scenario moved into the Perseid suite that reads the committed GMN copy `data/stories/perseids/gmn-iau-7.json`: record ids unique and every drawn id is in the file (was "no invented member", now GMN trajectory ids), 20-member energy/semi-major-axis resolution, the stated clump share, DW2(c)(d) comet and planets are the catalogue's, fill timing. DW2(a)/(b) (Earth nearest the stream, radiant) are the same facts as the existing DW3(iii)/(iv) GMN tests. Dropped for no GMN equivalent: the CAMS release counts/hash (24,928 records), the CAMS_XLSX source-workbook check (needs a 322 MB local file), the 99 double-entry counts (GMN has no flag). The GMN suite no longer skips: it reads the committed copy; the solar-longitude bin test computes the longitude from each orbit's epoch (the compact copy has no solar longitude column) and still passes inside 1 degree.
- showersMeasuredGeminids: local-file suite switched to the committed copy, same tests.
- sky: the Yale-file "five named stars" and "8,404 stars" tests (skipped without local Yale) removed; the same facts are asserted on HYG in hygStars.test.ts ("holds the naked-eye stars", "finds the five named stars"). The BSC fixed-width parser test removed with `fetch-stars.mjs`. The sky note tests now assert the HYG sentence and no Yale text.
- hygStars: "star source choice" (defaults, `?stars=yale`, Yale fallback) removed with the switch; replaced by "loads the committed HYG file, once, with no address switch or local file". The skip-if-no-Yale cross-check suite (HYG against Yale, 4 tests) removed: it needed the local Yale file and has no meaning without it.
- showers.test.ts: "keeps CAMS available/source switch", "offeredSources" and "source switch only when two sources" tests removed with the code; replaced by: GMN is the source with its months/licence and no switch, refusal of a settings file naming CAMS, the fetch command has `--months` and no `--source`; absent-stream tests updated. pairsFlag expectations removed.
- publicBuild, assetsPageCredits, solarLongitudeConvention: Yale/CAMS expectations rewritten (generic unlicensed fixtures; page lists no CAMS, Yale or local-only entry).

Browser scenarios (browser-showers-gmn.mjs removed): each scenario is mapped in the header of browser-showers.mjs and browser-public-showers.mjs (GMN credit, set counts and rule sentence, fetch command, shipped copy, removed switch, no CAMS or Yale request). Dropped: the CAMS-vs-GMN comparison screenshots (one-off for the owner's T-056 source choice). browser-showers.mjs lost its CAMS-only checks (double-entry counts, release hash).

### Extra reads (outside Context Files), with reasons

`tools/data/fetch-hyg-stars.mjs` (stale reference to fetch-stars.mjs), `tests/helpers/measuredOrbits.ts`, `tests/helpers/streamFacts.ts`, `tests/helpers/workbook.mjs`, `tests/helpers/miniWorkbook.mjs` (helpers the listed tests use), `tests/hygStars.test.ts`, `tests/showersMeasuredGeminids.test.ts`, `tests/listedOrbitGroup.test.ts` (flake rerun), `tools/validate/capture-experience-pictures.mjs` and `diff-screenshots.mjs` (picture comparison), `tools/validate/browser-lite.mjs` (header mention of the removed script, one comment edited), `docs/ASTRAEUS_SIMPLIFY_CANDIDATES.md` rows X1, C3, C4, C7, C8.

### Decisions and limitations

- Kept in data: the published-rule quote in `data/showers/*.json` still says the papers applied the rule "to the CAMS v3.0 database" (it is the papers' wording and shows in the panel; changing it would change visible text). `docs/ASTRONOMY_VALIDATION.md` and `docs/DONOR_PROVENANCE.md` still describe CAMS and Yale as history; not edited.
- Visible text that changed on purpose: the Sky panel note ("HYG star catalogue (CC BY-SA 4.0)" instead of the Yale option sentence), the Sky sources list (Yale line removed), the GMN source names in `data/showers/*.json` (the removed `--source gmn` flag text), and the assets page. No picture changed beyond tolerance.
- The dead exports named for T-067 are gone (`FETCH_STARS_COMMAND`, `forgetMeasuredOrbitRequests`). C3/C4/C7 not started: `showerSettings.ts` and `showerDefinition.ts` are smaller (about 40 and 30 lines) but not split; the Perseid and Geminid measured tests are still two files.
- `data/local/` (cams-iau-*, yale-bsc-v65.json, about 450 MB of other files) left on disk, git-ignored; deleting it is the owner's call. The dev server still reads a local `data/local/gmn-iau-N.json` first and falls back to the shipped copy.
- Defect found, not caused here: browser-showers.mjs checkLoop clicked Pause while the Perseids "earth-crossing" story panel (auto-opened during playback) covered it; fixed in the script by closing the panel first.
- The tests/listedOrbitGroup timing test is load-sensitive.
- Git: nothing staged or committed (an earlier `git rm` staging of the deleted files was reset). Deleted files show as unstaged deletions.

## Drift Notes

Design.md sections on local data, the shower builder and the sky need reconciling (Task 7, T-072): the "Measured orbits from a second source", "Texture rights" local-data convention, "Shower builder" source-switch text, and the sky star-source text now describe removed paths (GMN is the only orbit source, HYG the only catalogue, `stream.sources.gmn` required, no `?source=` or `?stars=`).
