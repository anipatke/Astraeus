---
id: I-133
title: The surface lock does not lock the published exports map
type: verification
status: resolved
source:
  kind: check
  check: C-137
  actor: {role: checker, session: o053-check-20261101}
  at: '2026-11-01T06:05:00Z'
tasks: [T-228]
checks: [C-137, C-138]
guardrail_ids: [API-01]
severity: medium
resolution:
  disposition: verified
  check: C-138
  actor: {role: checker, session: o053-recheck-20261101}
  at: '2026-11-01T06:40:00Z'
  reason: 'Repair 7798f19c verified by C-138 CLEAR: the lock records each published package''s x-publish.exports map (and the source map). Checker plants of a deep entry in the engine and in astraeus-data-saturn x-publish.exports, a removed jupiter entry and a source-map entry each fail ''matches the checked-in lock'' naming the package; the lock''s published maps equal every built dist/package.json exports map; api:lock is deterministic. Fresh lint, typecheck, build, test:full (2239 passed), check:engine-alone, check:pack, check:node-consumer and check:react-consumer pass.'
history:
  - at: '2026-11-01T06:05:00Z'
    actor: {role: checker, session: o053-check-20261101}
    kind: observed
    note: Found by the O-053 Full Objective Check. A planted extra entry in the engine's x-publish exports reached dist/package.json while the lock test and check:pack both passed.
    check: C-137
  - at: '2026-11-01T07:00:00Z'
    actor: {role: executor, session: o053-repair-20261101}
    kind: repair_attempted
    note: "Repair, not verified. tools/api-surface.mjs publishedExports now reads x-publish.exports (else exports) into packageExports and keeps the source map as sourceExports; both are compared and locked (api-surface.lock.json regenerated with npm run api:lock). New test locks the published map and proves the x-publish/exports selection. Proof Needed re-run: plant './core/clock' in the engine x-publish.exports -> 'matches the checked-in lock' fails naming 'changed package exports of astraeus'; plant './extra' in astraeus-data x-publish.exports -> same test fails naming astraeus-data; both reverted, tree passes (apiSurface+apiRules 25 passed). Neighbours: lint, typecheck, build, npm test (181 files, 2231 passed, 1 skipped), check:pack pass. Design.md 'O-053 checks' limit text updated. Unverified: no CHANGELOG entry (public root surface unchanged; only the lock's shape grew)."
    check: C-137
  - at: '2026-11-01T06:40:00Z'
    actor: {role: checker, session: o053-recheck-20261101}
    kind: rechecked
    check: C-138
    note: 'Verified by C-138 CLEAR (Full Objective re-check of O-053 at 7798f19c).'
---

# I-133: The surface lock does not lock the published exports map

## Summary

O-053 "API-surface lock (API-01)" and T-228 Done When say the lock holds "each published package's `exports` map" and "a change without updating the lock fails". `tools/api-surface.mjs` `publishedExports()` reads each manifest's source `exports` (`json.exports`): the workspace map the demos and site use (`./core/*`, `./app/*`, `./shell/*`, …). What npm actually publishes is the `x-publish.exports` block, which `tools/build-packages.mjs` (line 186) writes into `dist/package.json`. Nothing locks that map. So the most direct API-01 break, a new published deep entry point, passes every check. `check:pack` only checks that each `exports` target is packed, not which entries exist. Design.md "O-053 checks" lists this as a limit and calls it non-architectural, but that does not meet the Success Condition.

## Evidence

- `tools/api-surface.mjs` `publishedExports`: `out[json.name] = json.exports ?? {};`. `x-publish` is never read.
- `packages/astraeus/api-surface.lock.json` `packageExports.astraeus` holds the source map (`./core/*`, `./tests/*`, `./tools/import/test-io.mjs`, …), not the published `{".", "./style.css", "./package.json"}`.
- Planted break (checker, 2026-11-01, reverted): added `"./core/clock": "./src/core/clock.js"` to `packages/astraeus/package.json` `x-publish.exports`.
  - `cd packages/astraeus-site && npx vitest run tests/apiSurface.test.ts` gave `Tests 6 passed (6)`.
  - `npm run check:pack` gave `pack check: pass (14.4 s)`.
  - `dist/package.json` exports became `{".":…,"./style.css":…,"./package.json":…,"./core/clock":"./src/core/clock.js"}`, so the packed engine would publish a deep entry point.
- No test plants a change to `x-publish.exports`. `apiSurface.test.ts` "names added, removed and changed exports" uses a made-up surface only.

## Proof Needed

- The lock records each published package's published exports map: `x-publish.exports` where a manifest has one, else `exports`. The source map can stay in the lock as well.
- Plant `"./core/clock"` into the engine's `x-publish.exports`: `apiSurface.test.ts` "matches the checked-in lock" fails and names the change. Plant a data package's `x-publish.exports` entry too: same result.
- Removing the plant passes. `npm run api:lock` regenerates the lock deterministically, and the CHANGELOG notes any intended change.
