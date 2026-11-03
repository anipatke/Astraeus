---
id: I-142
title: The API reference page is over its load budget after O-056's doc comments
type: defect
status: resolved
source:
  kind: check
  check: C-146
  actor: {role: checker, session: o056-check-20261103}
  at: '2026-11-03T11:04:00Z'
tasks: [T-259, T-260, T-261, T-262, T-263, T-264]
checks: [C-146, C-147]
guardrail_ids: [TEST-01]
severity: medium
resolution:
  disposition: verified
  check: C-147
  actor: {role: checker, session: o056-recheck-20261103}
  at: '2026-11-03T11:26:00Z'
  reason: 'C-147 CLEAR: check:browser public-build-assets passes (api/index.html 118,927 raw / 150,000, 26,965 gzip / 30,000, owner limit 2026-11-03), and the fast test in apiReference.test.ts fails when the page exceeds either limit.'
history:
  - at: '2026-11-03T11:04:00Z'
    actor: {role: checker, session: o056-check-20261103}
    kind: observed
    check: C-146
    note: 'Found by the O-056 Full Objective Check (C-146). The one npm run check:browser (10:52:19-10:58:24Z on 180535a4) failed at public-build-assets (exit=1): loadBudget.ok false, only problem "api/index.html: 118927 bytes raw is over the limit of 100000". Every other step passed, including hello-planets. Direct measurement with buildApiPage(): main (43157c80) 94,439 bytes, HEAD (180535a4) 118,927 bytes. Evidence folder docs/evidence/browser-20261103T105219Z (summary.txt); step log /tmp/astraeus-check-logs-AcyxuZ/public-build-assets.log.'
  - at: '2026-11-03T12:00:00Z'
    actor: {role: executor, session: o056-i142-repair}
    kind: repair_attempted
    note: 'Owner decision 2026-11-03 (asked by the coordinator): "Raise the plain limit (Recommended)". Changed: api/index.html rawLimit 100_000 to 150_000 in packages/astraeus-site/tools/validate/load-budget.mjs (gzipLimit 30_000 unchanged; measured 118,927 raw, 26,894 gzip), with a comment giving the decision, date and reason. Added the fast test "keeps the generated page within the api/index.html raw and gzip limits of load-budget.mjs (I-142)" in packages/astraeus-site/tests/apiReference.test.ts: it renders the page from the already-collected exports with renderApiPage (the same function buildApiPage calls) and asserts raw and gzip bytes against the PAGES entry read from load-budget.mjs (one source, no copied numbers). Also fixed C-146 slips: Design.md test list (sunLook.test.ts and eventZonesDom.test.ts were extended, not added; camera.reach and camera.fitted are existing members) and the trailing space at eventZonesDom.test.ts:262. Gates on the working tree: npm run lint, typecheck, build, test all exit 0 (test: 207 files, 2606 passed, 2 skipped). Not run: npm run check:browser (public-build-assets) and a demonstration that the new test fails under a lowered limit; both unverified. The Issue stays open for a Check.'
  - at: '2026-11-03T11:26:00Z'
    actor: {role: checker, session: o056-recheck-20261103}
    kind: rechecked
    check: C-147
    note: 'Verified by C-147 CLEAR (Full Objective re-check of O-056 at 99d9608b). One npm run check:browser 11:17:39-11:23:48Z: 10/10 steps exit 0; public-build-assets api/index.html raw 118927 (limit 150000), gzip 26965 (limit 30000). Mutations of load-budget.mjs, each restored: raw limit 118926 fails the new test (expected 118927 <= 118926); gzip limit 20000 fails (expected 26965 <= 20000); exact limits 118927/26965 pass. Evidence docs/evidence/check-o056-recheck-20261103/. Note: the repair note and load-budget comment say 26,894 gzip; measured 26,965 (observation only).'
---

# I-142: The API reference page is over its load budget after O-056's doc comments

## Summary

The site's API reference page (`/api`, `api/index.html`) is built from the engine's public entry and its doc comments (`packages/astraeus-site/tools/site/api-reference.mjs`, `buildApiPage`). O-056 added many public members and long doc comments: `Scene.load`, `check`, `setLook`, the eight scene reads, `LookInput`, `SunGlowLook`, `LookRead`, the six new handle members, `withinSeconds` and the read types. The page grew from 94,439 to 118,927 bytes raw. Its budget is 100,000 raw and 30,000 gzip (`packages/astraeus-site/tools/validate/load-budget.mjs:41`). Gzip is 26,965, still within its limit; the raw limit fails.

So the browser gate fails, and the Full Objective Check needs that gate. No step ran it before this Check: under the run rules, browser checks run only at the Objective Check. No fast test measures the page. The builders' lite gates (`npm test`) passed, so nothing caught the growth when it happened.

## Evidence

- `npm run check:browser`, 2026-11-03T10:52:19Z to 10:58:24Z on 180535a4: `public-build-assets | scene=none (files only) | exit=1`. The step's JSON reports `loadBudget.ok: false`, page `api/index.html`, `raw 118927`, `gzip 26965`, `rawLimit 100000`, `gzipLimit 30000`, with the problem "118927 bytes raw is over the limit of 100000 (own share: 118927 B in all less 0 B engine)". Every other page in the step is within its limits, and every other step passed.
- `node --input-type=module -e 'const m = await import("./tools/site/api-reference.mjs"); console.log(Buffer.byteLength(await m.buildApiPage()))'` in `packages/astraeus-site`: 94,439 on main (temporary worktree at 43157c80, since removed) and 118,927 on HEAD. The measurement is deterministic, so the browser run was not repeated (browser policy: one run per Objective Check).
- `packages/astraeus-site/tests/publicBuild.test.ts:158` lists the page ids but does not measure the API page. Nothing in `npm test` builds `buildApiPage()` and compares it with the limit.

## Proof Needed

- `npm run check:browser` passes `public-build-assets` with `api/index.html` within its budget. Two ways get there: the page or the doc comments shrink, or the owner records a new limit for a larger public API (as the owner did for the Apollo 11 raw budget in T-217).
- Strategic fix (AGENTS.md "Strategic fix first"): a fast-suite test measures `buildApiPage()` against the `api/index.html` limits in `load-budget.mjs`, using one source for the limit. A doc-comment or API growth past the budget then fails `npm test` at the step that causes it, not at the Objective Check. The test is shown to fail when the limit is set below the current size.
