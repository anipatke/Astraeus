---
id: T-060
title: Ship real stars from the HYG catalogue on the public site
objective: O-016
status: done
depends_on: []
owner_validation: {required: true}
planned_by: {role: planner, session: o016-plan-20261016}
---

# Ship real stars from the HYG catalogue on the public site

## Outcome

The public build draws the naked-eye stars from HYG v4.2 (CC BY-SA 4.0), credited, so visitors see real stars. Local builds keep Yale available as an option.

## User Check

Open the public build and compare the sky with the local Yale sky: the same bright stars and constellations in the same places, with similar brightness. The assets page credits HYG.

## Done When

1. A fetch tool downloads HYG v4.2 from its official home (astronexus / Codeberg), checks the licence text, and writes a trimmed naked-eye file (magnitude limit matching today's Yale set) with source, version, URL, access date and licence recorded.
2. A star asset with an AssetLicence record (PROV-02). The public-build validator accepts it, and still rejects Yale in the public build.
3. Position and magnitude check against Yale for shared stars (by HR or HIP id), J2000, within stated tolerances. Test names recorded.
4. The assets page, README credits and DONOR_PROVENANCE are updated. CC BY-SA applies to the star file only; the code stays MIT, and this is said plainly.
5. The sky browser script passes in both builds, with screenshots in a fresh evidence directory.

## Context Files

`src/app/skyModel.ts`, `src/app/SkyView.ts`, `src/assets/sky.ts`, `tests/sky.test.ts`, `tests/publicBuild.test.ts`, `tests/textureLicence.test.ts`, `tools/validate/browser-sky.mjs`, `assets.html`, `README.md`, `docs/DONOR_PROVENANCE.md`.

## Design References

Sky and assets; public build.

## Guardrails

PROV-02, ARCH-04, TEST-01..03, STYLE-06.

## Implementation Plan

1. Find how Yale stars load and how the public build swaps assets.
2. Write the HYG fetch-and-trim tool, then the asset and licence record.
3. Add the comparison tests and the public-build switch.
4. Update the credits, then run the browser scripts.

## Boundaries

No changes to the Milky Way picture. Don't commit data/local. No engine changes.

## Technical Verification

Gates plus browser-sky in both builds. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Executed 2026-10-16 by a builder session (no router writes; no commit; no Task Check requested, none waived). Task `status: in_progress`, `stage: audit` (ready for a Check; not passed).

**Source and licence (read 2026-10-16).** HYG database by astronexus. Project page https://www.astronexus.com/projects/hyg: "current version: v4.2", "licensed with the Creative Commons Attribution-ShareAlike 4.0 license". File https://www.astronexus.com/downloads/catalogs/hygdata_v42.csv.gz (13,636,976 bytes, SHA-256 5ca9431ff364c8002a4a3efa91b2b9296746aea1543374db4cb6b4fab049d601, 119,626 records). Downloaded for inspection into an empty scratch directory and treated as data. The archive https://codeberg.org/astronexus/hyg has since moved to v4.4 (README: duplicate Gliese merges and two label changes; same CC BY-SA 4.0, its `LICENSE` file). v4.2 is no longer in the Codeberg tree, so v4.2 comes from astronexus.com as the Task asked; the v4.2 and v4.4 naked-eye sets differ in 2 rows of 8,920. The owner may prefer v4.4; the tool takes the URL from one constant.

**1. Fetch tool.** `tools/data/fetch-hyg-stars.mjs` (header records source, version, URL, licence). It downloads the file, checks the project page still names v4.2 and CC BY-SA 4.0 (throws if not), parses CSV as data, keeps `mag <= 6.5` (Yale's limit), skips the Sun, converts RA hours to degrees, and writes `src/assets/stars/hyg-v42-naked-eye.json` with a provenance header (source, version, page, archive, licence, licenceUrl, attribution, accessed 2026-10-16, filter, counts, licenceScope "This file only. The Astraeus code is MIT."). Result: 8,920 stars of 119,626 records, 284,317 bytes (116,387 gzipped). Types: `tools/data/fetch-hyg-stars.d.mts`. Tests: `HYG fetch tool parsing` (3 cases) in `tests/hygStars.test.ts`.

**2. Asset and licence record, public validator.** `HYG_STAR_LICENCE` (AssetLicence) in `src/assets/sky.ts`; tested equal to the file header and accepted by `textureRightsProblem`. `tools/validate/public-build-assets.mjs` gained `checkStarAsset` (complete shippable licence record, and the build must contain the file byte for byte) and `proveStarAssetHandling`; the validator result now has `starAsset`. Public build: `ASTRAEUS_PUBLIC_BUILD=1 npm run build` then `node tools/validate/public-build-assets.mjs` gives ok true, starAsset ok true, 0 matches, 13 data/local files checked (Yale among them; none in dist), no missing pages. Tests in `tests/publicBuild.test.ts`: `shipped HYG star asset (T-060)`: accepts the build that contains the licensed HYG file, whatever the hashed name; rejects a build without the star file; rejects a star file whose licence is not CC BY-SA 4.0 or whose record is incomplete; still rejects Yale (existing `proveLicenceHandling` and `proveItFails` data checks).

**Choice.** HYG is the default everywhere (public and local), loaded as a bundled asset (`?url` import, fetched). Yale stays selectable locally with `?stars=yale` (`starSourceFromSearch`, `loadStarCatalogue(source)` in `src/assets/sky.ts`); in a production build `yale` is ignored and HYG is drawn, and when the Yale file is absent it falls back to HYG. The public build contains no Yale bytes (validator). No App.tsx edit: a sky setting control for the star source is not added; the Sky info item says "HYG catalogue (CC BY-SA 4.0)" or "locally fetched Yale catalogue" only when the caller passes `source` in the star status. App.tsx currently passes `{kind: "loaded", count}` only, so its text is the neutral "HYG by default, the locally fetched Yale catalogue with ?stars=yale" (report to the coordinator: pass `source: loaded.source` there).

**3. Comparison with Yale (J2000 position and magnitude).** The local Yale file carries no HR/HIP ids, so shared stars are paired by position (each Yale star with its nearest HYG star within 30 arcsec); this is stated in the test. `tests/hygStars.test.ts`, `HYG against the Yale set, shared stars (J2000)` (4 tests, run because `data/local/yale-bsc-v65.json` exists here, skipped elsewhere): finds a HYG counterpart within 30 arcsec for at least 98% of the Yale stars (measured 8,306 of 8,404 = 98.8%; the rest are variables whose HYG mean V exceeds 6.5 or split doubles); agrees in position (median under 1.5 arcsec, 99th percentile under 6, none over 20; measured median 0.66, 99th 3.97, max 16.2); agrees in magnitude (median under 0.03, 95th percentile under 0.15; measured 0.01 and 0.07; pairs brighter than V 3 within 1.5, worst 1.36 for variables and split pairs such as Castor, Alpha Centauri and Betelgeuse); the same stars brighter than V 2 are in both within 15 arcsec (one may be a split pair). Always-run: `HYG star asset (T-060)`: holds the naked-eye stars, V 6.5 or brighter, with Sirius the brightest; finds the five named stars within 3 arcsec of the published J2000 positions and within 0.5 mag; records the licence; stays under 330 KB.

**4. Credits.** `assets.html` (sky figure tag and caption, Bright stars row, credits list: HYG row plus a local-only Yale option row), `README.md` (optional-steps line, assets table, credit lines), `docs/DONOR_PROVENANCE.md` (new HYG paragraph before the GMN paragraph in the T-053 sky section, plus a note and a tail fix on the Yale paragraph; nothing else edited). Each says in one line that CC BY-SA 4.0 covers the star file only and the code stays MIT. Not edited: the README picture caption on line 7 ("Stars: Yale Bright Star Catalogue"), because that picture still shows Yale stars until the O-016 re-shoot (T-064 or the image Task) replaces it.

**5. Browser, both builds.** `tools/validate/browser-sky.mjs` updated: expected count is 8,920 from the committed file (`ASTRAEUS_STARS=yale` expects 8,404), the panel must cite HYG and CC BY-SA 4.0, and it now closes the Apollo story panel before counting pixels (that panel, from the concurrent story-panels work, covers the mobile canvas and made the pixel assertion fail identically with Yale; verified before the edit with `ASTRAEUS_STARS=yale`). Run sequentially against my own servers (vite dev on 5402, `vite preview` of the public build on 5403, both stopped): `docs/evidence/o016-t060-20261016T110603Z/local/` and `.../public/` (`browser-sky.json`, screenshots; PNGs are git-ignored), logs `local-run.log` and `public-run.log`: both exit 0, 6 runs each (Apollo, Earth-Moon, Perseids at 1280x800 and 390x844), 8,920 stars drawn, errors 0 (page and console). Side-by-side Yale-left HYG-right screenshots of the same view: `docs/evidence/o016-t060-20261016T110603Z/compare/side-{apollo,earth-az0,earth-az120,earth-az240,perseids}.png` (plus the single images, including `*-public.png` from the public build); no console errors in that run either. Looked at: the same bright stars sit in the same places, the Pleiades clump in earth-az0 shows more resolved members in HYG; HYG draws 6% more stars (8,920 vs 8,404, the extra are Hipparcos stars at V <= 6.5 that Yale lacks). Orion and Perseus/Cassiopeia were not framed deliberately (the view links use arbitrary azimuths); the Perseids run is the shower view. An earlier run in which local and public ran at the same time timed out and was discarded (scratch).

**Gates (final, after all edits).** `npm run typecheck` clean; `npm run build` ok; `ASTRAEUS_PUBLIC_BUILD=1 npm run build` ok then `node tools/validate/public-build-assets.mjs` ok; `npx vitest run`: 48 files, 883 passed, 1 skipped (not from this Task). New tests this Task: 13 in `tests/hygStars.test.ts` (4 asset, 3 tool, 2 source, 4 Yale comparison), 4 in `tests/publicBuild.test.ts`; `tests/sky.test.ts` item text test updated.

**Files read beyond Context Files (reason).** `vite.config.ts`, `tools/validate/public-build-assets.mjs`, `tools/data/fetch-stars.mjs`, `tools/data/fetch-sky-map.mjs` (style), `src/assets/licence.ts`, `src/app/App.tsx` and `src/app/AstraeusScene.tsx` (how the loader is called; not edited), `src/app/viewLink.ts` (view links for screenshots), `src/shell/StoryPanelView.tsx` (close button selector, grep only), `tests/sky.test.ts` (edited).

**Limitations.** v4.2 not v4.4 (above). Yale pairing is by position, not HR/HIP (no ids in the local Yale file). Source-selection control not exposed in the UI (`?stars=` only). Front page, assets-page and README pictures still show Yale stars until re-shot.

## Drift Notes

- Design.md (Sky and assets) still describes the Yale file as the star source; the HYG default, the `?stars=` option and the `checkStarAsset` rule need reflecting there by the integration Task or explicitly marking non-architectural.
- `tools/validate/browser-sky.mjs` now closes the Apollo story panel; the story-panels builder should confirm `.story-panel-close` stays the selector.

Owner closed this Task on 2026-10-20 (structured question in the agent session: "Close five, plan portfolio"), on its CLEAR Task Check. The O-016 Full Objective Check still covers it.
