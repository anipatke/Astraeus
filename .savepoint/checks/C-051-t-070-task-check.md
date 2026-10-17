---
id: C-051
scope: {kind: task, id: T-070}
result: CLEAR
checked_by: {role: checker, session: o017-orchestrator-check-20261017}
executed_session: t070-builder-20261017
checked_at: '2026-10-17T13:30:00Z'
reviewed:
  base_commit: 07be4be
  head_commit: 07be4be
  files:
    - app.html
    - src/app/App.tsx
    - src/app/experienceDefinition.ts
    - src/experiences/apollo11/apollo11Definition.tsx
    - src/experiences/earth-moon/earthMoonExplorer.ts
    - src/experiences/jupiter-io/jupiterIo.ts
    - src/experiences/showers/measuredOrbits.ts
    - src/experiences/showers/showerDefinition.ts
    - data/stories/geminids/gmn-iau-4.json
    - data/stories/perseids/gmn-iau-7.json
    - tools/data/fetch-meteoroid-orbits.mjs
    - tools/validate/load-budget.mjs (new)
    - tools/validate/public-build-assets.mjs
    - tools/validate/browser-lite.mjs
    - tools/validate/browser-showers.mjs
    - tests (experienceDefinition, fetchMeteoroidOrbits, publicBuild, showersMeasured, helpers/measuredOrbits)
    - README.md
  dependencies: ['T-066 (C-047 CLEAR)']
issues: []
supersedes: null
---

# C-051: T-070 Task Check (Quick)

## Scope Lock

1. T-070 Done When 1–6: first-load bytes per page measured against the T-066 baseline; easy wins that do not change what is drawn, with before/after bytes; a per-page budget that fails the public build, proven by a mutation probe; before/after pictures match; the page heading reads "Astraeus" then "<label> · Astraeus" from the definition's label; gates, lite and public showers. Guardrails per the Task.
2. Owner decisions applied during the Check (O-017 Decisions 7 and 8): the builder's quality-85 texture re-encode was reverted by the orchestrator ("I don't want to compromise on quality"); the five textures are byte-identical to HEAD (`git diff --stat -- src/assets` empty; Earth SHA-256 prefix `b68865785011609d` as recorded before). Limits re-derived from the new measurement. Browser evidence is the lite tier plus pictures, not per-area full scripts (Decision 8); the builder's earlier `browser-showers.mjs` pass on the new stream layout stands as supplementary evidence.
3. Out of scope: Design.md and candidates-page reconciliation (T-072).

## Invariants and probes

| Criterion | Actual | Evidence |
|---|---|---|
| DW1 measurement | Public build, `load-budget.mjs`: index 410,045 B raw / 373,790 gzip (upper bound), assets 244,750 / 220,942, Apollo 4,038,691 / 2,720,311, earth-moon 3,671,629 / 2,601,663, jupiter-io 3,802,109 / 1,894,220, Perseids 10,648,446 / 7,072,612, Geminids 13,132,919 / 7,878,822, whole build 21,266,893 / 14,018,016. T-066 baseline: Perseids 10,922,682 raw, Geminids 13,692,592 raw, whole 22,107,479 raw. | `docs/evidence/c051-20261017T004511Z/budget.txt` |
| DW2 easy wins | Lossless only: both stream files in a column layout (Geminids gzip 2,294,009 to 1,798,172; Perseids 1,215,150 to 977,700), every row round-trips (tests). Textures unchanged by owner decision. | builder evidence, tests |
| DW3 budget | Limits = measurement + 5%, rounded up to 10,000 B, in `tools/validate/load-budget.mjs` and the README table. Checker mutation probe: 1,500,000 random bytes appended to the Perseids stream in a copy of the build; budget exit 1, Perseids page and whole build FAIL. Unmutated build exit 0. Self-proof tests in `tests/publicBuild.test.ts`. | `budget-mutation.txt` |
| DW4 pictures | Checker capture from the public preview (5478) against T-066: 8 identical; largest share of pixels differing by more than 16 levels 0.0231% (jupiter-io-wide-phone), within the 0.024% tolerance; assets page differs in size by design (earlier Tasks). | `pictures/diff-vs-before.json` |
| DW5 heading | `app.html` title "Astraeus"; lite run titles: "Apollo 11 · Astraeus", "Earth–Moon · Astraeus", "Jupiter and Io · Astraeus", "Perseids · Astraeus", "Geminids · Astraeus"; made-up experiences "Astraeus". Label comes from each definition (ARCH-01); test in `tests/experienceDefinition.test.ts`. | `lite/results.json` |
| DW6 gates | Checker: `npx tsc --noEmit` exit 0; `npx vitest run` 48 files, 885 passed; `npm run build` exit 0; public build exit 0; validator exit 0; lite 26/26, 0 failed, 85 s; `browser-public-showers.mjs` on the public preview exit 0, 41 s. | `docs/evidence/c051-20261017T004511Z/` |

## Issues Pass

DW1–DW6 Proven. No Issues. No materiality actions are required.

## Observations (non-blocking)

1. `listedOrbitGroup.test.ts` frame-time assertion failed once under load in the builder's run (18.2 ms vs 16.6 ms) and passed on rerun; it has now flaked twice in O-017. A candidate for T-071's trim or a looser bound.
2. Design.md and the candidates page need the budget, the column layout and `label`; deferred to T-072.

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
