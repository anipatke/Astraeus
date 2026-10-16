---
id: T-056
title: Read measured meteor orbits from the Global Meteor Network as a second source
objective: O-011
status: done
depends_on: [{task: T-038, requires: clear}, {task: T-039, requires: clear}]
owner_validation: {required: true, accepted_check: C-035, accepted_by: {role: owner, session: owner-chat-20261017}}
planned_by: {role: planner, session: o011-orchestrator-check-20261013}
lane: showers
planned_reads: [tools/data/fetch-meteoroid-orbits.mjs, src/experiences/showers/measuredOrbits.ts, src/experiences/showers/showerSettings.ts, src/experiences/showers/showerDefinition.ts, data/showers/perseids.json, data/showers/geminids.json, tests/fetchMeteoroidOrbits.test.ts, tests/showersMeasured.test.ts, tests/helpers/streamFacts.ts, tools/validate/public-build-assets.mjs]
planned_writes: [tools/data/fetch-meteoroid-orbits.mjs, tools/data/fetch-meteoroid-orbits.d.mts, src/experiences/showers/measuredOrbits.ts, src/experiences/showers/showerSettings.ts, src/experiences/showers/showerDefinition.ts, data/showers/perseids.json, data/showers/geminids.json, tests/fetchMeteoroidOrbits.test.ts, tests/showersMeasured.test.ts, docs/ASTRONOMY_VALIDATION.md, docs/DONOR_PROVENANCE.md]
---

# Read measured meteor orbits from the Global Meteor Network as a second source

## Outcome

A shower's measured orbits can come from either CAMS (current) or the Global Meteor Network (GMN), chosen by a setting with a live switch and a URL parameter. GMN data is CC BY 4.0 (https://globalmeteornetwork.org/data/, checked 2026-10-16), so unlike CAMS it may be shipped publicly with credit. The Perseids can then be shown and compared from both sources.

## Astraeus Hypothesis

- **Capability tested:** that the measured-orbit stream is source-agnostic. A second catalogue enters through the fetch tool and the same local file shape, with no change to the listed-orbit group or the shower builder beyond reading the source choice.
- **Contract reused:** `createListedOrbitGroup`, the `data/local/` loader, the all/reliable quality switch, the fact helpers.
- **Gap:** only CAMS is read. CAMS terms are unconfirmed, so nothing measured can be shipped.
- **Owner direction (2026-10-16):** "Let's plug in GMN and see what it looks like for Perseids", after the checker confirmed the GMN licence and counted 21,363 / 34,094 / 30,338 PER rows in the Aug 2023 / 2024 / 2025 monthly files.

## User Check

Compare Perseids from CAMS and from GMN side by side (screenshots are fine while the owner is remote). The owner decides which source to use by default.

## Done When

1. The fetch tool reads GMN `traj_summary_monthly_YYYYMM.txt` files (`;`-separated; column 5 is the IAU shower code; orbit columns a, e, i, peri, node, Sol lon, Vgeo with sigma, Qc), selected by the IAU code and by months or years named in the settings. It writes `data/local/gmn-iau-<code>.json` (git-ignored) in the same column layout as the CAMS file, with a provenance header: source URL, licence CC BY 4.0, the two citations (Vida et al. 2020 MNRAS 491(2); Vida et al. 2021 MNRAS 506(4)), files, byte sizes, SHA-256, fetch time, counts and filter. Column positions are verified from the header row on every run, and the tool throws if they move. Unbound orbits (e ≥ 1) are dropped and counted.
2. The settings choose the source (`stream.source: "cams" | "gmn"`, plus the GMN months), with a live Developer switch and `?source=cams|gmn`. The all/reliable rule maps to GMN's own columns (Qc ≥ 15°, Vgeo sigma ≤ 10% of Vgeo) and is stated. The panel names the source, its licence and the counts. The default stays CAMS until the owner decides.
3. Facts for GMN Perseids, using the existing helpers (J2000): the median Vg against MDC 58.8; the busiest solar-longitude bin against 140.1; the peak day from the minimum ellipse distance; the radiant from members passing near Earth against RA 47.9 / Dec +57.9. All figures recorded beside the CAMS figures in ASTRONOMY_VALIDATION.
4. Licence handling: GMN data is CC BY 4.0, so it MAY be committed or shipped, but this Task does not ship it. Keep it in `data/local/` for now. Whether to commit a GMN subset for the public build is an owner decision, recorded as a follow-up.
5. Screenshots for the owner, in a fresh evidence directory: Perseids from CAMS and from GMN with matching camera views (overview at the peak with the sky on; whole orbit; close on Earth's crossing) at desktop size, plus GMN all vs reliable.
6. Gates pass (typecheck, build, full vitest). browser-showers passes for both showers with the default source, plus a GMN Perseids run, all with zero console errors. The public-build validator still finds no local data in `dist`.

## Context Files

As planned_reads.

## Design References

Design: Spike 04 shower fixtures (O-011); listed-orbit group; local-data convention (T-051/T-053).

## Guardrails

ARCH-01, ARCH-03, PROV-01, PROV-02, TEST-01, TEST-03.

## Implementation Plan

1. Read the GMN column documentation (https://globalmeteornetwork.org/data/media/GMN_orbit_data_columns.pdf) and a monthly file header. Map the columns.
2. Extend the fetch tool with a GMN reader. Fetch the Perseid months (Jul and Aug of 2025, or as settled), plus Geminids Dec 2025 if cheap.
3. Add the source setting and switch, then the facts and the screenshots.

## Boundaries

No change to the listed-orbit group or the engine core. Never commit `data/local/`. Don't change the CAMS path's behaviour.

## Technical Verification

Configured gates, browser-showers, the public-build validator. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Built 2026-10-16 by the builder session (no Check written, Task not set to done, nothing committed). Evidence directory: `docs/evidence/o011-t056-20261016T082514Z/` (logs, `browser-showers/` screenshots, and `compare/` for the owner).

### Per-criterion outcome

1. **Fetch tool reads GMN.** `tools/data/fetch-meteoroid-orbits.mjs <iau> --source gmn --months 202507,202508 [--dir <folder>] [--out <file>]` downloads each monthly file to a temp folder, streams it line by line, selects by the IAU number column (and records the 3-letter code, which must be one code: "PER"), and writes `data/local/gmn-iau-7.json` (git-ignored) with the CAMS row layout (`pairsFlag` always 0). Header: source URL pattern, readme, licence CC BY 4.0 + licence URL, both citations (Vida 2021 MNRAS 506(4); Vida 2020 MNRAS 491(2)), files with URL, bytes, SHA-256 and last-modified, fetch time (2026-10-16T08:22:59Z), counts, filter, column positions per file. Column positions are looked up from the two header rows (name over unit) on every run; the tool throws on a missing or repeated column, an uncertainty column that does not follow Vgeo, a row of the wrong width, data before the header rows, and when the data fail the range / node-against-solar-longitude check (reused `checkLayout`). Unbound (e >= 1) dropped and counted. Real run: 214,156 rows scanned, 32,234 PER (Jul 1,896; Aug 30,338, equal to the checker's figure), 6,619 unbound and 27 incomplete dropped, 25,588 kept. Files: 202507 82,100,886 bytes sha256 4a14afab...ede8fd; 202508 117,046,295 bytes sha256 276d405f...d616e9. Unit tests (5 new in `tests/fetchMeteoroidOrbits.test.ts`) cover layout, drops, refusal of shifted or reshaped files, time parsing and the written file's acceptance by `parseMeasuredOrbits`.
2. **Source setting, switch, URL parameter.** `stream.source: "cams" | "gmn"` (default "cams") and `stream.sources: { cams, gmn? }` in the settings (`gmn` holds months, licence, licence URL, source citation, rule note); `?source=cams|gmn` in `src/main.tsx` (gmn only where the settings name it); live switch "Orbits from CAMS" / "Orbits from GMN" in Developer > Display settings (the existing `alternates` mechanism, reloads with the parameter; shown only for a shower with a GMN entry, so Geminids has none). The rule maps to GMN's columns (Qc >= 15 deg, Vgeo sigma <= 10% of Vgeo) and the panel states it; the panel names the source, licence CC BY 4.0, months and counts. Default stays CAMS. Browser-asserted in `tools/validate/browser-showers-gmn.mjs`.
3. **Facts, J2000, beside CAMS.** Recorded in `docs/ASTRONOMY_VALIDATION.md` (new "Second source" subsection with the table) from the GMN suite in `tests/showersMeasured.test.ts`: median Vgeo 58.63 / 58.64 (all / reliable) against 58.8; busiest 0.5 deg solar-longitude bin 140.0-140.5 against 140.1; smallest mean-distance day 2027-08-13, fitted minimum -0.09 d / -0.06 d from the peak instant; radiant RA 47.85 Dec +57.86 (0.04 deg off) from 11,251 members; CAMS beside them (58.59; 139.5-140.0; +0.16 d; 0.29 deg).
4. **Licence handling.** GMN data stays in `data/local/`; nothing committed or shipped. `docs/DONOR_PROVENANCE.md` records the licence and the fetch. Follow-up for the owner: whether to commit a GMN subset for the public build, and which source is the default.
5. **Screenshots.** `docs/evidence/o011-t056-20261016T082514Z/compare/` (16 files, below), desktop 1440x900, paused AT the peak (timeline reads 2027-08-13T10:41:43Z, 25 s after the 10:41:18 instant; the script allows 60 s and checks playback is paused), sky on, matching camera moves for CAMS and GMN, GMN all vs reliable, and one 16:9 card per view per source (picture only, controls and labels hidden).
6. **Gates.** `npm run typecheck` and `npm run build` pass; `npx vitest run`: 43 files, 808 passed, 1 skipped (the workbook-sample test, needs CAMS_XLSX). `browser-showers.mjs` with no argument (both showers, default source, includes the T-040 plain-load scenario): 2 of 2 passed, errors [] for both. `browser-showers-gmn.mjs`: ok, zero console errors. Public build (`ASTRAEUS_PUBLIC_BUILD=1 vite build`, validated with `node tools/validate/public-build-assets.mjs <dir>`): ok, 4 local data files checked (cams-iau-4, cams-iau-7, gmn-iau-7, yale-bsc-v65), none in the output.

### Commands run

`node tools/data/fetch-meteoroid-orbits.mjs 7 --source gmn --months 202507,202508`; `npm run typecheck`; `npm run build`; `npx vitest run` (and focused runs of tests/showers.test.ts, tests/fetchMeteoroidOrbits.test.ts, tests/showersMeasured.test.ts); vite dev server on port 5199 (stopped afterwards); `PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js ASTRAEUS_EVIDENCE_DIR=<dir>/browser-showers node tools/validate/browser-showers.mjs`; the same env with `node tools/validate/browser-showers-gmn.mjs`; `ASTRAEUS_PUBLIC_BUILD=1 npx vite build --outDir <scratch> --emptyOutDir` then `node tools/validate/public-build-assets.mjs <scratch>`.

### Screenshot files (compare/)

cams-overview-peak.png, gmn-overview-peak.png (plain load, sky on, paused at the peak); cams-whole-orbit-peak.png, gmn-whole-orbit-peak.png (Whole orbit preset); cams-earth-crossing-peak.png, gmn-earth-crossing-peak.png (Overview preset scrolled in 8 steps: the inner planets' paths, Earth and the stream crossing); gmn-all-overview-peak.png, gmn-reliable-overview-peak.png, gmn-all-earth-crossing-peak.png, gmn-reliable-earth-crossing-peak.png (all vs reliable); cards: cams-card-overview-peak.png, gmn-card-overview-peak.png, cams-card-whole-orbit-peak.png, gmn-card-whole-orbit-peak.png, cams-card-earth-crossing-peak.png, gmn-card-earth-crossing-peak.png.

### Files read

As the Task's planned reads (fetch tool and its .d.mts, measuredOrbits.ts, showerSettings.ts, showerDefinition.ts, perseids.json, geminids.json, the two tests, streamFacts.ts, public-build-assets.mjs).

Extra reads (logged): `src/main.tsx` (where the orbit file is loaded and `?orbits=` is read, to add `?source=`); `tests/helpers/measuredOrbits.ts` (the fixture reader, to add the GMN file); `src/app/App.tsx` and `src/app/experienceDefinition.ts` (how `alternates` become Developer buttons); `tests/showers.test.ts` (settings fixtures); `tools/validate/browser-showers.mjs` (read only: its CAMS-only assertions are why the GMN run is a separate script); `.savepoint/config.yml` (gates); `vite.config.ts` (public-build switch); `docs/ASTRONOMY_VALIDATION.md` and `docs/DONOR_PROVENANCE.md` (to add entries); GMN monthly files and the column PDF (data, in a scratch folder).

### Files changed

`tools/data/fetch-meteoroid-orbits.mjs`, `tools/data/fetch-meteoroid-orbits.d.mts`, `src/experiences/showers/measuredOrbits.ts`, `src/experiences/showers/showerSettings.ts`, `src/experiences/showers/showerDefinition.ts`, `data/showers/perseids.json`, `data/showers/geminids.json`, `tests/fetchMeteoroidOrbits.test.ts`, `tests/showersMeasured.test.ts`, `docs/ASTRONOMY_VALIDATION.md`, `docs/DONOR_PROVENANCE.md` (planned writes). Outside the planned writes: `src/main.tsx` (the `?source=` parameter), `tests/helpers/measuredOrbits.ts` (reads the GMN file), `tests/showers.test.ts` (settings fixture follows the new `stream.source`/`stream.sources` shape, new orbit-source tests), new `tools/validate/browser-showers-gmn.mjs`, new evidence directory. `tools/validate/browser-showers.mjs` and the T-040 / I-028 files were not touched. The router was not edited.

### Deviations and limitations

- The Task names `stream.source: "cams" | "gmn"`, but `stream.source` was already the CAMS citation object. The citation moved to `stream.sources.cams` (both settings files and the test fixture updated) so the setting can have the Task's name.
- The GMN run is a new script, `browser-showers-gmn.mjs`, not a `?source=gmn` run of `browser-showers.mjs`: that script's CAMS-specific assertions (double entries, orbit file name, counts) cannot hold for GMN. Its CAMS path is unchanged and passed.
- The "Earth's crossing" view is the Overview preset scrolled in, not Focus Earth: the dots are spread along whole orbits (illustrative), so none are in sight of Earth at Focus Earth scale (checked).
- Reliable GMN is 91% of the drawn set (CAMS 84%): the same numeric rule on GMN's own columns; GMN has no double-entry flag.
- GMN elements are used as published (J2000 per the node-against-solar-longitude check, not an independent equinox check). One year of data (2025), a single network.
- The configured test command also writes junit.xml; the gate was run as plain `npx vitest run` (same tests). A dev `npm run build` output (which holds the local-only Earth and Moon textures) fails `public-build-assets.mjs` by design; the public build passes.
- Headless software-GL screenshots; the owner's visual judgement is still required (owner_validation).

### Owner decisions (2026-10-16, after the build)

1. Default source: asked via AskUserQuestion, the owner chose "Global Meteor Network (Recommended)". `data/showers/perseids.json` now has `stream.source: "gmn"`; the Geminids stay on CAMS; CAMS stays available through the Developer switch and `?source=cams`. The panel credits the GMN by default (name, CC BY 4.0, months, counts, both Vida et al. citations: asserted by `browser-showers-gmn.mjs`). Tests and scripts that assumed a CAMS default now pass `"cams"` explicitly or `?source=cams`. The one edit to the strict `tools/validate/browser-showers.mjs` (which also holds the uncommitted T-040/I-028 changes and T-057's base-URL change): every `experience=shower-${shower}` URL gained `&source=cams` (8 places) plus one comment line, so the CAMS path stays covered; nothing else.
2. Shipping: asked via AskUserQuestion, the owner chose "Yes, ship it with the demo (Recommended)". `fetch-meteoroid-orbits.mjs ... --source gmn --ship perseids` writes the compact committed copy `data/stories/perseids/gmn-iau-7.json` (10 columns; same provenance header; 2,860,143 bytes, about 1.2 MB gzipped). The loader (`loadMeasuredOrbits(iau, source, story)`) reads it in production (a hashed asset via `import.meta.glob("data/stories/*/*.json")`) and falls back to it in development when no local file exists; it refuses a shipped-folder file whose licence is not on the shippable list. Only licences CC BY 4.0 and CC0 1.0 ship; CAMS and Yale declare none, so `shippedCopy` throws for them (tested). The validator exempts only local files that declare a shippable licence (a small additive change to `findLocalDataSources`, merged with T-057's `REQUIRED_PAGES` change in the same file); CAMS and Yale stay checked. A public build (`ASTRAEUS_PUBLIC_BUILD=1`) passes the validator and, under `vite preview`, the Perseids load the stream from `/assets/gmn-iau-7-*.json` (browser assertion, 25,588 orbits, panel credits GMN; `?source=cams` is "not fetched" there).
   Evidence: `docs/evidence/o011-t056-<stamp>-default/` (gates, browser runs, shipped run).

### Follow-ups for the owner

1. (Done, see Owner decisions.) The owner commits `data/stories/perseids/gmn-iau-7.json` with the story.
2. A GMN Geminid fetch is a separate decision.

## Drift Notes

For the Design reconciliation (named integration Task: T-040): a second measured-orbit source (GMN, CC BY 4.0) read by the same fetch tool into the same local file shape; the `stream.source` / `stream.sources` settings, `?source=cams|gmn` and the Developer source switch; the panel's GMN sentence (source, licence, months, counts); the reliable rule applied to GMN's Qc and Vgeo sigma columns. The listed-orbit group and engine core are unchanged.
