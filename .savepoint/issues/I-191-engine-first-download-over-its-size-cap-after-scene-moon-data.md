---
id: I-191
title: The engine's first download is 801 bytes over its raw size cap after each scene got its own moon data
type: verification
status: resolved
source:
  kind: check
  check: C-198
  actor: {role: checker, session: check-o084-orchestrator-20261121}
  at: '2026-11-21T12:49:15Z'
tasks: [T-357, T-358, T-359]
checks: [C-198, C-200]
guardrail_ids: []
severity: medium
resolution:
  disposition: verified
  check: C-200
  actor: {role: checker, session: recheck-o084-orchestrator-20261122}
  at: '2026-11-21T19:19:17Z'
  reason: Raw cap raised per the owner's choice; budget gates green in C-200.
history:
  - at: '2026-11-21T12:49:15Z'
    actor: {role: checker, session: check-o084-orchestrator-20261121}
    kind: observed
    note: 'C-198: packagePacks.test.ts and the browser public-build-assets step fail: examples/hello-scene first download 1,833,801 B raw against ENGINE_LIMIT.rawLimit 1,833,000 (+801 B); gzip 524,620 B within 527,000. Growth by Task: T-357 +405 B (moon-data seam), T-358 +292 B, T-359 +104 B (O-083 ended at 1,832,087 B, 913 B under). The cap is an owner decision (engine-budget.mjs; resets 2026-11-01 and 2026-11-10 were "measured + 5%"), and G-024 decision 7 parks an Objective whose size budget goes red.'
  - at: '2026-11-21T19:07:46Z'
    actor: {role: owner, session: orchestrate-g024-20261121}
    kind: owner_decision
    note: 'Owner: "carry on size option a" (option 1, a small raise of the raw cap by 3,000 B to 1,836,000 B; gzip unchanged).'
  - at: '2026-11-21T19:07:46Z'
    actor: {role: executor, session: orchestrate-g024-20261121}
    kind: repair_attempted
    note: 'ENGINE_LIMIT.rawLimit 1,836,000 in engine-budget.mjs (comment names the decision), publicBuild.test.ts pin, docs/BROWSER_CHECKS.md and Design Size budgets updated; publicBuild + packagePacks 44 passed.'
  - at: '2026-11-21T19:19:17Z'
    actor: {role: checker, session: recheck-o084-orchestrator-20261122}
    kind: rechecked
    note: 'C-200: packagePacks and public-build-assets pass at 1,833,801 / 1,836,000 B raw.'
---

# The engine's first download is 801 bytes over its raw size cap

## Problem

O-084's fix (each scene binds its own moon data) adds about 1.7 KB raw to the plain example's first download, which had 913 B of headroom. The raw cap (1,833,000 B) is now exceeded by 801 B; the gzip cap still holds (524,620 / 527,000 B). Everything else in the O-084 Full Check passes.

## Options for the owner

1. **Raise the raw cap a little** (e.g. to 1,836,000 B, +3,000 B): smallest change; leaves ~2.2 KB for the rest of G-024.
2. **Reset by the earlier rule** ("measured + 5%, rounded up to the next 1,000 B"): 1,925,000 B raw / 551,000 B gzip; generous room for O-085..O-093, but loosens the guard more.
3. **Trim engine code first** (a bounded Task to find ~1 KB of dead or duplicated code in the first-download path), keeping the cap; slower and uncertain. Note: moving the made-up scenes out of `src/` (O-093) does not help, since no engine source imports them.

## Proof needed

`npm test` (`packagePacks.test.ts`) and `npm run check:browser` (`public-build-assets`) green with the chosen cap or trim, the cap's comment in `packages/astraeus-site/tools/validate/engine-budget.mjs` naming the owner decision.
