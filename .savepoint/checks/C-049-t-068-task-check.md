---
id: C-049
scope: {kind: task, id: T-068}
result: CLEAR
checked_by: {role: checker, session: o017-orchestrator-check-20261017}
executed_session: t068-builder-20261017
checked_at: '2026-10-17T11:10:00Z'
reviewed:
  base_commit: be98e36
  head_commit: 5dfd356
  files:
    - src/app/lighting.ts
    - src/app/AstraeusScene.tsx
    - src/app/App.tsx
    - src/assets/sky.ts
    - src/app/SkyView.ts
    - src/app/skyModel.ts
    - src/main.tsx
    - src/types/build.d.ts (new)
    - vite.config.ts
    - tools/validate/public-build-assets.mjs
    - tools/validate/browser-lite.mjs
    - tools/validate/browser-lighting.mjs (deleted)
    - tools/validate/browser-sky-map.mjs (deleted)
    - tools/data/fetch-sky-map.mjs (deleted)
    - tests/skyPicture.test.ts
    - tests/jupiterIo.test.ts
    - tests/publicBuild.test.ts
    - assets.html
  dependencies: ['T-066 (C-047 CLEAR)']
issues: []
supersedes: null
---

# C-049: T-068 Task Check (Quick)

## Scope Lock

1. T-068 Done When 1–6: `?lighting=` and the single-sun method removed with default lighting unchanged; `?skymap=` and the NASA picture source removed with the ESO panorama and its licence kept; the two comparison scripts removed with scenarios mapped; made-up experiences excluded from the public build and still mounted on the dev server, proven by the validator or a test; sky "up", orbit quality and timeline span switches kept; gates, lite, `browser-sky.mjs` and the synthetic scripts pass with zero console errors. Guardrails ARCH-01, ARCH-03, PROV-02, TEST-01, TEST-03.
2. Reviewed as uncommitted work on `o017-simplify` plus three deletions that landed in commit 88a14b5 (see Observation 1). 16 files changed in the working tree, +197/-499.
3. Out of scope: C1–C5, C7, C8 (T-069); docs history (T-072).

## Invariants and probes

| Criterion | Actual | Evidence |
|---|---|---|
| DW1 lighting | Checker grep for `single-sun|sunLight|lighting=`: only a history comment in `src/app/lighting.ts:7` and the `data-lighting="per-body"` attribute remain. Before/after pictures within the 0.024% tolerance (largest 0.0236%, jupiter-io-wide-desktop). | grep; `o017-t068-after-20261016T223959Z/diff-vs-before.json` |
| DW2 sky picture | Grep for `skymap|picture-source|Deep Star|svs.gsfc.nasa.gov/4851`: only a mapping comment in `tests/skyPicture.test.ts:3`. ESO licence record kept (PROV-02); the NASA line is gone from the assets page. | grep |
| DW3 scripts removed | `browser-lighting.mjs`, `browser-sky-map.mjs` and `fetch-sky-map.mjs` deleted; scenario map in the Task's Technical Evidence (comparison-only scenarios named; per-body lighting kept in `browser-jupiter-io.mjs`; ESO tile registration a new test). | Task evidence |
| DW4 public build excludes synthetic | `src/main.tsx` `SYNTHETIC` is `{}` when `__PUBLIC_BUILD__` (defined in `vite.config.ts`). Checker public build: validator `ok: true`, `synthetic.ok: true`, 4 modules checked, 0 matches, `syntheticSelfProof: true`. Checker probe on the public preview (5473): `?experience=synthetic` and `?experience=synthetic-ring` open the default Apollo experience, zero console errors; the only request naming "synthetic" is the page address itself. Checker lite run on the dev server lists all six synthetic experiences and passes. | `docs/evidence/c049-20261016T225736Z/validator.json`, `public-fallback-probe.json`, `lite/results.json` |
| DW5 kept switches | Not touched by the diff (sky up, orbit quality, timeline span). | diff |
| DW6 gates | Checker: `npx tsc --noEmit` exit 0; `npx vitest run` 49 files, 877 passed; `npm run build` exit 0; public build exit 0; lite 26 of 26 loads, 0 failed, 86 s. Builder's touched scripts (sky, sun, jupiter-io, earth-moon, five synthetic) each exited 0 with `run.log` in `o017-t068-*-20261016T223959Z/`. | `docs/evidence/c049-20261016T225736Z/` |

## Issues Pass

DW1–DW6 Proven. No Issues. No materiality actions are required.

## Observations (non-blocking)

1. Three deletions (`tools/data/fetch-sky-map.mjs`, `tools/validate/browser-lighting.mjs`, `tools/validate/browser-sky-map.mjs`) were staged by the builder and swept into commit 88a14b5 ("Add G-006 and O-021"). The content is correct; the commit grouping is wrong. Not rewritten (local history only; recorded here).
2. The public page title still reads "Astraeus Earth–Moon spike". Worth fixing before launch (T-069, T-072 or O-020).
3. `docs/DONOR_PROVENANCE.md` and `docs/ASTRONOMY_VALIDATION.md` still describe the NASA map and `?lighting=single-sun`; Design.md lighting and sky paragraphs are listed in Drift Notes for T-072.
4. The NASA star map files were deleted from disk on the owner's instruction (2026-10-17); nothing reads them.

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
- [x] STYLE-10 **Small diffs**
