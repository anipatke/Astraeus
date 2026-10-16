---
id: C-048
scope: {kind: task, id: T-067}
result: CLEAR
checked_by: {role: checker, session: o017-orchestrator-check-20261017}
executed_session: t067-builder-20261017
checked_at: '2026-10-17T09:40:00Z'
reviewed:
  base_commit: 800ecd8
  head_commit: 800ecd8
  files:
    - src/experiences/showers/measuredOrbits.ts
    - src/experiences/showers/showerSettings.ts
    - src/experiences/showers/showerDefinition.ts
    - src/main.tsx
    - src/assets/sky.ts
    - src/app/skyModel.ts
    - src/app/AstraeusScene.tsx
    - data/showers/perseids.json
    - data/showers/geminids.json
    - tools/data/fetch-meteoroid-orbits.mjs
    - tools/data/fetch-stars.mjs (deleted)
    - tools/validate/public-build-assets.mjs
    - tools/validate/browser-showers.mjs
    - tools/validate/browser-showers-gmn.mjs (deleted)
    - tools/validate/browser-sky.mjs
    - tools/validate/browser-public-showers.mjs
    - tests (11 files, 2 helpers deleted)
    - assets.html
    - README.md
    - docs/ASTRAEUS_SPIKE_04.md
  dependencies: ['T-066 (C-047 CLEAR)']
issues: []
supersedes: null
---

# C-048: T-067 Task Check (Quick)

## Scope Lock

1. T-067 Done When 1–7: CAMS and Yale paths removed from code, settings, tools, tests, browser scripts, validator, pages and docs; a settings file naming `cams` is refused with a named error; GMN and HYG behaviour unchanged; gates, lite tier and the touched full scripts pass with zero console errors. Guardrails DATA-01, ARCH-01, PROV-01, PROV-02, TEST-01, TEST-03.
2. Reviewed as uncommitted work on branch `o017-simplify` at `800ecd8` (37 files outside `.savepoint` and evidence, 370 added, 1610 removed).
3. Out of scope: C3, C4, C7 (T-069), switches (T-068), I-034.

## Invariants and probes

| Criterion | Actual | Evidence |
|---|---|---|
| DW1 code | Checker grep over `src tools data/showers tests README.md assets.html index.html` for `cams|yale|stars=|?source`: remaining hits are only the HYG catalogue's own name ("Hipparcos, Yale Bright Star, Gliese"), the `?stars=<brightness>` number switch (a different setting), the refusal message in `showerSettings.ts:182`, and tests or browser scripts asserting absence. Diff read: `orbitSources` refuses `stream.source` and `stream.sources.cams` with named `ShowerSettingsError`s and requires `stream.sources.gmn`; `loadStarCatalogue` reads only the committed HYG file; `main.tsx` no longer reads `?source=`. Tests `tests/showers.test.ts` table rows "a missing GMN entry", "a CAMS entry", "a source choice" and the dedicated refusal test cover missing and old input. | grep, diff |
| DW2 tools | `fetch-stars.mjs` and `.d.mts` deleted; `fetch-meteoroid-orbits.mjs` GMN-only. | diff |
| DW3 tests | Checker run: `npx vitest run`, 49 files, 883 passed, 0 skipped (before T-067: 906 passed, 1 skipped; the drop is the removed CAMS/Yale suites, mapped in the Task's Technical Evidence). | `docs/evidence/c048-showers-20261016T221428Z/c048-test.txt` |
| DW4 browser scripts | Checker re-ran both touched shower scripts. `browser-public-showers.mjs` against a fresh public build preview (port 5470): exit 0, 42 s, "public build probe passed for geminids, perseids", `consoleErrors: []`, including the `?source=cams` ignored scenario. `browser-showers.mjs` against the dev server (5302): exit 0, 886 s, "2 of 2 showers passed", `errors: []`, `removedSwitches: "?source=cams&stars=yale ignored; no source switch; no CAMS or Yale request"`. Builder's sky and lite results read from their JSON: sky 6 runs, 0 errors, star source hyg 8920; lite 26 of 26 loads, 0 failed. | `docs/evidence/c048-public-showers-20261016T221428Z/`, `docs/evidence/c048-showers-20261016T221428Z/`, `o017-t067-sky-*`, `o017-t067-lite-*` |
| DW5 validator | Checker run on a fresh `ASTRAEUS_PUBLIC_BUILD=1` build: `ok: true`, `selfProof: true`, 52 files, 0 matches. Re-run after the owner had the local CAMS and Yale files deleted (owner instruction 2026-10-17): still `ok: true`, `selfProof: true`, 10 local files checked; the validator does not depend on the removed files. | `c048-validator.txt`, `c048-validator-2.txt` |
| DW6 pages and docs | `assets.html`, `README.md` carry no CAMS or Yale entries (asserted by `tests/assetsPageCredits.test.ts`); `docs/ASTRAEUS_SPIKE_04.md` gains one dated line; `.gitignore` untouched (`data/local/` still ignored, `git check-ignore`). | diff |
| DW7 gates | Checker: `npx tsc --noEmit` exit 0; `npm run build` exit 0; public build exit 0. | `c048-tsc.txt` |
| Boundaries | No change to `data/stories/` (GMN copies) or `src/assets/stars/` (HYG) (`git diff --stat` empty). Before/after pictures: showers pixel-identical on desktop, other views within the 0.024% run-noise tolerance from C-047 (builder's `diff-vs-before.json`, repeat run confirms the one 0.037% figure was noise); assets page differs by design. | git, `o017-t067-after-*` |

## Issues Pass

DW1–DW7 Proven. No Issues. No materiality actions are required.

## Observations (non-blocking)

1. `data/showers/perseids.json` GMN source name still says the file is "kept in the git-ignored data/local/ for now", although a copy ships under `data/stories/perseids/`. The wording predates T-067; worth correcting in T-069 or T-072.
2. The published rule quote shown in the panel still says "CAMS v3.0 database"; it is the papers' own wording and is left on purpose.
3. `docs/ASTRONOMY_VALIDATION.md` and `docs/DONOR_PROVENANCE.md` describe CAMS and Yale as history; Design.md sections are listed in the Task's Drift Notes for T-072.
4. `tests/listedOrbitGroup.test.ts` showed a timing flake under load in the builder's run; it passed in the checker's run.

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
