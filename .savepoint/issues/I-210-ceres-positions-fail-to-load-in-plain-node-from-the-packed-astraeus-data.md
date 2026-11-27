---
id: I-210
title: Ceres's positions fail to load in plain Node from the packed astraeus-data
type: defect
status: resolved
source:
  kind: check
  check: C-226
  actor: {role: checker, session: check-o102-20261127}
  at: '2026-11-27T00:50:00Z'
tasks: [T-467]
checks: [C-226, C-227]
guardrail_ids: [TEST-01, API-07]
severity: medium
resolution:
  disposition: verified
  check: C-227
  actor: {role: checker, session: recheck-o102-20261127}
  at: '2026-11-27T01:14:00Z'
  reason: 'C-227 CLEAR: Proof Needed met independently. Packed tarballs (npm pack of packages/astraeus/dist and packages/astraeus-data/dist) in a scratch consumer, Node 24.16.0: scene.load({ data: [dataSource] }) with Ceres resolves; stateOf("ceres") vs archived Horizons 0.162 km (1987-03-17) and 0.061 km (2038-11-02). Loader shapes through a custom DataSource: file, Node default-only namespace, Vite default+named all accepted; {default: null}, {default: "x"}, {} give bad-data. bodyPositionsData 9 rows and check:node-consumer 13 passed; npm test 5787 passed 2 skipped; check:pack pass.'
history:
  - at: '2026-11-27T00:50:00Z'
    actor: {role: checker, session: check-o102-20261127}
    kind: observed
    note: 'C-226 probe against the packed build written by this session''s `npm run check:pack` (throwaway script, deleted): Node 24.16.0 imports packages/astraeus/dist/src/api/index.node.js and packages/astraeus-data/dist/src/index.js; `new Scene().addBody(sun).addBody(ceres).setTimeline(2020-01-01..2020-02-01)`, `await scene.load({ data: [dataSource] })` rejects `bad-data` "astraeus-data: bodyPositions.ceres: TypeError [ERR_IMPORT_ATTRIBUTE_MISSING]: Module \"file:///.../astraeus-data/dist/data/positions/ceres.json\" needs an import attribute of \"type: json\"". Calling `dataSource.bodyPositions.ceres()` directly in Node throws the same.'
    check: C-226
  - at: '2026-11-27T00:59:00Z'
    actor: {role: executor, session: repair-o102-c226-20261127}
    kind: repair_attempted
    note: 'Repaired on both sides (T-467 scope, evidence in T-467 "Repair after C-226"). astraeus-data: the Ceres loader imports the JSON with `{ with: { type: "json" } }` and returns `loaded.default ?? loaded`, as the other data packages. Engine: `installData` unwraps a JSON module''s object `default` (`jsonOf` in api/data.ts), so the file itself, a default-only module (plain Node) and a default-plus-named module (Vite) all work. Proof: new `check:node-consumer` case loads Ceres from the packed astraeus-data in plain Node through `scene.load({ data: [dataSource] })` and matches the archived Horizons state (TDB 2038-11-02T20:00:13, JPL#48) within 1 km: 13 passed; with HEAD''s two files it FAILED (red first). `bodyPositionsData.test.ts` gains rows for the file itself (existing "valid"), a default-only module, a default-plus-named module and a malformed series inside default, beside the existing malformed rows: 9 passed; the default-only row fails at HEAD. Gates: typecheck, eslint and prettier on changed files, `npm test` 363 files 5787 passed 2 skipped, build, `check:pack` pass (engine 1,849,338 / 530,471 within 1,850,000 / 530,500). Not run: browser checks; non-Vite bundlers other than plain Node (covered by the unwrap rule, not separately probed).'
  - at: '2026-11-27T01:14:00Z'
    actor: {role: checker, session: recheck-o102-20261127}
    kind: rechecked
    note: 'C-227: Proof Needed met independently. Packed tarballs (npm pack of packages/astraeus/dist and packages/astraeus-data/dist) in a scratch consumer, Node 24.16.0: scene.load({ data: [dataSource] }) with Ceres resolves; stateOf("ceres") vs archived Horizons 0.162 km (1987-03-17) and 0.061 km (2038-11-02). Loader shapes through a custom DataSource: file, Node default-only namespace, Vite default+named all accepted; {default: null}, {default: "x"}, {} give bad-data. bodyPositionsData 9 rows and check:node-consumer 13 passed; npm test 5787 passed 2 skipped; check:pack pass. Closed as verified.'
    check: C-227
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
