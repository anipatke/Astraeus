---
id: I-164
title: The engine's first download is over its limit after O-065
type: defect
status: open
source:
  kind: check
  check: C-163
  actor: {role: checker, session: o065-check-20261110}
  at: '2026-11-10T04:56:00Z'
tasks: [T-295, T-296, T-297, T-298]
checks: [C-163]
guardrail_ids: [TEST-01]
severity: medium
history:
  - at: '2026-11-10T04:56:00Z'
    actor: {role: checker, session: o065-check-20261110}
    kind: observed
    note: 'Blocking for O-065: the one browser gate of the Full Objective Check fails on its public-build-assets step. Deterministic (a build size), not a flake.'
    check: C-163
  - at: '2026-11-10T16:20:00Z'
    actor: {role: executor, session: o065-repair-20261110}
    kind: repair_attempted
    note: 'Repair (executor evidence, not verified): ENGINE_LIMIT reset to 1,833,000 raw / 527,000 gzip (measured 1,745,198 / 501,483 by node tools/measure-example.mjs, plus 5%, rounded up to the next 1,000; owner decision 2026-11-10). New fast test packages/astraeus-site/tests/engineBudget.test.ts builds the packed engine and hello-scene (about 3 s) in npm test and holds it to ENGINE_LIMIT, and shows a limit one byte below fails. tools/build-example.mjs now runs its nested npm and vite without the outer npm_config_*, NODE_ENV and vitest variables (under npm test the build was 2,068,776 raw and npm install failed on --allow-scripts); tools/build-example.d.mts added. npm test, typecheck, lint, build and check:pack pass. check:browser not run (the recheck runs it).'
---

# I-164: The engine's first download is over its limit after O-065

## Summary

The engine's size budget (`packages/astraeus-site/tools/validate/engine-budget.mjs`, `ENGINE_LIMIT = { rawLimit: 1_735_000, gzipLimit: 497_000 }`, owner decision 2026-11-01) measures the plain example's first download (`examples/hello-scene` built from the packed engine). On `o065-sky-figures` at 79ba2307 it is 1,745,198 B raw and 501,483 B gzip: 10,198 B raw and 4,483 B gzip over. The step passed in both earlier runs on this day (O-064's `browser-20261109T233911Z` and `browser-20261110T024019Z`), so O-065's engine code (sky figures, looks, tracing, about 1,000 added source lines in `packages/astraeus/src`) pushed it over. The star file is fetched by URL and is not part of this number.

No fast-suite test measures this limit, so every step's builder gates (`npm test`, `check:pack`) passed and nothing caught the growth until the Objective's browser run. The same gap was closed for the API page by I-142 (`tests/apiReference.test.ts`).

## Evidence

- `npm run check:browser`, 2026-11-10T04:47:26Z to 04:52:44Z on 79ba2307: `public-build-assets | scene=none (files only) | exit=1`. Step log (`/tmp/astraeus-check-logs-xNDeEj/public-build-assets.log`): `engineBudget.ok: false`, `raw 1745198`, `gzip 501483`, `rawLimit 1735000`, `gzipLimit 497000`, problems "engine: the plain example's first download is 1745198 bytes raw, over the engine limit of 1735000" and "... 501483 bytes gzipped, over the engine limit of 497000". Summary: `docs/evidence/browser-20261110T044726Z/summary.txt`.
- Every other limit in that step passed (page budgets, star asset, addresses).
- No Task evidence in O-065 records this measurement; T-294 to T-298 ran no browser gate by the run rules.

## Proof Needed

- `npm run check:browser` passes `public-build-assets` with the engine's first download within its limit. Two ways get there: the engine's first download shrinks (for example, code only a sky-figure scene needs is loaded when a scene adds figures), or the owner records a new engine limit with a reason, as the owner did for the API page (`load-budget.mjs`, O-065 T-296).
- Strategic fix (AGENTS.md "Strategic fix first"; I-142 is the precedent): a fast-suite or `check:pack`-time check holds the engine's first download to `ENGINE_LIMIT` from the one source, so engine growth fails at the step that causes it, shown to fail when the limit is set below the current size.

Owner decision 2026-11-10 (coordinator session o065-run-20261110): "Reset limit, add fast test" — reset `ENGINE_LIMIT` by the owner's 2026-11-01 rule (measured size plus 5%, rounded up to the next 1,000 bytes) and add a fast size test so the ordinary test gate catches this next time.
