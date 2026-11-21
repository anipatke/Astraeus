---
id: C-200
scope: {kind: objective, id: O-084}
result: CLEAR
checked_by: {role: checker, session: recheck-o084-orchestrator-20261122}
executed_session: orchestrate-g024-20261121
checked_at: '2026-11-21T19:19:17Z'
health_snapshot: sha256:6234ecd9a3cb74f2fb902e1795c71a7c50ce496bff7916cd04ac01e85d8daecd
reviewed:
  base_commit: d9289f4e
  head_commit: 521cfccf
  files: [packages/astraeus-site/tools/validate/engine-budget.mjs, packages/astraeus-site/tests/publicBuild.test.ts, docs/BROWSER_CHECKS.md]
  dependencies: []
issues: []
supersedes: C-198
---

# C-200: O-084 Full Objective re-check

Re-check of C-198 under its frozen scope lock, after the owner's budget decision ("carry on size option a", 2026-11-22: raise the engine raw cap by 3,000 B).

**Result: CLEAR.** I-191 closed as verified.

## Closure map

- I-191 (engine raw size cap): **closed.** `ENGINE_LIMIT` is 1,836,000 B raw / 527,000 B gzip; the plain example measures 1,833,801 / 524,620 B; `packagePacks.test.ts` and the browser `public-build-assets` step pass.

## Admission ledger

| Re-check item | Prior claim | Frozen cell | Result |
|---|---|---|---|
| Engine size budget | C-198 release gate | Gates: `ENGINE_LIMIT`, `packagePacks`, `public-build-assets` | Pass |
| Every C-198 coverage row | unchanged code since C-198 (only the cap, its pin and two docs changed) | C-198 matrix | Pass (full suite and browser re-run) |

## Gates (this session)

- `lint` 0; `typecheck` 0; `build` 0; `check:engine-alone` pass (233 files, 3870 passed); `check:pack` pass; `check:node-consumer` pass; `measure:example` 1,833,801 / 524,620 B.
- `test:full`: first run 1 failure, `showersMeasured` "fills every dot quickly" (119 ms against its 100 ms wall-clock assertion under coverage), the AH-35 false red O-085 T-361 turns into a warning (not on this branch; outside O-084's scope lock, an observation). Re-run: 307 files, 5054 passed, 2 skipped.
- `npm run check:browser` once: exit 0, every step exit 0 (including `public-build-assets`); evidence `docs/evidence/browser-20261121T191029Z`.
- `savepoint health check O-084`: snapshot above, "does not block clearance" (a snapshot from the failed first run was discarded).

## Owner Decisions

- I-191 budget: owner "carry on size option a" (2026-11-22), recorded on I-191 and in `engine-budget.mjs`. No other owner decision on O-084.

## Observations (non-blocking)

- The `showersMeasured` wall-clock flake will stop when O-085 (T-361) merges.
