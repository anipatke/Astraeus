---
id: T-068
title: Remove two experiment switches and hide the test experiences from the public site
objective: O-017
status: in_progress
stage: audit
depends_on: [{task: T-066, requires: clear}]
owner_validation: {required: false}
planned_by: {role: planner, session: o017-plan-20261017}
---

# Remove two experiment switches and hide the test experiences from the public site

## Outcome

The lighting comparison and the Milky Way picture choice are gone, with their comparison scripts, and the made-up test experiences are not in the public build while still opening on the dev server.

## User Check

On the public preview, `?experience=synthetic` (or any made-up experience) shows the default experience instead, and the demos look unchanged. On the dev server the made-up experiences still open.

## Done When

1. `?lighting=single-sun` and `src/app/lighting.ts`'s second method are removed; the default lighting is unchanged (before/after pictures match).
2. `?skymap=` and the second Milky Way source are removed: one picture source remains (the current default), with its recorded licence; `tests/skyPicture.test.ts` and `tests/jupiterIo.test.ts` updated.
3. `tools/validate/browser-lighting.mjs` and `tools/validate/browser-sky-map.mjs` removed; their pass/fail scenarios, if any, mapped to remaining scripts or stated as comparison-only.
4. Made-up experiences (`src/synthetic/*`, the `synthetic*` keys in `src/main.tsx`) are excluded from the public build (`ASTRAEUS_PUBLIC_BUILD=1`), proven by the public-build validator or a test; the dev server still mounts them and their browser scripts still pass.
5. The sky "up" direction, orbit quality and timeline span switches stay.
6. Gates: typecheck, tests, both builds, validator, lite browser check; plus `browser-sky.mjs` and the synthetic scripts, zero console errors, fresh evidence directory.

## Context Files

`src/app/lighting.ts`, `src/app/AstraeusScene.tsx`, `src/assets/sky.ts`, `src/app/SkyView.ts`, `src/app/skyModel.ts`, `src/main.tsx`, `vite.config.ts`, `tools/validate/public-build-assets.mjs`, `tools/validate/browser-lighting.mjs`, `tools/validate/browser-sky-map.mjs`, `tests/skyPicture.test.ts`, `tests/jupiterIo.test.ts`.

## Design References

Design.md "The sky", lighting, "Public site and launch".

## Guardrails

ARCH-01, ARCH-03, PROV-02, TEST-01, TEST-03.

## Implementation Plan

1. Remove the lighting method and its switch.
2. Remove the sky map choice.
3. Exclude made-up experiences from the public entry; prove it.
4. Remove the two comparison scripts.

## Boundaries

No visual change to any real experience.

## Technical Verification

Configured gates, lite browser check, touched full scripts. Evaluated under `agent-skills/references/check-method.md`.

## Technical Evidence

Executed by the T-068 builder (not a Check). Evidence directories, all fresh, under `docs/evidence/` (each holds `run.log` and its script's JSON where the script writes one): `o017-t068-lite-20261016T223959Z`, `-sky-`, `-sun-`, `-jupiter-io-`, `-earth-moon-`, `-synthetic-`, `-synthetic-belt-`, `-synthetic-eccentric-`, `-synthetic-listed-`, `-synthetic-ring-` (all with suffix `20261016T223959Z`), and `o017-t068-after-20261016T223959Z` (pictures, `diff-vs-before.json`, `public-build-validator.json`).

### Per-criterion outcome

1. Lighting: `?lighting=single-sun`, `?sunLight=`, `LightingModel`, `DEFAULT_LIGHTING`, the single-sun branch and merged render pass are gone (`src/app/lighting.ts` 78 to 17 lines, keeps `bodyLightDirections`). The canvas keeps a fixed `data-lighting="per-body"` so `browser-jupiter-io` still asserts it. Default lighting unchanged: after pictures vs `o017-before-20261016T205125Z` (diff-vs-before.json): 14 of 16 app pictures within 0.024% of pixels differing (run-to-run noise bound), `jupiter-io-wide-desktop` 0.0236%; no picture over the bound; largest over-16 fraction 0.0234%.
2. Sky picture: `?skymap=`, `SkyMapSource`, `SKY_MAP_SOURCES`, `DEFAULT_SKY_MAP`, `sky.source` setting, `parseSkyManifest`, `loadPictureSet`, the equatorial frame (`equatorialUv`, `pictureTexel`, `PictureFrame`), picture `gain`, `data-sky-picture-source` and the NASA entry of `SKY_SOURCES` are removed. One picture remains: the ESO panorama (eso0932a, ESO/S. Brunier, CC BY 4.0, `MILKY_WAY_LICENCE`, accessed 2026-10-13), built on first need by `SkyView.requestPicture()`. `tests/skyPicture.test.ts` rewritten, `tests/jupiterIo.test.ts` and `tests/sky.test.ts` updated.
3. `tools/validate/browser-lighting.mjs`, `tools/validate/browser-sky-map.mjs` removed (and `tools/data/fetch-sky-map.mjs`, which only fed the removed NASA source). Mapping below.
4. Synthetic experiences: `vite.config.ts` defines `__PUBLIC_BUILD__` (true only with `ASTRAEUS_PUBLIC_BUILD=1`); `src/main.tsx` puts the six `synthetic*` keys in a `SYNTHETIC` table that is empty in a public build, so the bundler builds no synthetic chunk. Proof: `tools/validate/public-build-assets.mjs` now runs `checkNoSyntheticExperiences` (fails on a chunk named for a `src/synthetic` module, or an entry key in any text asset) with a self-proof (`proveSyntheticCheck`); public build result `synthetic.ok: true`, no matches, `syntheticSelfProof: true`; a plain (non-public) build run through the same check reports `ok: false` (entry keys and chunks found), so the check discriminates. Tests in `tests/publicBuild.test.ts` (chunk and key detection; `SYNTHETIC_KEYS` equals the keys `main.tsx` mounts). Dev server still mounts them: all five synthetic browser scripts pass on port 5471.
5. Kept untouched: `?up=` sky direction, `?orbits=`, `?span=`.
6. Gates (all run on this tree): `npx tsc --noEmit` clean; `npm test` 49 files, 877 tests pass; `npm run build` ok; `ASTRAEUS_PUBLIC_BUILD=1 npx vite build` ok; `node tools/validate/public-build-assets.mjs <dir> <json>` ok (`ok: true`, 42 files). Browser (dev server 5471, headless Chromium): `browser-lite.mjs` 26/26 loads pass (every experience incl. synthetic, desktop and phone, plus site pages); `browser-sky`, `browser-sun`, `browser-jupiter-io`, `browser-earth-moon`, `browser-synthetic`, `-belt`, `-eccentric`, `-listed`, `-ring` all exit 0 with zero console errors. Pictures from the public preview (5472): `capture-experience-pictures.mjs --url http://localhost:5472` 20 pictures, 0 errors.

### TEST-03 scenario map (removed or rewritten)

- `browser-lighting.mjs` (per-body vs `?lighting=single-sun` screenshots and attribute checks): comparison-only; its per-body assertion (`data-lighting` = per-body) lives on in `browser-jupiter-io.mjs`, and the default look is held by the before/after pictures.
- `browser-sky-map.mjs` (`?skymap=eso` vs `nasa` pictures, asserts reported source, zero errors): comparison-only; the ESO picture drawing with no console errors is covered by `browser-sky.mjs` and the lite check; the reported source attribute was removed with the switch.
- `jupiterIo.test.ts` "reads the lighting model from the query": removed with `lightingFromSearch` (comparison-only). "measures one Sun light ... against the per-body lights" (T-049 measurement of single-sun vs per-body): comparison-only, removed with the single-sun code. "lights Jupiter and Io each along its own Sun direction" kept.
- `skyPicture.test.ts` "accepts what the fetch tool writes" / "states the tone map" / "rejects a bad frame ..." (manifest and fetch-tool checks): NASA-only, removed with the tool and parser. "registration of the NASA map" (Vega, Deneb, vertex placement, fetched tiles): NASA-only; the equivalent ESO vertex-registration scenario is the new "places every vertex of each tile mesh" test (and the existing galactic checks in `sky.test.ts`). "falling back to the ESO panorama" and "reads ?skymap=": removed with the fallback and the switch. "loads the picture only when asked, keeps on/off and brightness" kept as "is built only when asked for, once, keeping the on/off state and brightness"; ESO shape/limit kept; `resolveSkySettings` no longer carries `source` (asserted).
- `tools/validate/browser-lite.mjs`: discovery now reads the `SYNTHETIC` table as well as `DEFINITIONS` (otherwise the split would have silently dropped the synthetic experiences from the lite pass); header no longer names the deleted scripts.

### Extra reads (outside Context Files)

`src/app/App.tsx` (the `lighting`/`sunLight` runtime fields it set); `tests/sky.test.ts` (a `source: "eso"` expectation and the galactic mesh test); `tests/publicBuild.test.ts` and `tools/validate/public-build-assets.d.mts` (where the new check and its test belong); `tools/validate/browser-lite.mjs` (its experience discovery parses `src/main.tsx`); `tools/validate/capture-experience-pictures.mjs`, `diff-screenshots.mjs` (running the picture comparison); `src/types/build.d.ts` created for the `__PUBLIC_BUILD__` declaration. `tools/data/fetch-sky-map.mjs` removed though not a Context File (its only product was the removed NASA picture).

### Limitations

- `site-assets-*` pictures differ in size from "before" (page 406 px shorter: the Sources list lost the NASA Deep Star Maps line), so the diff reports `sizeMismatch`; expected, not a regression. `site-index` within noise.
- The 5471 dev server was started with `--strictPort`; the picture capture used the public preview on 5472 (the capture script otherwise builds its own).
- The NASA star map (`data/local/sky`, `data/local/sky-src`) was deleted by the owner on 2026-10-17; nothing here depends on it.
- `docs/DONOR_PROVENANCE.md` and `docs/ASTRONOMY_VALIDATION.md` still describe the removed NASA map and `?lighting=single-sun` (docs, left for T-072).
- Git: the builder's `git rm` of the three deleted tool files staged them, and they were then included in the coordinator's commit 88a14b5; no other staging, commit or push by the builder.


## Drift Notes

Design.md lighting and sky paragraphs need reconciling (Task 7 / T-072): lighting is per-body only (no single-sun mode, no `?lighting=`/`?sunLight=`); the sky has one Milky Way picture (ESO panorama, CC BY 4.0, galactic frame, built on first need) with no `?skymap=`, no `sky.source`, no NASA/equatorial frame; the entry (`src/main.tsx`) mounts the `synthetic*` experiences only outside a public build (`__PUBLIC_BUILD__`), proved by `checkNoSyntheticExperiences` in `tools/validate/public-build-assets.mjs`. Also `docs/DONOR_PROVENANCE.md` and `docs/ASTRONOMY_VALIDATION.md` mention the removed switches.
