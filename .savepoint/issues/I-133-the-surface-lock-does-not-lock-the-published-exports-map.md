---
id: I-133
title: The surface lock does not lock the published exports map
type: verification
status: open
source:
  kind: check
  check: C-137
  actor: {role: checker, session: o053-check-20261101}
  at: '2026-11-01T06:05:00Z'
tasks: [T-228]
checks: [C-137]
guardrail_ids: [API-01]
severity: medium
history:
  - at: '2026-11-01T06:05:00Z'
    actor: {role: checker, session: o053-check-20261101}
    kind: observed
    note: Found by the O-053 Full Objective Check. A planted extra entry in the engine's x-publish exports reached dist/package.json while the lock test and check:pack both passed.
    check: C-137
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
