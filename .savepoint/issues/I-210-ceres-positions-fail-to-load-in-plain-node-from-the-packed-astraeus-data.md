---
id: I-210
title: Ceres's positions fail to load in plain Node from the packed astraeus-data
type: defect
status: open
source:
  kind: check
  check: C-226
  actor: {role: checker, session: check-o102-20261127}
  at: '2026-11-27T00:50:00Z'
tasks: [T-467]
checks: [C-226]
guardrail_ids: [TEST-01, API-07]
severity: medium
history:
  - at: '2026-11-27T00:50:00Z'
    actor: {role: checker, session: check-o102-20261127}
    kind: observed
    note: 'C-226 probe against the packed build written by this session''s `npm run check:pack` (throwaway script, deleted): Node 24.16.0 imports packages/astraeus/dist/src/api/index.node.js and packages/astraeus-data/dist/src/index.js; `new Scene().addBody(sun).addBody(ceres).setTimeline(2020-01-01..2020-02-01)`, `await scene.load({ data: [dataSource] })` rejects `bad-data` "astraeus-data: bodyPositions.ceres: TypeError [ERR_IMPORT_ATTRIBUTE_MISSING]: Module \"file:///.../astraeus-data/dist/data/positions/ceres.json\" needs an import attribute of \"type: json\"". Calling `dataSource.bodyPositions.ceres()` directly in Node throws the same.'
    check: C-226
---

# I-210: Ceres's positions fail to load in plain Node from the packed astraeus-data

## Summary

O-102 Success Condition 1 (a scene with `addBody(ceres)` and `astraeus-data` in `data` places and draws Ceres) and the `scene.load` promise ("Works in plain Node", `packages/astraeus/src/api/scene.ts` doc of `load`) fail for a plain-Node host and for any bundler that hands back a JSON module only as its default export. The loader `astraeus-data` ships is `() => import("../data/positions/ceres.json")`: no `with: { type: "json" }` attribute, and no unwrapping of `default`. Every other data package loads its JSON as `await import("...json", { with: { type: "json" } })` then `loaded.default ?? loaded` (Parcel hands back the JSON itself, Vite and webpack a module with a default): `packages/astraeus-data-pluto/src/index.ts:6-9`, the same in jupiter, saturn, mars, neptune and constellations. The engine side (`installData` in `packages/astraeus/src/api/data.ts:80-91`) passes the loader's result straight to `createSeriesModel`, which reads `file.format` at the top level, so even with the attribute a Node module namespace (`{ default }`) would fail as `bad-data`.

The site and the owner's look work because Vite's JSON plugin also gives named exports for top-level keys; the tests run under Vite too, so nothing caught it.

## Evidence

- `packages/astraeus-data/src/index.ts:15` (`bodyPositions: Object.freeze({ ceres: () => import("../data/positions/ceres.json") })`), built unchanged into `packages/astraeus-data/dist/src/index.js:7`.
- `packages/astraeus/src/api/data.ts:86-87`: `Promise.all([load(), import("../core/planetModels")]).then(([series, models]) => models.createSeriesModel(series, id))`.
- `packages/astraeus/src/core/planetModels.ts` `createSeriesModel`: `if (file.format !== fits.format) throw new TypeError(...)`.
- Reproduction above (history entry): `bad-data`, `ERR_IMPORT_ATTRIBUTE_MISSING`.
- Missing test evidence: `tests/ceresBody.test.ts` and `tests/bodyPositionsData.test.ts` run under Vite (named JSON exports); `check:node-consumer` does not load a body's positions from a data package; no test hands `installData` a loader that resolves to a module with only `default`.

## Proof Needed

With the packed packages in plain Node (a case in `check:node-consumer`, or an equivalent packed-build test), `scene.load({ data: [dataSource] })` for a scene holding Ceres resolves and `stateOf("ceres", ...)` gives a position within 1 km of an archived Horizons value. A table test of `DataSource.bodyPositions` covers a loader resolving to the file itself and to a module whose only key is `default` (both accepted), plus the existing malformed rows. Configured gates and `check:pack` pass.
