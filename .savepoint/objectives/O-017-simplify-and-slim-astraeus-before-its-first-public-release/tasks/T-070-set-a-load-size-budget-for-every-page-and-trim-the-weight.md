---
id: T-070
title: Set a load-size budget for every page and trim the weight
objective: O-017
status: done
depends_on: [{task: T-066, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o017-plan-20261017}
---

# Set a load-size budget for every page and trim the weight

## Outcome

The public build fails if any page's first load grows past its stated limit, and the obvious weight (pictures, stream data files) is trimmed without visible change.

## User Check

The assets page or README states each page's first-load size and its limit. The demos look the same.

## Done When

1. A measurement of first-load bytes per page (index, assets, app with each real experience) from the public build, compressed and uncompressed, using Task 1's before numbers as the baseline.
2. Easy wins applied where they do not change what is drawn: picture re-compression or resizing within PROV-02 (licence records updated if the file changes), stream data files in a leaner format or compression, anything else the measurement shows; each with before and after bytes.
3. A budget test (in `tools/validate/public-build-assets.mjs` or a new test beside it) with one limit per page, set from the post-trim measurement plus a stated headroom, failing the build when exceeded; a mutation probe shows it fails.
4. Before/after pictures of the affected experiences match (Task 1's tool).
5. Page heading (owner, 2026-10-17: "Update the page heading as part of this cleanup"): `app.html`'s `<title>` no longer says "Astraeus Earth–Moon spike". It reads "Astraeus" until an experience opens, then "<experience label> · Astraeus", taken from the experience definition's own label so the shell names no experience (ARCH-01); a test or browser assertion covers both.
6. Gates: typecheck, tests, both builds, validator with the budget, lite browser check, plus the public-showers script.

## Context Files

`app.html`, `vite.config.ts`, `tools/validate/public-build-assets.mjs`, `tests/publicBuild.test.ts`, `src/assets/textures/earth-bmng-july-4k.jpg`, `src/assets/licence.ts`, `data/stories/perseids/gmn-iau-7.json`, `src/experiences/showers/measuredOrbits.ts`, `docs/ASTRAEUS_SIMPLIFY_CANDIDATES.md`.

## Design References

Design.md "Public site and launch", "Texture rights", the lazy planet series.

## Guardrails

PROV-02, TEST-01, TEST-03, STYLE-07.

## Implementation Plan

1. Measure.
2. Trim the largest safe items.
3. Add the budget and prove it fails when exceeded.

## Boundaries

No visual change; no phone frame-rate or start-up work (O-017 decision 5).

## Technical Verification

Configured gates, budget mutation probe, before/after pictures. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

### Handoff summary (executor, 2026-10-17)

Measured first, trimmed three kinds of weight, added a per-page budget to the public-build validator, changed the page heading. All gates pass; the one exception to say plainly is in Limitations (picture comparison against the strict "any pixel differs" figure).

### Per-criterion outcome

1. **Measurement.** Built the public build of the current code (T-067..T-069 done) to a scratch directory and summed each page's first-load files, raw and gzip, with a new tool (`tools/validate/load-budget.mjs`); the app pages equal what headless Chromium fetched byte for byte (`docs/evidence/o017-t070-gates-20261017T001915Z/first-load-before-after.json`, static vs browser). T-066 baseline (browser, desktop, `docs/evidence/o017-before-20261016T205125Z/first-load.json`), pre-trim static on the current code, post-trim static (bytes raw / gzip):

| Page | T-066 baseline raw | Pre-trim raw / gzip | Post-trim raw / gzip | Limit raw / gzip |
|---|---|---|---|---|
| `index.html` (all 12 files it names; fonts external, not counted) | 630,024 (capture, incl. fonts) | 410,045 / 373,790 | 410,045 / 373,790 | 440,000 / 400,000 |
| `assets.html` (all 10 files) | 551,506 (capture, incl. fonts) | 244,750 / 220,942 | 244,750 / 220,942 | 260,000 / 240,000 |
| Apollo 11 | 4,046,212 | 4,038,535 / 2,720,337 | 3,734,239 / 2,413,006 | 3,930,000 / 2,540,000 |
| earth-moon | 3,678,856 | 3,671,470 / 2,601,676 | 3,367,177 / 2,294,360 | 3,540,000 / 2,410,000 |
| jupiter-io | 3,809,334 | 3,801,948 / 1,894,246 | 3,640,580 / 1,732,763 | 3,830,000 / 1,820,000 |
| shower-perseids | 10,922,682 | 10,911,032 / 7,307,200 | 9,270,623 / 5,691,830 | 9,740,000 / 5,980,000 |
| shower-geminids | 13,692,592 | 13,680,942 / 8,366,387 | 11,755,096 / 6,498,040 | 12,350,000 / 6,830,000 |
| whole build (42 files) | 22,107,479 (disk, T-066) | 22,078,097 / 14,740,323 | 19,889,070 / 12,637,234 | 20,890,000 / 13,270,000 |

   The site pages are not made lighter; their old figures were a screenshot capture with external Google Fonts, and these are the upper bound with every lazy picture loaded (C-047 observation 1).
2. **Easy wins, before / after bytes.**
   - `data/stories/geminids/gmn-iau-4.json` 5,630,107 -> 5,081,427 raw; gzip (zlib default) 2,294,009 -> 1,798,172.
   - `data/stories/perseids/gmn-iau-7.json` 2,860,197 -> 2,596,954 raw; gzip 1,215,150 -> 977,700. Lean format: rows stored column by column, the epoch as differences from the row before (`provenance.layout: "columns"`, written by the fetch tool's `shippedCopy`, read by `parseMeasuredOrbits`). Lossless: both conversions were checked row for row (51,115 and 25,588 rows round-trip exactly); originals were byte-identical to `JSON.stringify` of their parse. No value rounded.
   - `earth-bmng-july-4k.jpg` 1,559,348 -> 1,254,896; `jupiter-2k.jpg` 498,976 -> 337,447; `mercury-2k.jpg` 872,555 -> 533,469; `venus-2k.jpg` 885,075 -> 566,219; `sun-2k.jpg` 822,427 -> 568,527 (JPEG quality 92/94 -> 85, same pixel size, metadata stripped, ImageMagick 6.9.12; PSNR 35.9 to 43.9 dB per file). PROV-02: change recorded with both SHA-256 values in `docs/DONOR_PROVENANCE.md` ("Texture size trim") and a note in `src/assets/bodies/earth.ts`; source and licence records unchanged. Moon, Io, Mars and the Milky Way pictures left alone.
   - Left alone on purpose: `planetModels` chunk 1,391,800 (the full VSOP87A series; accuracy-bearing, docs/ASTRONOMY_VALIDATION.md), `app` chunk 1.22 MB (three.js, React), the Milky Way pictures (3.7 MB, not part of any first load: only `?milkyway=`), Google Fonts (external).
3. **Budget.** `tools/validate/load-budget.mjs`, run by `tools/validate/public-build-assets.mjs` on every public build (fails the validator, exit 1), with tests beside it in `tests/publicBuild.test.ts`. One raw and one gzip limit per page set plus the whole build, each = post-trim measurement + 5% rounded up to the next 10,000 B. The page sets also fail when a listed file is not in the build, or a listed script statically imports a script not listed (an eager new chunk). Mutation probes: (a) `docs/evidence/o017-t070-gates-20261017T001915Z/mutation-probe-perseids-stream-plus-500kB.log`: 500,000 random bytes appended to the Perseids stream file in a copy of the public build -> `FAIL app.html?experience=shower-perseids` (9,770,623 B raw over 9,740,000; gzip 6,193,163 over 5,980,000), exit 1, and `public-build-assets.mjs` on the same copy exits 1 (`mutation-probe-validator.log`); (b) the pre-trim build fails five page sets and the whole build (`budget-vs-pre-trim-build.log`); (c) the validator's own self-proof and `tests/publicBuild.test.ts` fail on a heavier picture, a stale set, an unlisted import and an unlisted heavy file.
4. **Pictures.** `docs/evidence/o017-t070-after-20261017T002116Z/` (20 pictures, `run.log`, `first-load.json`) against the T-066 set: `docs/evidence/o017-t070-after-20261017T002116Z/diff-vs-before.json`; against a pre-trim set of the same code `docs/evidence/o017-t070-pretrim-20261017T001333Z/` (`docs/evidence/o017-t070-after-20261017T002116Z/diff-vs-pretrim.json`, and `docs/evidence/o017-t070-pretrim-20261017T001333Z/diff-pretrim-vs-before.json` shows the earlier tasks alone moved nothing past noise). Tolerance 0.024% of pixels: experiences not touching a recompressed picture are inside it (Apollo, Earth-Moon wide, Perseids, Geminids, site pages: differing 0 to 0.0225%, over-16-levels 0 to 0.0159%). Two pairs of views exceed the plain "any pixel differs" figure; see Limitations.
5. **Heading.** `app.html` `<title>` is "Astraeus"; `ExperienceDefinition` gained an optional `label` (Apollo 11, Earth–Moon, Jupiter and Io, and for showers the settings file's own label); `App` sets `document.title` to `pageTitleOf(definition)` = "<label> · Astraeus" (no label: "Astraeus"). The shell names no experience (ARCH-01). Covered by `tests/experienceDefinition.test.ts` ("the page heading") and by the lite browser script (`browser-lite.mjs`: app.html title exactly Astraeus, open title per experience, never "spike"): `docs/evidence/o017-t070-lite-20261017T002316Z/results.json` shows "Apollo 11 · Astraeus", "Earth–Moon · Astraeus", "Jupiter and Io · Astraeus", "Geminids · Astraeus", "Perseids · Astraeus", and "Astraeus" for the made-up experiences.
6. **Gates** (evidence `docs/evidence/o017-t070-gates-20261017T001915Z/`): `npx tsc --noEmit` ok (`tsc.log`); `npm test` 48 files, 885 tests passed (`npm-test.log`; the first run, `npm-test-run1-timing-flake.log`, failed one frame-time assertion in `listedOrbitGroup.test.ts` at 18.2 ms vs 16.6 ms while other work ran, and passed unchanged on the rerun); `npm run build` ok (`build.log`); public build (`ASTRAEUS_PUBLIC_BUILD=1 vite build --outDir <scratch>`) and `node tools/validate/public-build-assets.mjs <dir>` exit 0 with the budget (`public-build-assets.json`: `ok: true`, `budgetSelfProof: true`). Lite browser: `ASTRAEUS_URL=http://localhost:5476/app.html node tools/validate/browser-lite.mjs` 26/26 loads, zero console and page errors (`docs/evidence/o017-t070-lite-20261017T002316Z/`). `browser-public-showers.mjs` against the public preview (5477): OK, zero console errors (`docs/evidence/o017-t070-public-showers-20261017T002447Z/run.log`). The stream files changed, so the full shower script `browser-showers.mjs` ran on the dev server: 2 of 2 showers passed (geminids, perseids), errors: [] in both (`docs/evidence/o017-t070-showers-20261017T002536Z/run.log`).

### Files read and changed

Read (Context Files): `app.html`, `vite.config.ts`, `tools/validate/public-build-assets.mjs`, `tests/publicBuild.test.ts`, `src/assets/licence.ts`, `src/experiences/showers/measuredOrbits.ts`, `docs/ASTRAEUS_SIMPLIFY_CANDIDATES.md`, `src/assets/textures/earth-bmng-july-4k.jpg` (identify only), `data/stories/perseids/gmn-iau-7.json` (parsed).
Changed: `app.html`; `src/app/App.tsx`, `src/app/experienceDefinition.ts` (label, `pageTitleOf`); the four definitions (`apollo11Definition.tsx`, `earthMoonExplorer.ts`, `jupiterIo.ts`, `showerDefinition.ts`: `label`); `src/experiences/showers/measuredOrbits.ts` (column layout reader); `tools/data/fetch-meteoroid-orbits.mjs` and `.d.mts` (`toColumns`, `fromColumns`, `rowsOfFile`, shipped copy in columns); `data/stories/{geminids/gmn-iau-4,perseids/gmn-iau-7}.json`; five textures; `src/assets/bodies/earth.ts` (comment); `docs/DONOR_PROVENANCE.md`; `README.md`; new `tools/validate/load-budget.mjs` and `.d.mts`; `tools/validate/public-build-assets.mjs`, `browser-lite.mjs`, `browser-showers.mjs` (reads rows through `rowsOfFile`); tests `experienceDefinition`, `fetchMeteoroidOrbits`, `publicBuild`, `showersMeasured`, `helpers/measuredOrbits`.

### Extra reads (logged)

- `tools/data/fetch-meteoroid-orbits.mjs` and `tests/fetchMeteoroidOrbits.test.ts`, `tests/showersMeasured.test.ts`, `tests/helpers/measuredOrbits.ts`: they write and read the shipped file, which the lean format changes.
- `src/main.tsx`, `src/app/App.tsx`, `src/app/experienceDefinition.ts`, `src/shell/experience.ts`, the four experience definition files: where the heading comes from (no experience label existed).
- `tools/validate/browser-lite.mjs`, `browser-showers.mjs` (row use), `capture-experience-pictures.mjs`, `diff-screenshots.mjs`: heading assertion, the rows reader, measuring and comparing.
- `docs/DONOR_PROVENANCE.md`, `src/assets/bodies/earth.ts`: PROV-02 change records.
- `src/core/planetSeries.ts` and the head of the built `planetModels` chunk: to decide whether the 1.4 MB chunk is trimmable (it is the VSOP87A series: left alone).

### Limitations

- Picture comparison: `diff-screenshots` counts any pixel that differs by at least one level. After the recompression Earth close-up differs in 5.9% (desktop) and 14.6% (phone) of pixels, Jupiter-Io close-up in 11.8% and 25.1%, but by at most 13 levels (Earth) and 25 (Jupiter, a single label edge; 7 on the phone) and none of them by more than 16 levels apart from label-edge noise already present between two runs of the unchanged code (Jupiter-Io wide desktop 0.0282% over 16 levels vs 0.0197% for the same view with no texture change). Whole-picture PSNR 59 to 62 dB; the Earth close-up pair was viewed side by side and shows no visible change. So "same look" holds visually but the strict 0.024%-of-pixels figure is exceeded for four views (Earth close, Jupiter close, both sizes), purely from JPEG quantisation of the textures. If the owner wants those within 0.024%, the recompression must go (or move to quality 92+, which saves far less).
- The `assets.html` pictures differ in size from the T-066 set (page height changed by earlier Tasks); `diff-vs-before.json` marks them size mismatch; against the pre-trim set they are identical (0 pixels).
- The budget page sets are a maintained table, cross-checked by the build (missing files, unlisted static imports) and against the browser once (equal to the byte); a new lazily loaded file that a page starts fetching is only caught by the whole-build limit or a browser check. External Google Fonts on the site pages are not counted.
- No phone frame-rate or start-up work; no Check written; Task status unchanged.


## Drift Notes

Design "Public site and launch" gains the budget (Task 7): the per-page first-load limits (README table; `tools/validate/load-budget.mjs`), the column layout of the shipped orbit files (`provenance.layout: "columns"`), the recompressed textures (PROV-02 note in DONOR_PROVENANCE) and the experience `label` that names the page heading. Deferred to Task 7, which accounts for them as reflected in Design.md.

## Owner Completion — 2026-10-17

Textures reverted to their originals by the orchestrator on the owner's decision ("I don't want to compromise on quality"); limits re-measured. Marked done on the owner's standing instruction ("yes, mark each clear step done and keep going") after Quick Task Check C-051 CLEAR.
