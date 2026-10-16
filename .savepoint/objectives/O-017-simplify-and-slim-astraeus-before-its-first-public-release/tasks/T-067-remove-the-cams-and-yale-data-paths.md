---
id: T-067
title: Remove the CAMS and Yale data paths
objective: O-017
status: planned
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

Pending execution.

## Drift Notes

Design.md sections on local data, the shower builder and the sky need reconciling (Task 7).
