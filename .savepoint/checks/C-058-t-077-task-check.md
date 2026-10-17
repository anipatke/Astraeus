---
id: C-058
scope: {kind: task, id: T-077}
result: CLEAR
checked_by: {role: checker, session: o017-orchestrator-check-20261017}
executed_session: t077-builder-lane-20261017
checked_at: '2026-10-17T23:30:00Z'
reviewed:
  base_commit: b1cf3f2
  head_commit: 437ae7e
  files:
    - tools/import/planetary-explorer.mjs (new), tools/import/ts-resolve-hook.mjs, tools/import/test-io.mjs, tools/import/planetary-explorer-map-sources.json
    - data/bodies/ (24 packages, catalogue.json, README.md)
    - tests/bodyPackages.test.ts
  dependencies: []
issues: []
supersedes: null
---

# C-058: T-077 Task Check (Quick)

## Scope Lock

T-077 Done When 1–6: package format for all 24 bodies; importer with donor commit, dry run, refusal without a map source, idempotence; exact preservation of every feature; coordinate convention proven against the donor's `latLonToXYZ`; counts and oddities reported; gates. Built in lane `o018-t077` (437ae7e), checked after merging into `o018-o019` (60380e5) on top of main 7377a87.

## Invariants and probes

| Criterion | Actual | Evidence |
|---|---|---|
| DW1 format | `data/bodies/<body>/` features, categories, overview, map (with coordinate convention, texture SHA-256 and source) for 24 bodies; format README. | files |
| DW2 importer | Checker re-ran `node tools/import/planetary-explorer.mjs --out <scratch>`: exit 0; `diff -rq` against the committed packages: identical except the hand-written `README.md`. Refusal without a source shown by the builder (exit 1 naming 8 bodies). | `docs/evidence/c058-20261017T042418Z/import-rerun.txt` |
| DW3 exact preservation | `tests/bodyPackages.test.ts` (all 403 features, `Object.is` on lat/lon, deep-equal objects) passes in the checker's suite. Independent checker probe: 3 random features per body (72) read straight from the donor's JSON and compared field by field with the package: 0 mismatches; per-body counts equal. | `docs/evidence/c058-20261017T042418Z/test.txt`, probe output |
| DW4 convention | Test compares placement by the recorded convention with a verbatim copy of the donor's `latLonToXYZ` (moon, ganymede, tethys, triton, europa, earth) and the copy with the donor's own export over a grid. | test |
| DW5 oddities | 12 ring-only features without lat/lon; 0–360 longitudes on many bodies (range recorded per body); 8 bodies' map sources from Astraeus traces; Ceres not shippable; Ganymede's 180° recorded as picture-only. Reported, nothing silently fixed. | `data/bodies/catalogue.json` |
| DW6 gates | Checker on the merged tree: `npx tsc --noEmit` exit 0; `npx vitest run` 57 files, 937 passed, 1 skipped; `npm run build` exit 0. | `docs/evidence/c058-20261017T042418Z/` |

## Issues Pass

DW1–DW6 Proven. No Issues. No materiality actions are required.

## Observations (non-blocking)

1. The importer needs Node with type stripping (22.18+ or 24); `package.json` engines should say so (Drift Note).
2. `docs/DONOR_PROVENANCE.md` and Design.md need the package lines (Drift Notes), for the next O-018 Task that touches them.

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
