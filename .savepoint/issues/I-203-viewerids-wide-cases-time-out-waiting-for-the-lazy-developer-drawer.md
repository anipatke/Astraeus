---
id: I-203
title: viewerIds wide cases time out waiting for the on-demand Developer drawer
type: defect
status: resolved
source:
  kind: check
  check: C-211
  actor: {role: checker, session: check-o094-20261122}
  at: '2026-11-22T04:40:00Z'
tasks: []
checks: [C-211, C-212]
guardrail_ids: [TEST-01]
severity: medium
resolution:
  disposition: verified
  check: C-212
  actor: {role: checker, session: check-o092-20261122}
  at: '2026-11-22T05:22:00Z'
  reason: 'C-212 CLEAR: one shared helper (tests/helpers/developerDrawer.ts, preload + 10 s named wait) used by viewerIds and developerDrawerFolds, addressDom/appScreenDom preload; viewerIds, developerDrawerFolds, twoViewers, waitDefaults green with 8 busy loops loading the machine; two consecutive green full npm test runs (05:12:30Z, 05:18:17Z: 337 files, 5481 passed, 2 skipped).'
history:
  - at: '2026-11-22T04:40:00Z'
    actor: {role: checker, session: check-o094-20261122}
    kind: observed
    note: 'Second red npm test today from the same two cases. C-211 Full Check gate run (2026-11-22T04:34:00Z, load average 1.6 at start, about 9 during the run): 328 files, 2 failed, 5431 passed. Both failures are packages/astraeus/tests/viewerIds.test.ts "every reference to an element id stays inside its viewer > mount, wide" (1080 ms) and "AstraeusScene, wide" (1022 ms), AssertionError at line 274. The file alone passed 8/8 straight after, and a full npm test rerun passed 328 files. The O-094 coordinator saw the same file fail (5 cases) earlier today and it passed on rerun. Out of O-094 scope (file untouched by O-094).'
  - at: '2026-11-22T04:44:56Z'
    actor: {role: executor, session: orchestrate-g024-20261122}
    kind: repair_attempted
    note: 'Direct repair on branch o092-gpu-cleanup: new shared helper packages/astraeus/tests/helpers/developerDrawer.ts (preloadDeveloperDrawer imports the chunk; waitForDeveloperDrawer preloads then waits for the heading with DRAWER_WAIT_MS 10 s, interval 20 ms). viewerIds.test.ts and developerDrawerFolds.test.ts wait through it (was the 1 s default); appScreenDom.test.ts and addressDom.test.ts preload before their click (their 2 s loops kept). No assertion or fixture changed. Proof: the 5 files incl. packageBoundaries 69/69; viewerIds + developerDrawerFolds 5/5 green with 14 busy-loop node processes loading the machine; two consecutive full npm test runs 328 files, 5433 passed, 2 skipped each. Typecheck, ESLint, Prettier clean. Other drawer-opening tests (twoViewers, panelPlacementDom, viewerStyles, barDom, domShell, developerToolsOption) do not wait for the heading and were not changed.'
  - at: '2026-11-22T05:22:00Z'
    actor: {role: checker, session: check-o092-20261122}
    kind: rechecked
    note: 'C-212: Proof Needed met; closed as verified.'
    check: C-212
---

# viewerIds wide cases time out waiting for the on-demand Developer drawer

## Problem

`packages/astraeus/tests/viewerIds.test.ts:273-274` clicks `.developer-mode-toggle` and then `await vi.waitFor(() => expect(shell.querySelector(".developer-heading")).not.toBeNull())` with Vitest's default `waitFor` timeout (1000 ms). Since O-089 T-418 (commit `1f6c308e`) the Developer drawer is `lazy(() => import("./DeveloperDrawer"))` (`packages/astraeus/src/app/developerPanels.tsx`), so the heading appears only after a dynamic import. Under a parallel `npm test` (16 workers) that import can take longer than 1 s, and both failing cases fail at about 1.0-1.1 s, which matches the default timeout. The quality gate `npm test` then goes red with no product defect.

## Smallest reproduction

`npm test` on a loaded machine (seen twice on 2026-11-22: the O-094 coordinator's combined gate, and C-211's gate run). `npx vitest run packages/astraeus/tests/viewerIds.test.ts` alone passes.

## Expected / actual

Expected: the gate is deterministic; a test that waits for an on-demand chunk waits for the chunk (or preloads it) rather than racing a 1 s default. Actual: two wide cases intermittently time out.

## Proof Needed

- The wait for the drawer no longer depends on the 1 s default: either the test awaits the drawer chunk (a shared helper other drawer tests can use; check `developerDrawerFolds.test.ts` and any other test that opens the drawer and then waits), or the waits use the project's stated timeout constant.
- A named way to show it holds under load (for example the file run with `--sequence.concurrent` or alongside a CPU load) and two consecutive green full `npm test` runs.

## Repair Routing

Direct repair under this Issue (one test helper, no product change), or folded into the next Objective that touches the fast suite.
